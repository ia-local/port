document.addEventListener('DOMContentLoaded', () => {
    console.log('Démarrage du framework SVG.');

    // Constantes et configurations
    const PHI = (1 + Math.sqrt(5)) / 2; // Nombre d'Or
    const INITIAL_CELL_WIDTH = 100;    // Largeur initiale de base pour les cellules
    const INITIAL_CELL_HEIGHT = INITIAL_CELL_WIDTH / PHI; // Hauteur basée sur le Nombre d'Or
    const CELL_PADDING = 5;            // Espace entre les cellules (pour une meilleure visibilité)

    // Sélection de l'élément SVG et de son conteneur
    const svg = d3.select("#main-svg");
    const svgContainer = d3.select("#svg-container");

    let currentTransform = d3.zoomIdentity; // Stocke la transformation actuelle (zoom et pan)
    let cellsData = []; // Données des cellules chargées

    // Groupe pour les éléments SVG qui seront transformés par le zoom/pan
    const zoomLayer = svg.append("g").attr("class", "zoom-layer");

    // --- Fonction de rendu des cellules ---
    function renderCells() {
        // Pour l'instant, on rend toutes les cellules.
        // Plus tard, ici sera implémentée la virtualisation (rendre seulement les cellules visibles).

        // Applique la transformation (zoom/pan) à tous les éléments du groupe 'zoomLayer'
        zoomLayer.attr("transform", currentTransform);

        // Liaison des données aux éléments rect
        const cells = zoomLayer.selectAll(".cell")
            .data(cellsData, d => d.id); // Utilise l'ID pour la clé de liaison des données

        // Entrée : ajout de nouvelles cellules
        const newCells = cells.enter()
            .append("g") // Crée un groupe pour chaque cellule (rect + text)
            .attr("class", "cell");

        newCells.append("rect")
            .attr("class", "cell-rect")
            .attr("width", INITIAL_CELL_WIDTH)
            .attr("height", INITIAL_CELL_HEIGHT)
            .attr("x", d => d.x * (INITIAL_CELL_WIDTH + CELL_PADDING)) // Position X basée sur les données
            .attr("y", d => d.y * (INITIAL_CELL_HEIGHT + CELL_PADDING)); // Position Y basée sur les données

        newCells.append("text")
            .attr("class", "cell-text")
            .attr("x", d => d.x * (INITIAL_CELL_WIDTH + CELL_PADDING) + INITIAL_CELL_WIDTH / 2)
            .attr("y", d => d.y * (INITIAL_CELL_HEIGHT + CELL_PADDING) + INITIAL_CELL_HEIGHT / 2)
            .text(d => `ID: ${d.id.split('_')[1]}`); // Affiche un ID simple

        // Mise à jour : mise à jour des cellules existantes (si les données changent)
        // (Pour l'instant, pas de mise à jour dynamique des positions/tailles après le rendu initial,
        //  mais c'est ici que la logique irait si les cellules pouvaient bouger.)
        cells.select(".cell-rect")
             .attr("width", INITIAL_CELL_WIDTH)
             .attr("height", INITIAL_CELL_HEIGHT);

        cells.select(".cell-text")
             .attr("x", d => d.x * (INITIAL_CELL_WIDTH + CELL_PADDING) + INITIAL_CELL_WIDTH / 2)
             .attr("y", d => d.y * (INITIAL_CELL_HEIGHT + CELL_PADDING) + INITIAL_CELL_HEIGHT / 2)
             .text(d => `ID: ${d.id.split('_')[1]}`); // Met à jour le texte si besoin

        // Suppression : suppression des cellules qui ne sont plus dans les données
        cells.exit().remove();

        // --- Logique d'interaction IA ou Conway (futur) ---
        // Ici, on pourrait ajouter des gestionnaires d'événements pour les cellules
        // ou des logiques de mise à jour basées sur Conway's Game of Life.
        newCells.on("click", function(event, d) {
            console.log("Cellule cliquée :", d);
            // Exemple : Demander à l'IA une réponse pour cette cellule
            askAIForCell(d);
        });
    }

    // --- Gestion du Zoom et Pan de D3 ---
    const zoomBehavior = d3.zoom()
        .scaleExtent([0.1, 10]) // Limites de zoom (0.1x à 10x)
        .on("zoom", (event) => {
            currentTransform = event.transform; // Met à jour la transformation actuelle
            renderCells(); // Redessine les cellules avec la nouvelle transformation
        });

    svg.call(zoomBehavior); // Applique le comportement de zoom à l'SVG

    // --- Chargement des données et initialisation ---
    fetch('database.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erreur HTTP! Statut: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            cellsData = data;
            console.log('Données de cellules chargées :', cellsData);
            renderCells(); // Rend les cellules initiales
        })
        .catch(error => {
            console.error('Erreur lors du chargement ou du traitement des données de cellules :', error);
            // Gérer l'erreur, afficher un message à l'utilisateur
        });

    // --- Fonction placeholder pour l'IA (à développer plus tard) ---
    function askAIForCell(cellData) {
        console.log(`Demande à l'IA pour la cellule ${cellData.id}: ${cellData.content}`);
        // Ici, vous feriez un appel à votre backend IA (ex: fetch('/api/ai/ask_cell', { method: 'POST', body: JSON.stringify(cellData) }))
        // et mettriez à jour l'UI avec la réponse.
        // Pour l'instant, une simple simulation :
        setTimeout(() => {
            const aiResponse = `L'IA analyse la cellule ${cellData.id}. Il semblerait que son contenu "${cellData.content.substring(0, 30)}..." soit très intéressant!`;
            alert(aiResponse); // Ou afficher dans un tooltip, une console, etc.
            // cellData.ai_response_cache = aiResponse; // Mettre à jour le cache
            // renderCells(); // Optionnel : si la réponse doit affecter le rendu
        }, 500);
    }

    // --- Fonctions futures pour Conway's Game of Life (exemple) ---
    function initializeConwayGrid() {
        // Convertir cellsData en une grille 2D pour Conway
        // Définir des états initiaux "vivant" ou "mort"
    }

    function runConwayStep() {
        // Appliquer les règles du Jeu de la Vie
        // Mettre à jour les états des cellules
        // renderCells(); // Re-rendre les cellules
    }

    // setInterval(runConwayStep, 1000); // Pour une simulation automatique
});