const express = require('express');
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

const app = express();
const db = new sqlite3.Database('./data/filieres.db');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'supersecret',
  resave: false,
  saveUninitialized: true,
}));
app.use(express.static(path.join(__dirname, 'public')));

// Page login
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));

// Connexion
app.post('/login', (req, res) => {
  const { login, password } = req.body;

  db.get('SELECT * FROM users WHERE login = ?', [login], async (err, user) => {
    if (err || !user) return res.status(401).send('Identifiants invalides');
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(403).send('Mot de passe incorrect');

    req.session.user = user;
    if (user.role === 'admin') res.redirect('/admin.html');
    else res.redirect('/ecole.html');
  });
});

// Middleware auth
function requireLogin(req, res, next) {
  if (!req.session.user) return res.status(401).send('Non autorisé');
  next();
}

// ADMIN: Créer école
app.post('/create-ecole', requireLogin, (req, res) => {
  if (req.session.user.role !== 'admin') return res.status(403).send('Interdit');
  const { nom, login, password, adresse } = req.body;
  bcrypt.hash(password, 10).then(hash => {
    db.run(
      'INSERT INTO users (nom, login, password, role, adresse) VALUES (?, ?, ?, ?, ?)',
      [nom, login, hash, 'ecole', adresse],
      (err) => {
        if (err) return res.status(500).send('Erreur DB');
        res.redirect('/admin.html');
      }
    );
  });
});

// DOMAINES
app.get('/api/domaines', requireLogin, (req, res) => {
  db.all('SELECT * FROM domaines', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/domaines', requireLogin, (req, res) => {
  if (req.session.user.role !== 'admin') return res.status(403).send('Interdit');
  const { nom } = req.body;
  db.run('INSERT INTO domaines (nom) VALUES (?)', [nom], err => {
    if (err) return res.status(500).send('Erreur DB');
    res.redirect('/admin.html');
  });
});

// FILIERES
app.get('/api/filieres', requireLogin, (req, res) => {
  const domaine_id = req.query.domaine_id;
  let sql = 'SELECT * FROM filieres';
  const params = [];

  if (domaine_id) {
    sql += ' WHERE domaine_id = ?';
    params.push(domaine_id);
  }
  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/filieres', requireLogin, (req, res) => {
  const { nom, description, domaine_id } = req.body;
  db.run('INSERT INTO filieres (nom, description, domaine_id) VALUES (?, ?, ?)', [nom, description, domaine_id], err => {
    if (err) return res.status(500).send('Erreur DB');
    res.redirect('/ecole.html');
  });
});

// SPECIALITES
app.get('/api/specialites', requireLogin, (req, res) => {
  const filiere_id = req.query.filiere_id;
  let sql = 'SELECT * FROM specialites';
  const params = [];

  if (filiere_id) {
    sql += ' WHERE filiere_id = ?';
    params.push(filiere_id);
  }
  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/specialites', requireLogin, (req, res) => {
  const { nom, filiere_id } = req.body;
  db.run('INSERT INTO specialites (nom, filiere_id) VALUES (?, ?)', [nom, filiere_id], err => {
    if (err) return res.status(500).send('Erreur DB');
    res.redirect('/ecole.html');
  });
});

app.listen(3000, () => console.log('Serveur sur http://localhost:3000'));
