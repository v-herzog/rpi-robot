# RPI-Robot

This project's goal was to build a robot with a Raspberry Pi controlled by a web interface, it was used a Node.js server running on the Pi inside the robot, so any person who connects to the Pi's IP address can control it using a computer, smartphone, tablet, etc. The web interface supports commands by the buttons in the layout, keyboard and gamepad.

![robot moving](https://raw.githubusercontent.com/v-herzog/rpi-robot/master/docs/robo.gif)

## Hardware

I had most of the parts for this project lying around at home, if you plan to build this project I suggest that you adapt some of it, since most stuff are old and/or specific components that are nearly impossible the find for sale these days. So this is much more of a guide for Raspberry Pi's powered robots than a manual for a specific build. Bellow you can see a diagram of all the main parts and sensors with topics of explanation for each individual piece:

![diagram](https://raw.githubusercontent.com/v-herzog/rpi-robot/master/docs/diagram.png)

### [Raspberry Pi]()

> The Raspberry Pi is a series of small single-board computers developed in the United Kingdom by the Raspberry Pi Foundation to promote the teaching of basic computer science in schools and in developing countries. The original model became far more popular than anticipated, selling outside its target market for uses such as robotics... In March 2018, sales reached 19 million. [Source](https://en.wikipedia.org/wiki/Raspberry_Pi)

I used a Raspberry Pi 1 model B since it was the one I owned, but this is an old Pi and you can use any new models or even other boards. It is responsable for running the Node.js server and communicate to the rest of the hardware, the RPI 1 doesn't have Wi-Fi built-in so I used an usb dongle, you don't need that if you plan to use a board that already have Wi-Fi, like a RPI model 3 or Zero W for example. If you go with the dongle try to get one with an antenna, it will give your robot an extra range.

When powered on, the Raspberry Pi runs a web server on the port 5000 and waits for a device to connect, this can be any device capable of web navigation, such as computers, smartphones and tablets. It is possible to connect a gamepad to the device and use it to controll the robot. The motor shield, meArm and ultrasonic sensor are connected to the Pi thought the GPIO (General-purpose input/output) pins, and the webcam uses a usb port.

### RC Car

The chassis of this robot is basically an old radio controlled car toy, you can use any option available to you, since it's almost impossible to find this exact model and there is no particular motive to do so. This toy car (and mostly all of toy rc cars) have a control board that receives the transmitter signal and send's it to the motors, but you can't use a signal to power a motor. To power a motor you need much more current, the easiest way to do this is using a [H-bridge](https://en.wikipedia.org/wiki/H_bridge) with a separate power source. Ok, so the toy's control board already does that, but the old battery was no longer working, so I replaced it with a [4AA Battery pack](https://www.adafruit.com/product/830).

This car's control board powers two motors: one in the back of the car and one in the front, the back one goes forwards and backwards and the front one turns the front wheels to the right and to the left. I also didn't had the transmitter for the car so I needed to find a way to convert a radio controlled vehicle to a digital GPIO pin controlled one, this is by far the most problematic part of this build. The whole receiver and logic part is done by an antenna and a IC ([Integrated Circuit](https://www.elprocus.com/different-types-of-integrated-circuits/)) on the control board, using the IC's [reference designator](https://en.wikipedia.org/wiki/Reference_designator) (it's an unique alphanumeric code for this specific component) and a **LOT** of research I was abble to find out that four of it's digital pins represented a type of movement (move forwards, move backwards, turn right and turn left) and that if powered with a 5 Volts signal moved one of the motors that direction.

To move the car around using the Raspberry Pi I soldered these four digital pins, plus a ground one to wires and connected it to the Pi's GPIO. Since these 4 pins are all digital, meaning that there are only two logic states: On or Off, I cannot control the speed of the motors, only if they should move or stop. I suggest that in your build you use a proper motor shield, like [this one](https://learn.adafruit.com/adafruit-dc-and-stepper-motor-hat-for-raspberry-pi/overview), for example. Also important: this hack to the control board won't work in hobby rc cars, these are much more complex than the toy used in the build, there are proper ways to control a hobby rc car with a Raspberry Pi.

### [meArm](https://shop.mime.co.uk/collections/mearm/products/mearm-your-robot-nuka-cola-blue)

> The original MeArm project was designed to be simple and open-source, requiring just three ingredients: servo motors, screws, and the laser-cut parts. This allowed the design to spread around the world... [Source](https://www.raspberrypi.org/blog/mearm-pi/)

Mime Industries made the drawings for this MeArm projects and released it for free on the web, you can download the schematics and laser cut it on a piece of plastic, obviously this requires some specific machinery, also you will need four servos and some screws. Alternatively you can buy a kit with all the necessary parts included (that's what I did) and just assemble it. This robotic arm have 4 dof (Degrees of Freedom) and uses one servo for each dof.

Servo motors are controlled by PWM ([Pulse Width Modulation](https://en.wikipedia.org/wiki/Pulse-width_modulation)), these are basically pulsing binary signals created throught modulation that enables digital outputs to create ramps and control devices that require partial or variable power input, such as motors and servomechanisms. So, to control the arm we need to know how to use PWM: imagine we want an average output signal of 50% (let's call that "duty cycle") from the On stage of a digital pin, to do that with a PWM we would have to turn the output On for half of the time and then Off for the other half, this time beeing the period of our signal, in the left part of the image bellow it's showned how different pulse widths generate different duty cycles during a same period of time:

![example of pwm](https://raw.githubusercontent.com/v-herzog/rpi-robot/master/docs/pwm.jpg)

In the right part of the image there is an example of how to generate a sine wave by just changing the duty cycle. Servo motors have a range of movement (normally 180°) that is controlled by the pulse width and need to be constantly send from the controller, to do this I strongly recommend the use of a good library, most libraries that handle GPIO will have support for PWM and in that case specific methods to control servos. Each servo has three pins: one pwm to control the position, one to draw power and a ground one, the rpi can't power a servo from it's GPIO's by lack of current, so I connected to the same 4AA Battery pack used by the car's motor's, remember that the grounds must be all connected together.

### [Ultrasonic Sensor](https://components101.com/ultrasonic-sensor-working-pinout-datasheet)

> The HC-SR04 ultrasonic sensor uses sonar to determine distance to an object like bats do. It offers excellent non-contact range detection... from 2cm to 400 cm. Its operation is not affected by sunlight or black material like sharp rangefinders are (although acoustically soft materials like cloth can be difficult to detect). It comes complete with ultrasonic transmitter and receiver module. [Sorce](https://randomnerdtutorials.com/complete-guide-for-ultrasonic-sensor-hc-sr04/)

This sensor is easy to use, cheap and very common in projects with Arduino, it has four pins: one to draw power (this can be connected to the Pi's GPIO 5V, the sensor doesn't need much current), a ground one, one input called trigger and an output called echo. To calculate the distance until an object it's necessary to send a digital high pulse to the trigger and that will make the sensor emit an acoustic burst and put it's echo output on a high logic state, it will wait until a very similar signal returns to set the echo pin to low, this logic is showed in this picture:

![ultrasonic sensor's logic](https://raw.githubusercontent.com/v-herzog/rpi-robot/master/docs/sonar.png)

So, if we monitor the echo pin we will have the time it took to a sonic wave to travel from the sensor until the reflected object and back, just divide that by two and multiply by the speed of sound and we have the distance until the object. This work really well for distances until four or five meters in the scale of centimeters, like the pwm there are libraries that make all this logic for us.

### Webcam

The video feed got into this build as a bonus because during the build I read that it's possible to adapt a laptop webcam as an usb webcam and decided to try. I had an old laptop with damage in the motherboard that was no longer working and collecting dust, so I stripped it's webcam and cut out the connector. Important: there are thousands of different models of this webcams, some will not work on an usb port, and even if they would it's still required to find the right pinout, this is not a trivial task and require some level of knowledge in electronics.

The first thing I did was to look for the serial number online, that didn't gave me much information, so I decided to measure the cables and discover the pinout by myself. An usb connector needs four wires: vcc to draw power, two datas (in and out) and a ground one, my webcam had also four wires, it was just a matter of finding witch is witch. I did that by inspecting in the webcam board for the ground and testing each wire with a multimeter in continuity mode, looking where the wires connected to the board I could see an IC that connected to the ground and another one of the wires, the IC should be a voltage regulator and this other wire the vcc. So by this point I already knew the vcc and the ground, the other two must be the datas so guessed witch was the in and the out and soldered the four wires to an usb connector. When I connected to the computer, Windows gave me the information that it has detected an unknown device, so I disconnected, inverted the data pins, and connected again, this time Windows detected it correctly as a webcam. Be careful when connecting it to a computer, if the vcc and ground are identified wrongly you could fry the webcam.

## Software

![dashboard](https://raw.githubusercontent.com/v-herzog/rpi-robot/master/docs/dashboard.gif)

To control the robot it was used a [Node.js](https://nodejs.org/en/) with [Socket.io](https://socket.io/docs/) as a server so that any device with browser could connect to it and be a controller, the webpage was designed as a dashboard and shows the data transmitted from the server, in addition to the buttons that control the car and the arm. There are three ways to make the car or the arm move: by clicking on the buttons on the dashboard, by pressing the mapped keyboard keys and with a gamepad connected to the client. Any of these choices will send the command to the server the same way via Socket.io, the server will periodically update the clients with the ultrasonic sensor data and video feed.

The gamepad support was done using the [Gamepad API](https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API) and tested with a Xbox controller, the dashboard shows the user if there is a recognizable gamepad connected or not. In the examples folder there is a gamepad file you can use to map your gamepad's buttons.