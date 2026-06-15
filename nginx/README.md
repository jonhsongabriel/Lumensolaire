Configuration Nginx pour LUMEN
Fichiers
Fichier	Description
nginx.conf	Configuration principale Nginx (workers, gzip, sécurité)
conf.d/lumen.conf	Virtual host LUMEN (reverse proxy API + static frontend)
conf.d/ssl-params.conf	Paramètres SSL/TLS partagés
Dockerfile	Image Nginx avec build frontend intégré
build.sh	Script de build production complet
www/	Dossier build frontend (React/Vite)
ssl/	Certificats SSL (Let's Encrypt ou manuel)
errors/	Pages d'erreur personnalisées
Architecture
Client ──► Nginx (port 80/443)
           ├── /          →  /var/www/lumen (React SPA statique)
           ├── /api/*     →  backend:9000 (Express API)
           ├── /ws/*      →  backend:9000 (WebSocket)
           └── /mqtt/     →  mosquitto:9001 (MQTT WebSocket)
Sécurité intégrée
Rate limiting : 10 req/s sur API, 5 req/min sur login
Headers sécurisés : X-Frame-Options, X-Content-Type-Options, X-XSS-Protection
Gzip : compression JS/CSS/JSON/SVG
Cache : 6 mois pour les assets, 1h pour le HTML
CORS : headers pour les requêtes cross-origin
SSL / HTTPS
Let's Encrypt (recommandé) :

# Générer le certificat
docker-compose -f docker-compose.ssl.yml run --rm certbot

# Relancer Nginx en mode SSL
# Éditer conf.d/lumen.conf → décommenter le bloc HTTPS
docker-compose -f docker-compose.prod.yml restart nginx
Certificat manuel :

# Placer les fichiers
cp fullchain.pem nginx/ssl/
cp privkey.pem nginx/ssl/

# Activer HTTPS dans la config
Commandes
# Test config
nginx -t

# Reload config
nginx -s reload

# Voir les logs
docker exec lumen-nginx-prod tail -f /var/log/nginx/access.log