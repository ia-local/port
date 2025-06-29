require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const Groq = require('groq-sdk');
const { JSDOM } = require('jsdom');
const path = require('path'); // Importez le module path

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const app = express();
const port = 3001;

app.use(bodyParser.json());
// Utilisez express.static pour servir les fichiers statiques (CSS, JS, HTML)
app.use(express.static(path.join(__dirname, 'public')));

// Route pour servir index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


// Configuration des prompts système
const systemPrompt = `Vous êtes un assistant expert en création d'applications SVG interactives avec des fonctionnalités CRUD et une intégration d'IA.  Fournissez des réponses concises et précises, formattées en HTML, en utilisant des styles CSS pour mettre en évidence les informations importantes.`;

/**
 * Génère une réponse en utilisant le modèle de langage Groq.
 * @param {string} query - La requête de l'utilisateur.
 * @param {object} cellData - Les données de la cellule SVG (id, contenu, etc.).
 * @returns {Promise<string>} La réponse générée par le modèle.
 */
async function generateResponse(query, cellData) {
    try {
        const messages = [
            { role: 'system', content: systemPrompt },
            {
                role: 'user',
                content: `${query}. Données de la cellule (pour contexte): ${JSON.stringify(
                    cellData
                )}`,
            },
        ];

        const chatCompletion = await groq.chat.completions.create({
            messages: messages,
            model: 'gemma2-9b-it',
            temperature: 0.7,
            max_tokens: 4096,
            top_p: 1,
            stream: false,
        });
        const response = chatCompletion.choices[0]?.message?.content || "Je n'ai pas compris.";

        // Utilisation de JSDOM pour traiter la réponse HTML
        const dom = new JSDOM(response);
        const document = dom.window.document;

        // Récupérer le HTML traité
        const processedResponse = document.body.innerHTML;

        return processedResponse;

    } catch (error) {
        console.error('Erreur Groq :', error);
        return 'Erreur de communication avec l\'IA.';
    }
}

// Route pour gérer les requêtes de l'IA concernant les cellules SVG
app.post('/groq', async (req, res) => {
    const { query, cellData } = req.body;

    if (!query) {
        return res.status(400).json({ error: 'La requête est obligatoire.' });
    }

    const response = await generateResponse(query, cellData);
    res.json({ result: response });
});

app.listen(port, () => console.log(`Server running on port http://localhost:${port}`));
