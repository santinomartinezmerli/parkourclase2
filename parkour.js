const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const finalScoreEl = document.getElementById('final-score');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const hearts = document.querySelectorAll('.heart');

const GRAVITY = 0.5;
const JUMP_FORCE = -12;
const PLAYER_SPEED = 5;

let gameRunning = false;
let score = 0;
let lives = 3;
let animationId;

const COLORS = {
    background: ['#2d1b4e', '#1a1a2e'],
    player: '#00d9ff',
    platform: '#f39c12',
    heart: '#e94560',
    star: '#f1c40f'
};

let player = {
    x: 0,
    y: 0,
    width: 35,
    height: 45,
    velocityX: 0,
    velocityY: 0,
    onGround: false,
    jumping: false
};

let platforms = [];
let heartsCollectible = [];
let stars = [];
let particles = [];

function resizeCanvas() {
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
}

function init() {
    resizeCanvas();
    resetGame();
}

function resetGame() {
    score = 0;
    lives = 3;
    updateLivesDisplay();
    scoreEl.textContent = '0';
    
    player.x = canvas.width / 2 - player.width / 2;
    player.y = canvas.height - 100;
    player.velocityX = 0;
    player.velocityY = 0;
    player.onGround = false;
    player.jumping = false;
    
    platforms = [];
    heartsCollectible = [];
    stars = [];
    particles = [];
    
    for (let i = 0; i < 8; i++) {
        platforms.push({
            x: Math.random() * (canvas.width - 120),
            y: canvas.height - 80 - i * 90,
            width: 100 + Math.random() * 40,
            height: 18
        });
    }
}

function jump() {
    if (player.onGround && !player.jumping) {
        player.velocityY = JUMP_FORCE;
        player.onGround = false;
        player.jumping = true;
    }
}

function spawnPlatform() {
    const lastPlatform = platforms[platforms.length - 1];
    platforms.push({
        x: Math.random() * (canvas.width - 120),
        y: lastPlatform.y - 80 - Math.random() * 30,
        width: 100 + Math.random() * 40,
        height: 18
    });
}

function spawnHeart() {
    if (Math.random() < 0.015) {
        heartsCollectible.push({
            x: Math.random() * (canvas.width - 30),
            y: Math.random() * canvas.height * 0.7,
            size: 25,
            pulse: 0
        });
    }
}

function spawnStar() {
    if (Math.random() < 0.01) {
        stars.push({
            x: Math.random() * (canvas.width - 20),
            y: Math.random() * canvas.height * 0.6,
            size: 15,
            rotation: 0
        });
    }
}

function spawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x,
            y,
            velocityX: (Math.random() - 0.5) * 8,
            velocityY: (Math.random() - 0.5) * 8,
            size: Math.random() * 5 + 2,
            color,
            life: 1
        });
    }
}

