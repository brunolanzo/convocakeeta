const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { requireAuth } = require('../middleware/auth');

router.get('/apostas', requireAuth, (req, res) => {
  const aposta = db.prepare('SELECT * FROM apostas WHERE usuario_id = ?').get(req.session.userId);
  const jogadoresSelecionados = aposta ? JSON.parse(aposta.jogadores) : [];
  res.render('apostas/form', { jogadoresSelecionados, erro: null, sucesso: null });
});

router.post('/apostas', requireAuth, (req, res) => {
  if (res.locals.prazoExpirado) {
    return res.render('apostas/form', {
      jogadoresSelecionados: [],
      erro: 'O prazo para apostas já encerrou.',
      sucesso: null
    });
  }

  let { jogadores } = req.body;

  if (typeof jogadores === 'string') {
    try { jogadores = JSON.parse(jogadores); } catch { jogadores = []; }
  }
  if (!Array.isArray(jogadores)) jogadores = [];

  // Remover duplicatas
  jogadores = [...new Set(jogadores)];

  if (jogadores.length !== 26) {
    return res.render('apostas/form', {
      jogadoresSelecionados: jogadores,
      erro: `Você deve selecionar exatamente 26 jogadores. Selecionados: ${jogadores.length}.`,
      sucesso: null
    });
  }

  const existing = db.prepare('SELECT id FROM apostas WHERE usuario_id = ?').get(req.session.userId);

  if (existing) {
    db.prepare('UPDATE apostas SET jogadores = ?, data_envio = datetime(\'now\') WHERE usuario_id = ?')
      .run(JSON.stringify(jogadores), req.session.userId);
  } else {
    db.prepare('INSERT INTO apostas (usuario_id, jogadores) VALUES (?, ?)')
      .run(req.session.userId, JSON.stringify(jogadores));
  }

  res.render('apostas/form', {
    jogadoresSelecionados: jogadores,
    erro: null,
    sucesso: 'Aposta salva com sucesso!'
  });
});

router.get('/apostas/:id', (req, res) => {
  // Apostas individuais só ficam visíveis após prazo
  if (!res.locals.prazoExpirado && req.session.userId != req.params.id) {
    return res.redirect('/ranking');
  }

  const usuario = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(req.params.id);
  if (!usuario) return res.redirect('/ranking');

  const aposta = db.prepare('SELECT * FROM apostas WHERE usuario_id = ?').get(req.params.id);
  const jogadoresAposta = aposta ? JSON.parse(aposta.jogadores) : [];

  // Pegar convocação para marcar acertos
  const convocacao = db.prepare('SELECT jogadores FROM convocacao ORDER BY id DESC LIMIT 1').get();
  const jogadoresConvocados = convocacao ? JSON.parse(convocacao.jogadores) : [];

  res.render('apostas/ver', { usuario, jogadoresAposta, jogadoresConvocados });
});

module.exports = router;
