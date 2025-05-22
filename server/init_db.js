
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/filieres.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS filieres (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL,
    description TEXT
  )`);

  db.run(`INSERT INTO filieres (nom, description) VALUES
    ('Informatique', 'Développement, réseau, sécurité'),
    ('Electronique', 'Systèmes embarqués, IoT, robotique')
  `);
});

db.close();
