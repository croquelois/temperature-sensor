# Node.js script to read temperature sensor (GPIO)

## raspberry side
main.js is done to run on a raspberry pi 3, with the shipped node.js version... which is old :( I don't have access to ES6 stuff
temperature sensor: DS18B20
need to update the variable "deviceFolder" with the directory created in ```/sys/bus/w1/devices/``` when you run
```
sudo modprobe w1-gpio
sudo modprobe w1-therm
```
make sure than ```/boot/config.txt``` contain ```dtoverlay=w1-gpio``` and reboot if it was not.

it can run alone, and don't need any additional library

## server side
server.js is done to run on a machine somewhere, it's a webserver he receive data from the raspberry pi and serve it to clients.

## what's missing
- filtering on webclient side
- database storage
