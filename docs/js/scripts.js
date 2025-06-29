document.addEventListener('DOMContentLoaded', () => {
    // Détecte le port actuel pour le serveur principal
    const currentPort = window.location.port || (window.location.protocol === 'https:' ? '443' : '80');
    // Détermine le port principal (où est servi le frontend et les API principales)
    // Et le port admin (où sont les API admin)
    const MAIN_PORT = currentPort;
    const ADMIN_PORT = '3001'; // Port par défaut pour l'admin, tu dois t'assurer qu'il correspond à celui de ton server.js

    // Mise à jour de l'affichage du port admin et du lien
    const adminPortDisplay = document.getElementById('adminPortDisplay');
    const adminLink = document.getElementById('adminLink');
    if (adminPortDisplay) adminPortDisplay.textContent = ADMIN_PORT;
    if (adminLink) {
        // Supposons que l'API admin n'a pas de frontend, le lien pointe vers une de ses routes (ex: /api/logs)
        adminLink.href = `${window.location.protocol}//${window.location.hostname}:${ADMIN_PORT}/api/logs`;
    }


    const promptInput = document.getElementById('promptInput');
    const sendPromptButton = document.getElementById('sendPromptButton');
    const aiResponseDiv = document.getElementById('aiResponse');
    const loadInteractionsButton = document.getElementById('loadInteractions');
    const interactionsList = document.getElementById('interactionsList');
    const loadLogsButton = document.getElementById('loadLogsButton');
    const logsDisplay = document.getElementById('logsDisplay');
    const modelSelect = document.getElementById('modelSelect');
    const updateModelButton = document.getElementById('updateModelButton');
    const currentModelDisplay = document.getElementById('currentModelDisplay');

    // --- Fonctions d'interaction avec l'API Principale ---

    // Envoyer un prompt à l'IA
    sendPromptButton.addEventListener('click', async () => {
        const prompt = promptInput.value.trim();
        if (!prompt) {
            alert("Veuillez entrer un prompt.");
            return;
        }

        aiResponseDiv.textContent = "Génération de la réponse...";
        try {
            const response = await fetch(`http://${window.location.hostname}:${MAIN_PORT}/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt: prompt }),
            });
            const data = await response.json();
            if (response.ok) {
                aiResponseDiv.textContent = data.response;
                promptInput.value = ''; // Efface le champ après envoi
                loadAllInteractions(); // Recharge la liste des interactions
            } else {
                aiResponseDiv.textContent = `Erreur: ${data.error || 'Une erreur est survenue.'}`;
            }
        } catch (error) {
            console.error('Erreur lors de la requête de génération:', error);
            aiResponseDiv.textContent = 'Erreur de connexion au serveur.';
        }
    });

    // Charger toutes les interactions
    async function loadAllInteractions() {
        interactionsList.innerHTML = '<li>Chargement des interactions...</li>';
        try {
            const response = await fetch(`http://${window.location.hostname}:${MAIN_PORT}/api/interactions`);
            const data = await response.json();
            if (response.ok) {
                interactionsList.innerHTML = ''; // Vide la liste
                if (data.length === 0) {
                    interactionsList.innerHTML = '<li>Aucune interaction enregistrée pour le moment.</li>';
                } else {
                    data.forEach(interaction => {
                        const li = document.createElement('li');
                        li.innerHTML = `<strong>Prompt:</strong> ${interaction.userPrompt.substring(0, 100)}...<br><strong>Réponse:</strong> ${interaction.aiResponse.substring(0, 100)}... <br><em>ID: ${interaction.id.substring(0, 8)}...</em>`;
                        interactionsList.appendChild(li);
                    });
                }
            } else {
                interactionsList.innerHTML = `<li>Erreur lors du chargement: ${data.error || 'Une erreur est survenue.'}</li>`;
            }
        } catch (error) {
            console.error('Erreur lors du chargement des interactions:', error);
            interactionsList.innerHTML = '<li>Erreur de connexion au serveur.</li>';
        }
    }

    loadInteractionsButton.addEventListener('click', loadAllInteractions);
    // Charger les interactions au démarrage
    loadAllInteractions();


    // Charger la liste des modèles Groq
    async function loadGroqModels() {
        modelSelect.innerHTML = '<option value="">Chargement des modèles...</option>';
        try {
            const response = await fetch(`http://${window.location.hostname}:${MAIN_PORT}/api/models`);
            const models = await response.json();
            if (response.ok) {
                modelSelect.innerHTML = '<option value="">-- Sélectionner un modèle --</option>';
                models.forEach(model => {
                    const option = document.createElement('option');
                    option.value = model;
                    option.textContent = model;
                    modelSelect.appendChild(option);
                });
                // Après le chargement des modèles, on récupère la config actuelle pour pré-sélectionner
                loadCurrentConfig();
            } else {
                console.error('Erreur lors du chargement des modèles:', models.error || 'Une erreur est survenue.');
                modelSelect.innerHTML = '<option value="">Erreur de chargement des modèles</option>';
            }
        } catch (error) {
            console.error('Erreur de connexion pour les modèles:', error);
            modelSelect.innerHTML = '<option value="">Erreur de connexion</option>';
        }
    }

    // Charger la configuration actuelle (pour le modèle sélectionné)
    async function loadCurrentConfig() {
        try {
            const response = await fetch(`http://${window.location.hostname}:${MAIN_PORT}/api/config`);
            const configData = await response.json();
            if (response.ok && configData.groq && configData.groq.model) {
                modelSelect.value = configData.groq.model;
                currentModelDisplay.textContent = `Modèle actuel: ${configData.groq.model}`;
            } else {
                currentModelDisplay.textContent = `Modèle actuel: Non disponible`;
                console.warn('Impossible de récupérer la configuration actuelle.');
            }
        } catch (error) {
            console.error('Erreur lors du chargement de la configuration actuelle:', error);
            currentModelDisplay.textContent = `Modèle actuel: Erreur de chargement`;
        }
    }

    // Mettre à jour le modèle via l'API principale (POST /api/config)
    updateModelButton.addEventListener('click', async () => {
        const selectedModel = modelSelect.value;
        if (!selectedModel) {
            alert('Veuillez sélectionner un modèle.');
            return;
        }

        try {
            const response = await fetch(`http://${window.location.hostname}:${MAIN_PORT}/api/config`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ model: selectedModel }),
            });
            const data = await response.json();
            if (response.ok) {
                alert(`Modèle mis à jour avec succès : ${data.newConfig.model}`);
                loadCurrentConfig(); // Recharge pour afficher le nouveau modèle
            } else {
                alert(`Erreur lors de la mise à jour du modèle: ${data.error || 'Une erreur est survenue.'}`);
            }
        } catch (error) {
            console.error('Erreur lors de la requête de mise à jour du modèle:', error);
            alert('Erreur de connexion au serveur.');
        }
    });


    // --- Fonctions d'interaction avec l'API d'Administration (Port Séparé) ---

    // Charger les logs depuis le port admin
    loadLogsButton.addEventListener('click', async () => {
        logsDisplay.textContent = "Chargement des logs...";
        try {
            // Requête vers l'API sur le port ADMIN_PORT
            const response = await fetch(`http://${window.location.hostname}:${ADMIN_PORT}/api/logs`);
            const data = await response.json();
            if (response.ok) {
                logsDisplay.textContent = JSON.stringify(data, null, 2);
            } else {
                logsDisplay.textContent = `Erreur: ${data.error || 'Une erreur est survenue.'}`;
                console.error('Erreur lors du chargement des logs:', data);
            }
        } catch (error) {
            console.error('Erreur lors de la requête de logs:', error);
            logsDisplay.textContent = `Erreur de connexion au serveur admin sur le port ${ADMIN_PORT}. Veuillez vérifier que le serveur admin est en cours d'exécution et que le pare-feu autorise l'accès.`;
        }
    });

    // Initialiser le chargement des modèles et de la configuration au démarrage
    loadGroqModels();
});