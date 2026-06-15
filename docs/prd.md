Document de Spécifications
1. Aperçu de l'application
Nom de l'application : LUMEN – Plateforme de Supervision Énergétique Multisite

Description : Plateforme web de supervision multisite des systèmes énergétiques (solaires hybrides, autonomes ou raccordés au réseau), permettant de centraliser les données, visualiser les performances en temps réel, gérer les accès utilisateurs et optimiser la maintenance sur l'ensemble des sites suivis par le Bureau d'Études et le service technique LUMEN.

2. Utilisateurs et scénarios d'utilisation
Utilisateurs cibles :

Administrateurs LUMEN : gestion globale de la plateforme, des utilisateurs et des configurations
Ingénieurs : supervision technique, analyse des données, modification des paramètres
Techniciens : consultation des alertes et états des équipements
Clients : accès restreint à leurs propres sites
Scénarios principaux :

Un ingénieur consulte en temps réel l'état de production et de consommation d'un site distant
Un administrateur crée un compte technicien et lui attribue l'accès à un sous-ensemble de sites
Un technicien reçoit une alerte de défaut et consulte l'historique pour diagnostiquer la panne
Un client visualise les indicateurs de performance de son installation
3. Structure des pages et fonctionnalités principales
3.1 Arborescence générale
Plateforme LUMEN
├── Page de connexion
├── Tableau de bord global
│   ├── Vue carte interactive (tous les sites)
│   └── Indicateurs synthétiques par site
├── Supervision temps réel (par site)
│   ├── Production / Consommation
│   ├── État batterie
│   ├── Température
│   └── Courbes dynamiques
├── Historique et rapports
│   ├── Historique des données
│   ├── Export CSV / PDF
│   └── Rapports automatiques
├── Commande et configuration (par site)
│   ├── Modification des seuils et modes
│   └── Journal d'audit
├── Gestion des utilisateurs
│   ├── Liste des utilisateurs
│   ├── Création / modification / suppression
│   └── Attribution des rôles et des sites
└── Notifications et alertes
    ├── Centre de notifications
    └── Paramétrage des alertes
