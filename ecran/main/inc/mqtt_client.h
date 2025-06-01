#ifndef MQTT_CLIENT_H
#define MQTT_CLIENT_H

void mqtt_init(void);
void mqtt_send_login(const char* username, const char* password);

#endif