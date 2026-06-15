Guide d'Installation et d'Exécution Locale - LUMEN
Prérequis
Node.js version 18 ou supérieure
pnpm (gestionnaire de paquets)
Un compte Supabase (déjà configuré)
Installation
1. Installer les dépendances
cd /workspace/app-ai3sybx9mo01
pnpm install
2. Vérifier les variables d'environnement
Le fichier .env devrait déjà contenir les informations Supabase :

VITE_SUPABASE_URL=https://ocqvzdvcypquydpyvrui.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Si le fichier .env n'existe pas, créez-le avec ces valeurs.

3. Lancer le serveur de développement
pnpm run dev
Le serveur démarrera sur http://localhost:5173 (ou un autre port si 5173 est occupé).

Première Utilisation
1. Créer le premier compte administrateur
Ouvrez votre navigateur à http://localhost:5173
Vous serez redirigé vers la page de connexion
Cliquez sur l'onglet "Inscription"
Créez un compte avec :
Nom d'utilisateur : admin (ou votre choix)
Mot de passe : minimum 6 caractères
Le premier utilisateur inscrit devient automatiquement administrateur
2. Explorer l'application
Une fois connecté, vous aurez accès à :

Tableau de bord : Vue d'ensemble avec carte interactive des sites
Supervision : Monitoring en temps réel des sites
Historique : Consultation et export des données
Configuration : Modification des paramètres (admin/ingénieur)
Utilisateurs : Gestion des comptes (admin uniquement)
Notifications : Centre d'alertes
Profil : Paramètres personnels
Données de Démonstration
L'application contient déjà 5 sites d'exemple :

Site Solaire Paris Nord
Installation Lyon Est
Centrale Marseille
Parc Toulouse Sud
Station Bordeaux
Avec des données de monitoring, alertes et configurations pré-remplies.

Commandes Utiles
# Démarrer en mode développement
pnpm run dev

# Vérifier le code (linting)
pnpm run lint

# Construire pour la production
pnpm run build

# Prévisualiser la version de production
pnpm run preview
Structure du Projet
/workspace/app-ai3sybx9mo01/
├── src/
│   ├── components/       # Composants réutilisables
│   │   ├── features/    # Composants métier
│   │   ├── layouts/     # Layouts (Header, Sidebar)
│   │   └── ui/          # Composants UI (shadcn)
│   ├── contexts/        # Contextes React (Auth)
│   ├── db/              # API Supabase
│   ├── pages/           # Pages de l'application
│   ├── types/           # Définitions TypeScript
│   └── App.tsx          # Point d'entrée
├── .env                 # Variables d'environnement
└── package.json         # Dépendances
Résolution de Problèmes
Le serveur ne démarre pas
# Nettoyer et réinstaller
rm -rf node_modules
pnpm install
pnpm run dev
Erreur de connexion Supabase
Vérifiez que les variables d'environnement dans .env sont correctes :

VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
Port déjà utilisé
Si le port 5173 est occupé, Vite utilisera automatiquement le port suivant disponible.

Erreurs TypeScript
# Vérifier et corriger
pnpm run lint
Basculer entre Thème Clair/Sombre
Cliquez sur l'icône lune/soleil dans l'en-tête pour basculer entre les thèmes.

Support
Pour toute question ou problème, consultez :

La documentation Supabase : https://supabase.com/docs
La documentation React : https://react.dev
La documentation shadcn/ui : https://ui.shadcn.com