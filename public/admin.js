const loginSection = document.querySelector('#login-section');
const guestsSection = document.querySelector('#guests-section');
const loginForm = document.querySelector('#login-form');
const loginMessage = document.querySelector('#login-message');
const guestList = document.querySelector('#guest-list');
const total = document.querySelector('#total');

async function loadGuests() {
  const response = await fetch('/api/admin/confirmacoes');
  if (response.status === 401) {
    loginSection.classList.remove('hidden');
    guestsSection.classList.add('hidden');
    return;
  }
  const data = await response.json();
  loginSection.classList.add('hidden');
  guestsSection.classList.remove('hidden');
  total.textContent = `${data.total} confirmação(ões)`;
  guestList.replaceChildren();
  if (!data.guests.length) {
    const empty = document.createElement('p');
    empty.className = 'muted';
    empty.textContent = 'Ainda não há confirmações.';
    guestList.appendChild(empty);
    return;
  }
  data.guests.forEach(guest => {
    const card = document.createElement('article');
    card.className = 'guest';
    const name = document.createElement('strong');
    name.textContent = guest.name;
    const companions = document.createElement('p');
    companions.textContent = guest.companions.length
      ? `Acompanhantes: ${guest.companions.join(', ')}`
      : 'Sem acompanhantes informados';
    const date = document.createElement('p');
    date.textContent = `Confirmado em: ${new Date(guest.createdAt).toLocaleString('pt-BR')}`;
    card.append(name, companions, date);
    guestList.appendChild(card);
  });
}

loginForm.addEventListener('submit', async event => {
  event.preventDefault();
  const button = loginForm.querySelector('button');
  button.disabled = true;
  loginMessage.textContent = '';
  try {
    const response = await fetch('/api/admin/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: document.querySelector('#password').value })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Não foi possível entrar.');
    document.querySelector('#password').value = '';
    await loadGuests();
  } catch (error) {
    loginMessage.textContent = error.message;
  } finally { button.disabled = false; }
});

document.querySelector('#logout-button').addEventListener('click', async () => {
  await fetch('/api/admin/logout', { method: 'POST' });
  await loadGuests();
});

fetch('/api/admin/session').then(r => r.json()).then(data => {
  if (data.authenticated) loadGuests();
}).catch(() => {});
