const express = require('express');
const Groq = require('groq-sdk');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

// Load environment variables from .env file
require('dotenv').config();

// --- Server and AI Configuration ---
let config = {
  // Définir les ports ici, par exemple :
  mainPort: process.env.MAIN_PORT || 3000, // Pour l'API et le frontend
  adminPort: process.env.ADMIN_PORT || 3001, // Pour les logs et la configuration (ou une API admin séparée)
  groq: {
    apiKey: process.env.GROQ_API_KEY,
    model: 'llama3-8b-8192',
    temperature: 0.7,
    maxTokens: 2048,
  },
  ai: {
    role: "Un assistant IA expert en développement et en conseil technique.",
    context: "Fournir des réponses précises, concises et utiles sur des sujets de programmation, d'architecture logicielle et de technologies web. Votre logique métier est d'être un conseiller technique fiable.",
  },
  logFilePath: path.join(__dirname, 'logs.json')
};

// Validate Groq API Key
if (!config.groq.apiKey) {
  console.error("❌ Erreur: La clé API Groq (GROQ_API_KEY) n'est pas configurée dans les variables d'environnement.");
  process.exit(1);
}

// Initialisation de Groq SDK avec la config actuelle
let groq = new Groq({ apiKey: config.groq.apiKey });

// --- Data Storage (In-memory) ---
let interactions = new Map();

// --- Logging Setup ---
const writeLog = (logEntry) => {
  const timestamp = new Date().toISOString();
  const log = { timestamp, ...logEntry };

  fs.readFile(config.logFilePath, (err, data) => {
    let logs = [];
    if (!err) {
      try {
        logs = JSON.parse(data.toString());
      } catch (parseError) {
        console.error("❌ Erreur de parsing du fichier de log existant:", parseError.message);
        logs = [];
      }
    }
    logs.push(log);
    fs.writeFile(config.logFilePath, JSON.stringify(logs, null, 2), (writeErr) => {
      if (writeErr) {
        console.error("❌ Erreur lors de l'écriture du log dans le fichier:", writeErr.message);
      }
    });
  });
};

if (!fs.existsSync(config.logFilePath)) {
  fs.writeFileSync(config.logFilePath, JSON.stringify([]));
  console.log(`➡️ Fichier de log créé: ${config.logFilePath}`);
} else {
  fs.readFile(config.logFilePath, (err, data) => {
    if (!err) {
      try {
        JSON.parse(data.toString());
      } catch (parseError) {
        console.error(`⚠️ Fichier de log existant corrompu (${config.logFilePath}). Réinitialisation.`);
        fs.writeFileSync(config.logFilePath, JSON.stringify([]));
      }
    }
  });
}
console.log(`➡️ Les interactions seront loggées dans : ${config.logFilePath}`);

// --- Création de deux instances Express ---
const appMain = express(); // Pour le frontend et les API publiques
const appAdmin = express(); // Pour les API d'administration (logs, config)

// --- Middleware Setup pour les deux applications ---
appMain.use(cors());
appMain.use(express.json());

appAdmin.use(cors()); // Tu pourrais vouloir des règles CORS plus strictes pour l'admin
appAdmin.use(express.json());

// --- Static Files Serving (uniquement sur le port principal) ---
appMain.use(express.static(path.join(__dirname, 'docs')));
console.log(`➡️ Service des fichiers statiques depuis : ${path.join(__dirname, 'docs')} sur le port principal`);

// --- API Endpoints du serveur principal (appMain) ---

// Endpoint pour l'interaction AI
appMain.post('/generate', async (req, res) => {
  const userPrompt = req.body.prompt;
  if (!userPrompt) {
    writeLog({ type: 'AI_INTERACTION', status: 'FAILURE', reason: 'Missing prompt', userPrompt: userPrompt });
    return res.status(400).json({ error: "Le champ 'prompt' est manquant dans le corps de la requête." });
  }

  console.log(`\n➡️ Requête AI reçue sur le port principal pour le prompt: "${userPrompt.substring(0, Math.min(userPrompt.length, 50))}..."`);
  writeLog({ type: 'AI_INTERACTION', status: 'REQUESTED', userPrompt: userPrompt.substring(0, 200) + '...' });

  try {
    const systemMessage = `Vous êtes ${config.ai.role}. Votre rôle est de ${config.ai.context}.`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userPrompt },
      ],
      model: config.groq.model,
      temperature: config.groq.temperature,
      max_tokens: config.groq.maxTokens,
    });

    const aiResponse = chatCompletion.choices[0]?.message?.content;

    if (aiResponse) {
      const newInteraction = {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        userPrompt: userPrompt,
        aiResponse: aiResponse,
        modelUsed: config.groq.model,
        temperatureUsed: config.groq.temperature,
      };
      interactions.set(newInteraction.id, newInteraction);

      console.log("✅ Réponse de l'IA générée et interaction stockée avec succès.");
      writeLog({ type: 'AI_INTERACTION', status: 'SUCCESS', interactionId: newInteraction.id, userPrompt: newInteraction.userPrompt.substring(0, 200) + '...', aiResponse: newInteraction.aiResponse.substring(0, 200) + '...' });
      res.status(200).json({
        response: aiResponse,
        interactionId: newInteraction.id
      });
    } else {
      console.warn("⚠️ Groq n'a pas généré de contenu pour cette requête.");
      writeLog({ type: 'AI_INTERACTION', status: 'FAILURE', reason: 'No content from AI', userPrompt: userPrompt.substring(0, 200) + '...' });
      res.status(500).json({ error: "L'IA n'a pas pu générer de réponse." });
    }

  } catch (error) {
    console.error("❌ Erreur lors de l'appel à l'API Groq ou du stockage de l'interaction:", error);
    writeLog({ type: 'AI_INTERACTION', status: 'ERROR', errorMessage: error.message, stack: error.stack?.substring(0, 500) + '...' || 'N/A', userPrompt: userPrompt.substring(0, 200) + '...' });
    res.status(500).json({ error: "Une erreur interne est survenue lors de la communication avec l'IA ou le stockage des données." });
  }
});

