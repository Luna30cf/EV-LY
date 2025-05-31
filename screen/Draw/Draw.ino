/**************************************
   LoginScreen.ino
   100% autonome, sans MQTT
   Affiche un écran “Login” + clavier virtuel
**************************************/

#include <Wire.h>            // Nécessaire pour TwoWire, Wire1, etc.
#include <LovyanGFX.hpp>
#include "gfx_conf.h"

// Si vous voulez changer les identifiants « utilisateur / mot de passe », modifiez ici
static const char CORRECT_USER[] = "admin";
static const char CORRECT_PASS[] = "1234";

// —————————————————————————————————————————
// Définitions de zones tactiles à l’écran
// —————————————————————————————————————————

// Zone du champ “Nom d’utilisateur”
static const int16_t USER_X = 150;
static const int16_t USER_Y = 100;
static const int16_t USER_W = 500;
static const int16_t USER_H = 40;

// Zone du champ “Mot de passe”
static const int16_t PASS_X = 150;
static const int16_t PASS_Y = 180;
static const int16_t PASS_W = 500;
static const int16_t PASS_H = 40;

// Zone du bouton “Se connecter”
static const int16_t BTN_X = 300;
static const int16_t BTN_Y = 260;
static const int16_t BTN_W = 200;
static const int16_t BTN_H = 50;

// États de saisie
enum Field_t {
  NONE,
  USER_FIELD,
  PASS_FIELD
};
static Field_t activeField = NONE;

// Stockage des chaînes saisies
static char userText[16] = "";
static char passText[16] = "";

// Position dans la chaîne
static size_t cursorPos = 0;

// Flag pour savoir si le clavier virtuel est affiché
static bool keyboardVisible = false;

// Dimensions du clavier virtuel
static const int16_t KB_X   =  50;
static const int16_t KB_Y   = 330;
static const int16_t KB_W   = 700;
static const int16_t KB_H   = 140;

// Taille d’une touche du clavier (grille 10 colonnes × 4 lignes)
static const int16_t KEY_W  = (KB_W - 11 * 2) / 10;  // espace 2px entre chaque
static const int16_t KEY_H  = (KB_H - 5 * 2) /  4;   // espace 2px en haut/bas

// Les caractères disponibles (26 lettres + 10 chiffres + effacer + OK)
static const char keyChars[4][10] = {
  {'A','B','C','D','E','F','G','H','I','J'},
  {'K','L','M','N','O','P','Q','R','S','T'},
  {'U','V','W','X','Y','Z','0','1','2','3'},
  {'4','5','6','7','8','9','<','_','-','+'}
};
// ‘<’ = backspace, ‘_’ = espace, ‘-’ = point, ‘+’ = OK

/**************************************
   Fonction : drawLoginScreen()
   Dessine l’interface de login de base
**************************************/
void drawLoginScreen() {
  tft.fillScreen(TFT_WHITE);
  tft.setTextSize(2);
  tft.setTextFont(1);
  tft.setTextColor(TFT_BLACK);

  // Titre
  tft.setCursor(300, 40);
  tft.print("Connexion");

  // Label “Nom d’utilisateur”
  tft.setCursor(USER_X, USER_Y - 20);
  tft.print("Nom d'utilisateur");

  // Zone du champ utilisateur (rectangle vide)
  tft.drawRect(USER_X, USER_Y, USER_W, USER_H, TFT_BLACK);

  // Si déjà du texte saisi, l’afficher
  if (strlen(userText) > 0) {
    tft.setCursor(USER_X + 5, USER_Y + 10);
    tft.print(userText);
  }

  // Label “Mot de passe”
  tft.setCursor(PASS_X, PASS_Y - 20);
  tft.print("Mot de passe");

  // Zone du champ mot de passe
  tft.drawRect(PASS_X, PASS_Y, PASS_W, PASS_H, TFT_BLACK);

  // Affiche des étoiles (●) pour chaque caractère de passText
  if (strlen(passText) > 0) {
    tft.setCursor(PASS_X + 5, PASS_Y + 10);
    for (size_t i = 0; i < strlen(passText); i++) {
      tft.print("\xE2\x97\x8F");  // ●
      tft.print(" ");
    }
  }

  // Bouton “Se connecter”
  tft.fillRect(BTN_X, BTN_Y, BTN_W, BTN_H, TFT_NAVY);
  tft.drawRect(BTN_X, BTN_Y, BTN_W, BTN_H, TFT_BLACK);
  tft.setTextColor(TFT_WHITE);
  tft.setTextSize(2);
  tft.setCursor(BTN_X + 30, BTN_Y + 12);
  tft.print("Se connecter");

  // Masquer le clavier virtuel si déjà affiché
  keyboardVisible = false;
}

