const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { requireAdmin } = require('../middleware/auth');

router.use(requireAdmin);

// Dashboard
router.get('/', (req, res) => {
  const totalUsuarios = db.prepare('SELECT COUNT(*) as total FROM usuarios WHERE is_admin = 0').get().total;
  const totalApostas = db.prepare('SELECT COUNT(*) as total FROM apostas').get().total;
  const totalPagos = db.prepare("SELECT COUNT(*) as total FROM usuarios WHERE status_pagamento = 'pago' AND is_admin = 0").get().total;
  const convocacao = db.prepare('SELECT * FROM convocacao ORDER BY id DESC LIMIT 1').get();
  const prazo = db.prepare("SELECT valor FROM configuracoes WHERE chave = 'prazo_apostas'").get();

  res.render('admin/dashboard', {
    totalUsuarios,
    totalApostas,
    totalPagos,
    convocacaoPublicada: !!convocacao,
    prazo: prazo ? prazo.valor : ''
  });
});

// Convocação oficial
router.get('/convocacao', (req, res) => {
  const convocacao = db.prepare('SELECT * FROM convocacao ORDER BY id DESC LIMIT 1').get();
  const jogadoresConvocados = convocacao ? JSON.parse(convocacao.jogadores) : [];
  res.render('admin/convocacao', { jogadoresConvocados, sucesso: null, erro: null });
});

router.post('/convocacao', (req, res) => {
  let { jogadores } = req.body;

  if (typeof jogadores === 'string') {
    try { jogadores = JSON.parse(jogadores); } catch { jogadores = []; }
  }
  if (!Array.isArray(jogadores)) jogadores = [];

  jogadores = [...new Set(jogadores)];

  if (jogadores.length !== 26) {
    return res.render('admin/convocacao', {
      jogadoresConvocados: jogadores,
      erro: `A convocação deve ter exatamente 26 jogadores. Informados: ${jogadores.length}.`,
      sucesso: null
    });
  }

  // Apagar convocação anterior e inserir nova
  db.prepare('DELETE FROM convocacao').run();
  db.prepare('INSERT INTO convocacao (jogadores) VALUES (?)').run(JSON.stringify(jogadores));

  res.render('admin/convocacao', {
    jogadoresConvocados: jogadores,
    erro: null,
    sucesso: 'Convocação oficial salva com sucesso!'
  });
});

// Pagamentos
router.get('/pagamentos', (req, res) => {
  const usuarios = db.prepare('SELECT * FROM usuarios WHERE is_admin = 0 ORDER BY nome').all();
  res.render('admin/pagamentos', { usuarios, sucesso: null });
});

router.post('/pagamentos/:id', (req, res) => {
  const { status } = req.body;
  const dataPagamento = status === 'pago' ? new Date().toISOString() : null;
  db.prepare('UPDATE usuarios SET status_pagamento = ?, data_pagamento = ? WHERE id = ?')
    .run(status, dataPagamento, req.params.id);

  const usuarios = db.prepare('SELECT * FROM usuarios WHERE is_admin = 0 ORDER BY nome').all();
  res.render('admin/pagamentos', { usuarios, sucesso: 'Status atualizado!' });
});

// Prazo
router.post('/prazo', (req, res) => {
  const { prazo } = req.body;
  db.prepare('INSERT OR REPLACE INTO configuracoes (chave, valor) VALUES (?, ?)').run('prazo_apostas', prazo);
  res.redirect('/admin');
});

module.exports = router;
