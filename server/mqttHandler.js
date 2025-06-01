// mqttHandler.js
//
// Ce module se connecte au broker MQTT (broker.emqx.io)
// et gère :
//   - robot/login             → vérification Login / Password dans SQLite
//   - robot/login/response    → envoi du résultat de l’authentification
//   - (vous pouvez ajouter d’autres topics MQTT pour CRUD Domaine/Filiere/… si besoin)

const sqlite3 = require('sqlite3').verbose();
const mqtt    = require('mqtt');

// Connexion au broker MQTT
const client = mqtt.connect('mqtt://broker.emqx.io');

// Base SQLite “robot.db”
const db = new sqlite3.Database('robot.db', (err) => {
  if (err) console.error("Erreur ouverture robot.db:", err.message);
  else console.log("Connecté à la base SQLite robot.db");
});

// Quand le client MQTT est connecté
client.on('connect', () => {
  console.log("Client MQTT connecté à broker.emqx.io");
  // On s’abonne au topic de login
  client.subscribe('robot/login', (err) => {
    if (err) console.error("Échec abonnement robot/login :", err);
    else console.log("Abonné au topic robot/login");
  });
});

// Lorsqu’un message arrive sur un topic
client.on('message', (topic, payload) => {
  if (topic === 'robot/login') {
    // On attend un JSON { "username": "...", "password": "..." }
    let msg;
    try {
      msg = JSON.parse(payload.toString());
    } catch (e) {
      console.error("Payload invalide (JSON) sur robot/login :", payload.toString());
      return;
    }
    const { username, password } = msg;
    if (!username || !password) {
      // Répondre avec une erreur JSON
      client.publish('robot/login/response', JSON.stringify({
        result: "error",
        message: "Champs manquants"
      }));
      return;
    }

    // Vérifier dans la table Admin
    db.get(
      `SELECT id FROM Admin WHERE login = ? AND password = ?`,
      [username, password],
      (err, row) => {
        if (err) {
          console.error("Erreur query SQLite :", err.message);
          client.publish('robot/login/response', JSON.stringify({
            result: "error",
            message: "Erreur serveur"
          }));
        } else if (!row) {
          // Login ou mot de passe incorrect
          client.publish('robot/login/response', JSON.stringify({
            result: "error",
            message: "Login ou mot de passe invalide"
          }));
        } else {
          // Authentification réussie
          client.publish('robot/login/response', JSON.stringify({
            result: "success"
          }));
        }
      }
    );
  }

  // *** Si vous voulez gérer d’autres topics via MQTT (CRUD Domaine, Filiere…) ***
  // Par exemple :
  //   if (topic === 'robot/getDomaines') { … récupérer domaines de SQLite puis 
  //       client.publish('robot/getDomaines/response', JSON.stringify(liste)); }
  //
  // mais pour l’instant, on ne fait que l’authentification.
});

module.exports = client;