/**************************************
   Fonction : drawKeyboard()
   Dessine le clavier virtuel sous les champs
**************************************/
void drawKeyboard() {
  keyboardVisible = true;
  // Fond gris clair
  tft.fillRect(KB_X - 2, KB_Y - 2, KB_W + 4, KB_H + 4, TFT_LIGHTGREY);

  tft.setTextSize(2);
  tft.setTextFont(1);
  for (int i = 0; i < 4; i++) {
    for (int j = 0; j < 10; j++) {
      int16_t x = KB_X + j * (KEY_W + 2);
      int16_t y = KB_Y + i * (KEY_H + 2);
      // Bouton blanc
      tft.fillRect(x, y, KEY_W, KEY_H, TFT_WHITE);
      tft.drawRect(x, y, KEY_W, KEY_H, TFT_BLACK);

      // Caractère ou symbole
      char c = keyChars[i][j];
      tft.setTextColor(TFT_BLACK);
      int16_t tx = x + (KEY_W / 2) - 8;
      int16_t ty = y + (KEY_H / 2) - 8;
      if (c == '<') {
        tft.setCursor(tx, ty);
        tft.print("←");        // Backspace
      } else if (c == '_') {
        tft.setCursor(tx - 4, ty);
        tft.print("SP");       // Espace
      } else if (c == '-') {
        tft.setCursor(tx, ty);
        tft.print(".");        // Point
      } else if (c == '+') {
        tft.setCursor(tx - 4, ty);
        tft.print("OK");
      } else {
        tft.setCursor(tx, ty);
        tft.print(c);
      }
    }
  }
}

/**************************************
   Fonction : checkKeyboardTouch(x, y)
   Si la touche (x,y) se trouve dans la zone du clavier virtuel,
   on renvoie le caractère correspondant. Sinon, on retourne '\0'.
**************************************/
char checkKeyboardTouch(int16_t tx, int16_t ty) {
  if (!keyboardVisible) return '\0';
  if (tx < KB_X || tx >= KB_X + KB_W) return '\0';
  if (ty < KB_Y || ty >= KB_Y + KB_H) return '\0';

  int col = (tx - KB_X) / (KEY_W + 2);
  int row = (ty - KB_Y) / (KEY_H + 2);
  if (col < 0 || col > 9 || row < 0 || row > 3) return '\0';

  return keyChars[row][col];
}

/**************************************
   Fonction : displayMessage(msg, colorBg, colorText)
   Affiche un message en bas de l’écran temporellement
**************************************/
void displayMessage(const char* msg, uint16_t colorBg, uint16_t colorText) {
  // Efface la zone de message
  tft.fillRect(0, 450, 800, 30, TFT_WHITE);
  tft.setTextSize(2);
  tft.setTextColor(colorText);
  tft.setCursor(100, 455);
  tft.print(msg);
  delay(1000);
  // Réaffiche l’écran de login
  drawLoginScreen();
}

/**************************************
   Fonction utilitaire pour récupérer un toucher
   (remplace “auto p = tft.getTouch()”)
**************************************/
bool getTouchPoint(int16_t &x, int16_t &y) {
  lgfx::v1::touch_point_t tp;
  if (tft.getTouch(&tp, 1)) {   // si un point tactile est disponible
    x = tp.x;
    y = tp.y;
    return true;
  }
  return false;
}

/**************************************
   Fonction : setup()
**************************************/
void setup() {
  Serial.begin(115200);
  tft.begin();
  tft.setBrightness(255);
  drawLoginScreen();
}

