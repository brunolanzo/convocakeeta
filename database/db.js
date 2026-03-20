const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Usar DB_PATH do .env para persistir fora do diretório do deploy
const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'convocakeeta.db');

// Garantir que o diretório do banco existe
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
db.exec(schema);

module.exports = db;
