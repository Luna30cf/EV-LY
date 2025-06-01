// server.js
//
// Serveur Express + SQLite + Sessions.
// - Authentification basique avec session (Admin)
// - CRUD complet pour Ecole, Domaine, Filiere, Specialite (avec custom_fields)
// - Gestion du mode “dark” : on sert deux CSS (styles.css et styles-dark.css)
// - Deux routes distinctes pour le dashboard : “cartes” et “liste”

const express       = require('express');
const sqlite3       = require('sqlite3').verbose();
const session       = require('express-session');
const bodyParser    = require('body-parser');
const path          = require('path');

const app = express();
const db  = new sqlite3.Database('robot.db');

// === MIDDLEWARES ===

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
  secret: 'robot_secret',      // À personnaliser en production
  resave: false,
  saveUninitialized: false
}));
// Dans server.js, avant `app.use(express.static(path.join(__dirname, 'public')));`

// Redirige "/" vers "/login.html" (si ce n'est pas déjà présent)
app.get('/', (req, res) => {
  return res.redirect('/login.html');
});

// Routes pour les vues “Cartes” et “Liste”
app.get('/dashboard/cards', requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard_cards.html'));
});
app.get('/dashboard/list', requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard_list.html'));
});


// Servir automatiquement tous les fichiers statiques dans /public
// (CSS, JS front, images, fichiers HTML, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// Middleware pour vérifier que l’admin est connecté
function requireLogin(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.redirect('/login.html');
  }
  next();
}

// === ROUTES D’AUTHENTIFICATION ===

// GET /login.html : la page login (fichier statique dans /public)
app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// POST /login : vérifie login/password dans la table Admin
app.post('/login', (req, res) => {
  const { login, password } = req.body;
  if (!login || !password) {
    return res.status(400).json({ error: 'Champs requis' });
  }

  const sql = `SELECT id FROM Admin WHERE login = ? AND password = ?`;
  db.get(sql, [login, password], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) {
      return res.status(401).json({ error: 'Login ou mot de passe incorrect' });
    }
    // Authentifié : on stocke l’id admin en session
    req.session.userId = row.id;
    // Redirection vers le dashboard par défaut (#cartes)
    return res.json({ success: true, redirect: '/dashboard/cards' });
  });
});

// GET /logout : déconnecte l’admin
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login.html');
  });
});

// === ROUTES DE DASHBOARD ===

// Deux pages HTML distinctes pour le dashboard cartes / liste
app.get('/dashboard/cards', requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard_cards.html'));
});

app.get('/dashboard/list', requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard_list.html'));
});

// === ROUTES ADMIN (pages statiques pour la gestion) ===

app.get('/admin.html', requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/admin_gestion.html', requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin_gestion.html'));
});

// === CRUD “École” ===

