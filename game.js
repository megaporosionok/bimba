const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
    const targetRatio = 1200 / 800; // Original width / Original height
    const windowRatio = window.innerWidth / window.innerHeight;
    
    let newWidth, newHeight;

    if (windowRatio < targetRatio) {
        newWidth = window.innerWidth;
        newHeight = window.innerWidth / targetRatio;
    } else {
        newHeight = window.innerHeight;
        newWidth = window.innerHeight * targetRatio;
    }

    canvas.style.width = newWidth + "px";
    canvas.style.height = newHeight + "px";
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

var gamestarted = 0;
var groundY = canvas.height - 20;

let monsters = [];
const MONSTER_COUNT = 5;

var quadcopterX = canvas.width/2-100;
var quadcopterY = 50;
var quadcopterVX = 0; // Скорость дрона по X
const DRONE_ACCELERATION = 0.8;
const DRONE_FRICTION = 0.92;
const DRONE_MAX_SPEED = 15;
var quadcopterAngle = 0; // Current rotation angle of the drone
const MAX_TILT_ANGLE = 0.3; // Maximum tilt angle in radians (e.g., ~17 degrees)
const TILT_SMOOTHING = 0.1; // How quickly the drone tilts

var bombX;
var bombY;
var bombVX = 0; // Скорость бомбы по X
var bombRadius = 10;
const GRAVITY = 0.5; // ускорение свободного падения
const BOMB_SPEED = 5; // начальная скорость бомбы
const BOMB_INERTIA_FACTOR = 0.5; // Коэффициент передачи инерции (0.0 - 1.0)
var bomb_ready = 1; // переменная для хранения состояния бомбы
var bomb_landed = 1;
var bombAngle = 0; // Angle for bomb rotation
const BOMB_ROTATION_SPEED = 0.1; // Speed of bomb rotation
let speed = 0;
const gravity = 0.15;
let explosionTimer = 60;
let explosionX, explosionY;
let startTime = null;
let gameTime = 0;

const MAX_DAMAGE = 25;
const MIN_DAMAGE = 5;
const HIT_RADIUS = 100; // Радиус поражения для урона

// Monster AI State
const CALM_DOWN_TIME = 6000; // Time in ms to calm down from one state to the previous one (increased to 6 seconds)
let textBubbleActive = false; // Controls if any text is currently being shown

// Floating Damage Numbers
let damageNumbers = [];

// Keys state
const keys = {
    ArrowLeft: false,
    ArrowRight: false
};

// Загрузка изображений
const quadcopterImage = new Image();
quadcopterImage.src = "drone.png";

const vatnikImage = new Image();
vatnikImage.src = "vatnik.png";
const vatnikStep1Image = new Image();
vatnikStep1Image.src = "vatnik_step1.png";
const vatnikStep2Image = new Image();
vatnikStep2Image.src = "vatnik_step2.png";
const vatnikStep3Image = new Image();
vatnikStep3Image.src = "vatnik_step3.png";
const walkAnimationFrames = [vatnikImage, vatnikStep3Image, vatnikStep1Image, vatnikStep2Image];


const hideImage = new Image();
hideImage.src = "hide.png";

const explosionImage = new Image();
explosionImage.src = "explosion.png";

const granadeImage = new Image();
granadeImage.src = "granade.png";

const pauseImage = new Image();
pauseImage.src = "pause.png";

const didntstartImage = new Image();
didntstartImage.src = "didntstart.png";

const nakievImage = new Image();
nakievImage.src = "nakiev.png";

const binderyImage = new Image();
binderyImage.src = "bindery.png";

const krymImage = new Image();
krymImage.src = "krym.png";

const donbasImage = new Image();
donbasImage.src = "donbas.png";

const StartImage = new Image();
StartImage.src = "start.png";

const DeadImage = new Image();
DeadImage.src = "dead.png";

const AmericaImage = new Image();
AmericaImage.src = "america.png";

const ForegroundImage = new Image();
ForegroundImage.src = "foreground.png";

const BackgroundImage = new Image();
BackgroundImage.src = "background.png";

const ControllImage = new Image();
ControllImage.src = "controll.png";

let drawtextArray = [pauseImage, didntstartImage, nakievImage, binderyImage, krymImage, donbasImage, AmericaImage];