3.2 Page de connexion
Formulaire identifiant / mot de passe
Option 2FA (authentification à deux facteurs) activable par l'administrateur
Redirection vers le tableau de bord global après authentification réussie
Gestion des erreurs de connexion (identifiants incorrects, compte désactivé)
Blocage temporaire du compte après 3 tentatives échouées avec notification à l'administrateur
3.3 Tableau de bord global
Carte interactive affichant la localisation de tous les sites supervisés
Indicateur d'état par site : opérationnel, alerte, hors ligne
Données synthétiques par site : production solaire actuelle, niveau de batterie, consommation
Accès rapide à la supervision détaillée d'un site via clic sur la carte ou la liste
Thème clair / sombre sélectionnable et persistant par utilisateur
3.4 Supervision temps réel (par site)
Affichage en temps réel des indicateurs : production (kW), consommation (kW), état de charge batterie (%), température (°C)
Courbes dynamiques avec mise à jour automatique (intervalle configurable)
Sélection de la plage temporelle d'affichage (dernière heure, dernières 24h, etc.)
Indicateur de connectivité du site (en ligne / hors ligne)
3.5 Historique et rapports
Consultation de l'historique des données par site et par période
Export des données au format CSV et PDF
Génération automatique de rapports selon une fréquence configurable (quotidienne, hebdomadaire, mensuelle)
Envoi automatique des rapports par email aux destinataires configurés
Archivage des rapports générés, accessibles depuis l'interface
En cas d'échec d'envoi email : journalisation de l'erreur et nouvelle tentative automatique
3.6 Commande et configuration
Modification à distance des seuils d'alerte et des modes de fonctionnement des équipements
Chaque action est enregistrée dans le journal d'audit : utilisateur, date/heure, paramètre modifié, valeur avant/après
Accès restreint aux ingénieurs et administrateurs uniquement
Journal d'audit non modifiable, accessible aux administrateurs et ingénieurs
3.7 Gestion des utilisateurs
Liste des comptes utilisateurs avec rôle et sites associés
Création, modification et désactivation de comptes
Rôles disponibles : Administrateur, Ingénieur, Technicien, Client
Attribution multi-site : un utilisateur peut être associé à un ou plusieurs sites
Réinitialisation de mot de passe par l'administrateur
Activation / désactivation du 2FA par utilisateur (configurable par l'administrateur)
3.8 Notifications et alertes
Détection automatique des défauts et anomalies (seuils dépassés, perte de communication)
Envoi d'alertes par email et notification push (web)
Centre de notifications dans l'interface : historique des alertes, statut (lue / non lue)
Paramétrage des règles d'alerte par site et par type d'événement
4. Règles métier et logique
Contrôle d'accès par rôle (RBAC) :

Administrateur : accès complet à toutes les fonctionnalités et tous les sites
Ingénieur : accès à la supervision, l'historique, la configuration et les commandes sur les sites assignés
Technicien : accès en lecture à la supervision et aux alertes sur les sites assignés
Client : accès en lecture aux indicateurs et rapports de ses propres sites uniquement
Collecte des données :

Intégration via API REST et protocole Modbus TCP/RTU
Architecture générique extensible pour supporter plusieurs marques et modèles d'onduleurs et batteries
Fréquence de collecte configurable par site
Sécurité des communications :

Toutes les communications entre le client et le serveur sont chiffrées via HTTPS
Accès au serveur interne LUMEN sécurisé par VPN
Sessions utilisateurs avec expiration automatique après inactivité
Sauvegarde automatique :

Sauvegarde quotidienne et hebdomadaire de la base de données sur le serveur interne LUMEN
Audit log :

Toute action de configuration ou de commande est tracée de manière non modifiable
Accessible uniquement aux administrateurs et ingénieurs
5. Cas limites et gestion des erreurs
Situation	Comportement attendu
Site hors ligne (perte de communication)	Indicateur visuel hors ligne sur la carte et dans la liste ; alerte générée automatiquement
Données manquantes ou incomplètes	Affichage d'un indicateur données indisponibles sans bloquer l'interface
Tentative de connexion échouée (3 fois)	Blocage temporaire du compte et notification à l'administrateur
Modification de paramètre par un rôle non autorisé	Action bloquée, message d'erreur explicite affiché
Export de données volumineuses	Traitement en arrière-plan avec notification à l'utilisateur à la fin de la génération
Expiration de session	Redirection vers la page de connexion avec message informatif
Rapport automatique non envoyé (erreur email)	Journalisation de l'erreur et nouvelle tentative automatique
6. Critères de validation
La page de connexion permet l'authentification par identifiant/mot de passe avec option 2FA activable
Le tableau de bord global affiche la carte interactive avec l'état de tous les sites
La supervision temps réel affiche les indicateurs mis à jour automatiquement pour chaque site
Les courbes dynamiques sont fonctionnelles et réactives
L'export CSV et PDF de l'historique est opérationnel
Les rapports automatiques sont générés et envoyés par email selon la fréquence configurée
La modification de paramètres à distance est fonctionnelle et tracée dans l'audit log
La gestion des utilisateurs permet la création, modification, désactivation et attribution de rôles/sites
Les alertes sont déclenchées automatiquement et envoyées par email et notification push
Le contrôle d'accès par rôle est respecté sur toutes les pages et fonctionnalités
Les sauvegardes automatiques quotidiennes et hebdomadaires sont opérationnelles
Le thème clair/sombre est fonctionnel et persistant par utilisateur
Toutes les communications sont chiffrées via HTTPS
7. Fonctionnalités hors périmètre de cette version
Application Android native (.apk)
Intégration des protocoles MQTT, SNMP et LoRa
Module d'intelligence artificielle pour la maintenance prédictive
Tableau de bord énergétique global agrégé
Export via API ouverte pour intégration ERP
Mode hors ligne partiel
Formation de l'équipe LUMEN
Documentation technique et manuel utilisateur
