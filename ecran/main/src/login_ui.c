#include "lvgl.h"
#include "mqtt_client.h"
#include <string.h>

static lv_obj_t* user_input;
static lv_obj_t* pass_input;
static lv_obj_t* status_label;

static void login_btn_event_cb(lv_event_t* e) {
    const char* user = lv_textarea_get_text(user_input);
    const char* pass = lv_textarea_get_text(pass_input);

    if (strlen(user) == 0 || strlen(pass) == 0) {
        lv_label_set_text(status_label, "Veuillez remplir les champs.");
        return;
    }

    lv_label_set_text(status_label, "Connexion en cours...");
    mqtt_send_login(user, pass);
}

void login_result_callback(bool success) {
    if (success) {
        lv_label_set_text(status_label, "Connexion r\xC3\xA9ussie !");
    } else {
        lv_label_set_text(status_label, "\xC3\x89chec de la connexion.");
    }
}

void show_login_screen(void) {
    lv_obj_clean(lv_scr_act());

    lv_obj_t* title = lv_label_create(lv_scr_act());
    lv_label_set_text(title, "Connexion");
    lv_obj_align(title, LV_ALIGN_TOP_MID, 0, 20);

    user_input = lv_textarea_create(lv_scr_act());
    lv_textarea_set_placeholder_text(user_input, "Identifiant");
    lv_textarea_set_one_line(user_input, true);
    lv_obj_set_size(user_input, 260, 40);
    lv_obj_align(user_input, LV_ALIGN_CENTER, 0, -60);
    lv_obj_add_flag(user_input, LV_OBJ_FLAG_CLICK_FOCUSABLE);

    pass_input = lv_textarea_create(lv_scr_act());
    lv_textarea_set_placeholder_text(pass_input, "Mot de passe");
    lv_textarea_set_password_mode(pass_input, true);
    lv_textarea_set_one_line(pass_input, true);
    lv_obj_set_size(pass_input, 260, 40);
    lv_obj_align(pass_input, LV_ALIGN_CENTER, 0, 0);
    lv_obj_add_flag(pass_input, LV_OBJ_FLAG_CLICK_FOCUSABLE);

    lv_obj_t* login_btn = lv_btn_create(lv_scr_act());
    lv_obj_set_size(login_btn, 160, 40);
    lv_obj_align(login_btn, LV_ALIGN_CENTER, 0, 60);
    lv_obj_add_event_cb(login_btn, login_btn_event_cb, LV_EVENT_CLICKED, NULL);
    lv_obj_t* btn_label = lv_label_create(login_btn);
    lv_label_set_text(btn_label, "Se connecter");

    status_label = lv_label_create(lv_scr_act());
    lv_label_set_text(status_label, "");
    lv_obj_align(status_label, LV_ALIGN_CENTER, 0, 110);
}
