const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;
const PREVIEW_BLOCK_SIZE = 20;

const COLORS = {
    I: '#00f5ff',
    O: '#ffd700',
    T: '#a855f7',
    S: '#22c55e',
    Z: '#ef4444',
    J: '#3b82f6',
    L: '#f97316'
};

const SHAPES = {
    I: [[1, 1, 1, 1]],
    O: [[1, 1], [1, 1]],
    T: [[0, 1, 0], [1, 1, 1]],
    S: [[0, 1, 1], [1, 1, 0]],
    Z: [[1, 1, 0], [0, 1, 1]],
    J: [[1, 0, 0], [1, 1, 1]],
    L: [[0, 0, 1], [1, 1, 1]]
};

class Tetris {
    constructor() {
        this.canvas = document.getElementById('game-board');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = COLS * BLOCK_SIZE;
        this.canvas.height = ROWS * BLOCK_SIZE;
        
        this.nextCanvas = document.getElementById('next-piece');
        this.nextCtx = this.nextCanvas.getContext('2d');
        
        this.scoreEl = document.getElementById('score');
        this.levelEl = document.getElementById('level');
        this.linesEl = document.getElementById('lines');
        this.gameOverScreen = document.getElementById('game-over');
        this.pauseScreen = document.getElementById('pause-screen');
        this.startScreen = document.getElementById('start-screen');
        this.finalScoreEl = document.getElementById('final-score');
        
        this.startBtn = document.getElementById('start-btn');
        this.restartBtn = document.getElementById('restart-btn');
        
        this.startBtn.addEventListener('click', () => this.start());
        this.restartBtn.addEventListener('click', () => this.restart());
        
        this.board = [];
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.gameOver = false;
        this.paused = false;
        this.dropInterval = 1000;
        this.lastDrop = 0;
        this.currentPiece = null;
        this.nextPiece = null;
        
        this.init();
        this.setupControls();
    }
    
    init() {
        this.board = Array(ROWS).fill(null).map(() => Array(COLS).fill(0));
        this.draw();
    }
    
    start() {
        this.startScreen.classList.add('hidden');
        this.spawnPiece();
        this.gameLoop();
    }
    
    restart() {
        this.board = Array(ROWS).fill(null).map(() => Array(COLS).fill(0));
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.gameOver = false;
        this.paused = false;
        this.dropInterval = 1000;
        this.updateDisplay();
        this.gameOverScreen.classList.add('hidden');
        this.spawnPiece();
        this.gameLoop();
    }
    
    setupControls() {
        document.addEventListener('keydown', (e) => {
            if (this.gameOver || !this.currentPiece) return;
            
            if (e.key === 'p' || e.key === 'P') {
                this.togglePause();
                return;
            }
            
            if (this.paused) return;
            
            switch(e.key) {
                case 'ArrowLeft':
                    this.movePiece(-1, 0);
                    break;
                case 'ArrowRight':
                    this.movePiece(1, 0);
                    break;
                case 'ArrowDown':
                    this.movePiece(0, 1);
                    break;
                case 'ArrowUp':
                    this.rotatePiece();
                    break;
                case ' ':
                    this.hardDrop();
                    break;
            }
        });
    }
    
    togglePause() {
        this.paused = !this.paused;
        if (this.paused) {
            this.pauseScreen.classList.remove('hidden');
        } else {
            this.pauseScreen.classList.add('hidden');
        }
    }
    
    spawnPiece() {
        const types = Object.keys(SHAPES);
        const type = types[Math.floor(Math.random() * types.length)];
        
        if (this.nextPiece) {
            this.currentPiece = {
                type: this.nextPiece.type,
                shape: this.nextPiece.shape.map(row => [...row]),
                color: this.nextPiece.color,
                x: Math.floor(COLS / 2) - Math.floor(this.nextPiece.shape[0].length / 2),
                y: 0
            };
        } else {
            this.currentPiece = {
                type,
                shape: SHAPES[type].map(row => [...row]),
                color: COLORS[type],
                x: Math.floor(COLS / 2) - Math.floor(SHAPES[type][0].length / 2),
                y: 0
            };
        }
        
        const nextType = types[Math.floor(Math.random() * types.length)];
        this.nextPiece = {
            type: nextType,
            shape: SHAPES[nextType].map(row => [...row]),
            color: COLORS[nextType]
        };
        
        this.drawNextPiece();
        
        if (this.checkCollision(0, 0)) {
            this.endGame();
        }
    }
    
    checkCollision(offsetX, offsetY, shape = this.currentPiece.shape) {
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    const newX = this.currentPiece.x + x + offsetX;
                    const newY = this.currentPiece.y + y + offsetY;
                    
                    if (newX < 0 || newX >= COLS || newY >= ROWS) {
                        return true;
                    }
                    
                    if (newY >= 0 && this.board[newY][newX]) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    
    movePiece(dx, dy) {
        if (!this.checkCollision(dx, dy)) {
            this.currentPiece.x += dx;
            this.currentPiece.y += dy;
            return true;
        }
        return false;
    }
    
    rotatePiece() {
        const shape = this.currentPiece.shape;
        const rotated = shape[0].map((_, i) => shape.map(row => row[i]).reverse());
        
        if (!this.checkCollision(0, 0, rotated)) {
            this.currentPiece.shape = rotated;
        } else if (!this.checkCollision(1, 0, rotated)) {
            this.currentPiece.x += 1;
            this.currentPiece.shape = rotated;
        } else if (!this.checkCollision(-1, 0, rotated)) {
            this.currentPiece.x -= 1;
            this.currentPiece.shape = rotated;
        }
    }
    
    hardDrop() {
        while (this.movePiece(0, 1)) {
            this.score += 2;
        }
        this.lockPiece();
    }
    
    lockPiece() {
        for (let y = 0; y < this.currentPiece.shape.length; y++) {
            for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if (this.currentPiece.shape[y][x]) {
                    const boardY = this.currentPiece.y + y;
                    const boardX = this.currentPiece.x + x;
                    if (boardY >= 0) {
                        this.board[boardY][boardX] = this.currentPiece.color;
                    }
                }
            }
        }
        this.clearLines();
        this.spawnPiece();
    }
    
