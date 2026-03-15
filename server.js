require('dotenv').config();
const express = require('express');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const path = require('path');
const db = require('./database/db');
const bcrypt = require('bcrypt');
const { setLocals } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
  store: new SQLiteStore({ db: 'sessions.db', dir: __dirname }),
  secret: process.env.SESSION_SECRET || 'fallback-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 }
}));

app.use(setLocals);

// Helper global: prazo das apostas
app.use((req, res, next) => {
  const row = db.prepare('SELECT valor FROM configuracoes WHERE chave = ?').get('prazo_apostas');
  res.locals.prazoApostas = row ? row.valor : null;
  res.locals.prazoExpirado = row ? new Date(row.valor) < new Date() : false;
  next();
});

// Criar admin padrão se não existir
(async () => {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@empresa.com';
  const adminSenha = process.env.ADMIN_SENHA || 'admin123';
  const existing = db.prepare('SELECT id FROM usuarios WHERE email = ?').get(adminEmail);
  if (!existing) {
    const hash = await bcrypt.hash(adminSenha, 10);
    db.prepare('INSERT INTO usuarios (nome, email, senha_hash, is_admin, status_pagamento) VALUES (?, ?, ?, 1, ?)')
      .run('Administrador', adminEmail, hash, 'pago');
    console.log(`Admin criado: ${adminEmail}`);
  }
})();

// Rotas
app.use('/', require('./routes/auth'));
app.use('/', require('./routes/pages'));
app.use('/', require('./routes/apostas'));
app.use('/', require('./routes/ranking'));
app.use('/admin', require('./routes/admin'));

// API: lista de jogadores para autocomplete
const jogadores = require('./data/jogadores.json');
app.get('/api/jogadores', (req, res) => {
  const q = (req.query.q || '').toLowerCase();
  if (!q) return res.json(jogadores);
  const filtered = jogadores.filter(j =>
    j.nome.toLowerCase().includes(q) ||
    j.posicao.toLowerCase().includes(q) ||
    j.clube.toLowerCase().includes(q)
  );
  res.json(filtered);
});

// API: contato (sugerir jogador ao admin)
app.post('/api/contato', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Não autenticado' });

  const { jogadorSugerido, clubePosicao, mensagem } = req.body;
  if (!jogadorSugerido || !jogadorSugerido.trim()) {
    return res.status(400).json({ error: 'Nome do jogador é obrigatório' });
  }

  const usuario = db.prepare('SELECT nome, email FROM usuarios WHERE id = ?').get(req.session.userId);

  // Salvar sugestão no banco (tabela criada abaixo)
  db.prepare('INSERT INTO sugestoes (usuario_id, jogador, clube_posicao, mensagem) VALUES (?, ?, ?, ?)')
    .run(req.session.userId, jogadorSugerido.trim(), clubePosicao || '', mensagem || '');

  // Tentar enviar email (falha silenciosa se não configurado)
  try {
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    if (process.env.SMTP_USER) {
      transporter.sendMail({
        from: process.env.SMTP_USER,
        to: process.env.ADMIN_CONTACT_EMAIL || 'bruno.lanzo@gmail.com',
        subject: `[ConvocaKeeta] Sugestão de jogador: ${jogadorSugerido}`,
        text: `Participante: ${usuario.nome} (${usuario.email})\n` +
              `Jogador sugerido: ${jogadorSugerido}\n` +
              `Clube/Posição: ${clubePosicao || '-'}\n` +
              `Observação: ${mensagem || '-'}`
      }).catch(() => {});
    }
  } catch { /* nodemailer não configurado */ }

  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`ConvocaKeeta rodando em http://localhost:${PORT}`);
});
