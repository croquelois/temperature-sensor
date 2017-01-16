# Node.js script to read temperature sensor (GPIO)

It's done to run on a raspberry pi 3, with the shipped node.js version... which is old :(
I don't have access to ES6 stuff, but I plan to update it.

temperature sensor: DS18B20

need to update the variable "deviceFolder" with the directory created in ```/sys/bus/w1/devices/``` when you run
```
sudo modprobe w1-gpio
sudo modprobe w1-therm
```
make sure than ```/boot/config.txt``` contain ```dtoverlay=w1-gpio``` and reboot if it was not.
