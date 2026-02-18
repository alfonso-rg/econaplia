const express = require('express');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const COURSE_SYSTEM_PROMPT = `Eres un asistente del curso "Usos de la IA en el trabajo académico" del Departamento de Economía Aplicada de la Universidad de Murcia.

Tu objetivo es ayudar a estudiantes y personal docente con:
- Diseño de prompts académicos.
- Búsqueda y revisión bibliográfica asistida por IA.
- Redacción, síntesis y mejora de estructura de textos.
- Buenas prácticas de citación, trazabilidad y ética.
- Automatización ligera del flujo de trabajo académico.

Instrucciones importantes:
1) Responde SIEMPRE en español claro y profesional.
2) Prioriza utilidad práctica para economía aplicada y entornos universitarios.
3) Cuando te pidan recomendaciones, ofrece pasos accionables y ejemplos concretos.
4) Si falta información, haz 1-2 preguntas de aclaración al final.
5) No inventes normas institucionales; cuando no estés seguro, indícalo explícitamente.`;

app.post('/api/chat', async (req, res) => {
  const { provider, question, history } = req.body || {};

  if (!provider || !['openai', 'gemini'].includes(provider)) {
    return res.status(400).json({ error: 'Proveedor no válido. Usa "openai" o "gemini".' });
  }

  if (!question || typeof question !== 'string' || !question.trim()) {
    return res.status(400).json({ error: 'La pregunta es obligatoria.' });
  }

  const safeHistory = Array.isArray(history)
    ? history
        .filter((item) => item && typeof item.role === 'string' && typeof item.content === 'string')
        .slice(-8)
    : [];

  try {
    const answer =
      provider === 'openai'
        ? await askOpenAI(question, safeHistory)
        : await askGemini(question, safeHistory);

    return res.json({ answer });
  } catch (error) {
    console.error('Error en /api/chat:', error);
    return res.status(500).json({
      error:
        'No se pudo obtener respuesta del modelo. Revisa tus claves API y la configuración del proveedor.'
    });
  }
});

async function askOpenAI(question, history) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY no definida');
  }

  const messages = [
    { role: 'system', content: COURSE_SYSTEM_PROMPT },
    ...history.map((item) => ({ role: item.role, content: item.content })),
    { role: 'user', content: question }
  ];

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.4,
      messages
    })
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`OpenAI error: ${response.status} ${details}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || 'No he podido generar respuesta.';
}

async function askGemini(question, history) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY no definida');
  }

  const formattedHistory = history.map((item) => ({
    role: item.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: item.content }]
  }));

  const body = {
    system_instruction: {
      parts: [{ text: COURSE_SYSTEM_PROMPT }]
    },
    contents: [...formattedHistory, { role: 'user', parts: [{ text: question }] }],
    generationConfig: {
      temperature: 0.4
    }
  };

  const model = 'gemini-1.5-flash';
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Gemini error: ${response.status} ${details}`);
  }

  const data = await response.json();
  return (
    data.candidates?.[0]?.content?.parts?.map((p) => p.text).join('\n').trim() ||
    'No he podido generar respuesta.'
  );
}

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
