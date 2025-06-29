const express = require('express');
const { createClient } = require('@sanity/client');
const cors = require('cors');
require('dotenv').config(); // Pour charger les variables d'environnement depuis .env


const app = express();
const port = process.env.PORT || 3000;

// Configuration de CORS pour autoriser les requêtes depuis votre domaine React
app.use(cors({
    origin: 'http://localhost:5173', // Remplacez par l'URL de votre application React si différent
    methods: 'GET,POST,OPTIONS',
    allowedHeaders: 'Content-Type,Authorization',
}));

// Middleware pour parser le JSON des requêtes
app.use(express.json());

// Configuration du client Sanity (Groq)


// Route pour servir les fichiers statiques (HTML, CSS, JS)
app.use(express.static('public'));

// Route pour la FAQ (faq.html et script.js)
app.get('/faq', (req, res) => {
  res.sendFile(__dirname + '/public/faq.html');
});

// Route pour récupérer les données de la FAQ depuis Sanity
app.get('/api/faq', async (req, res) => {
    const query = `*[_type == "faq"]{
      question,
      answer,
      category
    }`;
    try {
        const faqs = await client.fetch(query);
        res.json(faqs);
    } catch (error) {
        console.error("Error fetching FAQ data:", error);
        res.status(500).json({ error: "Failed to fetch FAQ data" });
    }
});

// Route pour récupérer les prompts depuis Sanity
app.get('/api/intents', async (req, res) => {
  const query = `*[_type == "intentPrompt"]{
    intent,
    prompt
  }`;
  try {
    const intents = await client.fetch(query);
    res.json(intents);
  } catch (error) {
    console.error("Error fetching intent prompts:", error);
    res.status(500).json({ error: "Failed to fetch intent prompts" });
  }
});

// Route pour traiter une question et obtenir une réponse (simulée - à adapter pour Groq)
app.post('/api/groq', async (req, res) => {
    const { question, prompt } = req.body;

    // Validation de base
    if (!question || !prompt) {
        return res.status(400).json({ error: "Question and prompt are required" });
    }

    try {
      // Simuler une requête à l'API de Groq (à adapter avec la vraie requête)
      const groqResponse = await client.fetch(
        `*[_type == "faq" && question == $question]{answer}[0]`,
        { question }
      );

        if (groqResponse) {
          res.json({ response: groqResponse.answer });
        }
        else {
          res.json({ response: "Je suis désolé, je ne peux pas répondre à cette question pour le moment."});
        }

    } catch (error) {
        console.error("Error processing question with Groq:", error);
        res.status(500).json({ error: "Failed to process question" });
    }
});

// Démarrer le serveur
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