/**************************************
   Fonction : loop()
   Boucle principale qui gère le toucher
**************************************/
void loop() {
  // Si clavier virtuel visible, on gère d’abord les touches du clavier
  if (keyboardVisible) {
    int16_t x, y;
    if (getTouchPoint(x, y)) {
      char c = checkKeyboardTouch(x, y);
      if (c != '\0') {
        if (c == '<') {
          // Backspace
          if (activeField == USER_FIELD && cursorPos > 0) {
            userText[--cursorPos] = '\0';
          } else if (activeField == PASS_FIELD && cursorPos > 0) {
            passText[--cursorPos] = '\0';
          }
        }
        else if (c == '_') {
          // Espace
          if (activeField == USER_FIELD && cursorPos < sizeof(userText) - 1) {
            userText[cursorPos++] = ' ';
            userText[cursorPos] = '\0';
          }
          else if (activeField == PASS_FIELD && cursorPos < sizeof(passText) - 1) {
            passText[cursorPos++] = ' ';
            passText[cursorPos] = '\0';
          }
        }
        else if (c == '-') {
          // Point
          if (activeField == USER_FIELD && cursorPos < sizeof(userText) - 1) {
            userText[cursorPos++] = '.';
            userText[cursorPos] = '\0';
          }
          else if (activeField == PASS_FIELD && cursorPos < sizeof(passText) - 1) {
            passText[cursorPos++] = '.';
            passText[cursorPos] = '\0';
          }
        }
        else if (c == '+') {
          // OK → fermer clavier
          keyboardVisible = false;
          drawLoginScreen();
        }
        else {
          // Lettre ou chiffre normal
          if (activeField == USER_FIELD && cursorPos < sizeof(userText) - 1) {
            userText[cursorPos++] = c;
            userText[cursorPos]  = '\0';
          }
          else if (activeField == PASS_FIELD && cursorPos < sizeof(passText) - 1) {
            passText[cursorPos++] = c;
            passText[cursorPos]   = '\0';
          }
        }

        // Mise à jour locale du champ actif
        if (activeField == USER_FIELD) {
          tft.fillRect(USER_X + 1, USER_Y + 1, USER_W - 2, USER_H - 2, TFT_WHITE);
          tft.setCursor(USER_X + 5, USER_Y + 10);
          tft.setTextSize(2);
          tft.setTextColor(TFT_BLACK);
          tft.print(userText);
        }
        else if (activeField == PASS_FIELD) {
          tft.fillRect(PASS_X + 1, PASS_Y + 1, PASS_W - 2, PASS_H - 2, TFT_WHITE);
          tft.setCursor(PASS_X + 5, PASS_Y + 10);
          tft.setTextSize(2);
          tft.setTextColor(TFT_BLACK);
          for (size_t i = 0; i < strlen(passText); i++) {
            tft.print("\xE2\x97\x8F");
            tft.print(" ");
          }
        }

        delay(200); // anti-rebond
      }
      return;
    }
  }

  // Si clavier masqué, on gère les clics sur l’écran de login
  int16_t x, y;
  if (getTouchPoint(x, y)) {
    // 1) Champ “Nom d’utilisateur” cliqué ?
    if (x >= USER_X && x < USER_X + USER_W && y >= USER_Y && y < USER_Y + USER_H) {
      activeField = USER_FIELD;
      cursorPos   = strlen(userText);
      drawKeyboard();
      return;
    }

    // 2) Champ “Mot de passe” cliqué ?
    if (x >= PASS_X && x < PASS_X + PASS_W && y >= PASS_Y && y < PASS_Y + PASS_H) {
      activeField = PASS_FIELD;
      cursorPos   = strlen(passText);
      drawKeyboard();
      return;
    }

    // 3) Bouton “Se connecter” cliqué ?
    if (x >= BTN_X && x < BTN_X + BTN_W && y >= BTN_Y && y < BTN_Y + BTN_H) {
      // Vérification des identifiants
      if (strcmp(userText, CORRECT_USER) == 0 && strcmp(passText, CORRECT_PASS) == 0) {
        displayMessage("Connexion reussie !", TFT_GREEN, TFT_BLACK);
      } else {
        displayMessage("Utilisateur ou mdp incorrect", TFT_RED, TFT_WHITE);
      }
      // Réinitialiser les champs
      userText[0] = '\0';
      passText[0] = '\0';
      activeField = NONE;
      cursorPos   = 0;
      keyboardVisible = false;
      return;
    }
  }
}
