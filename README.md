# Web del curso: Usos de la IA en el trabajo académico

Sitio web para la sesión del **Departamento de Economía Aplicada (Universidad de Murcia)**.

Incluye:
- Portada del curso (`/`).
- Subpágina con chatbot del curso (`/chatbot.html`).
- Backend Node.js con endpoint `/api/chat` para usar **OpenAI (pago)** o **Gemini (gratuito)** sin exponer claves en frontend.

## Datos del curso
- **Título**: Usos de la IA en el trabajo académico
- **Fecha**: lunes, 23 de febrero
- **Ponente**: Alfonso Rosa García
- **Contacto**: alfonso.rosa@um.es

## Requisitos
- Node.js 18+ (recomendado 20+)

## Instalación local
```bash
npm install
cp .env.example .env
# Añade tus claves en .env
npm start
```

Abrir: `http://localhost:3000`

## Variables de entorno
- `OPENAI_API_KEY`
- `GEMINI_API_KEY`
- `PORT` (opcional)

## Despliegue recomendado
### 1) Render (muy simple para servidor Node.js continuo)
1. Subir repo a GitHub.
2. Crear nuevo **Web Service** en Render apuntando al repo.
3. Build command: `npm install`
4. Start command: `npm start`
5. Añadir variables de entorno (`OPENAI_API_KEY`, `GEMINI_API_KEY`).
6. Desplegar.

### 2) Vercel (rápido y cómodo)
- También es una buena opción, aunque para este backend Node tradicional suele resultar más directo Render.
- Si se usa Vercel, conviene adaptar el endpoint a funciones serverless (`/api/chat`) y definir variables de entorno en el panel.

## Ideas útiles ya incluidas en la web
- Programa sugerido de 120 minutos.
- Lista de materiales para que los asistentes preparen casos reales.
- Chatbot orientado a tareas académicas (prompts, revisión bibliográfica, ética, redacción).
