from motor import *
import network
import espnow
from machine import Pin
import time

wlan = network.WLAN(network.STA_IF)
wlan.active(True)
wlan.disconnect()

e = espnow.ESPNow()
e.active(True)
btn_pin = Pin(35, Pin.IN, Pin.PULL_UP)
etat_btn_precedent = btn_pin.value()

autonome = False

print("En attentes de partage ESPNOW...")

while True:
    while autonome:
        if btn_pin.value() == 0 and etat_btn_precedent == 1:
            autonome = False
            stop()
            print("Mode manuel activé (via bouton local)")
            time.sleep(0.5)  
            break
        etat_btn_precedent = btn_pin.value()

        d = distance_cm()
        print("Distance:", d, "cm")

        if d > 20:
            av()
        else:
            stop()
            time.sleep(0.3)
            droite()
            time.sleep(0.4)

        time.sleep(0.2)

    host, msg = e.recv()
    if not msg:
        continue

    msg = msg.decode()
    print("Commande reçue:", msg)

    if msg == "AUTO":
        autonome = True
        print("Mode auto activé")
        continue

    if msg == "MANUEL":
        autonome = False
        stop()
        print("Retour mode manuel")
        continue

    #ca _ cest ce qui reprensente les mouvements combinés
    if "_" in msg:
        dir1, dir2 = msg.split("_")
        move_combined(dir1, dir2)
    #direction nomrlaes 
    else:
        if msg == "avant":
            av()
        elif msg == "arriere":
            ar()
        elif msg == "gauche":
            gauche()
        elif msg == "droite":
            droite()
        else:
            stop()