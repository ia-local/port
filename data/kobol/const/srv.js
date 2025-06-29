require('dotenv').config();
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');
const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const sharp = require('sharp');

const app = express();
const port = 5007;

app.use(express.static('public/'));
app.use(express.json({ limit: '10mb' })); // Augmente la limite de taille

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/save', async (req, res) => {
    const { topic, imageData, content } = req.body;
    const fileName = `${topic}_${Date.now()}`; // Correction du nom de fichier
    const outputDir = path.join(__dirname, 'output');
    const imagePath = path.join(outputDir, `${fileName}.webp`);
    const contentPath = path.join(outputDir, `${fileName}.md`);

    try {
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir);
        }

        const imageBuffer = Buffer.from(imageData, 'base64');
        const webpBuffer = await sharp(imageBuffer).webp().toBuffer();
        fs.writeFileSync(imagePath, webpBuffer);

        const markdownContent = `
# ${topic}
![Image](${fileName}.webp)

${content}
        `;
        fs.writeFileSync(contentPath, markdownContent);

        res.status(200).send('Contenu enregistré avec succès !');
    } catch (error) {
        console.error('Erreur :', error);
        res.status(500).send('Erreur lors de l\'enregistrement du contenu.');
    }
});

async function generateImageDescription(topic) {
    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: 'assistant', content: `** **<br/> | in box |.`, },
                {
                    role: 'user',
                    content: `** Décris une image qui illustre le thème suivant : ${topic}. La description doit être suffisamment détaillée pour générer une image pertinente.`,
                },
            ],
            model: 'gemma2-9b-it',
        });

        return chatCompletion.choices[0].message.content;
    } catch (error) {
        console.error('Erreur lors de la génération de la description de l\'image :', error);
        return 'Image abstraite liée à l\'intelligence artificielle.';
    }
}

app.get('/image', async (req, res) => {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const topic = req.query.topic;

    try {
        const imageDescription = await generateImageDescription(topic);

        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash-exp-image-generation',
            generationConfig: {
                responseModalities: ['Text', 'Image'],
            },
        });

        const response = await model.generateContent(imageDescription);
        for (const part of response.response.candidates[0].content.parts) {
            if (part.inlineData) {
                const imageData = part.inlineData.data;
                res.json({ image: imageData });
                return;
            }
        }
        res.status(500).send('Image non trouvée');
    } catch (error) {
        console.error('Erreur :', error);
        res.status(500).send('Erreur lors de la génération de l\'image');
    }
});
// Nouvelles routes pour les sujets de "IA et créativité"
app.get('/IA_exploration_spatiale', async (req, res) => {
    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: 'assistant', content: `** **<br/> | in box |.`, },
                {
                    role: 'user',
                    content: `** Rédige un article de blog sur les applications de l'IA dans l'exploration spatiale. Ta réponse doit être rédigée au format liste en HTML, respectant les normes du Web sémantique W3C intégrant des emoji intelligents associés.`,
                },
            ],
            model: 'gemma2-9b-it',
        });

        res.status(200).send(chatCompletion.choices[0].message.content);
    } catch (error) {
        res.status(500).send('Une erreur est survenue');
    }
});

app.get('/Cartographie_de_l_univers', async (req, res) => {
    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: 'assistant', content: `** **<br/> | in box |.`, },
                {
                    role: 'user',
                    content: `** Rédige un article de blog sur l'utilisation de l'IA pour la cartographie de l'univers. Ta réponse doit être rédigée au format liste en HTML, respectant les normes du Web sémantique W3C intégrant des emoji intelligents associés.`,
                },
            ],
            model: 'gemma2-9b-it',
        });

        res.status(200).send(chatCompletion.choices[0].message.content);
    } catch (error) {
        res.status(500).send('Une erreur est survenue');
    }
});
app.get('/Cartographie_de_l_univers', async (req, res) => {
    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: 'assistant', content: `** **<br/> | in box |.`, },
                {
                    role: 'user',
                    content: `** Rédige un article de blog sur l'utilisation de l'IA pour la cartographie de l'univers. Ta réponse doit être rédigée au format liste en HTML, respectant les normes du Web sémantique W3C intégrant des emoji intelligents associés.`,
                },
            ],
            model: 'gemma2-9b-it',
        });

        res.status(200).send(chatCompletion.choices[0].message.content);
    } catch (error) {
        res.status(500).send('Une erreur est survenue');
    }
});

