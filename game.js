// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size
canvas.width = 800;
canvas.height = 600;

// Game state
let gameState = {
    score: 0,
    lives: 3,
    level: 1,
    paused: false,
    gameOver: false
};

// Player
const player = {
    x: canvas.width / 2 - 25,
    y: canvas.height - 60,
    width: 50,
    height: 40,
    speed: 5,
    dx: 0
};

// Bullets
let bullets = [];
const bulletSpeed = 7;
const bulletWidth = 4;
const bulletHeight = 15;

// Enemies
let enemies = [];
const enemyRows = 4;
const enemyCols = 8;
const enemyWidth = 40;
const enemyHeight = 30;
const enemyPadding = 15;
const enemyOffsetTop = 60;
const enemyOffsetLeft = 50;
let enemyDirection = 1;
let enemySpeed = 1;
let enemyDropDistance = 20;

// Enemy bullets
let enemyBullets = [];
const enemyBulletSpeed = 3;

// Particle effects
let particles = [];

// Input handling
const keys = {
    ArrowLeft: false,
    ArrowRight: false,
    Space: false,
    KeyP: false,
    KeyR: false
};

// Initialize enemies
function createEnemies() {
    enemies = [];
    for (let row = 0; row < enemyRows; row++) {
        for (let col = 0; col < enemyCols; col++) {
            enemies.push({
                x: enemyOffsetLeft + col * (enemyWidth + enemyPadding),
                y: enemyOffsetTop + row * (enemyHeight + enemyPadding),
                width: enemyWidth,
                height: enemyHeight,
                alive: true,
                type: row // Different types for different rows
            });
        }
    }
}

// Create explosion particles
function createExplosion(x, y, color) {
    for (let i = 0; i < 15; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            life: 30,
            color: color
        });
    }
}

// Draw player
function drawPlayer() {
    // Player body
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(player.x, player.y, player.width, player.height);

    // Player details
    ctx.fillStyle = '#00cc00';
    ctx.fillRect(player.x + 10, player.y + 10, 30, 20);

    // Cannon
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(player.x + 23, player.y - 5, 4, 10);
}

// Draw bullets
function drawBullets() {
    ctx.fillStyle = '#ffff00';
    bullets.forEach(bullet => {
        ctx.fillRect(bullet.x, bullet.y, bulletWidth, bulletHeight);
    });
}

// Draw enemies
function drawEnemies() {
    enemies.forEach(enemy => {
        if (enemy.alive) {
            // Different colors for different types
            const colors = ['#ff0000', '#ff6600', '#ffaa00', '#ff00ff'];
            ctx.fillStyle = colors[enemy.type];

            // Enemy body
            ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);

            // Enemy details
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.fillRect(enemy.x + 5, enemy.y + 5, 10, 10);
            ctx.fillRect(enemy.x + 25, enemy.y + 5, 10, 10);

            // Enemy eyes
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(enemy.x + 10, enemy.y + 10, 5, 5);
            ctx.fillRect(enemy.x + 25, enemy.y + 10, 5, 5);
        }
    });
}

// Draw enemy bullets
function drawEnemyBullets() {
    ctx.fillStyle = '#ff0000';
    enemyBullets.forEach(bullet => {
        ctx.fillRect(bullet.x, bullet.y, bulletWidth, bulletHeight);
    });
}

// Draw particles
function drawParticles() {
    particles.forEach(particle => {
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = particle.life / 30;
        ctx.fillRect(particle.x, particle.y, 3, 3);
    });
    ctx.globalAlpha = 1;
}

// Update player
function updatePlayer() {
    player.x += player.dx;

    // Boundaries
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) {
        player.x = canvas.width - player.width;
    }
}

// Update bullets
function updateBullets() {
    bullets = bullets.filter(bullet => {
        bullet.y -= bulletSpeed;
        return bullet.y > 0;
    });
}

// Update enemies
function updateEnemies() {
    let hitEdge = false;

    enemies.forEach(enemy => {
        if (enemy.alive) {
            enemy.x += enemySpeed * enemyDirection;

            if (enemy.x <= 0 || enemy.x + enemy.width >= canvas.width) {
                hitEdge = true;
            }
        }
    });

    if (hitEdge) {
        enemyDirection *= -1;
        enemies.forEach(enemy => {
            if (enemy.alive) {
                enemy.y += enemyDropDistance;
            }
        });
    }

    // Random enemy shooting
    if (Math.random() < 0.02) {
        const aliveEnemies = enemies.filter(e => e.alive);
        if (aliveEnemies.length > 0) {
            const shooter = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
            enemyBullets.push({
                x: shooter.x + shooter.width / 2,
                y: shooter.y + shooter.height,
                width: bulletWidth,
                height: bulletHeight
            });
        }
    }
}

