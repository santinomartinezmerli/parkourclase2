const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const finalScoreEl = document.getElementById('final-score');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');

const BRICK_ROWS = 5;
const BRICK_COLS = 8;
const BRICK_PADDING = 8;
const BRICK_OFFSET_TOP = 60;
const BRICK_OFFSET_SIDE = 20;

let gameRunning = false;
let score = 0;
let lives = 3;
let animationId;

const COLORS = {
    background: '#1a1a2e',
    paddle: '#00d9ff',
    ball: '#fff',
    bricks: ['#e94560', '#f39c12', '#f1c40f', '#2ecc71', '#3498db']
};

let paddle = {
    x: 0,
    y: 0,
    width: 100,
    height: 15,
    speed: 8
};

let ball = {
    x: 0,
    y: 0,
    radius: 10,
    dx: 4,
    dy: -4,
    speed: 5
};

let bricks = [];
let particles = [];

function resizeCanvas() {
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    paddle.width = Math.min(100, canvas.width * 0.25);
}

function init() {
    resizeCanvas();
    resetGame();
}

function resetGame() {
    score = 0;
    lives = 3;
    livesEl.textContent = lives;
    scoreEl.textContent = '0';
    
    paddle.x = canvas.width / 2 - paddle.width / 2;
    paddle.y = canvas.height - 40;
    
    ball.x = canvas.width / 2;
    ball.y = paddle.y - 20;
    ball.dx = 4 * (Math.random() > 0.5 ? 1 : -1);
    ball.dy = -4;
    ball.speed = 5;
    
    createBricks();
    particles = [];
}

function createBricks() {
    bricks = [];
    const brickWidth = (canvas.width - BRICK_OFFSET_SIDE * 2 - BRICK_PADDING * (BRICK_COLS - 1)) / BRICK_COLS;
    const brickHeight = 25;
    
    for (let row = 0; row < BRICK_ROWS; row++) {
        for (let col = 0; col < BRICK_COLS; col++) {
            bricks.push({
                x: BRICK_OFFSET_SIDE + col * (brickWidth + BRICK_PADDING),
                y: BRICK_OFFSET_TOP + row * (brickHeight + BRICK_PADDING),
                width: brickWidth,
                height: brickHeight,
                color: COLORS.bricks[row],
                hits: row === 0 ? 2 : 1,
                active: true
            });
        }
    }
}

function spawnParticles(x, y, color) {
    for (let i = 0; i < 8; i++) {
        particles.push({
            x,
            y,
            dx: (Math.random() - 0.5) * 6,
            dy: (Math.random() - 0.5) * 6,
            size: Math.random() * 4 + 2,
            color,
            life: 1
        });
    }
}

function drawBackground() {
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = 'rgba(255,255,255,0.02)';
    for (let i = 0; i < 20; i++) {
        ctx.fillRect(0, i * 40, canvas.width, 1);
    }
}

function drawPaddle() {
    ctx.save();
    ctx.shadowColor = COLORS.paddle;
    ctx.shadowBlur = 15;
    
    const gradient = ctx.createLinearGradient(paddle.x, paddle.y, paddle.x, paddle.y + paddle.height);
    gradient.addColorStop(0, COLORS.paddle);
    gradient.addColorStop(1, '#0099cc');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(paddle.x, paddle.y, paddle.width, paddle.height, 8);
    ctx.fill();
    ctx.restore();
}