app.get('/Drone_IA', async (req, res) => {
    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: 'assistant', content: `** **<br/> | in box |.`, },
                {
                    role: 'user',
                    content: `** Rédige un article de blog sur les applications des drones IA dans l'exploration spatiale. Ta réponse doit être rédigée au format liste en HTML, respectant les normes du Web sémantique W3C intégrant des emoji intelligents associés.`,
                },
            ],
            model: 'gemma2-9b-it',
        });

        res.status(200).send(chatCompletion.choices[0].message.content);
    } catch (error) {
        res.status(500).send('Une erreur est survenue');
    }
});

app.get('/Satellite_IA', async (req, res) => {
    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: 'assistant', content: `** **<br/> | in box |.`, },
                {
                    role: 'user',
                    content: `** Rédige un article de blog sur l'utilisation des satellites IA pour le développement du Web Et la recherche spatiale. Ta réponse doit être rédigée au format liste en HTML, respectant les normes du Web sémantique W3C intégrant des emoji intelligents associés.`,
                },
            ],
            model: 'gemma2-9b-it',
        });

        res.status(200).send(chatCompletion.choices[0].message.content);
    } catch (error) {
        res.status(500).send('Une erreur est survenue');
    }
});

app.get('/Robots_explorateurs', async (req, res) => {
    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: 'assistant', content: `** **<br/> | in box |.`, },
                {
                    role: 'user',
                    content: `** Rédige un article de blog sur les robots explorateurs et leur utilisation dans l'exploration spatiale. Ta réponse doit être rédigée au format liste en HTML, respectant les normes du Web sémantique W3C intégrant des emoji intelligents associés.`,
                },
            ],
            model: 'gemma2-9b-it',
        });

        res.status(200).send(chatCompletion.choices[0].message.content);
    } catch (error) {
        res.status(500).send('Une erreur est survenue');
    }
});

app.get('/Analyse_de_donnees_astronomiques', async (req, res) => {
    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: 'assistant', content: `** **<br/> | in box |.`, },
                {
                    role: 'user',
                    content: `** Rédige un article de blog sur l'analyse de données astronomiques à l'aide de l'IA. Ta réponse doit être rédigée au format liste en HTML, respectant les normes du Web sémantique W3C intégrant des emoji intelligents associés.`,
                },
            ],
            model: 'gemma2-9b-it',
        });

        res.status(200).send(chatCompletion.choices[0].message.content);
    } catch (error) {
        res.status(500).send('Une erreur est survenue');
    }
});


app.get('/Analyse_de_donnees_astronomiques_constellation_Cancer', async (req, res) => {
    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: 'assistant', content: `** **<br/> | in box |.`, },
                {
                    role: 'user',
                    content: `** Rédige un article de blog sur l'analyse de données astronomiques à l'aide de l'IA. Ta réponse doit être rédigée au format liste en HTML, respectant les normes du Web sémantique W3C intégrant des emoji intelligents associés.`,
                },
            ],
            model: 'gemma2-9b-it',
        });

        res.status(200).send(chatCompletion.choices[0].message.content);
    } catch (error) {
        res.status(500).send('Une erreur est survenue');
    }
});


app.get('/Analyse_de_donnees_astronomiques_constellation_Taurus', async (req, res) => {
    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: 'assistant', content: `** **<br/> | in box |.`, },
                {
                    role: 'user',
                    content: `** Rédige un article de blog sur l'analyse de données astronomiques à l'aide de l'IA. Ta réponse doit être rédigée au format liste en HTML, respectant les normes du Web sémantique W3C intégrant des emoji intelligents associés.`,
                },
            ],
            model: 'gemma2-9b-it',
        });

        res.status(200).send(chatCompletion.choices[0].message.content);
    } catch (error) {
        res.status(500).send('Une erreur est survenue');
    }
});

app.get('/Analyse_de_donnees_astronomiques_constellation_Gemini', async (req, res) => {
    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: 'assistant', content: `** **<br/> | in box |.`, },
                {
                    role: 'user',
                    content: `** Rédige un article de blog sur l'analyse de données astronomiques à l'aide de l'IA. Ta réponse doit être rédigée au format liste en HTML, respectant les normes du Web sémantique W3C intégrant des emoji intelligents associés.`,
                },
            ],
            model: 'gemma2-9b-it',
        });

        res.status(200).send(chatCompletion.choices[0].message.content);
    } catch (error) {
        res.status(500).send('Une erreur est survenue');
    }
});

app.listen(port, () => console.log(`Server running on port http://localhost:${port}`));