// Отрисовка игрового поля
function drawField() {
  ctx.drawImage(ForegroundImage, 0, 0);
}

// Функция обновления физики дрона
function updateDrone() {
    if (gamestarted == 0) return;

    // Acceleration
    if (keys.ArrowLeft) {
        quadcopterVX -= DRONE_ACCELERATION;
    }
    if (keys.ArrowRight) {
        quadcopterVX += DRONE_ACCELERATION;
    }

    // Friction
    quadcopterVX *= DRONE_FRICTION;

    // Max speed limit (optional, but good for control)
    if (quadcopterVX > DRONE_MAX_SPEED) quadcopterVX = DRONE_MAX_SPEED;
    if (quadcopterVX < -DRONE_MAX_SPEED) quadcopterVX = -DRONE_MAX_SPEED;

    // Apply velocity
    quadcopterX += quadcopterVX;

    // Calculate target tilt angle based on velocity (inverted)
    let targetAngle = quadcopterVX / DRONE_MAX_SPEED * MAX_TILT_ANGLE;

    // Smoothly interpolate the current angle towards the target angle
    quadcopterAngle += (targetAngle - quadcopterAngle) * TILT_SMOOTHING;

    // Boundaries
    if (quadcopterX < 0) {
        quadcopterX = 0;
        quadcopterVX = -quadcopterVX * 0.5; // Отскок от стены
    } else if (quadcopterX > canvas.width - 200) {
        quadcopterX = canvas.width - 200;
        quadcopterVX = -quadcopterVX * 0.5; // Отскок от стены
    }
}

// Функция отрисовки квадрокоптера
function drawQuadcopter() {
    ctx.save(); // Save the current canvas state

    // Translate to the center of the drone image for rotation
    const droneWidth = quadcopterImage.naturalWidth;
    const droneHeight = quadcopterImage.naturalHeight;
    const centerX = quadcopterX + droneWidth / 2;
    const centerY = quadcopterY + droneHeight / 2;

    ctx.translate(centerX, centerY);
    ctx.rotate(quadcopterAngle); // Apply rotation

    ctx.drawImage(quadcopterImage, -droneWidth / 2, -droneHeight / 2, droneWidth, droneHeight);

    ctx.restore(); // Restore the canvas state
};

