const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../database/db');

router.get('/login', (req, res) => {
  if (req.session.userId) return res.redirect('/');
  res.render('login', { erro: null });
});

router.post('/login', (req, res) => {
  const { email, senha } = req.body;
  const user = db.prepare('SELECT * FROM usuarios WHERE email = ?').get(email);

  if (!user || !bcrypt.compareSync(senha, user.senha_hash)) {
    return res.render('login', { erro: 'Email ou senha incorretos.' });
  }

  req.session.userId = user.id;
  req.session.userName = user.nome;
  req.session.isAdmin = user.is_admin === 1;
  res.redirect('/');
});

router.get('/registro', (req, res) => {
  if (req.session.userId) return res.redirect('/');
  res.render('registro', { erro: null });
});

router.post('/registro', (req, res) => {
  const { nome, email, senha, confirmarSenha } = req.body;

  if (!nome || !email || !senha) {
    return res.render('registro', { erro: 'Todos os campos são obrigatórios.' });
  }
  if (senha.length < 4) {
    return res.render('registro', { erro: 'A senha deve ter pelo menos 4 caracteres.' });
  }
  if (senha !== confirmarSenha) {
    return res.render('registro', { erro: 'As senhas não conferem.' });
  }

  const existing = db.prepare('SELECT id FROM usuarios WHERE email = ?').get(email);
  if (existing) {
    return res.render('registro', { erro: 'Este email já está cadastrado.' });
  }

  const hash = bcrypt.hashSync(senha, 10);
  const result = db.prepare('INSERT INTO usuarios (nome, email, senha_hash) VALUES (?, ?, ?)').run(nome, email, hash);

  req.session.userId = result.lastInsertRowid;
  req.session.userName = nome;
  req.session.isAdmin = false;
  res.redirect('/apostas');
});

router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

module.exports = router;