    clearLines() {
        let linesCleared = 0;
        
        for (let y = ROWS - 1; y >= 0; y--) {
            if (this.board[y].every(cell => cell !== 0)) {
                this.board.splice(y, 1);
                this.board.unshift(Array(COLS).fill(0));
                linesCleared++;
                y++;
            }
        }
        
        if (linesCleared > 0) {
            const points = [0, 100, 300, 500, 800];
            this.score += points[linesCleared] * this.level;
            this.lines += linesCleared;
            this.level = Math.floor(this.lines / 10) + 1;
            this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 100);
            this.updateDisplay();
        }
    }
    
    updateDisplay() {
        this.scoreEl.textContent = this.score;
        this.levelEl.textContent = this.level;
        this.linesEl.textContent = this.lines;
    }
    
    endGame() {
        this.gameOver = true;
        this.finalScoreEl.textContent = this.score;
        this.gameOverScreen.classList.remove('hidden');
    }
    
    gameLoop(timestamp = 0) {
        if (this.gameOver) return;
        
        if (!this.paused) {
            if (timestamp - this.lastDrop > this.dropInterval) {
                if (!this.movePiece(0, 1)) {
                    this.lockPiece();
                }
                this.lastDrop = timestamp;
            }
            this.draw();
        }
        
        requestAnimationFrame((t) => this.gameLoop(t));
    }
    
    draw() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                if (this.board[y][x]) {
                    this.drawBlock(x, y, this.board[y][x]);
                }
            }
        }
        
        if (this.currentPiece) {
            for (let y = 0; y < this.currentPiece.shape.length; y++) {
                for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                    if (this.currentPiece.shape[y][x]) {
                        this.drawBlock(
                            this.currentPiece.x + x,
                            this.currentPiece.y + y,
                            this.currentPiece.color
                        );
                    }
                }
            }
        }
        
        this.drawGrid();
    }
    
    drawBlock(x, y, color) {
        const gradient = this.ctx.createLinearGradient(
            x * BLOCK_SIZE, y * BLOCK_SIZE,
            x * BLOCK_SIZE + BLOCK_SIZE, y * BLOCK_SIZE + BLOCK_SIZE
        );
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, this.darkenColor(color, 30));
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(
            x * BLOCK_SIZE + 1,
            y * BLOCK_SIZE + 1,
            BLOCK_SIZE - 2,
            BLOCK_SIZE - 2
        );
        
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.fillRect(
            x * BLOCK_SIZE + 2,
            y * BLOCK_SIZE + 2,
            BLOCK_SIZE - 6,
            3
        );
        
        this.ctx.strokeStyle = this.darkenColor(color, 50);
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(
            x * BLOCK_SIZE + 1,
            y * BLOCK_SIZE + 1,
            BLOCK_SIZE - 2,
            BLOCK_SIZE - 2
        );
    }
    
    drawGrid() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        this.ctx.lineWidth = 1;
        
        for (let x = 0; x <= COLS; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * BLOCK_SIZE, 0);
            this.ctx.lineTo(x * BLOCK_SIZE, this.canvas.height);
            this.ctx.stroke();
        }
        
        for (let y = 0; y <= ROWS; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * BLOCK_SIZE);
            this.ctx.lineTo(this.canvas.width, y * BLOCK_SIZE);
            this.ctx.stroke();
        }
    }
    
    drawNextPiece() {
        this.nextCtx.fillStyle = 'rgba(0, 0, 0, 1)';
        this.nextCtx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
        
        const shape = this.nextPiece.shape;
        const offsetX = (this.nextCanvas.width - shape[0].length * PREVIEW_BLOCK_SIZE) / 2;
        const offsetY = (this.nextCanvas.height - shape.length * PREVIEW_BLOCK_SIZE) / 2;
        
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    this.nextCtx.fillStyle = this.nextPiece.color;
                    this.nextCtx.fillRect(
                        offsetX + x * PREVIEW_BLOCK_SIZE + 1,
                        offsetY + y * PREVIEW_BLOCK_SIZE + 1,
                        PREVIEW_BLOCK_SIZE - 2,
                        PREVIEW_BLOCK_SIZE - 2
                    );
                }
            }
        }
    }
    
    darkenColor(hex, percent) {
        const num = parseInt(hex.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.max((num >> 16) - amt, 0);
        const G = Math.max((num >> 8 & 0x00FF) - amt, 0);
        const B = Math.max((num & 0x0000FF) - amt, 0);
        return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    }
}

const game = new Tetris();