// CRUD Endpoints for 'Interactions' (sur le port principal)
appMain.get('/api/interactions', (req, res) => {
    console.log(`\n➡️ Requête reçue sur le port principal: Lire toutes les interactions.`);
    const allInteractions = Array.from(interactions.values());
    writeLog({ type: 'CRUD_READ_ALL', status: 'SUCCESS', count: allInteractions.length });
    res.status(200).json(allInteractions);
});

appMain.get('/api/interactions/:id', (req, res) => {
    const { id } = req.params;
    console.log(`\n➡️ Requête reçue sur le port principal: Lire l'interaction avec l'ID ${id}.`);
    const interaction = interactions.get(id);
    if (interaction) {
        writeLog({ type: 'CRUD_READ_ONE', status: 'SUCCESS', interactionId: id });
        res.status(200).json(interaction);
    } else {
        writeLog({ type: 'CRUD_READ_ONE', status: 'NOT_FOUND', interactionId: id });
        res.status(404).json({ error: `Interaction avec l'ID ${id} non trouvée.` });
    }
});

appMain.put('/api/interactions/:id', (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    console.log(`\n➡️ Requête reçue sur le port principal: Mettre à jour l'interaction avec l'ID ${id}.`);
    const existingInteraction = interactions.get(id);
    if (existingInteraction) {
        const oldInteraction = { ...existingInteraction };
        const updatedInteraction = { ...existingInteraction, ...updates };
        interactions.set(id, updatedInteraction);
        writeLog({
            type: 'CRUD_UPDATE',
            status: 'SUCCESS',
            interactionId: id,
            oldData: { userPrompt: oldInteraction.userPrompt?.substring(0, 100) + '...' || 'N/A', aiResponse: oldInteraction.aiResponse?.substring(0, 100) + '...' || 'N/A' },
            newData: { userPrompt: updatedInteraction.userPrompt?.substring(0, 100) + '...' || 'N/A', aiResponse: updatedInteraction.aiResponse?.substring(0, 100) + '...' || 'N/A' }
        });
        res.status(200).json(updatedInteraction);
    } else {
        writeLog({ type: 'CRUD_UPDATE', status: 'NOT_FOUND', interactionId: id, updates: updates });
        res.status(404).json({ error: `Interaction avec l'ID ${id} non trouvée.` });
    }
});

appMain.delete('/api/interactions/:id', (req, res) => {
    const { id } = req.params;
    console.log(`\n➡️ Requête reçue sur le port principal: Supprimer l'interaction avec l'ID ${id}.`);
    const wasDeleted = interactions.delete(id);
    if (wasDeleted) {
        writeLog({ type: 'CRUD_DELETE', status: 'SUCCESS', interactionId: id });
        res.status(204).send();
    } else {
        writeLog({ type: 'CRUD_DELETE', status: 'NOT_FOUND', interactionId: id });
        res.status(404).json({ error: `Interaction avec l'ID ${id} non trouvée.` });
    }
});

appMain.delete('/api/interactions/clear-all', (req, res) => {
    console.log(`\n➡️ Requête reçue sur le port principal: Effacer toutes les interactions.`);
    const count = interactions.size;
    interactions.clear();
    writeLog({ type: 'CRUD_DELETE_ALL', status: 'SUCCESS', countCleared: count });
    res.status(200).json({ message: `Toutes les ${count} interactions ont été effacées.` });
});


