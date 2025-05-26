const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

const db = new sqlite3.Database('./data/filieres.db');

db.serialize(async () => {
  // Tables
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT,
    login TEXT UNIQUE,
    password TEXT,
    role TEXT,
    adresse TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS domaines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS filieres (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL,
    description TEXT,
    domaine_id INTEGER,
    FOREIGN KEY (domaine_id) REFERENCES domaines(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS specialites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL,
    filiere_id INTEGER,
    FOREIGN KEY (filiere_id) REFERENCES filieres(id)
  )`);

  // Créer admin si pas existant
  db.get('SELECT * FROM users WHERE login = ?', ['admin'], async (err, row) => {
    if (!row) {
      const hash = await bcrypt.hash('admin', 10);
      db.run('INSERT INTO users (nom, login, password, role) VALUES (?, ?, ?, ?)', ['Administrateur', 'admin', hash, 'admin']);
      console.log('Admin créé avec login admin / password admin');
    }
  });
});

db.close();
