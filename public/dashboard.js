// Directions for the car
const CAR_STEER_OFF = -1;
const CAR_MOTOR_OFF = 0;
const CAR_FORWARD = 1;
const CAR_BACKWARD = 2;
const CAR_RIGHT = 3;
const CAR_LEFT = 4;

// Directions for the arm
const ARM_RIGHT = {value: -50, direction: 3};
const ARM_LEFT = {value: 50, direction: 4};
const ARM_UP = {value: 50, direction: 5};
const ARM_DOWN = {value: -50, direction: 6};
const ARM_FORWARD = {value: 50, direction: 1};
const ARM_BACKWARD = {value: -50, direction: 2};
const ARM_OPEN = {value: 50, direction: 7};
const ARM_CLOSE = {value: -50, direction: 8};

var lastCarDirection = 5;
var socket = io();
var interval;

socket.on('sonar', function (data) {
  document.getElementById("sonar").innerHTML = data + "cm";
});

socket.on('servos', function (data) {
  document.getElementById("progressRotation").style.width = `${String(data.rotation)}%`;
  document.getElementById("progressHeight").style.width = `${String(data.height)}%`;
  document.getElementById("progressLength").style.width = `${String(data.length)}%`;
  document.getElementById("progressClaw").style.width = `${String(data.claw)}%`;
  document.getElementById("pointer").style.transform = `rotate(${String(data.angle)}deg)`;
});

document.getElementById("stream").src = `${window.location.hostname}:5001`;

if (!('ongamepadconnected' in window)) {
  interval = setInterval(function pollGamepads() {
      var gamepad = navigator.getGamepads()[0];
      if(gamepad) {
          clearInterval(interval);
          document.getElementById("gamepadStatus").innerHTML = gamepad.id.split('(')[0];
          gameLoop(gamepad);
      }
  }, 500);
}

function moveCar(direction) {
  if (direction != lastCarDirection) {
    socket.emit("moveCar", direction);
    lastCarDirection = direction;
  }
}

function moveArm(arm) {
  if (arm.direction == ARM_LEFT.direction || arm.direction == ARM_RIGHT.direction) {
    socket.emit("moveArmRotation", parseInt(arm.value));
  }
  else if (arm.direction == ARM_UP.direction || arm.direction == ARM_DOWN.direction) {
    socket.emit("moveArmHeight", parseInt(arm.value));
  }
  else if (arm.direction == ARM_FORWARD.direction || arm.direction == ARM_BACKWARD.direction) {
    socket.emit("moveArmLenght", parseInt(arm.value));
  }
  else if (arm.direction == ARM_OPEN.direction || arm.direction == ARM_CLOSE.direction) {
    socket.emit("moveArmClaw", parseInt(arm.value));
  }
}

function guideLines() {
  
}

function shutdown() {
  socket.emit("shutdown", null);
  document.getElementById("check-power").checked = true;
}

window.onkeydown = function(keyPressed) {
  var unicode = keyPressed.keyCode ? keyPressed.keyCode : keyPressed.charCode;
  switch (unicode) {
    case 37:	// <
      moveCar(CAR_LEFT);
      break;
    case 38:	// /\
      moveCar(CAR_FORWARD);
      break;
    case 39:	// >
      moveCar(CAR_RIGHT);
      break;
    case 40:	// \/
      moveCar(CAR_BACKWARD);
      break;
    case 65:	// A
      moveArm(ARM_OPEN);
      break;
    case 68:	// D
      moveArm(ARM_CLOSE);
      break;
    case 73:	// I
      moveArm(ARM_UP);
      break;
    case 74:	// J
      moveArm(ARM_LEFT);
      break;
    case 75:	// K
      moveArm(ARM_DOWN);
      break;
    case 76:	// L
      moveArm(ARM_RIGHT);
      break;
    case 87:	// W
      moveArm(ARM_FORWARD);
      break;
    case 83:	// S
      moveArm(ARM_BACKWARD);
      break;
    case 46:	// DEL
      shutdown();
      break;
    case 13:	// ENTER
      cameraStream();
      break;
    default:
  }
}

