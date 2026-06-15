Guide de Migration : Supabase → PostgreSQL + Backend Express
Résumé des Changements
L'architecture a été migrée de Supabase vers une solution on-premise :

Avant (Supabase)
Frontend → Supabase (Auth + DB + Realtime)
Dépendance externe obligatoire
Pas de contrôle sur les données
Après (PostgreSQL + Express)
Frontend → Backend Express API → PostgreSQL
Contrôle total de l'infrastructure
SCADA via MQTT intégré
Compatible local et production
Fichiers Modifiés / Créés
Backend (NOUVEAU)
/backend/
├── package.json           # Dépendances Express + PostgreSQL + MQTT
├── Dockerfile
├── src/
│   ├── index.js           # Serveur Express principal
│   ├── db/
│   │   ├── connection.js  # Pool PostgreSQL
│   │   ├── schema.sql     # Schéma complet
│   │   └── init.js        # Script d'initialisation
│   ├── middleware/
│   │   └── auth.js        # JWT + vérification rôles
│   └── routes/
│       ├── auth.js        # Login / Register
│       ├── sites.js       # CRUD sites + SCADA
│       ├── monitoring.js  # Données monitoring
│       ├── users.js       # Gestion utilisateurs
│       └── alerts.js      # Gestion alertes
Frontend (MODIFIÉ)
/src/
├── contexts/AuthContext.tsx    # Remplacé Supabase Auth par JWT
├── services/api.ts             # NOUVEAU : Client API REST
├── pages/LoginPage.tsx         # Remplacé Supabase par API
└── db/api.ts, supabase.ts      # Obsolète (gardé pour référence)
Configuration
vite.config.ts          # Ajout proxy API /api → localhost:9000
.env                    # Remplacé Supabase par VITE_API_URL
.env.example
Docker
docker-compose.yml      # PostgreSQL + Backend + Frontend
Dockerfile              # Frontend
/backend/Dockerfile     # Backend
Comment Utiliser Votre Code Existant
Si vous avez déjà un repo GitHub avec votre propre code :

Copiez le backend dans votre projet :

cp -r /workspace/app-ai3sybx9mo01/backend /votre-projet/
Remplacez le service API frontend par le nouveau :

cp /workspace/app-ai3sybx9mo01/src/services/api.ts /votre-projet/src/services/
Remplacez AuthContext par la version JWT :

cp /workspace/app-ai3sybx9mo01/src/contexts/AuthContext.tsx /votre-projet/src/contexts/
Mettez à jour vite.config.ts pour ajouter le proxy :

server: {
  proxy: {
    "/api": {
      target: "http://localhost:9000",
      changeOrigin: true,
    },
  },
}
Changez les variables d'environnement :

# Supprimez
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...

# Ajoutez
VITE_API_URL=/api/lumen
Prochaines Étapes
Installer et lancer PostgreSQL localement
Lancer le backend : cd backend && npm install && npm start
Lancer le frontend : pnpm run dev
Créer le compte admin sur /login
Ajouter un site SCADA avec SN + PSW
Pour toute question, consultez le README.md principal.