function updateAndDrawMonsters() {
    monsters.forEach(m => {
        // Handle Death
        if (m.health <= 0) {
            ctx.save();
            let deadImageWidth = DeadImage.naturalWidth;
            let deadImageHeight = DeadImage.naturalHeight;
            if (m.lastDirection === 1) {
                ctx.translate(m.x, groundY - 100 + deadImageHeight / 2);
                ctx.scale(-1, 1);
                ctx.drawImage(DeadImage, -deadImageWidth / 2, -deadImageHeight / 2, deadImageWidth, deadImageHeight);
            } else {
                ctx.drawImage(DeadImage, m.x - deadImageWidth / 2, groundY - 100, deadImageWidth, deadImageHeight);
            }
            ctx.restore();
            return; // Skip update logic for dead monsters
        }
        
        // --- State Calming Logic ---
        if (m.state > 1 && Date.now() - m.lastDamageTime > CALM_DOWN_TIME) {
            m.state--;
            m.lastDamageTime = Date.now(); 
            // Reset timers when calming down to prevent weird state-leaks
            m.waitTimer = 0;
            m.moveTimer = 0;
            if (m.speaking) {
                m.speaking = false;
                textBubbleActive = false;
            }
        }
        
        let isMoving = false;
        
        // --- AI MOVEMENT LOGIC based on State ---
        let prevX = m.x;

        switch (m.state) {
            case 1: // Calm walking
                isMoving = true;
                if (Date.now() - m.lastDirectionChange >= 1500) { 
                    m.speed = Math.random() < 0.5 ? -m.baseCalmSpeed : m.baseCalmSpeed;
                    m.lastDirectionChange = Date.now();
                }
                m.x += m.speed;
                break;

            case 2: // Agitated: alternate move and wait
                 if (m.moveTimer > 0) {
                    isMoving = true;
                    m.moveTimer--;
                    m.x += m.speed;
                    if (m.moveTimer <= 0) { // Finished moving, start waiting
                        m.waitTimer = getRandomInt(180, 360); 
                         if (!textBubbleActive) {
                            textBubbleActive = true; 
                            m.speaking = true;
                            m.currentTextIndex = getRandomInt(0, drawtextArray.length - 1);
                        } else { 
                            m.speaking = false; 
                        }
                    }
                } else if (m.waitTimer > 0) {
                    isMoving = false;
                    m.waitTimer--;
                    // No drawing here, only update state
                    if (m.waitTimer <= 0) { // Finished waiting, start moving
                        if (m.speaking) {
                            m.speaking = false;
                            textBubbleActive = false;
                        }
                        m.moveTimer = getRandomInt(30, 150);
                        m.speed = Math.random() < 0.5 ? -m.baseAgitatedSpeed : m.baseAgitatedSpeed;
                    }
                } else { // If no timers are active, start one
                    m.moveTimer = getRandomInt(30, 150);
                    m.speed = Math.random() < 0.5 ? -m.baseAgitatedSpeed : m.baseAgitatedSpeed;
                }
                break;

            case 3: // Panic
                isMoving = true;
                if (Date.now() - m.lastDirectionChange >= 200) { 
                    m.speed = Math.random() < 0.5 ? -m.basePanicSpeed : m.basePanicSpeed;
                    m.lastDirectionChange = Date.now();
                }
                m.x += m.speed;
                break;
        }

        // --- Animation & Drawing --- (Monster body and movement)
        let currentSprite;
        if(isMoving) {
            m.animationTimer++;
            if (m.animationTimer > 10) {
                m.animationTimer = 0;
                m.animationFrame = (m.animationFrame + 1) % walkAnimationFrames.length;
            }
            currentSprite = walkAnimationFrames[m.animationFrame];
        } else {
             currentSprite = hideImage;
             m.animationFrame = 0;
             m.animationTimer = 0;
        }
        
        // Update direction based on movement
        if (m.x > prevX) {
            if (m.direction !== 1) {
                m.lastDirection = m.direction;
                m.direction = 1;
            }
        } else if (m.x < prevX) {
            if (m.direction !== -1) {
                m.lastDirection = m.direction;
                m.direction = -1;
            }
        }

        ctx.save();
        let drawDirection = isMoving ? m.direction : m.lastDirection;
        let spriteWidth = currentSprite.naturalWidth;
        let spriteHeight = currentSprite.naturalHeight;

        if (drawDirection === 1) { 
            ctx.translate(m.x, groundY - 140 + spriteHeight / 2);
            ctx.scale(-1, 1);
            ctx.drawImage(currentSprite, -spriteWidth / 2, -spriteHeight / 2, spriteWidth, spriteHeight);
        } else {
            ctx.drawImage(currentSprite, m.x - spriteWidth / 2, groundY - 140, spriteWidth, spriteHeight);
        }
        ctx.restore();
        
        // --- BOUNDARY CHECKS ---
        if (m.x < 0) {
            m.x = 0;
            m.speed = Math.abs(m.speed);
        } else if (m.x + 20 > canvas.width) {
            m.x = canvas.width - 20;
            m.speed = -Math.abs(m.speed);
        }
    });
}

// New function to draw speech bubbles on top
function drawMonsterSpeechBubbles() {
    monsters.forEach(m => {
        if (m.health > 0 && m.state === 2 && m.speaking) {
            ctx.drawImage(drawtextArray[m.currentTextIndex], m.x - 165, groundY - 165);
        }
    });
}

// Функция отрисовки бомбы
function drawBomb() {
    ctx.save(); // Save the current canvas state

    const bombWidth = granadeImage.naturalWidth;
    const bombHeight = granadeImage.naturalHeight;
    const centerX = bombX - 10 + bombWidth / 2; // Adjust for initial offset
    const centerY = bombY - 40 + bombHeight / 2; // Adjust for initial offset

    ctx.translate(centerX, centerY);
    ctx.rotate(bombAngle);

    ctx.drawImage(granadeImage, -bombWidth / 2, -bombHeight / 2, bombWidth, bombHeight);

    ctx.restore(); // Restore the canvas state
}

// Функция отрисовки кнопки Старт
function drawStart() {
  if (gamestarted == 0){ctx.drawImage(StartImage, canvas.width/2-150, canvas.height/2-50 );
}}

