document.querySelectorAll('a[data-topic]').forEach(link => {
    link.addEventListener('click', async (event) => {
        event.preventDefault();
        const topic = link.dataset.topic;
        const sectionId = link.getAttribute('href').substring(1); // Récupère l'ID de la section
        const imageContainerId = `image${sectionId.charAt(0).toUpperCase() + sectionId.slice(1)}`;

        try {
            // Génération du contenu textuel
            const responseText = await fetch(`/${topic}`);
            const topicContent = await responseText.text();
            document.getElementById(`resultats${sectionId.charAt(0).toUpperCase() + sectionId.slice(1)}`).innerHTML = topicContent;

            // Génération de l'image
            const responseImage = await fetch(`/image?topic=${topic}`);// Vous pouvez modifier l'endpoint si nécessaire
            const imageData = await responseImage.json();
            const imageElement = document.createElement('img');
            imageElement.src = `data:image/png;base64,${imageData.image}`;
            document.getElementById(imageContainerId).innerHTML = '';
            document.getElementById(imageContainerId).appendChild(imageElement);
        } catch (error) {
            console.error('Erreur :', error);
            document.getElementById(`resultats${sectionId.charAt(0).toUpperCase() + sectionId.slice(1)}`).innerHTML = 'Erreur lors de la génération du contenu.';
            document.getElementById(imageContainerId).innerHTML = 'Erreur lors de la génération de l\'image.';
        }
    });
});

// ... le reste de votre code ...

document.getElementById('genererImage').addEventListener('click', async () => {
    try {
        const response = await fetch('/image');
        const imageData = await response.json();
        const imageElement = document.createElement('img');
        imageElement.src = `data:image/png;base64,${imageData.image}`;
        document.getElementById('resultatImage').innerHTML = '';
        document.getElementById('resultatImage').appendChild(imageElement);
    } catch (error) {
        console.error('Erreur :', error);
        document.getElementById('resultatImage').innerHTML = 'Erreur lors de la génération de l\'image.';
    }
});
document.querySelectorAll('.regenerate-content').forEach(button => {
    button.addEventListener('click', async (event) => {
        const topic = button.dataset.topic;
        const sectionId = button.closest('.topic-content').id;
        const resultatsId = `resultats${sectionId.charAt(0).toUpperCase() + sectionId.slice(1)}`;

        try {
            const response = await fetch(`/${topic}`);
            const topicContent = await response.text();
            document.getElementById(resultatsId).innerHTML = topicContent;
        } catch (error) {
            console.error('Erreur :', error);
            document.getElementById(resultatsId).innerHTML = 'Erreur lors de la génération du contenu.';
        }
    });
});

document.querySelectorAll('.regenerate-image').forEach(button => {
    button.addEventListener('click', async (event) => {
        const topic = button.dataset.topic;
        const sectionId = button.closest('.topic-content').id;
        const imageContainerId = `image${sectionId.charAt(0).toUpperCase() + sectionId.slice(1)}`;

        try {
            const response = await fetch(`/image?topic=${topic}`);
            const imageData = await response.json();
            const imageElement = document.createElement('img');
            imageElement.src = `data:image/png;base64,${imageData.image}`;
            document.getElementById(imageContainerId).innerHTML = '';
            document.getElementById(imageContainerId).appendChild(imageElement);
        } catch (error) {
            console.error('Erreur :', error);
            document.getElementById(imageContainerId).innerHTML = 'Erreur lors de la génération de l\'image.';
        }
    });
});

// ... (code existant pour les autres boutons) ...

document.querySelectorAll('.save-content').forEach(button => {
    button.addEventListener('click', async (event) => {
        const topic = button.dataset.topic;
        const sectionId = button.closest('.topic-content').id;
        const imageContainerId = `image${sectionId.charAt(0).toUpperCase() + sectionId.slice(1)}`;
        const resultatsId = `resultats${sectionId.charAt(0).toUpperCase() + sectionId.slice(1)}`;

        const imageElement = document.getElementById(imageContainerId).querySelector('img');
        const content = document.getElementById(resultatsId).innerHTML;

        if (imageElement && content) {
            const imageData = imageElement.src.replace(/^data:image\/png;base64,/, '');

            try {
                const response = await fetch('/save', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ topic, imageData, content }),
                });

                if (response.ok) {
                    alert('Contenu enregistré avec succès !');
                } else {
                    alert('Erreur lors de l\'enregistrement du contenu.');
                }
            } catch (error) {
                console.error('Erreur :', error);
                alert('Erreur lors de l\'enregistrement du contenu.');
            }
        } else {
            alert('Image ou contenu manquant.');
        }
    });
});