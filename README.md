# Web del curso: Usos de la IA en el trabajo académico

Sitio web para la sesión del **Departamento de Economía Aplicada (Universidad de Murcia)**.

## Páginas incluidas
- `/` portada integrada con navegación del curso.
- `/introduccion.html` modelos, agentes, sistemas de agentes, benchmarks y evolución.
- `/usos-academicos.html` mapa de usos de IA en investigación/docencia.
- `/chatbots-asignaturas.html` guía detallada para crear chatbots de asignatura.
- `/notebooklm.html` ventajas, casos y cautelas de NotebookLM.
- `/deep-research.html` uso práctico y validación de Deep Research.
- `/chatbot.html` demo técnica del chatbot con varios modelos.

## Carpeta de documentos
- Se ha creado `documents/` para alojar los PDF de talleres anteriores.
- En esta copia del repositorio aún no aparecen los PDF, por lo que se dejó la estructura preparada para incorporarlos en cuanto estén disponibles.

## Chatbot (backend)
- Endpoint: `POST /api/chat`
- Modelos: `gemini-2.0-flash`, `gpt-4o-mini`, `gpt-5.2`, `gpt-5-nano`, `gpt-5.2-thinking-low`
- El modelo `gpt-5.2-thinking-low` está limitado a **2 prompts por sesión**.

## Instalación local
```bash
npm install
cp .env.example .env
npm start
```

## Variables de entorno
- `OPENAI_API_KEY`
- `GEMINI_API_KEY`
- `PORT` (opcional)

## Render
- Branch: la rama donde esté este código (por ejemplo `main` o `work`)
- Build Command: `npm install`
- Start Command: `npm start`
