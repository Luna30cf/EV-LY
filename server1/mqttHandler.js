const mqtt = require('mqtt');

// Config du broker
const brokerUrl = 'mqtt://broker.emqx.io'; // broker public

// Fonction pour valider le login (à personnaliser)
function validateLogin(username, password) {
  // Exemple simple
  return username === 'admin' && password === 'piou';
}

// Fonction pour initialiser la connexion MQTT et gérer les messages
function initMqtt() {
  const client = mqtt.connect(brokerUrl);

  client.on('connect', () => {
    console.log('Connecté au broker MQTT');
    client.subscribe('robot/login', (err) => {
      if (err) {
        console.error('Erreur subscription:', err);
      } else {
        console.log('Abonné au topic robot/login');
      }
    });
  });

  client.on('message', (topic, message) => {
    console.log(`Message reçu sur topic ${topic}: ${message.toString()}`);
    if (topic === 'robot/login') {
      try {
        const data = JSON.parse(message.toString());

        let response;
        if (validateLogin(data.username, data.password)) {
          response = { result: 'success' };
        } else {
          response = { result: 'error', message: "Nom d'utilisateur ou mot de passe incorrect" };
        }

        client.publish('robot/login/response', JSON.stringify(response));
        console.log('Réponse envoyée:', response);
      } catch (e) {
        console.error('Erreur traitement message:', e);
      }
    }
  });

  client.on('error', (err) => {
    console.error('Erreur MQTT:', err);
  });

  return client;
}

initMqtt()
