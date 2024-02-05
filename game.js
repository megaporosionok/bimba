const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
var gamestarted = 0;
var groundY = canvas.height - 20;
var monsterX = canvas.width/2;
var monsterY = groundY;
let monsterSpeed = 2; // скорость движения монстра
let lastDirectionChange = Date.now(); // время последней смены направления монстра
var health = 100
let timershowtext = 0
var currenttext = 0
var quadcopterX = canvas.width/2-100;
var quadcopterY = 50;
var bombX;
var bombY;
var bombRadius = 10;
const GRAVITY = 0.5; // ускорение свободного падения
const BOMB_SPEED = 5; // начальная скорость бомбы
var bomb_ready = 1; // переменная для хранения состояния бомбы
var bomb_landed = 1;
let speed = 0;
const gravity = 0.15;
let explosionTimer = 60;
let explosionX, explosionY;
let startTime = null;
let gameTime = 0;

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

// Функция отрисовки квадрокоптера
function drawQuadcopter() {
  ctx.drawImage(quadcopterImage, quadcopterX, quadcopterY);
};

// Функция отрисовки монстра
function drawMonster() {
  ctx.drawImage(vatnikImage, monsterX-50, monsterY-140);
    // проверяем, прошло ли достаточно времени для смены направления
  if (Date.now() - lastDirectionChange >= 1000) {
    // генерируем новое направление движения
    monsterSpeed = Math.random() < 0.5 ? -monsterSpeed : monsterSpeed;
    lastDirectionChange = Date.now();
  }
  // обновляем положение монстра
  monsterX += monsterSpeed;
  // проверяем, не вышел ли монстр за пределы экрана
  if (monsterX < 0) {
    monsterX = 0;
    monsterSpeed = -monsterSpeed; // меняем направление движения
  } else if (monsterX + 20 > canvas.width) {
    monsterX = canvas.width - 20;
    monsterSpeed = -monsterSpeed; // меняем направление движения
}}

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
    // увеличиваем скорость бомбы на ускорение
    speed += gravity;
    // обновляем координаты бомбы
    bombY = bombY + speed;
    // проверяем, достигла ли бомба земли
    if (bombY < groundY) {
    drawBomb();
    } else {
      bomb_ready = 1;
      speed = 0;
      explosionX = bombX;
      explosionY = groundY;
      explosionTimer = 60;
      if (Math.abs(explosionX - monsterX) <100) {
      onhit();
      }
    }
}}

function createExplosion() {
  ctx.drawImage(explosionImage, explosionX-100, explosionY-200);
  drawField();
}

// Определяем функцию для обработки нажатий клавиш
function handleKeyDown(event) {
  switch (event.code) {
    case "ArrowLeft":
      if (quadcopterX > 0) {
        quadcopterX -= 10;
      }
      break;
    case "ArrowRight":
      if (quadcopterX < canvas.width - 200) {
        quadcopterX += 10;
      }
      break;
    case "Enter":
       if (gamestarted == 0) {startgame()}
      break;
    case "Space":
            if (gamestarted == 1){ 
                if (bomb_ready == 1) {
                bombX = quadcopterX + 100;
                bombY = quadcopterY * 2.5 ;
                dropBomb();
                bomb_ready = 0;
      break;
  }}}
}

function onhit() {
        health = health-10;
        if (health <=0) { 
            endgame();          
        }            
        monsterSpeed = monsterSpeed * 1.2;
        timershowtext = 140
        currenttext = getRandomInt(0, 6);
}

// Добавляем обработчик событий для отслеживания нажатия клавиш
document.addEventListener("keydown", handleKeyDown);

// Шкала здровья
function drawHealthBar(health, x, y, width, height) {
  const borderColor = "#000000";
  const backgroundColor = "#CCCCCC";
  const foregroundColor = "#FF0000";
  const borderSize = 2;
  const foregroundWidth = (width - 2 * borderSize) * (health / 100);

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

function createtext(){
      ctx.drawImage(drawtextArray[currenttext], monsterX-165, monsterY-165);
}

// Отрисовка.
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(BackgroundImage, 0, 0);  
  drawMonster();
  drawQuadcopter();
  drawField();
}

// Игровой цикл.
function gameLoop() {
  if (gamestarted == 1) {
  draw(); // отрисовываем элементы игры
  dropBomb(); // обновляем состояние бомб
  drawHealthBar(health, canvas.width/2-100, 20, 200, 20);
  if (explosionTimer > 0) {
    createExplosion();
    explosionTimer--;
}
  if (timershowtext > 0) {
    timershowtext--;
    if (timershowtext > 0 && timershowtext < 80) {
    createtext();
    }}
   requestAnimationFrame(gameLoop); // вызываем gameLoop() снова для следующего кадра
}}

function startGameTime() {
  if (!startTime) {
    startTime = Date.now();
  }
  gameTime = Date.now() - startTime;
}

// Начало (рестарт) игры игры
function startgame(){
    // вызываем функцию gameLoop() в первый раз для старта игры
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    explosionTimer = 0;
    gamestarted = 1;
    monsterSpeed = 2;
    health = 100;
    quadcopterX = canvas.width/2-100;
    quadcopterY = 50;
    requestAnimationFrame(gameLoop);
    draw();
    startTime = null;
    gameTime =0;
    startGameTime();
}

// Конец игры игры
function endgame(){
    gamestarted =0;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(DeadImage, monsterX-50, monsterY-100);
    ctx.drawImage(BackgroundImage, 0, 0);  
    drawStart();
    drawQuadcopter();
    startGameTime();
    // Выводим на экран время игры
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