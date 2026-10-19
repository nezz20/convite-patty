require('dotenv').config();
const express = require('express');
const session = require('express-session');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'confirmacoes.json');

if (!process.env.ADMIN_PASSWORD || !process.env.SESSION_SECRET) {
  console.error('Configure ADMIN_PASSWORD e SESSION_SECRET no arquivo .env antes de iniciar.');
  process.exit(1);
}
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]', 'utf8');

function readGuests() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
  catch { return []; }
}
function writeGuests(guests) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(guests, null, 2), 'utf8');
}

app.use(express.json({ limit: '20kb' }));
app.use(session({
  name: 'convite.sid',
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', maxAge: 2 * 60 * 60 * 1000 }
}));
app.use(express.static(path.join(__dirname, 'public')));

function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin === true) return next();
  return res.status(401).json({ error: 'Acesso restrito. Entre como administradora.' });
}

app.post('/api/confirmacoes', (req, res) => {
  const name = String(req.body.name || '').trim();
  const companions = Array.isArray(req.body.companions)
    ? req.body.companions.map(n => String(n).trim()).filter(Boolean).slice(0, 12)
    : [];
  if (name.length < 2 || name.length > 80) {
    return res.status(400).json({ error: 'Informe seu nome (de 2 a 80 caracteres).' });
  }
  if (companions.some(n => n.length > 80)) {
    return res.status(400).json({ error: 'Cada nome de acompanhante deve ter até 80 caracteres.' });
  }
  const guests = readGuests();
  guests.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8), name, companions, createdAt: new Date().toISOString() });
  writeGuests(guests);
  res.status(201).json({ message: 'Presença confirmada! Te esperamos 💿' });
});

app.post('/api/admin/login', (req, res, next) => {
  const password = String(req.body.password || '');
  if (password !== process.env.ADMIN_PASSWORD) return res.status(401).json({ error: 'Senha incorreta.' });
  req.session.regenerate(err => {
    if (err) return next(err);
    req.session.isAdmin = true;
    req.session.save(err2 => {
      if (err2) return next(err2);
      res.json({ message: 'Login realizado.' });
    });
  });
});

app.get('/api/admin/session', (req, res) => res.json({ authenticated: req.session?.isAdmin === true }));
app.post('/api/admin/logout', requireAdmin, (req, res) => {
  req.session.destroy(() => res.json({ message: 'Você saiu da área administrativa.' }));
});
app.get('/api/admin/confirmacoes', requireAdmin, (req, res) => {
  const guests = readGuests().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  res.json({ guests, total: guests.length });
});

app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));
app.listen(PORT, () => console.log(`Convite Y2K rodando em http://localhost:${PORT}`));
