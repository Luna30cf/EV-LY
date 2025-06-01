# EV-LY

Ce projet regroupe plusieurs modules (base roulante, manette, écran, serveur) pour piloter et afficher l’état d’un robot via Arduino/ESP32 et un serveur Web/MQTT. L’objectif principal est de contrôler la base roulante, communiquer sans fil entre manette et écran, et visualiser/contrôler le robot depuis une interface Web.

---


- **espnowMAC.py** : script Python utilisé pour découvrir/adresser dynamiquement les adresses MAC des ESP32 (mode ESP-NOW).
- **.gitignore** : fichiers/dossiers ignorés par Git.

---

## Modules et fonctionnalités

### 1. Base roulante (`/base roulante`)
- **main.py** : programme principal exécuté sur l’ESP32 ou microcontrôleur pilotant les moteurs.  
- **motor.py** : bibliothèque de gestion des moteurs (pilotage PWM, directions, limites de vitesse).

> **But** : recevoir des commandes (via ESP-NOW) et actionner les moteurs pour déplacer la base roulante.

### 2. Manette (`/manette`)
- **main.py** : code MicroPython embarqué sur l’ESP32 servant de télécommande.  
  - Lecture des entrées (joysticks)  
  - Envoi des commandes à la base (via ESP-NOW) 

> **But** : émettre des commandes de déplacement (avant/arrière, direction) et transmettre ces commandes au module « base roulante ».

### 3. Écran tactile (`/screen`)
- Projet Arduino (IDE Arduino).
- Deux sous-dossiers :
  1. **Draw/**  
     - **Draw.ino** + **gfx_conf.h** : exemple de démonstration d’interface graphique simple (dessin libre, boutons).
  2. **Main/**  
     - **main.ino** + **gfx_conf.h** : code principal de l’écran, basé sur LVGL et TFT_eSPI pour ESP32.  
       - Affichage de données reçues (état du robot, notifications)  
       - Lecture tactile (XPT2046 modifié pour NS2009)  
       - Éventuellement abonnement MQTT pour recevoir/afficher des informations en temps réel.

> **But** : proposer une interface HMI (graphique + tactile) pour visualiser le site mais de manière plus mobile, plus originale.

### 4. Serveur principal (`/server`)
- **server.js** : serveur Node.js (Express + Socket/MQTT) gérant l’API et la communication Web.  
- **mqttHandler.js** : logique de souscription/publication MQTT (ex. topics `robot/commande`, `robot/etat`).  
- **init_db.js** : script d’initialisation de la base SQLite (`robot.db`) pour stocker utilisateurs, logs, données historiques.  
- **testlogin.js** : script de test d’authentification/MQTT (connexion, envoi de requêtes login, etc.).  
- **robot.db** : base de données SQLite embarquée (utilisateurs, permissions, historique).  
- **public/** : interface front-end statique (HTML/CSS/JS) pour :  
  - Page de login (`login.html`)  
  - Tableaux de bord (`dashboard.html`, `dashboard_cards.html`, `dashboard_list.html`)  
  - Gestion d’éléments (écoles, filières, spécialités, domaines)  
  - Administration (`admin.html`, `admin_gestion.html`)  
  - Feuilles de style (`styles.css`, `styles-dark.css`)

> **But** : offrir une interface Web complète pour se connecter, gérer les utilisateurs, visualiser l’état du robot, et envoyer des commandes de pilotage via MQTT/WebSocket.

### 5. Serveur secondaire (`/server1`)
- Structure quasi-identique à `/server`, avec interface publique plus restreinte.  
- Destiné à un environnement simplifié (IHM minimale, moins de fonctionnalités administratives).
- Moins de feuilles de style, moins de règles d'affichage (cartes/liste)
- Moins bien organisé (pages domaines/filières/spécialités absentes)
- Gestion et Approche UI simpliste

> **But** : servir de démonstration ou de version allégée du serveur principal, par exemple pour des tests ou un déploiement plus léger.

---

## Prérequis & installation

1. **Cloner le dépôt**  
   ```bash
   git clone https://github.com/Luna30cf/EV-LY.git

   cd EV-LY/server

   npm install
   node server.js
   ```

## Répartition 

- *Erika*
    - base roulante
        - modélisation
        - programmation moteurs
        - programmation capteurs ultrasons
        - recherche adresse mac
    - manette
        - modélisation
        - programmation joysticks
        - config esp-Now

- *Luna*
    - modélisation 3D
        - support écran
        - corps robot
    - Server1
        - mise en place de la DB
        - pages et architecture de base du site
        - Ecran
            - passage en arduino
                - Tactile

- *Karl*
    - Ecran
        - tests firmwares micropython
        - affichage avec arduino
        - Server
            - site propre
            - meilleure gestion des pages
            - dark mode
            - affichage liste/cartes


## A venir:

- Fichiers de configuration .env ou .json pour sécuriser les mots de passe de la DB notamment côté admin

- Fichiers d'affichage du site sur l'écran
- Connexion Mqtt server-ecran fonctionnelle

- DAO des modélisations 3D (Azad a le stl)