window.onkeyup = function(keyPressed) {
  var unicode = keyPressed.keyCode ? keyPressed.keyCode : keyPressed.charCode;
  if (unicode == 37 || unicode == 39) {
    moveCar(CAR_STEER_OFF);
  }
  else if (unicode == 38 || unicode == 40) {
    moveCar(CAR_MOTOR_OFF);
  }
}

function gameLoop() {
    var gamepad = navigator.getGamepads()[0];
    if(!gamepad) {
        document.getElementById("gamepadStatus").innerHTML = "Gamepad disconnected";
        return;
    }
    // Analog Axes
    if (gamepad.axes[0] > 0.5) {        // L RIGHT
        moveCar(CAR_RIGHT);
    }
    else if (gamepad.axes[0] < -0.5) {  // L LEFT
        moveCar(CAR_LEFT);
    }
    else {
    	moveCar(CAR_STEER_OFF);
    }
    if (gamepad.axes[1] > 0.5) {        // L DOWN
        moveArm({value: gamepad.axes[1] * -30, direction: ARM_BACKWARD.direction});
    }
    else if (gamepad.axes[1] < -0.5) {  // L UP
        moveArm({value: gamepad.axes[1] * -30, direction: ARM_FORWARD.direction});
    }
    if (gamepad.axes[2] > 0.5) {        // R LEFT
        moveArm({value: gamepad.axes[2] * -30, direction: ARM_LEFT.direction});
    }
    else if (gamepad.axes[2] < -0.5) {  // R RIGHT
        moveArm({value: gamepad.axes[2] * -30, direction: ARM_RIGHT.direction});
    }
    if (gamepad.axes[3] > 0.5) {        // R DOWN
        moveArm({value: gamepad.axes[3] * -30, direction: ARM_DOWN.direction});
    }
    else if (gamepad.axes[3] < -0.5) {  // R UP
        moveArm({value: gamepad.axes[3] * -30, direction: ARM_UP.direction});
    }
    // Digital Buttons
    if (gamepad.buttons[0].value > 0.5) {   // A
        console.log("button A");
    }
    if (gamepad.buttons[1].value > 0.5) {   // B

    }
    if (gamepad.buttons[2].value > 0.5) {   // X
      cameraStream();
    }
    if (gamepad.buttons[3].value > 0.5) {   // Y
      shutdown();
    }
    if (gamepad.buttons[4].value > 0.5) {   // LB
      moveCar(CAR_BACKWARD);
    }
    else {
    	moveCar(CAR_MOTOR_OFF);
    }
    if (gamepad.buttons[5].value > 0.5) {   // RB
      moveCar(CAR_FORWARD);
    }
    else {
	    moveCar(CAR_MOTOR_OFF);
    }
    if (gamepad.buttons[8].value > 0.5) {   // BACK

    }
    if (gamepad.buttons[9].value > 0.5) {   // START

    }
    if (gamepad.buttons[10].value > 0.5) {  // LEFT STICK

    }
    if (gamepad.buttons[11].value > 0.5) {  // RIGHT STICK

    }
    if (gamepad.buttons[12].value > 0.5) {  // UP

    }
    if (gamepad.buttons[13].value > 0.5) {  // DOWN

    }
    if (gamepad.buttons[14].value > 0.5) {  // LEFT

    }
    if (gamepad.buttons[15].value > 0.5) {  // RIGHT

    }
    // Analog Triggers
    if (gamepad.buttons[6].value > 0.1) {   // LT
	    moveArm({value: gamepad.buttons[6].value * 30, direction: ARM_OPEN.direction});
    }
    if (gamepad.buttons[7].value > 0.1) {   // RT
      moveArm({value: gamepad.buttons[7].value * -30, direction: ARM_CLOSE.direction});
    }
    requestAnimationFrame(gameLoop);
}
