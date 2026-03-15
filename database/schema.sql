CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  senha_hash TEXT NOT NULL,
  is_admin INTEGER DEFAULT 0,
  status_pagamento TEXT DEFAULT 'pendente',
  data_pagamento TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS apostas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER NOT NULL UNIQUE,
  jogadores TEXT NOT NULL,
  data_envio TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS convocacao (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  jogadores TEXT NOT NULL,
  data_publicacao TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS configuracoes (
  chave TEXT PRIMARY KEY,
  valor TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sugestoes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER NOT NULL,
  jogador TEXT NOT NULL,
  clube_posicao TEXT,
  mensagem TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

INSERT OR IGNORE INTO configuracoes (chave, valor) VALUES ('prazo_apostas', '2026-05-15T23:59:59');
