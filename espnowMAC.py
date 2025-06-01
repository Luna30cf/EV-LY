import network

wlan = network.WLAN(network.STA_IF) 
wlan.active(True)

mac = wlan.config('mac') 
mac_address = ':'.join('%02x' % b for b in mac)

print("Adresse MAC ESP32 base roulante:", mac_address)
