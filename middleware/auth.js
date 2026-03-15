function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.userId || !req.session.isAdmin) {
    return res.redirect('/login');
  }
  next();
}

function setLocals(req, res, next) {
  if (req.session.userId) {
    const db = require('../database/db');
    const row = db.prepare('SELECT status_pagamento FROM usuarios WHERE id = ?').get(req.session.userId);
    res.locals.user = {
      id: req.session.userId,
      nome: req.session.userName,
      isAdmin: req.session.isAdmin,
      statusPagamento: row ? row.status_pagamento : 'pendente'
    };
  } else {
    res.locals.user = null;
  }
  next();
}

module.exports = { requireAuth, requireAdmin, setLocals };
