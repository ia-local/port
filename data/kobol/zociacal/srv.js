// groq-serveur.js
require('dotenv').config(); // Charge les variables d'environnement du fichier .env
const express = require('express');
const Groq = require('groq-sdk');
const cors = require('cors'); // Pour gérer les requêtes cross-origin
const path = require('path'); // Module Node.js pour travailler avec les chemins de fichiers

const app = express();
const port = process.env.PORT || 3000; // Le port sur lequel le serveur écoutera

// Initialisation du client Groq avec la clé API de l'environnement
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Middleware pour parser le JSON des requêtes
app.use(express.json());

// Middleware CORS pour permettre à votre frontend de communiquer avec ce serveur
// En développement, '*' est acceptable. En production, remplacez par l'URL de votre frontend.
app.use(cors({
    origin: '*', // Permet toutes les origines. Pour la production, remplacez par l'URL de votre frontend (ex: 'https://votre-domaine.com')
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Servir les fichiers statiques depuis le répertoire 'public'
// Cela signifie que 'index.html' sera accessible via http://localhost:3000/
app.use(express.static(path.join(__dirname, 'public')));
console.log(`Servir les fichiers statiques depuis: ${path.join(__dirname, 'public')}`);


// Données Zodiacales (doivent être les mêmes que dans votre frontend ou être chargées depuis une base de données)
const zodiacData = [
    { name: "Capricorne", symbol: "♑︎", dates: { start: "12-22", end: "01-19" }, traits: "Discipliné, responsable, pratique, ambitieux, patient, pessimiste, rigide, rancunier." },
    { name: "Verseau", symbol: "♒︎", dates: { start: "01-20", end: "02-18" }, traits: "Original, indépendant, humanitaire, intellectuel, excentrique, distant, imprévisible." },
    { name: "Poissons", symbol: "♓︎", dates: { start: "02-19", end: "03-20" }, traits: "Compatissant, artistique, intuitif, doux, sage, craintif, trop confiant, triste, désireux d'échapper à la réalité." },
    { name: "Bélier", symbol: "♈︎", dates: { start: "03-21", end: "04-19" }, traits: "Courageux, déterminé, confiant, enthousiaste, optimiste, honnête, passionné, impatient, colérique, impulsif, agressif." },
    { name: "Taureau", symbol: "♉︎", dates: { start: "04-20", end: "05-20" }, traits: "Fiable, patient, pratique, dévoué, responsable, stable, inflexible, têtu, possessif, intransigeant." },
    { name: "Gémeaux", symbol: "♊︎", dates: { start: "05-21", end: "06-20" }, traits: "Doux, affectueux, curieux, adaptable, rapide à apprendre, nerveux, indécis, inconsistant." },
    { name: "Cancer", symbol: "♋︎", dates: { start: "06-21", end: "07-22" }, traits: "Tenace, très imaginatif, loyal, émotif, sympathique, persuasif, maussade, pessimiste, méfiant, manipulateur, insécure." },
    { name: "Lion", symbol: "♌︎", dates: { start: "07-23", end: "08-22" }, traits: "Créatif, passionné, généreux, chaleureux, joyeux, humoristique, arrogant, têtu, égocentrique, paresseux, inflexible." },
    { name: "Vierge", symbol: "♍︎", dates: { start: "08-23", end: "09-22" }, traits: "Loyal, analytique, gentil, travailleur, pratique, timide, inquiet, trop critique d'eux-mêmes et des autres." },
    { name: "Balance", symbol: "♎︎", dates: { start: "09-23", end: "10-22" }, traits: "Coopératif, juste, social, diplomate, gracieux, équitable, indécis, évite la confrontation, se plaint, apitoiement." },
    { name: "Scorpion", symbol: "♏︎", dates: { start: "10-23", end: "11-21" }, traits: "Ingénieux, courageux, passionné, têtu, véritable ami, jaloux, secret, violent, méfiant." },
    { name: "Sagittaire", symbol: "♐︎", dates: { start: "11-22", end: "12-21" }, traits: "Généreux, idéaliste, grand sens de l'humour, promet plus qu'il ne peut tenir, très impatient, dira n'importe quoi, peu importe à quel point ce n'est pas diplomatique." }
];

// Point de terminaison pour obtenir l'horoscope d'un signe spécifique
// (Peut être utilisé si vous décidez de générer les horoscopes un par un côté client)
app.post('/horoscope/:signName', async (req, res) => {
    const signNameParam = req.params.signName;
    const { horoscopeDate } = req.body; // Récupère la date envoyée par le frontend

    const sign = zodiacData.find(s => s.name.toLowerCase() === signNameParam.toLowerCase());

    if (!sign) {
        return res.status(404).json({ error: 'Signe astrologique non trouvé.' });
    }

    if (!horoscopeDate) {
        return res.status(400).json({ error: 'Date de l\'horoscope manquante.' });
    }

    try {
        const formattedDate = new Date(horoscopeDate).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
        const prompt = `Génère un horoscope quotidien pour le ${formattedDate} pour le signe astrologique ${sign.name} en tenant compte de ses traits de caractère principaux: ${sign.traits}. Le ton doit être inspirant et positif, sans être trop générique. Donne des conseils pour la journée.`;

        console.log(`Requête Groq pour ${sign.name}:`, prompt);

        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "gemma2-9b-it",
            temperature: 0.7,
            max_tokens: 300
        });

        const horoscopeText = chatCompletion.choices[0]?.message?.content || "Horoscope non disponible.";
        res.json({ sign: sign.name, horoscope: horoscopeText });

    } catch (error) {
        console.error(`Erreur lors de la génération de l'horoscope pour ${sign.name}:`, error);
        res.status(500).json({ error: `Erreur interne du serveur lors de la génération de l'horoscope pour ${sign.name}.` });
    }
});

// Point de terminaison pour obtenir tous les horoscopes en une seule requête
app.post('/horoscopes-all', async (req, res) => {
    const { horoscopeDate } = req.body;

    if (!horoscopeDate) {
        return res.status(400).json({ error: 'Date de l\'horoscope manquante.' });
    }

    const formattedDate = new Date(horoscopeDate).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
    const allHoroscopes = [];

    // Utilisation de Promise.allSettled pour gérer les promesses individuelles
    // et s'assurer que même si certaines échouent, le processus global continue
    const results = await Promise.allSettled(zodiacData.map(async (sign) => {
        try {
            const prompt = `Génère un horoscope quotidien pour le ${formattedDate} pour le signe astrologique ${sign.name} en tenant compte de ses traits de caractère principaux: ${sign.traits}. Le ton doit être inspirant et positif, sans être trop générique. Donne des conseils pour la journée.`;

            console.log(`Requête Groq pour ${sign.name} (batch):`, prompt);

            const chatCompletion = await groq.chat.completions.create({
                messages: [{ role: "user", content: prompt }],
                model: "gemma2-9b-it",
                temperature: 0.7,
                max_tokens: 300
            });

            const horoscopeText = chatCompletion.choices[0]?.message?.content || "Horoscope non disponible.";
            return { sign: sign.name, horoscope: horoscopeText, symbol: sign.symbol, status: 'fulfilled' };

        } catch (error) {
            console.error(`Erreur lors de la génération de l'horoscope pour ${sign.name} (batch):`, error);
            return { sign: sign.name, horoscope: `Erreur: ${error.message || 'Problème de génération.'}`, symbol: sign.symbol, status: 'rejected' };
        }
    }));

    // Collecte des résultats
    results.forEach(result => {
        if (result.status === 'fulfilled') {
            allHoroscopes.push(result.value);
        } else {
            // Si une promesse a été rejetée, le 'reason' contient l'objet retourné par le catch
            allHoroscopes.push(result.reason); // Assurez-vous que le catch renvoie un objet avec sign, horoscope, symbol
        }
    });

    res.json(allHoroscopes);
});


// Démarrage du serveur
app.listen(port, () => {
    console.log(`Serveur Groq démarré sur http://localhost:${port}`);
    console.log('Assurez-vous que votre GROQ_API_KEY est définie dans le fichier .env');
});
