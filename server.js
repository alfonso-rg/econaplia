const express = require('express');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const THINKING_MODEL = 'gpt-5.2-thinking-low';
const THINKING_LIMIT_PER_SESSION = 2;
const thinkingUsageBySession = new Map();

const MODEL_CONFIGS = {
  'gemini-2.0-flash': {
    provider: 'gemini'
  },
  'gpt-5.2': {
    provider: 'openai',
    reasoningEffort: null
  },
  'gpt-5.2-thinking-low': {
    provider: 'openai',
    reasoningEffort: 'low'
  }
};

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
  const { model, question, history, sessionId } = req.body || {};

  if (!model || !MODEL_CONFIGS[model]) {
    return res.status(400).json({
      error: `Modelo no válido. Usa uno de: ${Object.keys(MODEL_CONFIGS).join(', ')}`
    });
  }

  if (!question || typeof question !== 'string' || !question.trim()) {
    return res.status(400).json({ error: 'La pregunta es obligatoria.' });
  }

  if (model === THINKING_MODEL) {
    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({ error: 'Falta sessionId para el modelo thinking.' });
    }

    const usage = thinkingUsageBySession.get(sessionId) || 0;
    if (usage >= THINKING_LIMIT_PER_SESSION) {
      return res.status(429).json({
        error:
          'Has alcanzado el límite de 2 prompts por sesión para el modelo gpt-5.2 thinking (low).',
        thinkingRemaining: 0
      });
    }
  }

  const safeHistory = Array.isArray(history)
    ? history
        .filter((item) => item && typeof item.role === 'string' && typeof item.content === 'string')
        .slice(-8)
    : [];

  try {
    const config = MODEL_CONFIGS[model];
    const answer =
      config.provider === 'openai'
        ? await askOpenAI(question, safeHistory, model, config.reasoningEffort)
        : await askGemini(question, safeHistory, model);

    let thinkingRemaining;
    if (model === THINKING_MODEL) {
      const currentUsage = thinkingUsageBySession.get(sessionId) || 0;
      const newUsage = currentUsage + 1;
      thinkingUsageBySession.set(sessionId, newUsage);
      thinkingRemaining = Math.max(THINKING_LIMIT_PER_SESSION - newUsage, 0);
    }

    return res.json({ answer, thinkingRemaining });
  } catch (error) {
    console.error('Error en /api/chat:', error);
    return res.status(500).json({
      error:
        'No se pudo obtener respuesta del modelo. Revisa tus claves API y la configuración del proveedor.'
    });
  }
});

async function askOpenAI(question, history, model, reasoningEffort = null) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY no definida');
  }

  const input = [
    { role: 'system', content: COURSE_SYSTEM_PROMPT },
    ...history.map((item) => ({ role: item.role, content: item.content })),
    { role: 'user', content: question }
  ];

  const body = {
    model,
    input
  };

  if (reasoningEffort) {
    body.reasoning = { effort: reasoningEffort };
  }

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`OpenAI error: ${response.status} ${details}`);
  }

  const data = await response.json();
  const textFromOutput = data.output
    ?.flatMap((item) => item.content || [])
    .filter((content) => typeof content.text === 'string')
    .map((content) => content.text)
    .join('\n')
    .trim();

  return data.output_text?.trim() || textFromOutput || 'No he podido generar respuesta.';
}

async function askGemini(question, history, preferredModel) {
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

  const fallbacks = Array.from(new Set([preferredModel, 'gemini-1.5-flash']));
  let lastError;

  for (const model of fallbacks) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (response.ok) {
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text).join('\n').trim();
      return text || 'No he podido generar respuesta.';
    }

    const details = await response.text();
    lastError = `Gemini error (${model}): ${response.status} ${details}`;

    if (response.status !== 404) {
      throw new Error(lastError);
    }
  }

  throw new Error(lastError || 'Gemini error desconocido');
}

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