function drawBackground() {
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, COLORS.background[0]);
    gradient.addColorStop(1, COLORS.background[1]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawPlayer() {
    ctx.save();
    
    ctx.shadowColor = player.color;
    ctx.shadowBlur = 15;
    
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.roundRect(player.x, player.y, player.width, player.height, 8);
    ctx.fill();
    
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(player.x + 10, player.y + 14, 4, 0, Math.PI * 2);
    ctx.arc(player.x + 25, player.y + 14, 4, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath();
    ctx.arc(player.x + 10, player.y + 14, 2, 0, Math.PI * 2);
    ctx.arc(player.x + 25, player.y + 14, 2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}

function drawPlatforms() {
    platforms.forEach(platform => {
        ctx.save();
        
        ctx.shadowColor = COLORS.platform;
        ctx.shadowBlur = 10;
        
        const gradient = ctx.createLinearGradient(
            platform.x, platform.y,
            platform.x, platform.y + platform.height
        );
        gradient.addColorStop(0, COLORS.platform);
        gradient.addColorStop(1, '#d68910');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(platform.x, platform.y, platform.width, platform.height, 5);
        ctx.fill();
        
        ctx.strokeStyle = '#f9e79f';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(platform.x + 5, platform.y + 3);
        ctx.lineTo(platform.x + platform.width - 5, platform.y + 3);
        ctx.stroke();
        
        ctx.restore();
    });
}

function drawHearts() {
    heartsCollectible.forEach(heart => {
        ctx.save();
        
        ctx.shadowColor = COLORS.heart;
        ctx.shadowBlur = 15;
        
        heart.pulse += 0.1;
        const scale = 1 + Math.sin(heart.pulse) * 0.1;
        
        ctx.translate(heart.x + heart.size / 2, heart.y + heart.size / 2);
        ctx.scale(scale, scale);
        
        ctx.fillStyle = COLORS.heart;
        ctx.font = `${heart.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('♥', 0, 0);
        
        ctx.restore();
    });
}

function drawStars() {
    stars.forEach(star => {
        ctx.save();
        
        ctx.shadowColor = COLORS.star;
        ctx.shadowBlur = 10;
        
        star.rotation += 0.05;
        
        ctx.translate(star.x + star.size / 2, star.y + star.size / 2);
        ctx.rotate(star.rotation);
        
        ctx.fillStyle = COLORS.star;
        drawStarShape(0, 0, 5, star.size / 2, star.size / 4);
        
        ctx.restore();
    });
}

function drawStarShape(cx, cy, spikes, outerRadius, innerRadius) {
    let rot = Math.PI / 2 * 3;
    let step = Math.PI / spikes;
    
    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    
    for (let i = 0; i < spikes; i++) {
        ctx.lineTo(cx + Math.cos(rot) * outerRadius, cy + Math.sin(rot) * outerRadius);
        rot += step;
        ctx.lineTo(cx + Math.cos(rot) * innerRadius, cy + Math.sin(rot) * innerRadius);
        rot += step;
    }
    
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fill();
}

function drawParticles() {
    particles.forEach((p, index) => {
        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        p.x += p.velocityX;
        p.y += p.velocityY;
        p.life -= 0.02;
        p.size *= 0.98;
        
        if (p.life <= 0) {
            particles.splice(index, 1);
        }
    });
}

function updatePlayer() {
    player.velocityY += GRAVITY;
    player.y += player.velocityY;
    player.x += player.velocityX;
    
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
    
    player.onGround = false;
    
    platforms.forEach(platform => {
        if (player.velocityY > 0 &&
            player.x + player.width > platform.x &&
            player.x < platform.x + platform.width &&
            player.y + player.height >= platform.y &&
            player.y + player.height <= platform.y + platform.height + 12) {
            
            player.y = platform.y - player.height;
            player.velocityY = 0;
            player.onGround = true;
            player.jumping = false;
            jump();
        }
    });
    
    if (player.y + player.height > canvas.height) {
        loseLife();
    }
    
    if (player.y < -50) {
        loseLife();
    }
}

function updatePlatforms() {
    platforms.forEach(platform => {
        platform.y += 1.5;
    });
    
    platforms = platforms.filter(p => p.y < canvas.height + 50);
    
    while (platforms.length < 8) {
        spawnPlatform();
    }
    
    score += 1;
    scoreEl.textContent = Math.floor(score / 10);
}

function updateHearts() {
    heartsCollectible.forEach((heart, index) => {
        heart.y += 1.5;
        heart.pulse += 0.1;
        
        if (player.x + player.width > heart.x &&
            player.x < heart.x + heart.size &&
            player.y + player.height > heart.y &&
            player.y < heart.y + heart.size) {
            
            if (lives < 5) {
                lives++;
                updateLivesDisplay();
                spawnParticles(heart.x, heart.y, COLORS.heart, 15);
            }
            heartsCollectible.splice(index, 1);
        }
        
        if (heart.y > canvas.height) {
            heartsCollectible.splice(index, 1);
        }
    });
    
    spawnHeart();
}

function updateStars() {
    stars.forEach((star, index) => {
        star.y += 1.5;
        star.rotation += 0.05;
        
        if (player.x + player.width > star.x &&
            player.x < star.x + star.size &&
            player.y + player.height > star.y &&
            player.y < star.y + star.size) {
            
            score += 50;
            scoreEl.textContent = Math.floor(score / 10);
            spawnParticles(star.x, star.y, COLORS.star, 20);
            stars.splice(index, 1);
        }
        
        if (star.y > canvas.height) {
            stars.splice(index, 1);
        }
    });
    
    spawnStar();
}

function loseLife() {
    lives--;
    updateLivesDisplay();
    spawnParticles(player.x + player.width / 2, player.y + player.height / 2, '#e94560', 20);
    
    if (lives <= 0) {
        gameOver();
    } else {
        player.y = canvas.height - 150;
        player.velocityY = 0;
    }
}

function updateLivesDisplay() {
    hearts.forEach((heart, index) => {
        if (index < lives) {
            heart.classList.remove('lost');
        } else {
            heart.classList.add('lost');
        }
    });
}

function gameOver() {
    gameRunning = false;
    cancelAnimationFrame(animationId);
    finalScoreEl.textContent = Math.floor(score / 10);
    gameOverScreen.classList.remove('hidden');
}

function gameLoop() {
    if (!gameRunning) return;
    
    drawBackground();
    drawPlatforms();
    drawHearts();
    drawStars();
    drawParticles();
    drawPlayer();
    
    updatePlayer();
    updatePlatforms();
    updateHearts();
    updateStars();
    
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
                player.velocityX = -PLAYER_SPEED;
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                player.velocityX = PLAYER_SPEED;
                break;
        }
    });
    
    document.addEventListener('keyup', (e) => {
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
            if (player.velocityX < 0) player.velocityX = 0;
        }
        if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
            if (player.velocityX > 0) player.velocityX = 0;
        }
    });
    
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (!gameRunning) return;
        
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        
        if (x < canvas.width / 2) {
            player.velocityX = -PLAYER_SPEED;
        } else {
            player.velocityX = PLAYER_SPEED;
        }
    });
    
    canvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        player.velocityX = 0;
    });
    
    canvas.addEventListener('mousedown', (e) => {
        if (!gameRunning) return;
        
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        
        if (x < canvas.width / 2) {
            player.velocityX = -PLAYER_SPEED;
        } else {
            player.velocityX = PLAYER_SPEED;
        }
    });
    
    canvas.addEventListener('mouseup', () => {
        player.velocityX = 0;
    });
    
    canvas.addEventListener('mouseleave', () => {
        player.velocityX = 0;
    });
}

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);
window.addEventListener('resize', () => {
    resizeCanvas();
    if (!gameRunning) {
        init();
    }
});

setupControls();
init();
