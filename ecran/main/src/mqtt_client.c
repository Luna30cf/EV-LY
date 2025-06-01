#include "mqtt_client.h"
#include "login_ui.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "MQTTClient.h"

#define ADDRESS     "tcp://broker.emqx.io:1883"
#define CLIENTID    "LVGL_Client"
#define TOPIC_PUB   "robot/login"
#define TOPIC_SUB   "robot/login/response"
#define QOS         1
#define TIMEOUT     10000L

static MQTTClient client;

static void message_arrived_cb(void* context, char* topicName, int topicLen, MQTTClient_message* message) {
    if (strcmp(topicName, TOPIC_SUB) == 0) {
        char* payload = (char*)message->payload;
        printf("[MQTT] Recu : %s\n", payload);
        if (strcmp(payload, "success") == 0) {
            login_result_callback(true);
        } else {
            login_result_callback(false);
        }
    }
    MQTTClient_freeMessage(&message);
    MQTTClient_free(topicName);
}

void mqtt_init(void) {
    MQTTClient_connectOptions conn_opts = MQTTClient_connectOptions_initializer;
    MQTTClient_create(&client, ADDRESS, CLIENTID, MQTTCLIENT_PERSISTENCE_NONE, NULL);
    MQTTClient_setCallbacks(client, NULL, NULL, message_arrived_cb, NULL);

    if (MQTTClient_connect(client, &conn_opts) != MQTTCLIENT_SUCCESS) {
        printf("[MQTT] Connexion echouee\n");
        return;
    }
    printf("[MQTT] Connecte\n");

    MQTTClient_subscribe(client, TOPIC_SUB, QOS);
}

void mqtt_send_login(const char* username, const char* password) {
    char payload[256];
    snprintf(payload, sizeof(payload), "{\"username\":\"%s\",\"password\":\"%s\"}", username, password);

    MQTTClient_message pubmsg = MQTTClient_message_initializer;
    pubmsg.payload = payload;
    pubmsg.payloadlen = (int)strlen(payload);
    pubmsg.qos = QOS;
    pubmsg.retained = 0;

    MQTTClient_deliveryToken token;
    MQTTClient_publishMessage(client, TOPIC_PUB, &pubmsg, &token);
    MQTTClient_waitForCompletion(client, token, TIMEOUT);
    printf("[MQTT] Login envoye\n");
}
