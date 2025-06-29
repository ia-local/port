const { spawn } = require('child_process');
const readline = require('readline');
const shlex = require('shlex');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const commandesAutorisees = {
  'afficher_date': {
    description: 'Affiche la date et l\'heure actuelles',
    commande: 'date',
    parametres: [],
  },
  'lister_repertoire': {
    description: 'Liste le contenu d\'un répertoire',
    commande: 'ls',
    parametres: [
      { nom: 'chemin', type: 'string', description: 'Le chemin du répertoire (par défaut: .)' },
      { nom: 'l', type: 'boolean', description: 'Affiche les détails' },
    ],
  },
  'afficher_utilisateur': {
    description: 'Affiche le nom de l\'utilisateur actuel',
    commande: 'whoami',
    parametres: [],
  },
  'creer_dossier': {
    description: 'Crée un nouveau dossier',
    commande: 'mkdir',
    parametres: [
      { nom: 'nom_dossier', type: 'string', description: 'Le nom du dossier à créer.' },
    ],
  },
};

function afficherAide(commandeNom) {
  /**
   * Affiche l'aide générale ou l'aide spécifique pour une commande.
   * @param {string} commandeNom - Le nom de la commande pour laquelle afficher l'aide (optionnel).
   */
  if (commandeNom) {
    if (commandesAutorisees[commandeNom]) {
      const commande = commandesAutorisees[commandeNom];
      console.log(`\nAide pour la commande '${commandeNom}':`);
      console.log(`  Description: ${commande.description}`);
      console.log(`  Commande à exécuter: ${commande.commande}`);
      if (commande.parametres.length > 0) {
        console.log('  Paramètres:');
        commande.parametres.forEach(param => {
          console.log(`    ${param.nom} (${param.type}): ${param.description}`);
        });
      } else {
        console.log('  Cette commande n\'accepte pas de paramètres.');
      }
    } else {
      console.log(`Erreur : La commande '${commandeNom}' n'existe pas.`);
    }
  } else {
    console.log('Bienvenue dans l\'application Shell Sécurisée !\n');
    console.log('Commandes disponibles :\n');
    for (const nom in commandesAutorisees) {
      console.log(`${nom}: ${commandesAutorisees[nom].description}`);
    }
    console.log('\nTapez \'aide <commande>\' pour plus d\'informations sur une commande.');
    console.log('Tapez \'quitter\' pour sortir.');
  }
}

function executerCommande(commandeNom, parametres) {
  /**
   * Exécute une commande avec les paramètres fournis.
   * @param {string} commandeNom - Le nom de la commande à exécuter.
   * @param {object} parametres - Un objet contenant les paramètres de la commande.
   * @returns {Promise<{success: boolean, output?: string, error?: string}>}
   * Une promesse qui résout avec le résultat de l'exécution de la commande.
   */
  return new Promise((resolve, reject) => {
    if (!commandesAutorisees[commandeNom]) {
      resolve({ success: false, error: `Commande '${commandeNom}' non autorisée.` });
      return;
    }

    const commandeAutorisee = commandesAutorisees[commandeNom];
    let commandeAExecuter = commandeAutorisee.commande;
    const commandeArgs = [];

    // Validation des paramètres
    let parametresValides = true;
    for (const paramDef of commandeAutorisee.parametres) {
      const paramNom = paramDef.nom;
      if (parametres[paramNom] !== undefined) {
        // Vérification du type (exemple simplifié, à adapter)
        if (paramDef.type === 'string' && typeof parametres[paramNom] !== 'string') {
          parametresValides = false;
          break;
        } else if (paramDef.type === 'boolean' && typeof parametres[paramNom] !== 'boolean') {
          parametresValides = false;
          break;
        }
      } else if (paramDef.type !== 'boolean') {
        parametresValides = false;
        break;
      }
    }

    if (!parametresValides) {
      resolve({ success: false, error: 'Paramètres invalides pour la commande.' });
      return;
    }

    // Construction de la commande
    for (const paramDef of commandeAutorisee.parametres) {
      const paramNom = paramDef.nom;
      if (parametres[paramNom] !== undefined) {
        if (paramDef.type === 'boolean' && parametres[paramNom]) {
          commandeArgs.push(`-${paramNom}`);
        } else if (paramDef.type === 'string') {
          commandeArgs.push(parametres[paramNom]);
        }
      }
    }
    const child = spawn(commandeAExecuter, commandeArgs);
    let output = '';
    let error = '';

    child.stdout.on('data', data => {
      output += data.toString();
    });

    child.stderr.on('data', data => {
      error += data.toString();
    });

    child.on('close', code => {
      if (code === 0) {
        resolve({ success: true, output, error });
      } else {
        resolve({ success: false, output, error });
      }
    });

    child.on('error', err => {
      resolve({ success: false, error: err.message });
    });
  });
}

function analyserEntree(entree) {
  /**
   * Analyse l'entrée de l'utilisateur et retourne la commande et les paramètres.
   * @param {string} entree - L'entrée de l'utilisateur.
   * @returns {{commandeNom: string, parametres: object}} - La commande et les paramètres analysés.
   */
  const tokens = shlex.split(entree);
  if (tokens.length === 0) {
    return { commandeNom: null, parametres: {} };
  }
  const commandeNom = tokens[0];
  const parametres = {};
  let i = 1;
  while (i < tokens.length) {
    if (tokens[i].startsWith('-')) {
      const paramNom = tokens[i].slice(1); // Retire le '-'
      if (i + 1 < tokens.length && !tokens[i + 1].startsWith('-')) {
        const paramValeur = tokens[i + 1];
        i += 1;
        parametres[paramNom] = paramValeur;
      } else {
        parametres[paramNom] = true; // Paramètre booléen sans valeur
      }
    } else {
      // Gérer les paramètres sans tiret (pour la commande 'lister_repertoire', par exemple)
      if (!parametres.chemin) {
        parametres.chemin = tokens[i];
      }
    }
    i += 1;
  }
  return { commandeNom, parametres };
}

async function main() {
  /**
   * Fonction principale de l'application.
   */
  afficherAide();
  while (true) {
    const entree = await new Promise(resolve => rl.question('\n> ', resolve));
    const trimmedEntree = entree.trim();
    if (!trimmedEntree) {
      continue; // Retourne au début de la boucle si l'entrée est vide
    }

    if (trimmedEntree === 'quitter') {
      console.log('Au revoir !');
      rl.close();
      break;
    }

    const { commandeNom, parametres } = analyserEntree(trimmedEntree);
    if (commandeNom === 'aide') {
      if (Object.keys(parametres).length > 0) {
        afficherAide(Object.keys(parametres)[0]);
      } else {
        afficherAide();
      }
    } else if (commandeNom) {
      const resultat = await executerCommande(commandeNom, parametres);
      if (resultat.success) {
        console.log(resultat.output);
      } else {
        console.error(`Erreur : ${resultat.error}`);
      }
    }
  }
}

main();
