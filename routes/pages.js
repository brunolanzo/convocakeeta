const express = require('express');
const router = express.Router();
const db = require('../database/db');

router.get('/', (req, res) => {
  const prazo = db.prepare("SELECT valor FROM configuracoes WHERE chave = 'prazo_apostas'").get();
  const totalParticipantes = db.prepare('SELECT COUNT(*) as total FROM apostas').get().total;
  res.render('home', { prazo: prazo ? prazo.valor : null, totalParticipantes });
});

router.get('/convocacao', (req, res) => {
  const convocacao = db.prepare('SELECT * FROM convocacao ORDER BY id DESC LIMIT 1').get();
  const jogadoresConvocados = convocacao ? JSON.parse(convocacao.jogadores) : [];
  res.render('convocacao', { jogadoresConvocados, dataPublicacao: convocacao ? convocacao.data_publicacao : null });
});

router.get('/estatisticas', (req, res) => {
  const apostas = db.prepare('SELECT jogadores FROM apostas').all();
  const convocacao = db.prepare('SELECT jogadores FROM convocacao ORDER BY id DESC LIMIT 1').get();
  const convocados = convocacao ? JSON.parse(convocacao.jogadores) : [];

  // Contagem de jogadores apostados
  const contagem = {};
  for (const aposta of apostas) {
    const lista = JSON.parse(aposta.jogadores);
    for (const j of lista) {
      contagem[j] = (contagem[j] || 0) + 1;
    }
  }

  const jogadoresOrdenados = Object.entries(contagem)
    .map(([nome, total]) => ({ nome, total, percentual: Math.round((total / apostas.length) * 100) }))
    .sort((a, b) => b.total - a.total);

  const maisApostados = jogadoresOrdenados.slice(0, 15);
  const menosApostados = jogadoresOrdenados.slice(-15).reverse();

  // Distribuição de acertos
  let distribuicaoAcertos = [];
  let mediaAcertos = 0;

  if (convocados.length > 0) {
    const acertosPorParticipante = apostas.map(a => {
      const lista = JSON.parse(a.jogadores);
      return lista.filter(j => convocados.includes(j)).length;
    });
    mediaAcertos = acertosPorParticipante.length > 0
      ? Math.round((acertosPorParticipante.reduce((a, b) => a + b, 0) / acertosPorParticipante.length) * 10) / 10
      : 0;

    // Distribuição
    const dist = {};
    for (const a of acertosPorParticipante) {
      dist[a] = (dist[a] || 0) + 1;
    }
    distribuicaoAcertos = Object.entries(dist)
      .map(([acertos, total]) => ({ acertos: parseInt(acertos), total }))
      .sort((a, b) => a.acertos - b.acertos);
  }

  res.render('estatisticas', {
    totalApostas: apostas.length,
    maisApostados,
    menosApostados,
    mediaAcertos,
    distribuicaoAcertos,
    temConvocacao: convocados.length > 0
  });
});

module.exports = router;
