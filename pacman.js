// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Grid settings
const gridSize = 20;
const rows = 21;
const cols = 19;
canvas.width = cols * gridSize;
canvas.height = rows * gridSize;

// Game state
let gameState = {
    score: 0,
    lives: 3,
    level: 1,
    paused: false,
    gameOver: false,
    ready: true,
    won: false,
    pelletsRemaining: 0
};

// Maze layout (1 = wall, 0 = pellet, 2 = power pellet, 3 = empty, 4 = ghost house)
const originalMaze = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,0,1],
    [1,2,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,2,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,0,1,0,1,1,1,1,1,0,1,0,1,1,0,1],
    [1,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,1],
    [1,1,1,1,0,1,1,1,3,1,3,1,1,1,0,1,1,1,1],
    [1,1,1,1,0,1,3,3,3,3,3,3,3,1,0,1,1,1,1],
    [1,1,1,1,0,1,3,1,1,4,1,1,3,1,0,1,1,1,1],
    [3,3,3,3,0,3,3,1,4,4,4,1,3,3,0,3,3,3,3],
    [1,1,1,1,0,1,3,1,1,1,1,1,3,1,0,1,1,1,1],
    [1,1,1,1,0,1,3,3,3,3,3,3,3,1,0,1,1,1,1],
    [1,1,1,1,0,1,3,1,1,1,1,1,3,1,0,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,0,1],
    [1,2,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,2,1],
    [1,1,0,1,0,1,0,1,1,1,1,1,0,1,0,1,0,1,1],
    [1,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,1],
    [1,0,1,1,1,1,1,1,0,1,0,1,1,1,1,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

let maze = [];

// Pac-Man
const pacman = {
    x: 9,
    y: 15,
    direction: { x: 0, y: 0 },
    nextDirection: { x: 0, y: 0 },
    speed: 0.15,
    position: { x: 9, y: 15 },
    mouthOpen: 0,
    mouthSpeed: 0.15,
    powered: false,
    powerTimer: 0,
    powerDuration: 7000
};

// Ghosts
const ghosts = [
    {
        name: 'Blinky',
        color: '#ff0000',
        x: 9,
        y: 9,
        startX: 9,
        startY: 9,
        direction: { x: -1, y: 0 },
        speed: 0.1,
        mode: 'chase',
        scatter: { x: 17, y: 0 }
    },
    {
        name: 'Pinky',
        color: '#ffb8ff',
        x: 8,
        y: 10,
        startX: 8,
        startY: 10,
        direction: { x: 0, y: -1 },
        speed: 0.1,
        mode: 'chase',
        scatter: { x: 1, y: 0 }
    },
    {
        name: 'Inky',
        color: '#00ffff',
        x: 9,
        y: 10,
        startX: 9,
        startY: 10,
        direction: { x: 0, y: -1 },
        speed: 0.1,
        mode: 'chase',
        scatter: { x: 17, y: 20 }
    },
    {
        name: 'Clyde',
        color: '#ffb851',
        x: 10,
        y: 10,
        startX: 10,
        startY: 10,
        direction: { x: 0, y: -1 },
        speed: 0.1,
        mode: 'chase',
        scatter: { x: 1, y: 20 }
    }
];

// Timers
let readyTimer = 0;
let ghostModeTimer = 0;
let ghostModePhase = 0;

// Initialize maze
function initMaze() {
    maze = originalMaze.map(row => [...row]);
    gameState.pelletsRemaining = 0;

    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            if (maze[y][x] === 0 || maze[y][x] === 2) {
                gameState.pelletsRemaining++;
            }
        }
    }
}

// Reset positions
function resetPositions() {
    pacman.x = 9;
    pacman.y = 15;
    pacman.position = { x: 9, y: 15 };
    pacman.direction = { x: 0, y: 0 };
    pacman.nextDirection = { x: 0, y: 0 };
    pacman.powered = false;
    pacman.powerTimer = 0;

    ghosts.forEach(ghost => {
        ghost.x = ghost.startX;
        ghost.y = ghost.startY;
        ghost.direction = { x: 0, y: -1 };
        ghost.frightened = false;
        ghost.eaten = false;
    });
}

