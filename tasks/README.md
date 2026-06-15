LUMEN - Plateforme de Supervision Énergétique Multisite
Architecture
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Frontend  │──────▶│   Backend   │──────▶│  PostgreSQL │
│   (React)   │◀──────│  (Express)  │◀──────│   (SCADA)   │
└─────────────┘      └─────────────┘      └─────────────┘
                            │
                            ▼
                      ┌─────────────┐
                      │    MQTT     │
                      │  (SCADA)    │
                      └─────────────┘
Stack Technique
Frontend : React + TypeScript + Vite + Tailwind CSS + shadcn/ui
Backend : Node.js + Express + PostgreSQL (pg)
Base de données : PostgreSQL 15
SCADA : MQTT (HiveMQ public broker)
Auth : JWT (jsonwebtoken) + bcryptjs
Variables d'Environnement
Production (Docker)
# Frontend (.env)
VITE_API_URL=/api/lumen

# Backend (server-side only)
POSTGRES_URL=postgres://lumen:Lum3n.pasS!@db:5432/lumendb
PORT=9000
SECRET_KEY=change_me_before_site_test

# MQTT / SCADA
MQTT_URL=mqtt://broker.hivemq.com:1883
MQTT_TOPIC=centrale/+/data
Local (Développement)
# Frontend (.env)
VITE_API_URL=/api/lumen

# Backend (.env dans /backend)
POSTGRES_URL=postgres://lumen:Lum3n.pasS!@localhost:5432/lumendb
PORT=9000
SECRET_KEY=dev_secret_key_change_in_production
Installation Locale
Prérequis
Node.js 18+
PostgreSQL 15
pnpm
1. Base de données
# Créer la base de données
createdb -U lumen lumendb

# Initialiser le schéma
cd backend
npm install
node src/db/init.js
2. Backend
cd backend
npm install
npm start
# ou en dev : npm run dev
Le backend démarre sur http://localhost:9000

3. Frontend
# Racine du projet
pnpm install
pnpm run dev
Le frontend démarre sur http://localhost:5173

Le proxy Vite redirige automatiquement /api/lumen/* vers http://localhost:9000

Déploiement avec Docker
# Lancer tous les services
docker-compose up -d

# Frontend : http://localhost:5173
# Backend  : http://localhost:9000
# PostgreSQL : localhost:5432
Authentification SCADA
Ajouter un site SCADA manuellement via son Numéro de Série (SN) et Mot de Passe (PSW) :

POST /api/lumen/sites
{
  "name": "Centrale Solaire Paris",
  "location": "Paris, France",
  "serial_number": "SCADA-SN-001",
  "password": "mon_mot_de_passe_scada",
  "scada_enabled": true,
  "scada_protocol": "modbus"
}
Connexion MQTT / SCADA
Le backend se connecte au broker MQTT et écoute le topic centrale/+/data.

Format de message attendu :

{
  "site_id": "uuid-du-site",
  "production_kw": 45.2,
  "consumption_kw": 12.8,
  "battery_level_percent": 78.5,
  "battery_voltage": 48.2,
  "temperature_celsius": 35.0,
  "grid_status": "connected"
}
API Endpoints
Auth
POST /api/lumen/auth/register - Inscription
POST /api/lumen/auth/login - Connexion
GET /api/lumen/auth/me - Profil utilisateur
PATCH /api/lumen/auth/me - Mise à jour profil
Sites
GET /api/lumen/sites - Liste des sites
GET /api/lumen/sites/:id - Détails d'un site
POST /api/lumen/sites - Créer un site (admin/ingénieur)
PATCH /api/lumen/sites/:id - Modifier un site
GET /api/lumen/sites/scada/enabled - Sites SCADA
POST /api/lumen/sites/scada/verify - Vérifier SN/PSW
PATCH /api/lumen/sites/:id/scada/status - Statut connexion
Monitoring
GET /api/lumen/monitoring/site/:siteId - Données d'un site
GET /api/lumen/monitoring/site/:siteId/latest - Dernières données
POST /api/lumen/monitoring - Insérer données (MQTT)
GET /api/lumen/monitoring/summary/:siteId - Résumé
Utilisateurs (admin)
GET /api/lumen/users - Liste utilisateurs
GET /api/lumen/users/:id - Détails
PATCH /api/lumen/users/:id/role - Modifier rôle
DELETE /api/lumen/users/:id - Supprimer
Alertes
GET /api/lumen/alerts - Liste alertes
POST /api/lumen/alerts - Créer alerte
PATCH /api/lumen/alerts/:id/acknowledge - Acquitter
PATCH /api/lumen/alerts/:id/resolve - Résoudre
Rôles Utilisateurs
Rôle	Permissions
admin	Tout
engineer	CRUD sites, monitoring, config
technician	Lecture, acquittement alertes
client	Lecture seule
Première Utilisation
Créer le compte admin : S'inscrire sur /login - le premier utilisateur devient admin
Ajouter un site SCADA : Menu Configuration → Ajouter site avec SN + PSW
Connecter MQTT : Les données arrivent automatiquement via le broker
Production vs Local
Aspect	Local	Production
PostgreSQL	localhost:5432	db:5432 (Docker)
Backend URL	localhost:9000	localhost:9000
Frontend URL	localhost:5173	localhost:5173
API Proxy	Vite dev server	Nginx / même domaine
CORS	* (dev)	Domaine spécifique
Scripts Utiles
# Initialiser la base de données
cd backend && node src/db/init.js

# Démarrer en dev (3 terminaux)
# Terminal 1 : cd backend && npm run dev
# Terminal 2 : pnpm run dev (frontend)
# Terminal 3 : docker run -p 5432:5432 -e POSTGRES_USER=lumen -e POSTGRES_PASSWORD=Lum3n.pasS! -e POSTGRES_DB=lumendb postgres:15-alpine
Sécurité
Changez SECRET_KEY en production
Utilisez HTTPS en production
Le mot de passe SCADA est stocké en clair dans la DB (à hasher si nécessaire)
Les mots de passe utilisateurs sont hashés avec bcrypt
JWT expire après 24h