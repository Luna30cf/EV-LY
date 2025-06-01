#pragma once
#define LGFX_USE_V1

#include <LovyanGFX.hpp>
#include <lgfx/v1/platforms/esp32s3/Panel_RGB.hpp>
#include <lgfx/v1/platforms/esp32s3/Bus_RGB.hpp>
#include <driver/i2c.h>

/*******************************************************************************
 * Décommentez **SEULEMENT** la ligne correspondant à votre version d’écran :
 * Ici, nous voulons CrowPanel_70 (7.0″, 800×480).
 ******************************************************************************/
#define CrowPanel_70
// #define CrowPanel_50
// #define CrowPanel_43



#if defined (CrowPanel_70)

#define screenWidth   800
#define screenHeight  480

class LGFX : public lgfx::LGFX_Device
{
public:
  lgfx::Bus_RGB    _bus_instance;
  lgfx::Panel_RGB  _panel_instance;
  lgfx::Light_PWM  _light_instance;
  lgfx::Touch_GT911 _touch_instance;

  LGFX(void)
  {
    //--------------------------------------
    // 1) Configuration du Bus RGB (16 bits)
    //--------------------------------------
    {
      auto cfg = _bus_instance.config();
      cfg.panel = &_panel_instance;

      // --- Bus Bleu (B0..B4)
      // D0 = B0 sur IO15
      // D1 = B1 sur IO7
      // D2 = B2 sur IO6
      // D3 = B3 sur IO5
      // D4 = B4 sur IO4
      cfg.pin_d0  = GPIO_NUM_15; // B0
      cfg.pin_d1  = GPIO_NUM_7;  // B1
      cfg.pin_d2  = GPIO_NUM_6;  // B2
      cfg.pin_d3  = GPIO_NUM_5;  // B3
      cfg.pin_d4  = GPIO_NUM_4;  // B4

      // --- Bus Vert (G0..G5)
      // D5  = G0 sur IO9
      // D6  = G1 sur IO46
      // D7  = G2 sur IO3
      // D8  = G3 sur IO8
      // D9  = G4 sur IO16
      // D10 = G5 sur IO1
      cfg.pin_d5  = GPIO_NUM_9;   // G0
      cfg.pin_d6  = GPIO_NUM_46;  // G1
      cfg.pin_d7  = GPIO_NUM_3;   // G2
      cfg.pin_d8  = GPIO_NUM_8;   // G3
      cfg.pin_d9  = GPIO_NUM_16;  // G4
      cfg.pin_d10 = GPIO_NUM_1;   // G5

      // --- Bus Rouge (R0..R4)
      // D11 = R0 sur IO14
      // D12 = R1 sur IO21
      // D13 = R2 sur IO47
      // D14 = R3 sur IO48
      // D15 = R4 sur IO45
      cfg.pin_d11 = GPIO_NUM_14;  // R0
      cfg.pin_d12 = GPIO_NUM_21;  // R1
      cfg.pin_d13 = GPIO_NUM_47;  // R2
      cfg.pin_d14 = GPIO_NUM_48;  // R3
      cfg.pin_d15 = GPIO_NUM_45;  // R4

      // --- Synchronisation & Pixel Clock
      cfg.pin_henable = GPIO_NUM_41;  // DE    = IO41_DE
      cfg.pin_vsync   = GPIO_NUM_40;  // VSYNC = IO40_VSYNC
      cfg.pin_hsync   = GPIO_NUM_39;  // HSYNC = IO39_HSYNC
      cfg.pin_pclk    = GPIO_NUM_0;   // PCLK  = IO0_BOOT_CLK

      // Fréquence d’écriture sur le bus RGB (15 MHz par défaut Elecrow)
      cfg.freq_write = 15000000;

      // --- Timings H/V (d’après le schéma Elecrow)
      cfg.hsync_polarity    = 0;
      cfg.hsync_front_porch = 40;
      cfg.hsync_pulse_width = 48;
      cfg.hsync_back_porch  = 40;

      cfg.vsync_polarity    = 0;
      cfg.vsync_front_porch = 1;
      cfg.vsync_pulse_width = 31;
      cfg.vsync_back_porch  = 13;

      cfg.pclk_active_neg = 1;  // PCLK actif sur front descendant
      cfg.de_idle_high    = 0;
      cfg.pclk_idle_high  = 0;

      _bus_instance.config(cfg);
    }

    //--------------------------------------
    // 2) Configuration du Panel (taille)
    //--------------------------------------
    {
      auto cfg = _panel_instance.config();
      cfg.memory_width  = screenWidth;   // résolution “virtuelle”
      cfg.memory_height = screenHeight;
      cfg.panel_width   = screenWidth;   // résolution réelle
      cfg.panel_height  = screenHeight;
      cfg.offset_x = 0;
      cfg.offset_y = 0;
      _panel_instance.config(cfg);
    }

    // Relier le Bus RGB au Panel
    _panel_instance.setBus(&_bus_instance);
    setPanel(&_panel_instance);

    //--------------------------------------
    // 3) Rétro‐éclairage (Back‐Light)
    //--------------------------------------
    {
      auto cfg = _light_instance.config();
      // Le BL est piloté sur IO2
      cfg.pin_bl = GPIO_NUM_2;  // IO2_LCD_BL_CTR
      _light_instance.config(cfg);
      _panel_instance.light(&_light_instance);
    }

    //--------------------------------------
    // 4) Tactile (Touch GT911 via I²C)
    //--------------------------------------
    {
      auto cfg = _touch_instance.config();
      cfg.x_min      = 0;
      cfg.x_max      = 799;
      cfg.y_min      = 0;
      cfg.y_max      = 479;

      // Pas de broche IRQ/RESET dédiée en GT911 sur le CrowPanel 7″
      cfg.pin_int    = -1;
      cfg.pin_rst    = -1;

      cfg.bus_shared = true;       // le bus I²C est partagé avec l’écran
      cfg.offset_rotation = 0;     // orientation normale (0°)

      // SDA = IO19_I2C_SDA → GPIO19
      // SCL = IO20_I2C_SCL → GPIO20
      cfg.i2c_port = I2C_NUM_1;
      cfg.pin_sda  = GPIO_NUM_19;
      cfg.pin_scl  = GPIO_NUM_20;
      cfg.freq     = 400000;       // 400 kHz pour GT911
      cfg.i2c_addr = 0x5D;         // adresse du GT911
      _touch_instance.config(cfg);
      _panel_instance.setTouch(&_touch_instance);
    }
  }
};

// Crée l’instance globale (à placer en dehors de toute fonction)
LGFX tft;

#elif defined (CrowPanel_50)

// … Si vous utilisez la version 5″, copiez ici le mapping CrowPanel_50
//    depuis votre doc Elecrow. Ne rien laisser d’autre actif.

#elif defined (CrowPanel_43)

// … Si vous utilisez la version 4.3″, copiez ici le mapping CrowPanel_43
//    depuis votre doc Elecrow. Ne rien laisser d’autre actif.

#endif  // CrowPanel_70, CrowPanel_50, CrowPanel_43
