document.addEventListener('DOMContentLoaded', () => {
    console.log('Démarrage du framework SVG & IA.');

    // --- Constantes et configurations ---
    const PHI = (1 + Math.sqrt(5)) / 2;
    const INITIAL_CELL_WIDTH = 100;
    const INITIAL_CELL_HEIGHT = INITIAL_CELL_WIDTH / PHI;
    const CELL_PADDING = 5;

    // --- Sélection des éléments du DOM ---
    const svg = d3.select("#main-svg");
    const svgContainer = d3.select("#svg-container");

    // Sélection des éléments de contrôle CRUD
    const cellIdInput = document.getElementById('cell-id');
    const cellContentInput = document.getElementById('cell-content');
     const cellXInput = document.getElementById('cell-x');
    const cellYInput = document.getElementById('cell-y');
    const createCellButton = document.getElementById('create-cell');
    const readCellButton = document.getElementById('read-cell');
    const updateCellButton = document.getElementById('update-cell');
    const deleteCellButton = document.getElementById('delete-cell');
    const listCellsButton = document.getElementById('list-cells');

    // Sélection des éléments de contrôle IA
    const aiResponseDiv = document.getElementById('ai-response');

    let currentTransform = d3.zoomIdentity;
    let cellsData = [];
    let selectedCellId = null; // Track the selected cell

    const zoomLayer = svg.append("g").attr("class", "zoom-layer");

    // --- Fonctions de gestion des données (CRUD) ---
    function createCell(id, x, y, content) {
        const newCell = {
            id: id,
            x: x,
            y: y,
            content: content,
            width: INITIAL_CELL_WIDTH,
            height: INITIAL_CELL_HEIGHT,
        };
        cellsData.push(newCell);
        saveData();
        renderCells();
        console.log(`Cellule "${id}" créée.`);
    }

    function readCell(id) {
        const cell = cellsData.find(c => c.id === id);
        if (cell) {
            console.log('Cellule trouvée :', cell);
            updateInputFields(cell); // Update input fields.
            return cell;
        } else {
            console.log(`Cellule "${id}" non trouvée.`);
            alert(`Cellule "${id}" non trouvée.`);
            return null;
        }
    }

    function updateCell(id, newContent, newX, newY) {
       const cell = cellsData.find(c => c.id === id);
        if (cell) {
            cell.content = newContent;
            cell.x = newX;
            cell.y = newY;
            saveData();
            renderCells();
            console.log(`Cellule "${id}" mise à jour.`);
        } else {
            console.log(`Cellule "${id}" non trouvée.`);
            alert(`Cellule "${id}" non trouvée.`);
        }
    }

    function deleteCell(id) {
        const index = cellsData.findIndex(c => c.id === id);
        if (index !== -1) {
            cellsData.splice(index, 1);
            saveData();
            renderCells();
            console.log(`Cellule "${id}" supprimée.`);
        } else {
            console.log(`Cellule "${id}" non trouvée.`);
            alert(`Cellule "${id}" non trouvée.`);
        }
    }

    function listCells() {
        console.log('Liste des cellules :', cellsData);
        alert(JSON.stringify(cellsData, null, 2));
        return cellsData;
    }

    // --- Persistance des données (data.json) ---
    function saveData() {
        localStorage.setItem('cellsData', JSON.stringify(cellsData));
        console.log('Données sauvegardées :', cellsData);
    }

    function loadData() {
        const savedData = localStorage.getItem('cellsData');
        if (savedData) {
            cellsData = JSON.parse(savedData);
            console.log('Données chargées :', cellsData);
        } else {
           console.log('Aucune donnée sauvegardée trouvée. Initialisation avec des données par défaut.');
            cellsData = [
                { id: 'cell_1', x: 0, y: 0, content: 'Cellule 1' },
                { id: 'cell_2', x: 1, y: 0, content: 'Cellule 2' },
                { id: 'cell_3', x: 0, y: 1, content: 'Cellule 3' },
            ];
            saveData();
        }
    }

    // --- Fonction de rendu des cellules ---
    function renderCells() {
        zoomLayer.attr("transform", currentTransform);

        const cells = zoomLayer.selectAll(".cell")
            .data(cellsData, d => d.id);

        // Entrée
        const newCells = cells.enter()
            .append("g")
            .attr("class", "cell")
            .on("click", handleCellClick); // Attach click handler here

        newCells.append("rect")
            .attr("class", "cell-rect")
            .attr("width", d => d.width)
            .attr("height", d => d.height)
            .attr("x", d => d.x * (INITIAL_CELL_WIDTH + CELL_PADDING))
            .attr("y", d => d.y * (INITIAL_CELL_HEIGHT + CELL_PADDING));

        newCells.append("text")
            .attr("class", "cell-text")
            .attr("x", d => d.x * (INITIAL_CELL_WIDTH + CELL_PADDING) + d.width / 2)
            .attr("y", d => d.y * (INITIAL_CELL_HEIGHT + CELL_PADDING) + d.height / 2)
            .text(d => d.content);

        // Mise à jour
        cells.select(".cell-rect")
            .attr("width", d => d.width)
            .attr("height", d => d.height)
            .attr("x", d => d.x * (INITIAL_CELL_WIDTH + CELL_PADDING))
            .attr("y", d => d.y * (INITIAL_CELL_HEIGHT + CELL_PADDING));

        cells.select(".cell-text")
            .attr("x", d => d.x * (INITIAL_CELL_WIDTH + CELL_PADDING) + d.width / 2)
            .attr("y", d => d.y * (INITIAL_CELL_HEIGHT + CELL_PADDING) + d.height / 2)
            .text(d => d.content);

        // Suppression
        cells.exit().remove();
    }

    // --- Gestion du Zoom et Pan de D3 ---
    const zoomBehavior = d3.zoom()
        .scaleExtent([0.1, 10])
        .on("zoom", (event) => {
            currentTransform = event.transform;
            renderCells();
        });

    svg.call(zoomBehavior);

    // --- Gestion des événements ---
    loadData();

    createCellButton.addEventListener('click', () => {
        const id = cellIdInput.value;
        const content = cellContentInput.value;
         const x = parseInt(cellXInput.value);
        const y = parseInt(cellYInput.value);
        if (id && content) {
            createCell(id, x, y, content);
            clearInputFields();
        } else {
            alert('Veuillez entrer un ID et un contenu pour la cellule.');
        }
    });

    readCellButton.addEventListener('click', () => {
        const id = cellIdInput.value;
         if(id){
          readCell(id);
        }
        else{
            alert('Veuillez entrer l\'ID de la cellule à lire');
        }
    });

    updateCellButton.addEventListener('click', () => {
        const id = cellIdInput.value;
        const content = cellContentInput.value;
         const x = parseInt(cellXInput.value);
        const y = parseInt(cellYInput.value);
        if (id && content) {
            updateCell(id, content, x, y);
            clearInputFields();
        } else {
            alert('Veuillez entrer l\'ID et le nouveau contenu de la cellule.');
        }
    });

    deleteCellButton.addEventListener('click', () => {
        const id = cellIdInput.value;
        if(id){
             deleteCell(id);
             clearInputFields();
        }
        else{
             alert('Veuillez entrer l\'ID de la cellule à supprimer.');
        }

    });

    listCellsButton.addEventListener('click', () => {
        listCells();
    });

    function clearInputFields() {
        cellIdInput.value = '';
        cellContentInput.value = '';
        cellXInput.value = '0';
        cellYInput.value = '0';
    }

    function handleCellClick(event, cellData) {
        console.log("Cellule cliquée :", cellData);
        selectedCellId = cellData.id; // Track the selected cell
        updateInputFields(cellData);  // Update fields with cell data
        askAIForCell(cellData); // Send cell data to AI
    }

     function updateInputFields(cell) {
        cellIdInput.value = cell.id;
        cellContentInput.value = cell.content;
        cellXInput.value = cell.x;
        cellYInput.value = cell.y;
    }

    // --- Fonction pour l'IA (à développer plus tard) ---
    function askAIForCell(cellData) {
        console.log(`Demande à l'IA pour la cellule ${cellData.id}: ${cellData.content}`);
        fetch('/groq', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: `Décris et analyse la cellule avec l'ID ${cellData.id} et le contenu suivant : ${cellData.content}.  Fournis aussi les coordonnées X: ${cellData.x}, Y: ${cellData.y}`,
                cellData: cellData, // Envoyer les données de la cellule
            }),
        })
        .then(response => response.json())
        .then(data => {
            console.log('Réponse de Groq :', data);
            aiResponseDiv.textContent = data.result || 'Aucune réponse de l\'IA.';
            updateCellContent(cellData.id, data.result); // Mettre à jour le contenu de la cellule
        })
        .catch(error => {
            console.error('Erreur lors de l\'appel à l\'API Groq :', error);
            aiResponseDiv.textContent = 'Erreur lors de la communication avec l\'IA.';
        });
    }

    function updateCellContent(cellId, newContent) {
        const cell = cellsData.find(c => c.id === cellId);
        if (cell) {
            cell.content = newContent; // Mettre à jour le contenu
            saveData();
            renderCells(); // Re-render to show the change
            console.log(`Contenu de la cellule ${cellId} mis à jour avec : ${newContent}`);
        } else {
            console.warn(`Cellule avec l'ID ${cellId} non trouvée lors de la mise à jour du contenu.`);
        }
    }

    renderCells();
});
