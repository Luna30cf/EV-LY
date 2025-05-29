const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('robot.db');

db.serialize(() => {
  db.run("PRAGMA foreign_keys = ON");

  db.run(`DROP TABLE IF EXISTS Specialite`);
  db.run(`DROP TABLE IF EXISTS Filiere`);
  db.run(`DROP TABLE IF EXISTS Domaine`);
  db.run(`DROP TABLE IF EXISTS Ecole`);
  db.run(`DROP TABLE IF EXISTS Admin`);

  db.run(`CREATE TABLE Admin (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    login TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  )`);

  db.run(`CREATE TABLE Ecole (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL,
    login TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  )`);

  db.run(`CREATE TABLE Domaine (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL,
    couleur TEXT DEFAULT '#3498db',
    ecole_id INTEGER NOT NULL,
    FOREIGN KEY (ecole_id) REFERENCES Ecole(id) ON DELETE CASCADE
  )`);

  db.run(`CREATE TABLE Filiere (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL,
    domaine_id INTEGER NOT NULL,
    FOREIGN KEY (domaine_id) REFERENCES Domaine(id) ON DELETE CASCADE
  )`);

  db.run(`CREATE TABLE Specialite (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL,
    filiere_id INTEGER NOT NULL,
    FOREIGN KEY (filiere_id) REFERENCES Filiere(id) ON DELETE CASCADE
  )`);

  db.run(`INSERT INTO Admin (login, password) VALUES (?, ?)`, ["admin", "pioupiou"]);

});

db.close();