function dropBomb() {
    if (bomb_ready == 0) {
        speed += gravity;
        bombY = bombY + speed;
        bombX += bombVX; 
        bombAngle += BOMB_ROTATION_SPEED; // Rotate the bomb

        if (bombY < groundY) {
            drawBomb();
        } else {
            bomb_ready = 1;
            speed = 0;
            bombVX = 0;
            bombAngle = 0; // Reset bomb angle on landing
            explosionX = bombX;
            explosionY = groundY;
            explosionTimer = 60;
            
            // Loop through all monsters for damage
            monsters.forEach(m => {
                if (m.health <= 0) return;

                let distance = Math.abs(explosionX - m.x);
                
                // Damage Calculation
                if (distance < HIT_RADIUS) {
                    let damageFactor = 1 - (distance / HIT_RADIUS);
                    let damage = MIN_DAMAGE + (MAX_DAMAGE - MIN_DAMAGE) * damageFactor;
                    damage = Math.round(damage);
                    onhit(damage, m);
                }
            });
        }
    }
}

function createExplosion() {
  ctx.drawImage(explosionImage, explosionX-100, explosionY-200);
  drawField();
}

// Определяем функцию для обработки нажатий клавиш
function handleKeyDown(event) {
    if (event.code === "ArrowLeft" || event.code === "ArrowRight") {
        keys[event.code] = true;
    }

    if (event.code === "Enter") {
        if (gamestarted == 0) {
            startgame();
        }
    }

    if (event.code === "Space") {
        if (gamestarted == 1 && bomb_ready == 1) {
            bombX = quadcopterX + 100;
            bombY = quadcopterY * 2.5;
            bombVX = quadcopterVX * BOMB_INERTIA_FACTOR; 
            dropBomb();
            bomb_ready = 0;
        }
    }
}

function handleKeyUp(event) {
    if (event.code === "ArrowLeft" || event.code === "ArrowRight") {
        keys[event.code] = false;
    }
}

function onhit(damage, monster) {
    // Prevent state change or damage if already dead
    if (monster.health <= 0) return;

    monster.health -= damage;
    monster.lastDamageTime = Date.now();

    // State transition logic
    let previousState = monster.state;
    if (monster.state === 1) {
        monster.state = 2;
    } else if (monster.state === 2) {
        monster.state = 3;
    }
    
    // If state changed, interrupt current action
    if (monster.state !== previousState) {
        monster.waitTimer = 0;
        monster.moveTimer = 0; // Reset timers to start new behavior immediately
        if(monster.speaking) {
            monster.speaking = false;
            textBubbleActive = false;
        }
    }

    // Spawn damage number at monster's location
    damageNumbers.push({
        x: monster.x,
        y: groundY - 150, 
        value: damage,
        opacity: 1.0,
        life: 60 
    });
    
    // Check for Game Over only after applying damage
    if (monster.health <= 0) {
        let totalHealth = monsters.reduce((sum, m) => sum + (m.health > 0 ? m.health : 0), 0);
        if (totalHealth <= 0) { 
            endgame();          
        }
    }          
}


function drawDamageNumbers() {
    ctx.font = "bold 30px Arial";
    ctx.fillStyle = "red";
    
    for (let i = 0; i < damageNumbers.length; i++) {
        let num = damageNumbers[i];
        
        ctx.globalAlpha = num.opacity;
        ctx.fillText("-" + num.value, num.x, num.y);
        ctx.globalAlpha = 1.0; 
        
        num.y -= 1; 
        num.life--;
        num.opacity = num.life / 60; 

        if (num.life <= 0) {
            damageNumbers.splice(i, 1);
            i--;
        }
    }
}

document.addEventListener("keydown", handleKeyDown);
document.addEventListener("keyup", handleKeyUp);

