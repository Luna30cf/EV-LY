#include "lvgl.h"
#include "login_ui.h"
#include "mqtt_client.h"
#include <SDL2/SDL.h>

extern lv_display_t* lv_sdl_window_create(int w, int h);
extern lv_indev_t* lv_sdl_mouse_create(void);
extern lv_indev_t* lv_sdl_keyboard_create(void);
extern lv_group_t* lv_group_get_default(void);

int main(void) {
    lv_init();

    lv_display_t* disp = lv_sdl_window_create(480, 320);
    lv_display_set_default(disp);

    lv_indev_t* mouse = lv_sdl_mouse_create();
    lv_indev_t* keyboard = lv_sdl_keyboard_create();
    lv_indev_set_group(mouse, lv_group_get_default());
    lv_indev_set_group(keyboard, lv_group_get_default());

    mqtt_init();
    show_login_screen();

    while (1) {
        lv_timer_handler();
        lv_tick_inc(5);
        SDL_Delay(5);
    }
    return 0;
}
