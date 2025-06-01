from machine import ADC, Pin
from time import sleep
import network
import espnow
import time  # Pour get_distance

#/!\ MODIFIER SI NECESSAIRE FAUT METTRE L'ADRESSE MAC DE LESP32 DE LA BASE ROULANTE
peer = b'\xFC\xE8\xC0\x7D\x90\xF0'
#voir code espmac pour avoir ladresse mac dune carte
# === INIT ESP-NOW ===
sta = network.WLAN(network.STA_IF)
sta.active(True)
sta.disconnect()

e = espnow.ESPNow()
e.active(True)
e.add_peer(peer)

class Joystick:
    def __init__(self, pin_axis):
        self.axis = ADC(Pin(pin_axis))
        self.axis.atten(ADC.ATTN_11DB)
    def read(self):
        return self.axis.read()

joystick1 = Joystick(33)  # Y j1
joystick2 = Joystick(35)  # X j2

# j1
btn = Pin(32, Pin.IN, Pin.PULL_UP)
btn_state_last = btn.value() 
autonome = False

#CAPT ULTRASONS 
trigger = Pin(12, Pin.OUT)
echo = Pin(14, Pin.IN)

def get_distance():
    trigger.value(0)
    sleep(0.2)
    trigger.value(1)
    sleep(0.1)
    trigger.value(0)

    while echo.value() == 0:
        pass
    start = time.ticks_us()
    while echo.value() == 1:
        pass
    end = time.ticks_us()

    duration = time.ticks_diff(end, start)
    distance_cm = (duration / 2) / 29.1
    return distance_cm

#FONCTIONS DIRECTION classieqh
def get_direction_joystick1(y):
    if y > 3700:
        return "avant"
    elif y < 300:
        return "arriere"
    else:
        return "neutre"

def get_direction_joystick2(x):
    if x > 3800:
        return "droite"
    elif x < 200:
        return "gauche"
    else:
        return "neutre"

last_command = None

while True:
    btn_state = btn.value()
    if btn_state == 0 and btn_state_last == 1:
        autonome = not autonome
        mode = "AUTO" if autonome else "MANUEL"
        e.send(peer, mode.encode())
        print(f"mmode changé: {mode}")
        sleep(0.3) 
    btn_state_last = btn_state

    if autonome:
        dist = get_distance()
        print(f"distance : {dist:.1f} cm")

        command = "stop" if dist < 20 else "avant"

        if command != last_command:
            e.send(peer, command.encode())
            print(f"Commande AUTO envoyée : {command}")
            last_command = command

    else:
        y1 = joystick1.read()
        x2 = joystick2.read()

        dir1 = get_direction_joystick1(y1)
        dir2 = get_direction_joystick2(x2)

        if dir1 == "neutre" and dir2 == "neutre":
            command = "stop"
        elif dir1 != "neutre" and dir2 == "neutre":
            command = dir1
        elif dir1 == "neutre" and dir2 != "neutre":
            command = dir2
        else:
            command = dir1 + "_" + dir2

        if command != last_command:
            e.send(peer, command.encode())
            print(f"Commande MANUEL envoyée : {command}")
            last_command = command

    sleep(0.2)