// Draw maze
function drawMaze() {
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            const cell = maze[y][x];

            if (cell === 1) {
                // Wall
                ctx.fillStyle = '#2121ff';
                ctx.fillRect(x * gridSize, y * gridSize, gridSize, gridSize);
                ctx.strokeStyle = '#4040ff';
                ctx.lineWidth = 1;
                ctx.strokeRect(x * gridSize, y * gridSize, gridSize, gridSize);
            } else if (cell === 0) {
                // Pellet
                ctx.fillStyle = '#ffb897';
                ctx.beginPath();
                ctx.arc(x * gridSize + gridSize / 2, y * gridSize + gridSize / 2, 2, 0, Math.PI * 2);
                ctx.fill();
            } else if (cell === 2) {
                // Power pellet
                const pulse = Math.sin(Date.now() / 200) * 0.3 + 0.7;
                ctx.fillStyle = `rgba(255, 184, 151, ${pulse})`;
                ctx.beginPath();
                ctx.arc(x * gridSize + gridSize / 2, y * gridSize + gridSize / 2, 5, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
}

// Draw Pac-Man
function drawPacman() {
    const centerX = pacman.position.x * gridSize + gridSize / 2;
    const centerY = pacman.position.y * gridSize + gridSize / 2;
    const radius = gridSize / 2 - 2;

    // Determine mouth angle based on direction
    let rotation = 0;
    if (pacman.direction.x === 1) rotation = 0;
    else if (pacman.direction.x === -1) rotation = Math.PI;
    else if (pacman.direction.y === 1) rotation = Math.PI / 2;
    else if (pacman.direction.y === -1) rotation = -Math.PI / 2;

    // Animate mouth
    pacman.mouthOpen += pacman.mouthSpeed;
    if (pacman.mouthOpen > 0.8 || pacman.mouthOpen < 0) {
        pacman.mouthSpeed *= -1;
    }

    const mouthAngle = pacman.mouthOpen * 0.4;

    ctx.fillStyle = '#ffff00';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, rotation + mouthAngle, rotation + Math.PI * 2 - mouthAngle);
    ctx.lineTo(centerX, centerY);
    ctx.closePath();
    ctx.fill();
}

// Draw ghosts
function drawGhosts() {
    ghosts.forEach(ghost => {
        const centerX = ghost.x * gridSize + gridSize / 2;
        const centerY = ghost.y * gridSize + gridSize / 2;
        const radius = gridSize / 2 - 2;

        if (ghost.eaten) {
            // Eyes only (ghost eaten)
            ctx.fillStyle = '#fff';
            ctx.fillRect(centerX - 6, centerY - 4, 4, 4);
            ctx.fillRect(centerX + 2, centerY - 4, 4, 4);
            ctx.fillStyle = '#000';
            ctx.fillRect(centerX - 5 + ghost.direction.x * 2, centerY - 3, 2, 2);
            ctx.fillRect(centerX + 3 + ghost.direction.x * 2, centerY - 3, 2, 2);
        } else if (ghost.frightened) {
            // Frightened ghost (blue)
            const blinkTime = pacman.powerTimer < 2000 ? 200 : 1000;
            const blink = Math.floor(Date.now() / blinkTime) % 2;
            ctx.fillStyle = blink && pacman.powerTimer < 2000 ? '#fff' : '#2121de';

            // Body
            ctx.beginPath();
            ctx.arc(centerX, centerY - 2, radius, Math.PI, 0);
            ctx.lineTo(centerX + radius, centerY + radius);
            ctx.lineTo(centerX + radius - 3, centerY + radius - 3);
            ctx.lineTo(centerX + radius - 6, centerY + radius);
            ctx.lineTo(centerX, centerY + radius - 3);
            ctx.lineTo(centerX - radius + 6, centerY + radius);
            ctx.lineTo(centerX - radius + 3, centerY + radius - 3);
            ctx.lineTo(centerX - radius, centerY + radius);
            ctx.closePath();
            ctx.fill();

            // Frightened face
            ctx.fillStyle = '#fff';
            ctx.fillRect(centerX - 6, centerY - 2, 3, 4);
            ctx.fillRect(centerX + 3, centerY - 2, 3, 4);

            // Mouth
            ctx.fillRect(centerX - 5, centerY + 4, 2, 2);
            ctx.fillRect(centerX - 1, centerY + 4, 2, 2);
            ctx.fillRect(centerX + 3, centerY + 4, 2, 2);
        } else {
            // Normal ghost
            ctx.fillStyle = ghost.color;

            // Body
            ctx.beginPath();
            ctx.arc(centerX, centerY - 2, radius, Math.PI, 0);
            ctx.lineTo(centerX + radius, centerY + radius);
            ctx.lineTo(centerX + radius - 3, centerY + radius - 3);
            ctx.lineTo(centerX + radius - 6, centerY + radius);
            ctx.lineTo(centerX, centerY + radius - 3);
            ctx.lineTo(centerX - radius + 6, centerY + radius);
            ctx.lineTo(centerX - radius + 3, centerY + radius - 3);
            ctx.lineTo(centerX - radius, centerY + radius);
            ctx.closePath();
            ctx.fill();

            // Eyes
            ctx.fillStyle = '#fff';
            ctx.fillRect(centerX - 6, centerY - 4, 5, 6);
            ctx.fillRect(centerX + 1, centerY - 4, 5, 6);

            // Pupils
            ctx.fillStyle = '#000';
            ctx.fillRect(centerX - 5 + ghost.direction.x * 2, centerY - 2 + ghost.direction.y * 2, 3, 3);
            ctx.fillRect(centerX + 2 + ghost.direction.x * 2, centerY - 2 + ghost.direction.y * 2, 3, 3);
        }
    });
}

// Check if move is valid
function isValidMove(x, y) {
    const gridX = Math.round(x);
    const gridY = Math.round(y);

    if (gridX < 0 || gridX >= cols || gridY < 0 || gridY >= rows) {
        return false;
    }

    const cell = maze[gridY][gridX];
    return cell !== 1;
}

// Update Pac-Man
function updatePacman() {
    // Try to change direction
    const nextX = pacman.position.x + pacman.nextDirection.x * pacman.speed;
    const nextY = pacman.position.y + pacman.nextDirection.y * pacman.speed;

    if (isValidMove(nextX, nextY)) {
        pacman.direction = { ...pacman.nextDirection };
    }

    // Move in current direction
    const newX = pacman.position.x + pacman.direction.x * pacman.speed;
    const newY = pacman.position.y + pacman.direction.y * pacman.speed;

    if (isValidMove(newX, newY)) {
        pacman.position.x = newX;
        pacman.position.y = newY;
    }

    // Wrap around
    if (pacman.position.x < -0.5) pacman.position.x = cols - 0.5;
    if (pacman.position.x > cols - 0.5) pacman.position.x = -0.5;

    // Update grid position
    pacman.x = Math.round(pacman.position.x);
    pacman.y = Math.round(pacman.position.y);

    // Collect pellets
    const cell = maze[pacman.y][pacman.x];
    if (cell === 0 || cell === 2) {
        if (cell === 2) {
            // Power pellet
            pacman.powered = true;
            pacman.powerTimer = pacman.powerDuration;
            ghosts.forEach(ghost => {
                if (!ghost.eaten) {
                    ghost.frightened = true;
                    ghost.direction.x *= -1;
                    ghost.direction.y *= -1;
                }
            });
            gameState.score += 50;
        } else {
            gameState.score += 10;
        }

        maze[pacman.y][pacman.x] = 3;
        gameState.pelletsRemaining--;
        updateScore();

        if (gameState.pelletsRemaining === 0) {
            winLevel();
        }
    }

    // Update power timer
    if (pacman.powered) {
        pacman.powerTimer -= 16;
        if (pacman.powerTimer <= 0) {
            pacman.powered = false;
            ghosts.forEach(ghost => {
                ghost.frightened = false;
            });
        }
    }
}

// Ghost AI - Get next direction
function getGhostDirection(ghost) {
    const possibleDirections = [];
    const directions = [
        { x: 0, y: -1 }, // Up
        { x: 0, y: 1 },  // Down
        { x: -1, y: 0 }, // Left
        { x: 1, y: 0 }   // Right
    ];

    // Don't reverse unless necessary
    directions.forEach(dir => {
        if (dir.x === -ghost.direction.x && dir.y === -ghost.direction.y) {
            return;
        }

        const nextX = Math.round(ghost.x + dir.x);
        const nextY = Math.round(ghost.y + dir.y);

        if (isValidMove(nextX, nextY) && maze[nextY][nextX] !== 4) {
            possibleDirections.push(dir);
        }
    });

    if (possibleDirections.length === 0) {
        // Allow reverse if stuck
        directions.forEach(dir => {
            const nextX = Math.round(ghost.x + dir.x);
            const nextY = Math.round(ghost.y + dir.y);
            if (isValidMove(nextX, nextY)) {
                possibleDirections.push(dir);
            }
        });
    }

    if (possibleDirections.length === 0) {
        return ghost.direction;
    }

    let target;

    if (ghost.frightened) {
        // Random movement when frightened
        return possibleDirections[Math.floor(Math.random() * possibleDirections.length)];
    } else if (ghost.eaten) {
        // Return to ghost house
        target = { x: 9, y: 10 };
    } else if (ghost.mode === 'scatter') {
        target = ghost.scatter;
    } else {
        // Chase Pac-Man
        target = { x: pacman.x, y: pacman.y };

        // Different behaviors for different ghosts
        if (ghost.name === 'Pinky') {
            // Target 4 tiles ahead of Pac-Man
            target.x += pacman.direction.x * 4;
            target.y += pacman.direction.y * 4;
        } else if (ghost.name === 'Inky') {
            // Complex targeting with Blinky
            const blinky = ghosts[0];
            const aheadX = pacman.x + pacman.direction.x * 2;
            const aheadY = pacman.y + pacman.direction.y * 2;
            target.x = aheadX + (aheadX - blinky.x);
            target.y = aheadY + (aheadY - blinky.y);
        } else if (ghost.name === 'Clyde') {
            // Chase if far, scatter if close
            const distance = Math.sqrt(Math.pow(ghost.x - pacman.x, 2) + Math.pow(ghost.y - pacman.y, 2));
            if (distance < 8) {
                target = ghost.scatter;
            }
        }
    }

    // Find closest direction to target
    let bestDir = possibleDirections[0];
    let bestDist = Infinity;

    possibleDirections.forEach(dir => {
        const nextX = ghost.x + dir.x;
        const nextY = ghost.y + dir.y;
        const dist = Math.sqrt(Math.pow(nextX - target.x, 2) + Math.pow(nextY - target.y, 2));

        if (dist < bestDist) {
            bestDist = dist;
            bestDir = dir;
        }
    });

    return bestDir;
}

// Update ghosts
function updateGhosts() {
    // Update ghost mode timing
    ghostModeTimer += 16;
    const modeTimes = [7000, 20000, 7000, 20000, 5000, 20000, 5000];

    if (ghostModePhase < modeTimes.length && ghostModeTimer > modeTimes[ghostModePhase]) {
        ghostModeTimer = 0;
        ghostModePhase++;

        const newMode = ghostModePhase % 2 === 0 ? 'scatter' : 'chase';
        ghosts.forEach(ghost => {
            if (!ghost.frightened && !ghost.eaten) {
                ghost.mode = newMode;
            }
        });
    }

    ghosts.forEach(ghost => {
        // Check if at intersection
        const atIntersection = Math.abs(ghost.x - Math.round(ghost.x)) < 0.1 &&
                              Math.abs(ghost.y - Math.round(ghost.y)) < 0.1;

        if (atIntersection) {
            ghost.x = Math.round(ghost.x);
            ghost.y = Math.round(ghost.y);

            // Check if reached home after being eaten
            if (ghost.eaten && ghost.x === 9 && ghost.y === 10) {
                ghost.eaten = false;
                ghost.frightened = false;
            }

            ghost.direction = getGhostDirection(ghost);
        }

        // Move ghost
        const speed = ghost.frightened ? ghost.speed * 0.5 : ghost.eaten ? ghost.speed * 2 : ghost.speed;
        ghost.x += ghost.direction.x * speed;
        ghost.y += ghost.direction.y * speed;

        // Wrap around
        if (ghost.x < -0.5) ghost.x = cols - 0.5;
        if (ghost.x > cols - 0.5) ghost.x = -0.5;
    });
}

// Check collisions with ghosts
function checkGhostCollisions() {
    ghosts.forEach(ghost => {
        const dist = Math.sqrt(Math.pow(ghost.x - pacman.x, 2) + Math.pow(ghost.y - pacman.y, 2));

        if (dist < 0.7) {
            if (ghost.frightened && !ghost.eaten) {
                // Eat ghost
                ghost.eaten = true;
                ghost.frightened = false;
                gameState.score += 200;
                updateScore();
            } else if (!ghost.eaten) {
                // Lose life
                loseLife();
            }
        }
    });
}

// Lose a life
function loseLife() {
    gameState.lives--;
    updateLives();

    if (gameState.lives <= 0) {
        endGame();
    } else {
        resetPositions();
        gameState.ready = true;
        readyTimer = 2000;
        showReadyScreen();
    }
}

// Win level
function winLevel() {
    gameState.won = true;
    document.getElementById('levelScore').textContent = gameState.score;
    document.getElementById('winScreen').classList.remove('hidden');

    setTimeout(() => {
        gameState.level++;
        updateLevel();
        initMaze();
        resetPositions();
        gameState.won = false;
        gameState.ready = true;
        readyTimer = 2000;
        document.getElementById('winScreen').classList.add('hidden');
        showReadyScreen();

        // Increase ghost speed slightly
        ghosts.forEach(ghost => {
            ghost.speed += 0.01;
        });
        pacman.speed += 0.01;
    }, 3000);
}

// End game
function endGame() {
    gameState.gameOver = true;
    document.getElementById('finalScore').textContent = gameState.score;
    document.getElementById('gameOverScreen').classList.remove('hidden');
}

// Restart game
function restartGame() {
    gameState = {
        score: 0,
        lives: 3,
        level: 1,
        paused: false,
        gameOver: false,
        ready: true,
        won: false
    };

    initMaze();
    resetPositions();

    // Reset ghost speeds
    ghosts.forEach(ghost => {
        ghost.speed = 0.1;
    });
    pacman.speed = 0.15;

    ghostModeTimer = 0;
    ghostModePhase = 0;
    readyTimer = 2000;

    updateScore();
    updateLives();
    updateLevel();

    document.getElementById('gameOverScreen').classList.add('hidden');
    showReadyScreen();
}

// Show ready screen
function showReadyScreen() {
    document.getElementById('readyScreen').classList.remove('hidden');
}

// Toggle pause
function togglePause() {
    if (gameState.ready || gameState.gameOver || gameState.won) return;

    gameState.paused = !gameState.paused;
    if (gameState.paused) {
        document.getElementById('pauseScreen').classList.remove('hidden');
    } else {
        document.getElementById('pauseScreen').classList.add('hidden');
    }
}

// Update UI
function updateScore() {
    document.getElementById('score').textContent = gameState.score;
}

function updateLives() {
    const livesContainer = document.getElementById('lives-container');
    livesContainer.textContent = '●'.repeat(gameState.lives);
}

function updateLevel() {
    document.getElementById('level').textContent = gameState.level;
}

// Clear canvas
function clear() {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// Game loop
let lastTime = 0;
function gameLoop(timestamp) {
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    clear();
    drawMaze();

    if (gameState.ready) {
        readyTimer -= deltaTime;
        if (readyTimer <= 0) {
            gameState.ready = false;
            document.getElementById('readyScreen').classList.add('hidden');
        }
    }

    if (!gameState.gameOver && !gameState.paused && !gameState.ready && !gameState.won) {
        updatePacman();
        updateGhosts();
        checkGhostCollisions();
    }

    drawPacman();
    drawGhosts();

    requestAnimationFrame(gameLoop);
}

// Keyboard controls
document.addEventListener('keydown', (e) => {
    if (e.code === 'KeyP' || e.code === 'Escape') {
        e.preventDefault();
        togglePause();
    }

    if (e.code === 'KeyR' && gameState.gameOver) {
        e.preventDefault();
        restartGame();
    }

    if (!gameState.paused && !gameState.gameOver) {
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
            e.preventDefault();
            pacman.nextDirection = { x: -1, y: 0 };
        } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
            e.preventDefault();
            pacman.nextDirection = { x: 1, y: 0 };
        } else if (e.code === 'ArrowUp' || e.code === 'KeyW') {
            e.preventDefault();
            pacman.nextDirection = { x: 0, y: -1 };
        } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
            e.preventDefault();
            pacman.nextDirection = { x: 0, y: -1 };
        }
    }
});

// Initialize game
initMaze();
updateLives();
showReadyScreen();
requestAnimationFrame(gameLoop);
