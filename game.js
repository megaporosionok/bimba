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

var bombX;
var bombY;
var bombVX = 0; // Скорость бомбы по X
var bombRadius = 10;
const GRAVITY = 0.5; // ускорение свободного падения
const BOMB_SPEED = 5; // начальная скорость бомбы
const BOMB_INERTIA_FACTOR = 0.5; // Коэффициент передачи инерции (0.0 - 1.0)
var bomb_ready = 1; // переменная для хранения состояния бомбы
var bomb_landed = 1;
let speed = 0;
const gravity = 0.15;
let explosionTimer = 60;
let explosionX, explosionY;
let startTime = null;
let gameTime = 0;

const MAX_DAMAGE = 25;
const MIN_DAMAGE = 5;
const HIT_RADIUS = 100; // Радиус поражения

// Monster AI State
let firstBombLanded = false;
let lastExplosionX = 0;
let lastExplosionTime = 0; // Time of the last explosion
let textBubbleActive = false; // Controls if any text is currently being shown
const CALM_DOWN_TIME = 7000; // Time in ms to calm down

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
  ctx.drawImage(quadcopterImage, quadcopterX, quadcopterY);
};

function updateAndDrawMonsters() {
    // Check if monsters should calm down
    let isCalmMode = false;
    if (firstBombLanded && (Date.now() - lastExplosionTime > CALM_DOWN_TIME)) {
        isCalmMode = true;
    }

    monsters.forEach(m => {
        // Handle Death
        if (m.health <= 0) {
            // If they died while speaking, release the lock
            if (m.speaking) {
                m.speaking = false;
                textBubbleActive = false;
            }
            ctx.drawImage(DeadImage, m.x - 50, groundY - 100);
            return; // Skip update logic for dead monsters
        }

        // Draw Living Monster
        ctx.drawImage(vatnikImage, m.x - 50, groundY - 140);

        // --- AI BEHAVIOR ---

        // FORCE CALM MODE (Override other states if too much time passed)
        if (isCalmMode) {
             // Reset speaking if active
             if (m.speaking) {
                m.speaking = false;
                textBubbleActive = false;
             }
             
             // Calm behavior
             let calmSpeed = 2;
             if (Date.now() - m.lastDirectionChange >= 1000) {
                 m.speed = Math.random() < 0.5 ? -calmSpeed : calmSpeed;
                 m.lastDirectionChange = Date.now();
             }
             m.x += m.speed;
        }
        // STAGE 3: PANIC (Health < panicThreshold)
        else if (m.health < m.panicThreshold) {
            // Panic behavior doesn't support speaking
            if (m.speaking) {
                m.speaking = false;
                textBubbleActive = false;
            }

            let panicSpeed = m.basePanicSpeed;
            if (Date.now() - m.lastDirectionChange >= 200) {
                m.speed = Math.random() < 0.5 ? -panicSpeed : panicSpeed;
                m.lastDirectionChange = Date.now();
            }
            m.x += m.speed;
        }
        // STAGE 2: TACTICAL (After first bomb, Health >= panicThreshold)
        else if (firstBombLanded) {
            let runSpeed = m.baseRunSpeed;

            if (m.moveTimer > 0) {
                // RUNNING STATE
                m.moveTimer--;
                m.x += m.speed;
                if (m.moveTimer <= 0) {
                    // Transition to WAITING
                    // INCREASED RANDOMNESS: 1 to 5 seconds
                    m.waitTimer = getRandomInt(60, 300); 
                    
                    // Try to speak
                    if (!textBubbleActive) {
                        textBubbleActive = true;
                        m.speaking = true;
                        m.currentTextIndex = getRandomInt(0, 6);
                    } else {
                        m.speaking = false;
                    }
                }
            } else if (m.waitTimer > 0) {
                // WAITING STATE
                m.waitTimer--;
                // Show text only if this monster holds the lock
                if (m.speaking) {
                    ctx.drawImage(drawtextArray[m.currentTextIndex], m.x - 165, groundY - 165);
                }
                
                if (m.waitTimer <= 0) {
                    // Transition to RUNNING
                    if (m.speaking) {
                        m.speaking = false;
                        textBubbleActive = false;
                    }
                    // INCREASED RANDOMNESS: 0.5 to 3.3 seconds
                    m.moveTimer = getRandomInt(30, 200);
                    // Add small speed variation
                    let speedVariation = (Math.random() - 0.5) * 2; // -1 to 1
                    let currentRunSpeed = runSpeed + speedVariation;
                    m.speed = Math.random() < 0.5 ? -currentRunSpeed : currentRunSpeed;
                }
            } else {
                // Fallback init
                if (m.moveTimer <= 0 && m.waitTimer <= 0) {
                     // Initial wait desync: 0.1 to 2 seconds
                     m.waitTimer = getRandomInt(6, 120); 
                     
                     if (!textBubbleActive) {
                        textBubbleActive = true;
                        m.speaking = true;
                        m.currentTextIndex = getRandomInt(0, 6);
                     } else {
                        m.speaking = false;
                     }
                }
            }
        }
        // STAGE 1: CALM (Before first bomb)
        else {
            let calmSpeed = 2;
            if (Date.now() - m.lastDirectionChange >= 1000) {
                m.speed = Math.random() < 0.5 ? -calmSpeed : calmSpeed;
                m.lastDirectionChange = Date.now();
            }
            m.x += m.speed;
        }

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


// Функция отрисовки бомбы
function drawBomb() {
  ctx.drawImage(granadeImage, bombX-10, bombY-40);
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

        if (bombY < groundY) {
            drawBomb();
        } else {
            bomb_ready = 1;
            speed = 0;
            bombVX = 0;
            explosionX = bombX;
            explosionY = groundY;
            explosionTimer = 60;
            
            firstBombLanded = true;
            lastExplosionX = explosionX;
            lastExplosionTime = Date.now(); // Update explosion time
            
            // Loop through all monsters for collision and reaction
            monsters.forEach(m => {
                if (m.health <= 0) return;

                // Reaction: Run away if in Stage 2 (and healthy enough not to panic yet)
                if (m.health >= m.panicThreshold) {
                    // Interrupt speaking
                    if (m.speaking) {
                        m.speaking = false;
                        textBubbleActive = false;
                    }

                    m.waitTimer = 0; 
                    // INCREASED RANDOMNESS: Reaction delay 0.5s to 2.5s
                    m.moveTimer = getRandomInt(30, 150); 
                    
                    // Add small speed variation
                    let speedVariation = (Math.random() - 0.5) * 2;
                    let currentRunSpeed = m.baseRunSpeed + speedVariation;
                    
                    m.speed = (m.x < explosionX) ? -currentRunSpeed : currentRunSpeed;
                }

                // Damage Calculation
                let distance = Math.abs(explosionX - m.x);
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
        monster.health = monster.health - damage;
        
        // Spawn damage number at monster's location
        damageNumbers.push({
            x: monster.x,
            y: groundY - 150, 
            value: damage,
            opacity: 1.0,
            life: 60 
        });
        
        // Check for Game Over (if all are dead)
        let totalHealth = monsters.reduce((sum, m) => sum + (m.health > 0 ? m.health : 0), 0);
        if (totalHealth <= 0) { 
            endgame();          
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
  updateAndDrawMonsters();
  drawQuadcopter();
  drawField();
  drawDamageNumbers(); 
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
    
    // Reset global state
    firstBombLanded = false;
    lastExplosionTime = Date.now(); // Init so they don't calm down immediately
    textBubbleActive = false;
    
    // Init Monsters
    monsters = [];
    for(let i=0; i < MONSTER_COUNT; i++) {
        monsters.push({
            x: getRandomInt(50, canvas.width - 50),
            health: 100,
            speed: (Math.random() < 0.5 ? -1 : 1) * (1.5 + Math.random()), 
            lastDirectionChange: Date.now() + Math.random() * 1000,
            waitTimer: getRandomInt(0, 100), // Random start wait to further desync
            moveTimer: 0,
            currentTextIndex: 0,
            speaking: false, // Is this monster currently showing a text bubble?
            // Traits randomisation
            baseRunSpeed: getRandomInt(5, 9),
            basePanicSpeed: getRandomInt(11, 15),
            panicThreshold: getRandomInt(25, 45) 
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
    
    // Draw dead bodies of everyone
    monsters.forEach(m => {
        ctx.drawImage(DeadImage, m.x - 50, groundY - 100);
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