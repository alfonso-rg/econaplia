const chatForm = document.getElementById('chatForm');
const questionInput = document.getElementById('question');
const chatWindow = document.getElementById('chatWindow');
const modelSelect = document.getElementById('model');
const clearBtn = document.getElementById('clearBtn');
const thinkingInfo = document.getElementById('thinkingInfo');

const THINKING_MODEL = 'gpt-5.2-thinking-low';
const THINKING_LIMIT = 2;

const sessionId = getOrCreateSessionId();
let history = [];
let localThinkingUsage = 0;

function getOrCreateSessionId() {
  const key = 'courseChatSessionId';
  const existing = sessionStorage.getItem(key);
  if (existing) return existing;

  const newId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  sessionStorage.setItem(key, newId);
  return newId;
}

function addMessage(role, text) {
  const article = document.createElement('article');
  article.className = `msg ${role}`;
  const paragraph = document.createElement('p');
  paragraph.textContent = text;
  article.appendChild(paragraph);
  chatWindow.appendChild(article);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function setFormEnabled(enabled) {
  questionInput.disabled = !enabled;
  modelSelect.disabled = !enabled;
  chatForm.querySelector('button[type="submit"]').disabled = !enabled;
}

function updateThinkingInfo() {
  if (modelSelect.value !== THINKING_MODEL) {
    thinkingInfo.textContent = '';
    return;
  }

  const remaining = Math.max(THINKING_LIMIT - localThinkingUsage, 0);
  thinkingInfo.textContent = `GPT 5.2 Thinking (low): te quedan ${remaining} de ${THINKING_LIMIT} prompts en esta sesión.`;
}

clearBtn.addEventListener('click', () => {
  history = [];
  localThinkingUsage = 0;
  chatWindow.innerHTML = '';
  addMessage(
    'assistant',
    'Chat reiniciado. ¿Sobre qué parte del curso quieres trabajar primero?'
  );
  updateThinkingInfo();
});

modelSelect.addEventListener('change', () => {
  updateThinkingInfo();
});

chatForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const question = questionInput.value.trim();
  if (!question) return;

  if (modelSelect.value === THINKING_MODEL && localThinkingUsage >= THINKING_LIMIT) {
    addMessage(
      'assistant',
      'Has alcanzado el límite local de 2 prompts para GPT 5.2 Thinking (low). Cambia de modelo o reinicia chat.'
    );
    return;
  }

  addMessage('user', question);
  questionInput.value = '';
  setFormEnabled(false);
  addMessage('assistant', 'Pensando...');

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: modelSelect.value,
        question,
        history,
        sessionId
      })
    });

    const data = await response.json();

    chatWindow.lastElementChild?.remove();

    if (!response.ok) {
      addMessage('assistant', data.error || 'Error desconocido del servidor.');
      if (typeof data.thinkingRemaining === 'number') {
        localThinkingUsage = THINKING_LIMIT - data.thinkingRemaining;
      }
      updateThinkingInfo();
      return;
    }

    const answer = data.answer || 'No se recibió respuesta del modelo.';
    addMessage('assistant', answer);

    history.push({ role: 'user', content: question });
    history.push({ role: 'assistant', content: answer });
    history = history.slice(-8);

    if (modelSelect.value === THINKING_MODEL) {
      if (typeof data.thinkingRemaining === 'number') {
        localThinkingUsage = THINKING_LIMIT - data.thinkingRemaining;
      } else {
        localThinkingUsage += 1;
      }
      updateThinkingInfo();
    }
  } catch (error) {
    chatWindow.lastElementChild?.remove();
    addMessage('assistant', 'No se pudo conectar con el servidor del chatbot.');
    console.error(error);
  } finally {
    setFormEnabled(true);
    questionInput.focus();
  }
});

updateThinkingInfo();
