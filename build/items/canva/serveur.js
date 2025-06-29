// groq-server.js
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs'); // Keep if needed for file operations, otherwise can remove
const path = require('path');
const Groq = require('groq-sdk');
const { JSDOM } = require('jsdom');
const cors = require('cors'); // Importez le module cors
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const app = express();
const port = 5008;

app.use(cors()); // Ajoutez ce middleware pour activer CORS
app.use(bodyParser.json());
app.use(express.static('public/'));

// Route racine pour servir index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Configuration des prompts système pour chaque contexte d'agent
const systemPrompts = {
    backend: `Vous êtes un assistant expert en développement backend. Fournissez des solutions de codage concises et précises pour le backend. Tenez compte du routage de l'application: '/' pour la page principale du tutoriel, '/canvas.html' pour l'application de dessin interactive, '/fram.html' pour les rapports IA, '/chat/:context' pour les interactions avec les agents IA, et '/cli-command' pour les commandes de ligne de commande. Vos réponses doivent être rédigées au format HTML, en respectant les normes du Web sémantique W3C. Identifiez les mots clés importants et mettez-les en évidence avec des styles CSS personnalisés (couleurs, gras, italique, etc.). Utilisez votre propre jugement pour déterminer l'importance des mots clés et choisissez les styles appropriés.`,
    frontend: `Vous êtes un assistant expert en développement frontend. Fournissez des solutions de codage concises et précises pour le frontend. Tenez compte du routage de l'application: '/' pour la page principale du tutoriel, '/canvas.html' pour l'application de dessin interactive, '/fram.html' pour les rapports IA, '/chat/:context' pour les interactions avec les agents IA, et '/cli-command' pour les commandes de ligne de commande. Vos réponses doivent être rédigées au format HTML, en respectant les normes du Web sémantique W3C. Identifiez les mots clés importants et mettez-les en évidence avec des styles CSS personnalisés (couleurs, gras, italique, etc.). Utilisez votre propre jugement pour déterminer l'importance des mots clés et choisissez les styles appropriés.`,
    api_rest: `Vous êtes un assistant expert en conception et développement d'API REST. Fournissez des solutions pour créer des API RESTful robustes et efficaces. Tenez compte du routage de l'application: '/' pour la page principale du tutoriel, '/canvas.html' pour l'application de dessin interactive, '/fram.html' pour les rapports IA, '/chat/:context' pour les interactions avec les agents IA, et '/cli-command' pour les commandes de ligne de commande. Vos réponses doivent être rédigées au format HTML, en respectant les normes du Web sémantique W3C. Incluez des exemples de code, des structures de données et des meilleures pratiques. Identifiez les mots clés importants et mettez-les en évidence avec des styles CSS personnalisés (couleurs, gras, italique, etc.). Utilisez votre propre jugement pour déterminer l'importance des mots clés et choisissez les styles appropriés.`,
    cli_command: `Vous êtes un assistant expert en ligne de commande et en gestion de projet. Votre tâche est de générer des commandes shell (pour Linux/macOS), des idées ou des explications basées sur des requêtes. Tenez compte de la structure du projet: '/mon-projet-canva-ia/' avec 'src/' (sources) et 'public/' (build). Les réponses doivent être au format HTML, en respectant les normes du Web sémantique W3C. Mettez en évidence les mots clés importants avec des styles CSS personnalisés.`
};

/**
 * Génère une réponse en utilisant le modèle de langage Groq.
 * @param {string} model - Le nom du modèle à utiliser (par exemple, 'gemma2-9b-it').
 * @param {Array} messages - Le tableau de messages à envoyer à l'API.
 * @returns {Promise<string>} La réponse générée par le modèle, ou un message d'erreur.
 */
async function generateResponse(model, messages) {
    try {
        const chatCompletion = await groq.chat.completions.create({
            messages,
            model: model, // Utilisation du modèle passé en paramètre
            temperature: 0.7,
            max_tokens: 4096,
            top_p: 1,
            stream: false
        });
        let response = chatCompletion.choices[0]?.message?.content || "Je n'ai pas compris.";

        // Utilisation de JSDOM pour traiter la réponse HTML
        const dom = new JSDOM(response);
        const document = dom.window.document;

        // Récupérer le HTML traité (ici, on renvoie simplement le contenu du body)
        response = document.body.innerHTML;

        return response;
    } catch (error) {
        console.error('Erreur Groq :', error);
        return 'Erreur de communication avec l\'IA.';
    }
}

// Route générique pour gérer les requêtes de chat des différents agents
app.post('/chat/:context', async (req, res) => {
    const context = req.params.context;
    const message = req.body.message;

    // Vérifier si le contexte est valide
    if (!systemPrompts[context]) {
        return res.status(400).json({ error: 'Contexte de chat invalide.' });
    }

    let messages = [
        { role: 'system', content: systemPrompts[context] },
        { role: 'user', content: message }
    ];
    
    const response = await generateResponse('gemma2-9b-it', messages); 
    res.json({ response });
});

// Nouvelle route POST pour les commandes CLI génériques
app.post('/cli-command', async (req, res) => {
    const { command, args } = req.body;
    
    if (!command) {
        return res.status(400).json({ error: 'La commande CLI est requise.' });
    }

    const prompt = `Génère une réponse ou des commandes shell pour la commande CLI suivante : "${command}" avec les arguments : "${args || 'aucun'}" en tenant compte de la structure du projet.`;

    let messages = [
        { role: 'system', content: systemPrompts['cli_command'] },
        { role: 'user', content: prompt }
    ];

    const response = await generateResponse('gemma2-9b-it', messages);
    res.json({ response });
});

// Routes spécifiques pour les opérations CRUD, utilisant l'agent CLI
app.post('/create', async (req, res) => {
    const { message } = req.body;
    if (!message) {
        return res.status(400).json({ error: 'Un message est requis pour la création.' });
    }
    const prompt = `Crée : ${message}`;
    const response = await generateResponse('gemma2-9b-it', [
        { role: 'system', content: systemPrompts['cli_command'] },
        { role: 'user', content: prompt }
    ]);
    res.json({ response });
});

app.post('/rename', async (req, res) => {
    const { message } = req.body;
    if (!message) {
        return res.status(400).json({ error: 'Un message est requis pour le renommage.' });
    }
    const prompt = `Renomme : ${message}`;
    const response = await generateResponse('gemma2-9b-it', [
        { role: 'system', content: systemPrompts['cli_command'] },
        { role: 'user', content: prompt }
    ]);
    res.json({ response });
});

app.post('/update', async (req, res) => {
    const { message } = req.body;
    if (!message) {
        return res.status(400).json({ error: 'Un message est requis pour la mise à jour.' });
    }
    const prompt = `Mets à jour : ${message}`;
    const response = await generateResponse('gemma2-9b-it', [
        { role: 'system', content: systemPrompts['cli_command'] },
        { role: 'user', content: prompt }
    ]);
    res.json({ response });
});

app.post('/delete', async (req, res) => {
    const { message } = req.body;
    if (!message) {
        return res.status(400).json({ error: 'Un message est requis pour la suppression.' });
    }
    const prompt = `Supprime : ${message}`;
    const response = await generateResponse('gemma2-9b-it', [
        { role: 'system', content: systemPrompts['cli_command'] },
        { role: 'user', content: prompt }
    ]);
    res.json({ response });
});


// Démarrage du serveur
app.listen(port, () => console.log(`Server running on port http://localhost:${port}`));
