from machine import Pin, PWM, time_pulse_us
from time import sleep, sleep_us
#branchement du driver par rapport a lesp base roulante 
ena = PWM(Pin(32), freq=5000, duty_u16=64000)
enb = PWM(Pin(13), freq=5000, duty_u16=64000)

in1 = Pin(25, Pin.OUT)
in2 = Pin(26, Pin.OUT)
in3 = Pin(27, Pin.OUT)
in4 = Pin(14, Pin.OUT)

def moteur_dc(vitesse, direction):
    if direction == "avant":
        in1.value(1)
        in2.value(0)
        in3.value(1)
        in4.value(0)
    elif direction == "arriere":
        in1.value(0)
        in2.value(1)
        in3.value(0)
        in4.value(1)
    elif direction == "gauche":
        in1.value(1)
        in2.value(0)
        in3.value(0)
        in4.value(1)
    elif direction == "droite":
        in1.value(0)
        in2.value(1)
        in3.value(1)
        in4.value(0)
    else:
        in1.value(0)
        in2.value(0)
        in3.value(0)
        in4.value(0)

    vitesse = max(0, min(1023, vitesse))
    ena.duty(int(vitesse))
    enb.duty(int(vitesse))

def av():
    print("moteur avant")
    moteur_dc(800, "avant")
    sleep(0.1)

def ar():
    print("moteur arrière")
    moteur_dc(800, "arriere")
    sleep(0.1)

def gauche():
    print("moteur gauche")
    moteur_dc(800, "gauche")
    sleep(0.1)

def droite():
    print("moteur droite")
    moteur_dc(800, "droite")
    sleep(0.1)

def stop():
    print("stop")
    moteur_dc(0, "stop")
    sleep(0.1)

#pour les direction combonées genre aller a droite tout en avancant (si roues mecanum)
def move_combined(dir1, dir2):
    dir1 = dir1.lower()
    dir2 = dir2.lower()
    print(f"commande combinée: {dir1} + {dir2}")

    if dir1 == "avant":
        in1.value(1)
        in2.value(0)
        in3.value(1)
        in4.value(0)
    elif dir1 == "arriere":
        in1.value(0)
        in2.value(1)
        in3.value(0)
        in4.value(1)
    else:
        in1.value(0)
        in2.value(0)

    if dir2 == "droite":
        in3.value(0)
        in4.value(1)
    elif dir2 == "gauche":
        in3.value(1)
        in4.value(0)
    else:
        in3.value(0)
        in4.value(0)

    ena.duty(800)
    enb.duty(800)
    sleep(0.1)
#partie pour capteur ultrasons 
trigger = Pin(33, Pin.OUT)
echo = Pin(34, Pin.IN)

def distance_cm():
    trigger.value(0)
    sleep_us(2)
    trigger.value(1)
    sleep_us(10)
    trigger.value(0)

    duration = time_pulse_us(echo, 1, 30000) 
    if duration < 0:
        return 999 

    dist = (duration / 2) / 29.1
    return round(dist, 1)
