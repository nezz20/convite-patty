const form = document.querySelector('#rsvp-form');
const companionsList = document.querySelector('#companions-list');
const addButton = document.querySelector('#add-companion');
const message = document.querySelector('#form-message');
let companionCount = 0;

function addCompanion() {
  if (companionCount >= 12) {
    message.textContent = 'Você pode adicionar até 12 acompanhantes.';
    return;
  }
  companionCount += 1;
  const input = document.createElement('input');
  input.name = 'companion';
  input.maxLength = 80;
  input.placeholder = `Nome do acompanhante ${companionCount}`;
  input.setAttribute('aria-label', `Nome do acompanhante ${companionCount}`);
  companionsList.appendChild(input);
  input.focus();
  message.textContent = '';
}
addButton.addEventListener('click', addCompanion);

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = form.querySelector('.submit-button');
  const name = document.querySelector('#name').value.trim();
  const companions = [...companionsList.querySelectorAll('input')].map(input => input.value.trim()).filter(Boolean);
  button.disabled = true;
  button.textContent = 'ENVIANDO...';
  message.textContent = '';
  try {
    const response = await fetch('/api/confirmacoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, companions })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Não foi possível confirmar agora.');
    form.reset();
    companionsList.replaceChildren();
    companionCount = 0;
    message.textContent = result.message;
    message.style.color = '#47734d';
  } catch (error) {
    message.textContent = error.message || 'Não foi possível conectar ao servidor. Confira se ele está rodando.';
    message.style.color = '#a33d5c';
  } finally {
    button.disabled = false;
    button.textContent = 'CONFIRMAR PRESENÇA ↗';
  }
});
