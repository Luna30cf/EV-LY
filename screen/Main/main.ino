#include <Wire.h>
#include <SPI.h>
#include <PCA9557.h>
#include "gfx_conf.h"   // contient la config CrowPanel_70 (i2c_addr = 0x5D)

PCA9557 Out;

// Adresse 7‐bits du GT911 (scanné plus tôt) :
static constexpr uint8_t GT911_ADDR = 0x5D;

// Registres GT911 importants :
static constexpr uint16_t REG_TD_STATUS = 0x814E; // nombre de points + bit7 de statut
static constexpr uint16_t REG_X1_LSB    = 0x8150;
static constexpr uint16_t REG_X1_MSB    = 0x8151;
static constexpr uint16_t REG_Y1_LSB    = 0x8152;
static constexpr uint16_t REG_Y1_MSB    = 0x8153;

// Écrire un octet 'val' dans le registre 16 bits 'reg' du GT911
void writeGT911Register8(uint16_t reg, uint8_t val) {
  Wire.beginTransmission(GT911_ADDR);
  Wire.write(uint8_t((reg >> 8) & 0xFF)); // high byte
  Wire.write(uint8_t(reg & 0xFF));        // low byte
  Wire.write(val);
  Wire.endTransmission();
}

// Lire un octet depuis le registre 16 bits 'reg' du GT911
uint8_t readGT911Register8(uint16_t reg) {
  Wire.beginTransmission(GT911_ADDR);
  Wire.write(uint8_t((reg >> 8) & 0xFF));
  Wire.write(uint8_t(reg & 0xFF));
  Wire.endTransmission();
  Wire.requestFrom(uint8_t(GT911_ADDR), uint8_t(1));
  if (Wire.available()) {
    return Wire.read();
  }
  return 0xFF; // pas de réponse
}

void setup() {
  Serial.begin(115200);
  delay(50);
  Serial.println();
  Serial.println(">>> I2C GT911 Coord + Mask Test <<<");

  // 1) Initialiser le bus I2C (GT911 + PCA9557)
  Wire.begin(19, 20);
  Serial.println("Wire.begin(19,20)");

  // 2) Séquence RESET GT911 via PCA9557 (IO0=RESET, IO1=INT)
  Out.reset();                // tous IO du PCA9557 à LOW
  Out.setMode(IO_OUTPUT);     // IO0+IO1 en sortie pour forcer RESET/INT
  Out.setState(IO0, IO_LOW);  // RESET_GT911 = LOW
  Out.setState(IO1, IO_LOW);  // INT_GT911   = LOW
  delay(20);                  // 20 ms de reset forcé
  Out.setState(IO0, IO_HIGH); // relâche reset GT911
  delay(100);                 // laisser GT911 booter (~100 ms)
  Out.setMode(IO1, IO_INPUT); // INT_GT911 passe en entrée
  Serial.println("GT911 RESET terminé");

  // 3) Clear initial du drapeau TD_STATUS (écrire 0)
  writeGT911Register8(REG_TD_STATUS, 0x00);
  Serial.println("TD_STATUS (0x814E) remis à 0");

  // 4) Lire immédiatement TD_STATUS pour vérifier → doit être 0
  uint8_t initialRaw = readGT911Register8(REG_TD_STATUS);
  Serial.print("Raw TD_STATUS initial = 0x");
  Serial.print(initialRaw, HEX);
  Serial.print("  → nombre de points = ");
  Serial.println(initialRaw & 0x0F);
  Serial.println(">> Touchez l'écran pour faire varier 'points' et X1/Y1.");
}

void loop() {
  // 5) Lire RAW TD_STATUS
  uint8_t raw = readGT911Register8(REG_TD_STATUS);
  // Masquer le bit7 + bits 4…6 pour ne garder que le nibble bas
  uint8_t pts = raw & 0x0F;

  Serial.print("Raw TD_STATUS = 0x");
  Serial.print(raw, HEX);
  Serial.print("  → points detectés (raw & 0x0F) = ");
  Serial.println(pts);

  // 6) Si pts > 0 : lire les coordonnées X1/Y1
  if (pts > 0 && pts < 6) {
    // Lire X1 (LSB + MSB)
    uint8_t x1_lsb = readGT911Register8(REG_X1_LSB);
    uint8_t x1_msb = readGT911Register8(REG_X1_MSB);
    uint16_t x1 = (uint16_t(x1_msb) << 8) | x1_lsb;
    // Lire Y1 (LSB + MSB)
    uint8_t y1_lsb = readGT911Register8(REG_Y1_LSB);
    uint8_t y1_msb = readGT911Register8(REG_Y1_MSB);
    uint16_t y1 = (uint16_t(y1_msb) << 8) | y1_lsb;

    Serial.print(" → Touch point 1 : X = ");
    Serial.print(x1);
    Serial.print("   Y = ");
    Serial.println(y1);

    // 7) Une fois lu, on CLEAR TD_STATUS (écrire 0)
    writeGT911Register8(REG_TD_STATUS, 0x00);
    Serial.println("   (TD_STATUS remis à 0 après lecture)");

  } else if (raw & 0x80) {
    // Si bit7 = 1 mais nibble bas = 0 : pas de point, on clear quand même
    Serial.println(" → Pas de new touch (bit7=1), on clear juste TD_STATUS.");
    writeGT911Register8(REG_TD_STATUS, 0x00);
  }
  delay(200);
}
