const mqtt = require('mqtt');
const brokerUrl = 'mqtt://broker.emqx.io'; // Même broker que le serveur

function testLogin(username, password) {
  const client = mqtt.connect(brokerUrl);

  client.on('connect', () => {
    console.log('Connecté au broker MQTT (test)');

    // S'abonner au topic de réponse
    client.subscribe('robot/login/response', (err) => {
      if (err) {
        console.error('Erreur subscription:', err);
        client.end();
        return;
      }

      // Envoyer la requête login
      const payload = JSON.stringify({ username, password });
      console.log('Envoi login:', payload);
      client.publish('robot/login', payload);
    });
  });

  client.on('message', (topic, message) => {
    if (topic === 'robot/login/response') {
      console.log('Réponse reçue:', message.toString());
      client.end();
    }
  });

  client.on('error', (err) => {
    console.error('Erreur MQTT:', err);
    client.end();
  });
}

// Change les valeurs ici pour tester différents logins
testLogin('admin', '1234');