// Update enemy bullets
function updateEnemyBullets() {
    enemyBullets = enemyBullets.filter(bullet => {
        bullet.y += enemyBulletSpeed;
        return bullet.y < canvas.height;
    });
}

// Update particles
function updateParticles() {
    particles = particles.filter(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life--;
        return particle.life > 0;
    });
}

// Collision detection
function checkCollisions() {
    // Bullet-enemy collisions
    bullets.forEach((bullet, bulletIndex) => {
        enemies.forEach(enemy => {
            if (enemy.alive &&
                bullet.x < enemy.x + enemy.width &&
                bullet.x + bulletWidth > enemy.x &&
                bullet.y < enemy.y + enemy.height &&
                bullet.y + bulletHeight > enemy.y) {

                enemy.alive = false;
                bullets.splice(bulletIndex, 1);
                gameState.score += (enemy.type + 1) * 10;
                updateScore();
                createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, '#ff6600');

                // Check if all enemies destroyed
                if (enemies.every(e => !e.alive)) {
                    nextLevel();
                }
            }
        });
    });

    // Enemy bullet-player collision
    enemyBullets.forEach((bullet, index) => {
        if (bullet.x < player.x + player.width &&
            bullet.x + bulletWidth > player.x &&
            bullet.y < player.y + player.height &&
            bullet.y + bulletHeight > player.y) {

            enemyBullets.splice(index, 1);
            loseLife();
        }
    });

    // Enemy-player collision
    enemies.forEach(enemy => {
        if (enemy.alive && enemy.y + enemy.height >= player.y) {
            endGame();
        }
    });
}

// Shoot bullet
function shoot() {
    if (bullets.length < 3) { // Max 3 bullets on screen
        bullets.push({
            x: player.x + player.width / 2 - bulletWidth / 2,
            y: player.y,
            width: bulletWidth,
            height: bulletHeight
        });
    }
}

// Lose a life
function loseLife() {
    gameState.lives--;
    updateLives();
    createExplosion(player.x + player.width / 2, player.y + player.height / 2, '#00ff00');

    if (gameState.lives <= 0) {
        endGame();
    }
}

// Next level
function nextLevel() {
    gameState.level++;
    updateLevel();
    enemySpeed += 0.5;
    createEnemies();
    bullets = [];
    enemyBullets = [];
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
        gameOver: false
    };

    player.x = canvas.width / 2 - 25;
    player.y = canvas.height - 60;
    player.dx = 0;

    bullets = [];
    enemyBullets = [];
    particles = [];
    enemySpeed = 1;
    enemyDirection = 1;

    createEnemies();
    updateScore();
    updateLives();
    updateLevel();

    document.getElementById('gameOverScreen').classList.add('hidden');
}

// Toggle pause
function togglePause() {
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
    document.getElementById('lives').textContent = gameState.lives;
}

function updateLevel() {
    document.getElementById('level').textContent = gameState.level;
}

// Clear canvas
function clear() {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// Draw stars background
function drawStars() {
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 50; i++) {
        const x = (i * 137.5) % canvas.width;
        const y = (i * 197.3) % canvas.height;
        ctx.fillRect(x, y, 2, 2);
    }
}

// Game loop
function gameLoop() {
    clear();
    drawStars();

    if (!gameState.gameOver && !gameState.paused) {
        updatePlayer();
        updateBullets();
        updateEnemies();
        updateEnemyBullets();
        updateParticles();
        checkCollisions();
    }

    drawPlayer();
    drawBullets();
    drawEnemies();
    drawEnemyBullets();
    drawParticles();

    requestAnimationFrame(gameLoop);
}

// Keyboard event handlers
document.addEventListener('keydown', (e) => {
    if (e.code in keys) {
        e.preventDefault();

        if (e.code === 'KeyP' && !gameState.gameOver) {
            togglePause();
        }

        if (e.code === 'KeyR' && gameState.gameOver) {
            restartGame();
        }

        if (!gameState.paused && !gameState.gameOver) {
            if (e.code === 'ArrowLeft') {
                player.dx = -player.speed;
            } else if (e.code === 'ArrowRight') {
                player.dx = player.speed;
            } else if (e.code === 'Space' && !keys.Space) {
                shoot();
                keys.Space = true;
            }
        }
    }
});

document.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
        player.dx = 0;
    } else if (e.code === 'Space') {
        keys.Space = false;
    }
});

// Initialize game
createEnemies();
gameLoop();
