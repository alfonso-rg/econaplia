const chatForm = document.getElementById('chatForm');
const questionInput = document.getElementById('question');
const chatWindow = document.getElementById('chatWindow');
const providerSelect = document.getElementById('provider');
const clearBtn = document.getElementById('clearBtn');

let history = [];

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
  providerSelect.disabled = !enabled;
  chatForm.querySelector('button[type="submit"]').disabled = !enabled;
}

clearBtn.addEventListener('click', () => {
  history = [];
  chatWindow.innerHTML = '';
  addMessage(
    'assistant',
    'Chat reiniciado. ¿Sobre qué parte del curso quieres trabajar primero?'
  );
});

chatForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const question = questionInput.value.trim();
  if (!question) return;

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
        provider: providerSelect.value,
        question,
        history
      })
    });

    const data = await response.json();

    chatWindow.lastElementChild?.remove();

    if (!response.ok) {
      addMessage('assistant', data.error || 'Error desconocido del servidor.');
      return;
    }

    const answer = data.answer || 'No se recibió respuesta del modelo.';
    addMessage('assistant', answer);

    history.push({ role: 'user', content: question });
    history.push({ role: 'assistant', content: answer });
    history = history.slice(-8);
  } catch (error) {
    chatWindow.lastElementChild?.remove();
    addMessage('assistant', 'No se pudo conectar con el servidor del chatbot.');
    console.error(error);
  } finally {
    setFormEnabled(true);
    questionInput.focus();
  }
});