function drawBall() {
    ctx.save();
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 15;
    
    ctx.fillStyle = COLORS.ball;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.arc(ball.x - 3, ball.y - 3, ball.radius * 0.4, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}

function drawBricks() {
    bricks.forEach(brick => {
        if (!brick.active) return;
        
        ctx.save();
        ctx.shadowColor = brick.color;
        ctx.shadowBlur = 8;
        
        const gradient = ctx.createLinearGradient(brick.x, brick.y, brick.x, brick.y + brick.height);
        gradient.addColorStop(0, brick.color);
        gradient.addColorStop(1, darkenColor(brick.color, 20));
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(brick.x, brick.y, brick.width, brick.height, 4);
        ctx.fill();
        
        if (brick.hits === 2) {
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillRect(brick.x + 3, brick.y + 3, brick.width - 6, 4);
        
        ctx.restore();
    });
}

function drawParticles() {
    particles.forEach((p, i) => {
        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        p.x += p.dx;
        p.y += p.dy;
        p.dy += 0.1;
        p.life -= 0.03;
        
        if (p.life <= 0) particles.splice(i, 1);
    });
}

function updateBall() {
    ball.x += ball.dx;
    ball.y += ball.dy;
    
    if (ball.x - ball.radius < 0) {
        ball.x = ball.radius;
        ball.dx = Math.abs(ball.dx);
    }
    if (ball.x + ball.radius > canvas.width) {
        ball.x = canvas.width - ball.radius;
        ball.dx = -Math.abs(ball.dx);
    }
    if (ball.y - ball.radius < 0) {
        ball.y = ball.radius;
        ball.dy = Math.abs(ball.dy);
    }
    
    if (ball.y + ball.radius > paddle.y &&
        ball.y - ball.radius < paddle.y + paddle.height &&
        ball.x > paddle.x &&
        ball.x < paddle.x + paddle.width) {
        
        ball.y = paddle.y - ball.radius;
        
        const hitPoint = (ball.x - paddle.x) / paddle.width;
        const angle = (hitPoint - 0.5) * Math.PI * 0.7;
        
        ball.dx = ball.speed * Math.sin(angle);
        ball.dy = -ball.speed * Math.cos(angle);
        
        spawnParticles(ball.x, ball.y, COLORS.paddle);
    }
    
    if (ball.y + ball.radius > canvas.height) {
        loseLife();
    }
}

function checkBrickCollision() {
    for (let brick of bricks) {
        if (!brick.active) continue;
        
        if (ball.x + ball.radius > brick.x &&
            ball.x - ball.radius < brick.x + brick.width &&
            ball.y + ball.radius > brick.y &&
            ball.y - ball.radius < brick.y + brick.height) {
            
            brick.hits--;
            
            if (brick.hits <= 0) {
                brick.active = false;
                score += brick.color === COLORS.bricks[0] ? 20 : 10;
            } else {
                score += 5;
            }
            
            scoreEl.textContent = score;
            
            const overlapLeft = ball.x + ball.radius - brick.x;
            const overlapRight = brick.x + brick.width - (ball.x - ball.radius);
            const overlapTop = ball.y + ball.radius - brick.y;
            const overlapBottom = brick.y + brick.height - (ball.y - ball.radius);
            
            const minOverlapX = Math.min(overlapLeft, overlapRight);
            const minOverlapY = Math.min(overlapTop, overlapBottom);
            
            if (minOverlapX < minOverlapY) {
                ball.dx = -ball.dx;
            } else {
                ball.dy = -ball.dy;
            }
            
            spawnParticles(ball.x, ball.y, brick.color);
            break;
        }
    }
}

function checkWin() {
    return bricks.every(b => !b.active);
}

function loseLife() {
    lives--;
    livesEl.textContent = lives;
    
    if (lives <= 0) {
        gameOver();
    } else {
        ball.x = canvas.width / 2;
        ball.y = paddle.y - 20;
        ball.dx = 4 * (Math.random() > 0.5 ? 1 : -1);
        ball.dy = -4;
    }
}

function gameOver() {
    gameRunning = false;
    cancelAnimationFrame(animationId);
    finalScoreEl.textContent = score;
    gameOverScreen.classList.remove('hidden');
}

function darkenColor(hex, percent) {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max((num >> 16) - amt, 0);
    const G = Math.max((num >> 8 & 0x00FF) - amt, 0);
    const B = Math.max((num & 0x0000FF) - amt, 0);
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

function gameLoop() {
    if (!gameRunning) return;
    
    drawBackground();
    drawBricks();
    drawPaddle();
    drawBall();
    drawParticles();
    
    updateBall();
    checkBrickCollision();
    
    if (checkWin()) {
        createBricks();
        ball.speed += 0.5;
        spawnParticles(canvas.width / 2, canvas.height / 2, '#f1c40f');
    }
    
    animationId = requestAnimationFrame(gameLoop);
}

function startGame() {
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    resetGame();
    gameRunning = true;
    gameLoop();
}

function setupControls() {
    document.addEventListener('keydown', (e) => {
        if (!gameRunning) return;
        
        switch(e.key) {
            case 'ArrowLeft':
            case 'a':
            case 'A':
                paddle.x = Math.max(0, paddle.x - paddle.speed);
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                paddle.x = Math.min(canvas.width - paddle.width, paddle.x + paddle.speed);
                break;
        }
    });
    
    let touching = false;
    
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        touching = true;
    });
    
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (!gameRunning || !touching) return;
        
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left - paddle.width / 2;
        paddle.x = Math.max(0, Math.min(canvas.width - paddle.width, x));
    });
    
    canvas.addEventListener('touchend', () => {
        touching = false;
    });
    
    canvas.addEventListener('mousedown', (e) => {
        if (!gameRunning) return;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left - paddle.width / 2;
        paddle.x = Math.max(0, Math.min(canvas.width - paddle.width, x));
    });
}

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);
window.addEventListener('resize', () => {
    resizeCanvas();
    if (!gameRunning) init();
});

setupControls();
init();