function drawHealthBar(totalHealth, maxHealth, x, y, width, height) {
  const borderColor = "#000000";
  const backgroundColor = "#CCCCCC";
  const foregroundColor = "#FF0000";
  const borderSize = 2;
  
  // Ensure health doesn't go below 0 for drawing
  let safeHealth = Math.max(0, totalHealth);
  const foregroundWidth = (width - 2 * borderSize) * (safeHealth / maxHealth);

  ctx.fillStyle = borderColor;
  ctx.fillRect(x, y, width, height);
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(x + borderSize, y + borderSize, width - 2 * borderSize, height - 2 * borderSize);
  ctx.fillStyle = foregroundColor;
  ctx.fillRect(x + borderSize, y + borderSize, foregroundWidth, height - 2 * borderSize);
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Отрисовка.
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(BackgroundImage, 0, 0);  
  updateAndDrawMonsters(); // Updates monster state and draws monster bodies (not speech bubbles)
  drawQuadcopter();
  drawField();
  drawDamageNumbers(); 
  drawMonsterSpeechBubbles(); // Draw speech bubbles last, on top of everything
}

// Игровой цикл.
function gameLoop() {
  if (gamestarted == 1) {
    updateDrone(); 
    draw(); 
    dropBomb(); 

    // Calculate total health for the bar
    let totalHealth = monsters.reduce((sum, m) => sum + (m.health > 0 ? m.health : 0), 0);
    let maxTotalHealth = MONSTER_COUNT * 100;
    
    drawHealthBar(totalHealth, maxTotalHealth, canvas.width/2-100, 20, 200, 20);
    
    if (explosionTimer > 0) {
        createExplosion();
        explosionTimer--;
    }
    
    requestAnimationFrame(gameLoop); 
  }
}

function startGameTime() {
  if (!startTime) {
    startTime = Date.now();
  }
  gameTime = Date.now() - startTime;
}

// Начало (рестарт) игры игры
function startgame(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    explosionTimer = 0;
    gamestarted = 1;
    
    quadcopterX = canvas.width/2-100;
    quadcopterY = 50;
    quadcopterVX = 0; 
    keys.ArrowLeft = false; 
    keys.ArrowRight = false;
    damageNumbers = []; 
    textBubbleActive = false;
    
    // Init Monsters
    monsters = [];
    for(let i=0; i < MONSTER_COUNT; i++) {
        monsters.push({
            x: getRandomInt(50, canvas.width - 50),
            health: 100,
            state: 1, // 1: calm, 2: agitated, 3: panic
            lastDamageTime: 0,
            speed: (Math.random() < 0.5 ? -1 : 1) * getRandomInt(1, 3), // Initial speed for calm state
            lastDirectionChange: Date.now() + Math.random() * 1000,
            animationFrame: 0,
            animationTimer: 0,
            direction: -1, // -1 for left, 1 for right
            lastDirection: -1,
            // Timers and state for phase 2
            waitTimer: 0,
            moveTimer: 0,
            speaking: false,
            currentTextIndex: 0,
            // Traits randomisation
            baseCalmSpeed: getRandomInt(1, 3),
            baseAgitatedSpeed: getRandomInt(4, 7),
            basePanicSpeed: getRandomInt(8, 12)
        });
    }

    requestAnimationFrame(gameLoop);
    draw();
    startTime = null;
    gameTime =0;
    startGameTime();
}

// Конец игры игры
function endgame(){
    gamestarted =0;
    // Just draw the end screen over whatever state the game is in
    ctx.drawImage(BackgroundImage, 0, 0);  
    
    // Draw dead bodies of everyone (now with mirroring)
    monsters.forEach(m => {
        ctx.save();
        let deadImageWidth = DeadImage.naturalWidth;
        let deadImageHeight = DeadImage.naturalHeight;
        if (m.lastDirection === 1) {
            ctx.translate(m.x, groundY - 100 + deadImageHeight / 2);
            ctx.scale(-1, 1);
            ctx.drawImage(DeadImage, -deadImageWidth / 2, -deadImageHeight / 2, deadImageWidth, deadImageHeight);
        } else {
            ctx.drawImage(DeadImage, m.x - deadImageWidth / 2, groundY - 100, deadImageWidth, deadImageHeight);
        }
        ctx.restore();
    });

    drawStart();
    drawQuadcopter();
    startGameTime();
    
    ctx.fillStyle = "blue";
    ctx.font = "bold 50px Arial";
    ctx.fillText(`Your Time: ${gameTime/1000}`, canvas.width/2-200, canvas.height/2-100);
}

// Заставка
function drawControll (){
ctx.clearRect(0, 0, canvas.width, canvas.height);
ctx.drawImage(ControllImage, 0, 0);
}
setTimeout(drawControll,500);