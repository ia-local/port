cd /Volumes/devOps/port # Navigue vers le répertoire de server.js
pm2 stop universmc-server  # Arrête l'ancienne instance
pm2 delete universmc-server # Supprime l'ancienne configuration
pm2 start server.js --name "universmc-server" # Redémarre la nouvelle
pm2 save                   # Pour que PM2 conserve l'état au redémarrage du système