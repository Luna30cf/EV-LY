#pragma once
#define LGFX_USE_V1

/*------------------------------------------------------------------------------
   Configuration LovyanGFX pour CrowPanel 7.0″ v3.0 (ESP32-S3)
   Basé sur le schéma “LCD+TP 接口” et la carte V3.0.
------------------------------------------------------------------------------*/

#include <LovyanGFX.hpp>
#include <lgfx/v1/platforms/esp32s3/Panel_RGB.hpp>
#include <lgfx/v1/platforms/esp32s3/Bus_RGB.hpp>
#include <driver/i2c.h>   // nécessaire pour Touch_GT911

// Définition de la version de l’écran (7 pouces)
#define CrowPanel_70

#if defined(CrowPanel_70)

#define screenWidth   800
#define screenHeight  480

// Classe LGFX personnalisée
class LGFX : public lgfx::LGFX_Device {
public:
    lgfx::Bus_RGB     _bus_instance;    // bus parallèle RGB
    lgfx::Panel_RGB   _panel_instance;  // panneau TFT
    lgfx::Light_PWM   _light_instance;  // rétroéclairage (BL)
    lgfx::Touch_GT911 _touch_instance;  // contrôleur tactile GT911

    LGFX(void) {
        // 1) Configuration du panneau (dimensions mémoire vs affichage)
        {
            auto cfg = _panel_instance.config();
            cfg.memory_width  = screenWidth;
            cfg.memory_height = screenHeight;
            cfg.panel_width   = screenWidth;
            cfg.panel_height  = screenHeight;
            cfg.offset_x      = 0;
            cfg.offset_y      = 0;
            _panel_instance.config(cfg);
        }

        // 2) Configuration du bus parallèle RGB (B0..B4, G0..G5, R0..R4, HSYNC, VSYNC, DE, PCLK)
        {
            auto cfg = _bus_instance.config();
            cfg.panel = &_panel_instance;

            // ——— BLEU (B7 → B3) ———
            cfg.pin_d0 = GPIO_NUM_4;    // IO4_B7
            cfg.pin_d1 = GPIO_NUM_5;    // IO5_B6
            cfg.pin_d2 = GPIO_NUM_6;    // IO6_B5
            cfg.pin_d3 = GPIO_NUM_7;    // IO7_B4
            cfg.pin_d4 = GPIO_NUM_15;   // IO15_B3

            // ——— VERT (G4 → G0) ———
            cfg.pin_d5  = GPIO_NUM_3;   // IO3_G4
            cfg.pin_d6  = GPIO_NUM_46;  // IO46_G3
            cfg.pin_d7  = GPIO_NUM_9;   // IO9_G2
            cfg.pin_d8  = GPIO_NUM_1;   // IO1_G7  (les bits sont “mélangés” sur la nappe)
            cfg.pin_d9  = GPIO_NUM_16;  // IO16_G6
            cfg.pin_d10 = GPIO_NUM_8;   // IO8_G5

            // ——— ROUGE (R3 → R7) ———
            cfg.pin_d11 = GPIO_NUM_14;  // IO14_R3
            cfg.pin_d12 = GPIO_NUM_21;  // IO21_R4
            cfg.pin_d13 = GPIO_NUM_47;  // IO47_R5
            cfg.pin_d14 = GPIO_NUM_48;  // IO48_R6
            cfg.pin_d15 = GPIO_NUM_45;  // IO45_R7

            // Horloge pixel & synchronisation
            cfg.pin_pclk    = GPIO_NUM_0;   // IO0_BOOT_CLK (pixel clock)
            cfg.pin_hsync   = GPIO_NUM_39;  // IO39_HSYNC
            cfg.pin_vsync   = GPIO_NUM_40;  // IO40_VSYNC
            cfg.pin_henable = GPIO_NUM_41;  // IO41_DE (Data Enable)

            // Timings d’écriture recommandés pour v3.0
            cfg.freq_write        = 12000000;  // 12 MHz
            cfg.hsync_polarity    = 0;
            cfg.hsync_front_porch = 40;
            cfg.hsync_pulse_width = 48;
            cfg.hsync_back_porch  = 40;
            cfg.vsync_polarity    = 0;
            cfg.vsync_front_porch = 1;
            cfg.vsync_pulse_width = 31;
            cfg.vsync_back_porch  = 13;
            cfg.pclk_active_neg   = 1;
            cfg.de_idle_high      = 0;
            cfg.pclk_idle_high    = 0;

            _bus_instance.config(cfg);
            _panel_instance.setBus(&_bus_instance);
        }

        // 3) Rétroéclairage (BL) → broche IO2 (GPIO2)
        {
            auto cfg = _light_instance.config();
            cfg.pin_bl      = GPIO_NUM_2;  // IO2_LCD_BL_CTR
            cfg.invert      = false;
            cfg.freq        = 44000;
            cfg.pwm_channel = 7;
            _light_instance.config(cfg);
            _panel_instance.setLight(&_light_instance);
        }

        // 4) Contrôleur tactile GT911 (I²C) → broches IO19=SDA, IO20=SCL, adresse 0x14
        {
            auto cfg = _touch_instance.config();
            cfg.x_min      = 0;
            cfg.x_max      = screenWidth - 1;
            cfg.y_min      = 0;
            cfg.y_max      = screenHeight - 1;
            cfg.pin_int    = -1;       // non utilisé
            cfg.pin_rst    = -1;       // non utilisé
            cfg.bus_shared = true;     // bus RGB + I²C partagé
            cfg.offset_rotation = 0;   // orientation sans rotation
            cfg.i2c_port   = I2C_NUM_0;
            cfg.pin_sda    = GPIO_NUM_19; // IO19_I2C_SDA
            cfg.pin_scl    = GPIO_NUM_20; // IO20_I2C_SCL
            cfg.freq       = 400000;
            cfg.i2c_addr   = 0x14;       // adresse fixed GT911 V3.0
            _touch_instance.config(cfg);
            _panel_instance.setTouch(&_touch_instance);
        }

        // On relie enfin le panneau complet
        setPanel(&_panel_instance);
    }
};

#endif  // CrowPanel_70

// Instanciation globale du TFT, accessible depuis votre sketch .ino
LGFX tft;
