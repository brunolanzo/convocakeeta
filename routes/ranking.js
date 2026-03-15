const express = require('express');
const router = express.Router();
const db = require('../database/db');

router.get('/ranking', (req, res) => {
  const convocacao = db.prepare('SELECT jogadores FROM convocacao ORDER BY id DESC LIMIT 1').get();

  if (!convocacao) {
    return res.render('ranking', { ranking: [], convocacaoPublicada: false });
  }

  const convocados = JSON.parse(convocacao.jogadores);

  // Buscar todas as apostas
  const apostas = db.prepare(`
    SELECT a.usuario_id, a.jogadores, u.nome, u.status_pagamento
    FROM apostas a
    JOIN usuarios u ON a.usuario_id = u.id
  `).all();

  // Contar quantas vezes cada jogador foi apostado (para índice inusitado)
  const contagemJogadores = {};
  for (const aposta of apostas) {
    const lista = JSON.parse(aposta.jogadores);
    for (const j of lista) {
      contagemJogadores[j] = (contagemJogadores[j] || 0) + 1;
    }
  }

  // Calcular resultados
  const ranking = apostas.map(aposta => {
    const lista = JSON.parse(aposta.jogadores);
    const acertos = lista.filter(j => convocados.includes(j));
    const pontuacao = acertos.length * 10;

    // Índice inusitado: soma de 1/total_apostas para cada acerto
    const indiceInusitado = acertos.reduce((sum, j) => {
      return sum + (1 / (contagemJogadores[j] || 1));
    }, 0);

    return {
      usuario_id: aposta.usuario_id,
      nome: aposta.nome,
      status_pagamento: aposta.status_pagamento,
      acertos: acertos.length,
      pontuacao,
      indiceInusitado: Math.round(indiceInusitado * 1000) / 1000
    };
  });

  // Ordenar: pontuação DESC, índice inusitado DESC, aleatório
  ranking.sort((a, b) => {
    if (b.pontuacao !== a.pontuacao) return b.pontuacao - a.pontuacao;
    if (b.indiceInusitado !== a.indiceInusitado) return b.indiceInusitado - a.indiceInusitado;
    return Math.random() - 0.5;
  });

  // Atribuir posição
  ranking.forEach((r, i) => { r.posicao = i + 1; });

  res.render('ranking', { ranking, convocacaoPublicada: true });
});

module.exports = router;