// Configuration Endpoints (sur le port principal, pour les utilisateurs)
appMain.get('/api/config', (req, res) => {
    console.log(`\n➡️ Requête reçue sur le port principal: Lire la configuration AI.`);
    const currentConfig = {
        groq: {
            model: config.groq.model,
            temperature: config.groq.temperature,
            maxTokens: config.groq.maxTokens,
        },
        ai: config.ai
    };
    res.status(200).json(currentConfig);
});

// NOUVEAU: Les requêtes de modification de configuration et de lecture de logs sont déplacées vers le port admin
// appMain.post('/api/config', ...) sera déplacé vers appAdmin
// appMain.get('/api/logs', ...) sera déplacé vers appAdmin

// NOUVEAU: La liste des modèles Groq reste sur le port principal car elle est "publique"
appMain.get('/api/models', async (req, res) => {
    console.log(`\n➡️ Requête reçue sur le port principal: Lire la liste des modèles Groq.`);
    try {
        const models = await groq.models.list();
        const modelNames = models.data.map(model => model.id);
        writeLog({ type: 'MODELS_LIST_FETCH', status: 'SUCCESS', count: modelNames.length });
        res.status(200).json(modelNames);
    } catch (error) {
        console.error("❌ Erreur lors de la récupération de la liste des modèles Groq:", error);
        writeLog({ type: 'MODELS_LIST_FETCH', status: 'FAILURE', errorMessage: error.message });
        res.status(500).json({ error: "Impossible de récupérer la liste des modèles Groq." });
    }
});


// --- API Endpoints du serveur d'administration (appAdmin) ---
// Ces routes devraient être protégées par une authentification/autorisation en production !

appAdmin.post('/api/config', (req, res) => {
    const { model, temperature, maxTokens } = req.body;
    const oldConfig = { ...config.groq };

    if (model) config.groq.model = model;
    if (temperature !== undefined) config.groq.temperature = parseFloat(temperature);
    if (maxTokens !== undefined) config.groq.maxTokens = parseInt(maxTokens, 10);

    // Re-initialiser l'instance Groq SDK pour s'assurer que les changements de configuration sont pris en compte
    groq = new Groq({ apiKey: config.groq.apiKey });

    console.log(`\n➡️ Configuration AI mise à jour via le port admin.`);
    writeLog({
        type: 'CONFIG_UPDATE',
        status: 'SUCCESS',
        oldConfig: oldConfig,
        newConfig: config.groq
    });
    res.status(200).json({ message: "Configuration AI mise à jour avec succès.", newConfig: config.groq });
});

appAdmin.get('/api/logs', (req, res) => {
    console.log(`\n➡️ Requête reçue sur le port admin: Lire les logs.`);
    fs.readFile(config.logFilePath, (err, data) => {
        if (err) {
            console.error("❌ Erreur lors de la lecture du fichier de log:", err.message);
            writeLog({ type: 'LOG_READ', status: 'FAILURE', errorMessage: err.message });
            return res.status(500).json({ error: "Impossible de lire le fichier de log." });
        }
        try {
            const logs = JSON.parse(data.toString());
            writeLog({ type: 'LOG_READ', status: 'SUCCESS', count: logs.length });
            res.status(200).json(logs);
        } catch (parseError) {
            console.error("❌ Erreur de parsing du fichier de log:", parseError.message);
            writeLog({ type: 'LOG_READ', status: 'FAILURE', errorMessage: parseError.message });
            res.status(500).json({ error: "Fichier de log corrompu." });
        }
    });
});


// --- Server Initialization ---
appMain.listen(config.mainPort, () => {
  console.log(`\n🚀 Serveur Groq Express Principal démarré sur http://localhost:${config.mainPort}`);
  console.log(`Accédez au frontend via : http://localhost:${config.mainPort}/`);
  console.log(`\nPoints d'API (Port Principal - Public) :`);
  console.log(`  POST /generate                (Générer réponse IA)`);
  console.log(`  GET  /api/interactions        (Lire toutes les interactions)`);
  console.log(`  GET  /api/interactions/:id    (Lire une interaction par ID)`);
  console.log(`  PUT  /api/interactions/:id    (Mettre à jour une interaction)`);
  console.log(`  DELETE /api/interactions/:id (Supprimer une interaction)`);
  console.log(`  DELETE /api/interactions/clear-all (Effacer toutes les interactions)`);
  console.log(`  GET  /api/config              (Lire la configuration AI)`);
  console.log(`  GET  /api/models              (Lire la liste des modèles Groq)`);
});

appAdmin.listen(config.adminPort, () => {
    console.log(`\n🔒 Serveur Groq Express Admin démarré sur http://localhost:${config.adminPort}`);
    console.log(`\nPoints d'API (Port Admin - Privé/Protégé) :`);
    console.log(`  POST /api/config             (Mettre à jour la configuration AI)`);
    console.log(`  GET  /api/logs                (Lire tous les logs)`);
    console.log(`\nClé API Groq chargée: ${config.groq.apiKey ? 'Oui' : 'Non (vérifier votre .env)'}`);
});