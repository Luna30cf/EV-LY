const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const db = new sqlite3.Database('robot.db');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
  secret: 'robot_secret',
  resave: false,
  saveUninitialized: false
}));

app.use(express.static('public'));

function requireLogin(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: 'Non autorisé' });
  next();
}

app.post('/login', (req, res) => {
  const { username, password } = req.body;

  db.get(`SELECT * FROM Admin WHERE login = ? AND password = ?`, [username, password], (err, admin) => {
    if (admin) {
      req.session.user = { type: 'admin', id: admin.id };
      return res.json({ redirect: '/admin.html' });
    }
    db.get(`SELECT * FROM Ecole WHERE login = ? AND password = ?`, [username, password], (err, ecole) => {
      if (ecole) {
        req.session.user = { type: 'ecole', id: ecole.id };
        return res.json({ redirect: '/ecole.html' });
      }
      res.status(401).json({ error: 'Identifiants incorrects' });
    });
  });
});

// CRUD Écoles (admin)
app.get('/ecoles', requireLogin, (req, res) => {
  if (req.session.user.type !== 'admin') return res.sendStatus(403);
  db.all(`SELECT * FROM Ecole`, [], (err, rows) => res.json(rows));
});

app.post('/ecoles', requireLogin, (req, res) => {
  if (req.session.user.type !== 'admin') return res.sendStatus(403);
  const { nom, login, password } = req.body;
  db.run(`INSERT INTO Ecole (nom, login, password) VALUES (?, ?, ?)`, [nom, login, password], function (err) {
    if (err) return res.status(400).json({ error: err.message });
    res.status(201).json({ id: this.lastID });
  });
});

app.delete('/ecoles/:id', requireLogin, (req, res) => {
  if (req.session.user.type !== 'admin') return res.sendStatus(403);
  db.run(`DELETE FROM Ecole WHERE id = ?`, [req.params.id], function (err) {
    if (err) return res.status(400).json({ error: err.message });
    res.json({ success: true });
  });
});

// Domaines
app.get('/domaines', requireLogin, (req, res) => {
  const ecoleId = req.session.user.type === 'admin' && req.query.ecole_id
    ? req.query.ecole_id
    : req.session.user.id;

  db.all(`SELECT * FROM Domaine WHERE ecole_id = ?`, [ecoleId], (err, rows) => res.json(rows));
});

app.post('/domaines', requireLogin, (req, res) => {
  const { nom, ecole_id, couleur } = req.body;
  const colorValue = couleur || '#3498db';
  const sql = `INSERT INTO Domaine (nom, ecole_id, couleur) VALUES (?, ?, ?)`;
  db.run(sql, [nom, ecole_id, colorValue], function(err) {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({ id: this.lastID });
  });
});

app.delete('/domaines/:id', requireLogin, (req, res) => {
  db.run(`DELETE FROM Domaine WHERE id = ?`, [req.params.id], function (err) {
    if (err) return res.status(400).json({ error: err.message });
    res.json({ success: true });
  });
});

// Filières
app.get('/filieres/:domaine_id', requireLogin, (req, res) => {
  db.all(`SELECT * FROM Filiere WHERE domaine_id = ?`, [req.params.domaine_id], (err, rows) => res.json(rows));
});

app.post('/filieres', requireLogin, (req, res) => {
  const { nom, domaine_id } = req.body;
  db.run(`INSERT INTO Filiere (nom, domaine_id) VALUES (?, ?)`, [nom, domaine_id], function (err) {
    if (err) return res.status(400).json({ error: err.message });
    res.status(201).json({ id: this.lastID });
  });
});

app.delete('/filieres/:id', requireLogin, (req, res) => {
  db.run(`DELETE FROM Filiere WHERE id = ?`, [req.params.id], function (err) {
    if (err) return res.status(400).json({ error: err.message });
    res.json({ success: true });
  });
});

// Spécialités
app.get('/specialites/:filiere_id', requireLogin, (req, res) => {
  db.all(`SELECT * FROM Specialite WHERE filiere_id = ?`, [req.params.filiere_id], (err, rows) => res.json(rows));
});

app.post('/specialites', requireLogin, (req, res) => {
  const { nom, filiere_id } = req.body;
  db.run(`INSERT INTO Specialite (nom, filiere_id) VALUES (?, ?)`, [nom, filiere_id], function (err) {
    if (err) return res.status(400).json({ error: err.message });
    res.status(201).json({ id: this.lastID });
  });
});

app.delete('/specialites/:id', requireLogin, (req, res) => {
  db.run(`DELETE FROM Specialite WHERE id = ?`, [req.params.id], function (err) {
    if (err) return res.status(400).json({ error: err.message });
    res.json({ success: true });
  });
});



// Serveur
app.listen(3000, () => {
  console.log('Serveur démarré sur http://localhost:3000');
});
