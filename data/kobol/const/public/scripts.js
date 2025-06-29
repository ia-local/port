const canvas = document.getElementById('constellationCanvas');
const ctx = canvas.getContext('2d');

// Paramètres
const numStars = 100;
const starRadius = 2;
const connectionDistance = 150;

let stars = [];

// Fonction pour générer des étoiles aléatoires
function generateStars() {
    for (let i = 0; i < numStars; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: starRadius,
            color: 'white'
        });
    }
}

// Fonction pour dessiner les étoiles
function drawStars() {
    stars.forEach(star => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = star.color;
        ctx.fill();
    });
}

// Fonction pour dessiner les connexions (cordes cosmiques)
function drawConnections() {
    for (let i = 0; i < stars.length; i++) {
        for (let j = i + 1; j < stars.length; j++) {
            const dx = stars[i].x - stars[j].x;
            const dy = stars[i].y - stars[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < connectionDistance) {
                ctx.beginPath();
                ctx.moveTo(stars[i].x, stars[i].y);
                ctx.lineTo(stars[j].x, stars[j].y);
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'; // Connexions semi-transparentes
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        }
    }
}

// Fonction d'animation
function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Efface le canvas
    drawConnections();
    drawStars();
    requestAnimationFrame(animate);
}

// Initialisation
function init() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    generateStars();
    animate();
}

init();

// Redimensionnement du canvas
window.addEventListener('resize', init);