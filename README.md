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
### 1) Render (opción recomendada para esta versión)
1. Subir repo a GitHub.
2. Crear nuevo **Web Service** en Render apuntando al repo.
3. Build command: `npm install`
4. Start command: `npm start`
5. Añadir variables de entorno (`OPENAI_API_KEY`, `GEMINI_API_KEY`).
6. Desplegar.

### 2) Vercel o Netlify
- Muy buenas opciones para frontend estático.
- Para el chatbot, conviene adaptar `/api/chat` a funciones serverless antes del despliegue.

## Valor añadido de contenidos en la portada
- Programa sugerido de 120 minutos.
- Kit de prompts académicos reutilizable.
- Flujo de revisión bibliográfica con trazabilidad.
- Checklist de integridad académica y verificación.
- Ejercicios prácticos para usar durante la sesión.
