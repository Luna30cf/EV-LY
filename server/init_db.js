// init_db.js
//
// Initialise la base SQLite “robot.db” avec : 
// - Les tables Admin, Ecole, Domaine, Filiere, Specialite
// - Ajout d’un champ custom_fields (JSON sous forme TEXT) dans chaque table
// - Quelques exemples de champs “classiques” : adresse, description, couleur, etc.
// - Insertion d’un admin par défaut (login=admin / password=pioupiou)

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('robot.db');

db.serialize(() => {
  // Activer les clés étrangères
  db.run("PRAGMA foreign_keys = ON");

  // Supprimer d’éventuelles anciennes tables
  db.run(`DROP TABLE IF EXISTS Specialite`);
  db.run(`DROP TABLE IF EXISTS Filiere`);
  db.run(`DROP TABLE IF EXISTS Domaine`);
  db.run(`DROP TABLE IF EXISTS Ecole`);
  db.run(`DROP TABLE IF EXISTS Admin`);

  // Création de la table Admin
  db.run(`
    CREATE TABLE Admin (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      login TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      email TEXT,
      role TEXT DEFAULT 'admin',
      custom_fields TEXT DEFAULT '{}' 
    )
  `);

  // Création de la table Ecole (avec adresse, ville, téléphone…)
  db.run(`
    CREATE TABLE Ecole (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nom TEXT NOT NULL,
      adresse TEXT,
      ville TEXT,
      code_postal TEXT,
      telephone TEXT,
      email TEXT,
      custom_fields TEXT DEFAULT '{}' 
    )
  `);

  // Création de la table Domaine
  db.run(`
    CREATE TABLE Domaine (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nom TEXT NOT NULL,
      couleur TEXT DEFAULT '#3498db',
      description TEXT,
      ecole_id INTEGER NOT NULL,
      custom_fields TEXT DEFAULT '{}',
      FOREIGN KEY (ecole_id) REFERENCES Ecole(id) ON DELETE CASCADE
    )
  `);

  // Création de la table Filiere
  db.run(`
    CREATE TABLE Filiere (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nom TEXT NOT NULL,
      description TEXT,
      domaine_id INTEGER NOT NULL,
      custom_fields TEXT DEFAULT '{}',
      FOREIGN KEY (domaine_id) REFERENCES Domaine(id) ON DELETE CASCADE
    )
  `);

  // Création de la table Specialite
  db.run(`
    CREATE TABLE Specialite (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nom TEXT NOT NULL,
      description TEXT,
      filiere_id INTEGER NOT NULL,
      custom_fields TEXT DEFAULT '{}',
      FOREIGN KEY (filiere_id) REFERENCES Filiere(id) ON DELETE CASCADE
    )
  `);

  // Insertion d’un compte Admin par défaut
  db.run(
    `INSERT INTO Admin (login, password) VALUES (?, ?)`,
    ['admin', 'pioupiou']
  );
});

db.close();
console.log("Base SQLite initialisée dans robot.db");