// POST /ecoles  → créer une nouvelle École avec ses champs (nom, adresse, etc. + custom_fields)
app.post('/ecoles', requireLogin, (req, res) => {
  const {
    nom,
    adresse = null,
    ville = null,
    code_postal = null,
    telephone = null,
    email = null,
    custom_fields = '{}'
  } = req.body;

  if (!nom) {
    return res.status(400).json({ error: 'Le nom de l\'école est requis' });
  }

  const sql = `
    INSERT INTO Ecole (nom, adresse, ville, code_postal, telephone, email, custom_fields)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  db.run(sql, [nom, adresse, ville, code_postal, telephone, email, custom_fields], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, ecole_id: this.lastID });
  });
});

// GET /ecoles → liste toutes les écoles
app.get('/ecoles', requireLogin, (req, res) => {
  const sql = `SELECT * FROM Ecole`;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// GET /ecoles/:id → récupérer une école par son ID
app.get('/ecoles/:id', requireLogin, (req, res) => {
  const sql = `SELECT * FROM Ecole WHERE id = ?`;
  db.get(sql, [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'École introuvable' });
    res.json(row);
  });
});

// PUT /ecoles/:id → modifier une école (tous champs possibles)
app.put('/ecoles/:id', requireLogin, (req, res) => {
  const {
    nom,
    adresse = null,
    ville = null,
    code_postal = null,
    telephone = null,
    email = null,
    custom_fields = '{}'
  } = req.body;

  if (!nom) {
    return res.status(400).json({ error: 'Le nom de l\'école est requis' });
  }

  const sql = `
    UPDATE Ecole
    SET nom = ?, adresse = ?, ville = ?, code_postal = ?, telephone = ?, email = ?, custom_fields = ?
    WHERE id = ?
  `;
  db.run(sql,
    [nom, adresse, ville, code_postal, telephone, email, custom_fields, req.params.id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'École introuvable' });
      res.json({ success: true });
    }
  );
});

// DELETE /ecoles/:id → supprimer une école (cascade → ses domaines, filières, spécialités)
app.delete('/ecoles/:id', requireLogin, (req, res) => {
  const sql = `DELETE FROM Ecole WHERE id = ?`;
  db.run(sql, [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'École introuvable' });
    res.json({ success: true });
  });
});


// === CRUD “Domaine” ===

// POST /domaines → créer un Domaine (nom, couleur, description, ecole_id, custom_fields)
app.post('/domaines', requireLogin, (req, res) => {
  const {
    nom,
    couleur = '#3498db',
    description = null,
    ecole_id,
    custom_fields = '{}'
  } = req.body;

  if (!nom || !ecole_id) {
    return res.status(400).json({ error: 'nom et ecole_id sont requis' });
  }

  const sql = `
    INSERT INTO Domaine (nom, couleur, description, ecole_id, custom_fields)
    VALUES (?, ?, ?, ?, ?)
  `;
  db.run(sql, [nom, couleur, description, ecole_id, custom_fields], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, domaine_id: this.lastID });
  });
});

// GET /domaines → lister tous les Domaines
app.get('/domaines', requireLogin, (req, res) => {
  const sql = `SELECT * FROM Domaine`;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// GET /ecoles/:ecole_id/domaines → lister les Domaines d’une École
app.get('/ecoles/:ecole_id/domaines', requireLogin, (req, res) => {
  const sql = `SELECT * FROM Domaine WHERE ecole_id = ?`;
  db.all(sql, [req.params.ecole_id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// PUT /domaines/:id → modifier un Domaine
app.put('/domaines/:id', requireLogin, (req, res) => {
  const {
    nom,
    couleur = '#3498db',
    description = null,
    ecole_id,
    custom_fields = '{}'
  } = req.body;

  if (!nom || !ecole_id) {
    return res.status(400).json({ error: 'nom et ecole_id sont requis' });
  }

  const sql = `
    UPDATE Domaine
    SET nom = ?, couleur = ?, description = ?, ecole_id = ?, custom_fields = ?
    WHERE id = ?
  `;
  db.run(sql,
    [nom, couleur, description, ecole_id, custom_fields, req.params.id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'Domaine introuvable' });
      res.json({ success: true });
    }
  );
});

// DELETE /domaines/:id → supprimer un Domaine (cascade vers Filières/Spécialités)
app.delete('/domaines/:id', requireLogin, (req, res) => {
  const sql = `DELETE FROM Domaine WHERE id = ?`;
  db.run(sql, [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Domaine introuvable' });
    res.json({ success: true });
  });
});

// === CRUD “Filiere” ===

// POST /filieres → créer une Filière (nom, description, domaine_id, custom_fields)
app.post('/filieres', requireLogin, (req, res) => {
  const {
    nom,
    description = null,
    domaine_id,
    custom_fields = '{}'
  } = req.body;

  if (!nom || !domaine_id) {
    return res.status(400).json({ error: 'nom et domaine_id sont requis' });
  }

  const sql = `
    INSERT INTO Filiere (nom, description, domaine_id, custom_fields)
    VALUES (?, ?, ?, ?)
  `;
  db.run(sql, [nom, description, domaine_id, custom_fields], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, filiere_id: this.lastID });
  });
});

// GET /filieres → lister toutes les Filières
app.get('/filieres', requireLogin, (req, res) => {
  const sql = `SELECT * FROM Filiere`;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// GET /domaines/:domaine_id/filieres → lister les Filières d’un Domaine
app.get('/domaines/:domaine_id/filieres', requireLogin, (req, res) => {
  const sql = `SELECT * FROM Filiere WHERE domaine_id = ?`;
  db.all(sql, [req.params.domaine_id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// PUT /filieres/:id → modifier une Filière
app.put('/filieres/:id', requireLogin, (req, res) => {
  const {
    nom,
    description = null,
    domaine_id,
    custom_fields = '{}'
  } = req.body;

  if (!nom || !domaine_id) {
    return res.status(400).json({ error: 'nom et domaine_id sont requis' });
  }

  const sql = `
    UPDATE Filiere
    SET nom = ?, description = ?, domaine_id = ?, custom_fields = ?
    WHERE id = ?
  `;
  db.run(sql,
    [nom, description, domaine_id, custom_fields, req.params.id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'Filière introuvable' });
      res.json({ success: true });
    }
  );
});

// DELETE /filieres/:id → supprimer une Filière (cascade vers Spécialités)
app.delete('/filieres/:id', requireLogin, (req, res) => {
  const sql = `DELETE FROM Filiere WHERE id = ?`;
  db.run(sql, [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Filière introuvable' });
    res.json({ success: true });
  });
});

// === CRUD “Specialite” ===

// POST /specialites → créer une Spécialité (nom, description, filiere_id, custom_fields)
app.post('/specialites', requireLogin, (req, res) => {
  const {
    nom,
    description = null,
    filiere_id,
    custom_fields = '{}'
  } = req.body;

  if (!nom || !filiere_id) {
    return res.status(400).json({ error: 'nom et filiere_id sont requis' });
  }

  const sql = `
    INSERT INTO Specialite (nom, description, filiere_id, custom_fields)
    VALUES (?, ?, ?, ?)
  `;
  db.run(sql, [nom, description, filiere_id, custom_fields], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, specialite_id: this.lastID });
  });
});

// GET /specialites → lister toutes les Spécialités
app.get('/specialites', requireLogin, (req, res) => {
  const sql = `SELECT * FROM Specialite`;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// GET /filieres/:filiere_id/specialites → lister les Spécialités d’une Filière
app.get('/filieres/:filiere_id/specialites', requireLogin, (req, res) => {
  const sql = `SELECT * FROM Specialite WHERE filiere_id = ?`;
  db.all(sql, [req.params.filiere_id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// PUT /specialites/:id → modifier une Spécialité
app.put('/specialites/:id', requireLogin, (req, res) => {
  const {
    nom,
    description = null,
    filiere_id,
    custom_fields = '{}'
  } = req.body;

  if (!nom || !filiere_id) {
    return res.status(400).json({ error: 'nom et filiere_id sont requis' });
  }

  const sql = `
    UPDATE Specialite
    SET nom = ?, description = ?, filiere_id = ?, custom_fields = ?
    WHERE id = ?
  `;
  db.run(sql,
    [nom, description, filiere_id, custom_fields, req.params.id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'Spécialité introuvable' });
      res.json({ success: true });
    }
  );
});

// DELETE /specialites/:id → supprimer une Spécialité
app.delete('/specialites/:id', requireLogin, (req, res) => {
  const sql = `DELETE FROM Specialite WHERE id = ?`;
  db.run(sql, [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Spécialité introuvable' });
    res.json({ success: true });
  });
});


// === GESTION DES FICHIERS CSS POUR LE MODE “DARK” ===
//
// On suppose que vous avez dans /public deux fichiers :
//   - styles.css       (CSS standard “clair”)
//   - styles-dark.css  (CSS pour le thème sombre)
//
// Pour basculer côté client, il suffira d’ajouter un 
// <link id="themeStylesheet" href="/styles.css" rel="stylesheet"> dans le HTML 
// puis, via JS, remplacer par “/styles-dark.css” ou “/styles.css” 
// selon le choix de l’utilisateur.
//
// Exemple de route (pas absolument nécessaire, les fichiers statiques 
// sont déjà servis par express.static) :
app.get('/styles.css', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'styles.css'));
});
app.get('/styles-dark.css', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'styles-dark.css'));
});

// === ROUTE DE START DU SERVEUR ===

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
