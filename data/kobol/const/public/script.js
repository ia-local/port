console.log("Script JavaScript chargé.");

const canvas = document.getElementById('monCanvas');
const ctx = canvas.getContext('2d');

if (!ctx) {
    console.error("Erreur : contexte 2D non trouvé !");
} else {
    console.log("Élément canvas trouvé.");

    // Définir les dimensions du canvas
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    console.log("Dimensions du canvas définies :", canvas.width, canvas.height);

    // Paramètres
    const nombreEtoiles = 50;
    const distanceConnexion = 150;

    const etoiles = [];

    function creerEtoile() {
        return {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            rayon: Math.random() * 3 + 1,
            activite: Math.random()
        };
    }

    for (let i = 0; i < nombreEtoiles; i++) {
        etoiles.push(creerEtoile());
    }

    console.log("Étoiles créées :", etoiles);

    function dessinerEtoiles() {
        console.log("Dessin des étoiles...");
        etoiles.forEach(etoile => {
            ctx.beginPath();
            ctx.arc(etoile.x, etoile.y, etoile.rayon, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${etoile.activite})`;
            ctx.fill();
        });
        console.log("Dessin des étoiles terminé.");
    }

    function dessinerConnexions(etoile1, etoile2) {
        console.log("Dessin des connexions...");
        const distance = Math.sqrt(Math.pow(etoile2.x - etoile1.x, 2) + Math.pow(etoile2.y - etoile1.y, 2));

        if (distance < distanceConnexion) {
            ctx.beginPath();
            ctx.moveTo(etoile1.x, etoile1.y);
            ctx.lineTo(etoile2.x, etoile2.y);
            ctx.fillStyle = 'blue'; // Changer la couleur des étoiles
            ctx.strokeStyle = 'green';// Changer la couleur des connexions
            ctx.stroke();
        }
        console.log("Dessin des connexions terminé.");
    }

    function animer() {
        console.log("Animation en cours...");
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let i = 0; i < etoiles.length; i++) {
            for (let j = i + 1; j < etoiles.length; j++) {
                dessinerConnexions(etoiles[i], etoiles[j]);
            }
        }

        dessinerEtoiles();

        requestAnimationFrame(animer);
    }

    animer();

    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
}