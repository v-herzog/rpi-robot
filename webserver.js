var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var Gpio = require('pigpio').Gpio;
var process = require('child_process');

app.use(express.static(__dirname + '/public'));
app.get('/', function(req, res, next) {
  res.sendFile(__dirname + '/public/dashboard.html');
});
server.listen(5000);

var LED = new Gpio(8, {mode: Gpio.OUTPUT});
var TRIGGER = new Gpio(18, {mode: Gpio.OUTPUT});
var ECHO = new Gpio(23, {mode: Gpio.INPUT, alert:true});

var CAR_FORWARD = new Gpio(27, {mode: Gpio.OUTPUT});
var CAR_BACKWARD = new Gpio(22, {mode: Gpio.OUTPUT});
var CAR_RIGHT = new Gpio(17, {mode: Gpio.OUTPUT});
var CAR_LEFT = new Gpio(4, {mode: Gpio.OUTPUT});

var ARM_ROTATION = new Gpio(10, {mode: Gpio.OUTPUT});		// Range 500 to 2000, inicial 1250
var ARM_HEIGHT = new Gpio(9, {mode: Gpio.OUTPUT});		// Range 800 to 1900, inicial 1000
var ARM_LENGHT = new Gpio(11, {mode: Gpio.OUTPUT});		// Range 500 to 2000, inicial 1250
var ARM_CLAW = new Gpio(7, {mode: Gpio.OUTPUT});		// Range 1450 to 2500, iniial 2000

var rotationPulse = 1250;
var heightPulse = 1500;
var lenghtPulse = 1250;
var clawPulse = 2000;

// Number of microseconds it takes sound to travel 1cm at 20deg celcius
var MICROSECONDS_PER_CM = 1e6 / 34321;
var startTick;

TRIGGER.digitalWrite(0);

CAR_FORWARD.digitalWrite(0);
CAR_BACKWARD.digitalWrite(0);
CAR_RIGHT.digitalWrite(0);
CAR_LEFT.digitalWrite(0);

LED.digitalWrite(1);

io.sockets.on('connection', function (socket) {

  ECHO.on('alert', function(level, tick) {
    var endTick;
    var diff;

    if(level == 1) {
	  startTick = tick;
    }
    else {
	  endTick = tick;
	  diff = (endTick >> 0) - (startTick >> 0);
	  socket.emit("sonar", parseInt(diff / 2 / MICROSECONDS_PER_CM));
    }
  });

  setInterval(function() {
    TRIGGER.trigger(10, 1)	// Set TRIGGER high for 10 microseconds
  }, 1000);

  servosFeedback = function() {
    var data = {
      rotation: (rotationPulse - 500) / 15,
      height: (heightPulse - 800) / 11,
      length: (lenghtPulse - 500) / 15,
      claw: (clawPulse - 1450) / 11.5,
      angle: (((rotationPulse - 500) * 150) / 2000) - 60
    };
    socket.emit('servos', data);
  };

  socket.on('stream', function(data) {
    if(data) {
      process.exec('LD_PRELOAD=/usr/lib/arm-linux-gnueabihf/libv4l/v4l1compat.so motion');
      console.log("STREAM is ON");
    } else {
      process.exec('sudo pkill motion');
      console.log('STREAM is OFF');
    }
  });

  socket.on('shutdown', function(data) {
	console.log('\n\nTANGO DOWN');
	process.exec('sudo poweroff');  
  });

  socket.on('moveArmRotation', function(data) {
    rotationPulse += data;
    if(rotationPulse > 2000) rotationPulse = 2000;
    else if (rotationPulse < 500) rotationPulse = 500;
    console.log('ARM ROTATION to ' + rotationPulse);
    ARM_ROTATION.servoWrite(rotationPulse);
    servosFeedback();
  });

  socket.on('moveArmHeight', function(data) {
    heightPulse += data;
    if(heightPulse > 1900) heightPulse = 1900;
    else if (heightPulse < 800) heightPulse = 800;
    console.log('ARM HEIGHT to ' + heightPulse);
    ARM_HEIGHT.servoWrite(heightPulse);
    servosFeedback();
  });

  socket.on('moveArmLenght', function(data) {
    lenghtPulse += data;
    if(lenghtPulse > 2000) lenghtPulse = 2000;
    else if (lenghtPulse < 500) lenghtPulse = 500;
    console.log('ARM LENGHT to ' + lenghtPulse);
    ARM_LENGHT.servoWrite(lenghtPulse);
    servosFeedback();
  });

  socket.on('moveArmClaw', function(data) {
    clawPulse += data;
    if(clawPulse > 2500) clawPulse = 2500;
    else if (clawPulse < 1450) clawPulse = 1450;
    console.log('ARM CLAW to ' + clawPulse);
    ARM_CLAW.servoWrite(clawPulse);
    servosFeedback();
  });

  socket.on('moveCar', function(data) {
    switch (data) {
      case -1:
        CAR_RIGHT.digitalWrite(0);
        CAR_LEFT.digitalWrite(0);
        break;
      case 0:
        CAR_FORWARD.digitalWrite(0);
        CAR_BACKWARD.digitalWrite(0);
        break;
      case 1:
        console.log("Move car: FORWARD");
        CAR_FORWARD.digitalWrite(1);
        CAR_BACKWARD.digitalWrite(0);
        break;
      case 2:
        console.log("Move car: BACKWARD");
        CAR_FORWARD.digitalWrite(0);
        CAR_BACKWARD.digitalWrite(1);
        break;
      case 3:
        console.log("Move car: RIGHT");
        CAR_RIGHT.digitalWrite(1);
        CAR_LEFT.digitalWrite(0);
        break;
      case 4:
        console.log("Move car: LEFT");
        CAR_RIGHT.digitalWrite(0);
        CAR_LEFT.digitalWrite(1);
        break;
      default:
        break;
    }
  });
});
