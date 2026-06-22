# Plan de test fonctionnel — Digital Card App (Afriland First Bank)

Ce document énumère toutes les fonctionnalités utilisateur et administrateur de l'application,
avec pour chacune : l'action à réaliser, le résultat attendu et une case pour consigner le résultat
du test (OK / KO / N/A).

Les sections sont regroupées par domaine fonctionnel. La numérotation est continue pour faciliter
le suivi dans un tableau Excel / Word.

Légende : ✱ = champ obligatoire · Prérequis : serveur backend + base de données démarrés, compte admin initialisé.

---

## 1. Accès et authentification

| N° | Fonctionnalités | Description | Résultat attendu | Résultat des tests |
|----|----|----|----|----|
| 1 | Ouverture de la page de connexion | Accéder à `/login` depuis le navigateur | Affichage du formulaire avec logo Afriland et bannière « Espace Employé » |  |
| 2 | Saisie email valide | Saisir un email professionnel puis sortir du champ (blur) | Appel `GET /api/auth/login-hint?email=...` ; hint mis à jour |  |
| 3 | Détection compte admin | Saisir l'email d'un compte admin | Le champ mot de passe apparaît ; message « Compte administrateur détecté » |  |
| 4 | Accès direct employé | Saisir l'email d'un employé ayant une carte | Redirection automatique vers `/card?email=...` |  |
| 5 | Email sans carte | Saisir un email inconnu de la base | Message « Aucune carte n'est associée à cet email » |  |
| 6 | Validation email vide | Soumettre sans email | Message « L'email est requis » ; submit bloqué |  |
| 7 | Validation format email | Saisir un email mal formé | Message « Email invalide » |  |
| 8 | Connexion admin succès | Saisir email admin + mot de passe valides | `POST /api/auth/admin/login` 200 ; cookie `vcard_admin_session` posé ; redirection `/admin/cards` |  |
| 9 | Connexion admin mot de passe invalide | Saisir mauvais mot de passe | Réponse 401 ; message « Email ou mot de passe incorrect » |  |
| 10 | Limitation de débit login | Lancer plusieurs connexions en parallèle | Réponse 429 « Too many concurrent login requests » |  |
| 11 | Indicateur chargement | Pendant la vérification de l'email | Texte « Vérification de l'email… » visible |  |
| 12 | Bouton langue FR/EN au login | Cliquer sur EN puis FR | Tous les libellés basculent ; choix persisté en `localStorage` |  |
| 13 | Cookie session durée 8 h | Admin connecté | Cookie `vcard_admin_session` avec `Max-Age ≈ 28800s`, `HttpOnly`, `SameSite` |  |
| 14 | Auto-logout sur 401 | Simuler une session expirée puis faire une action admin | Redirection automatique vers `/login` |  |
| 15 | Déconnexion explicite | Cliquer « Déconnexion » dans l'entête admin | `POST /api/auth/admin/logout` ; cookie effacé ; retour `/login` |  |

---

## 2. Page carte de visite (employé)

| N° | Fonctionnalités | Description | Résultat attendu | Résultat des tests |
|----|----|----|----|----|
| 16 | Chargement de la carte | Ouvrir `/card?email=john@afrilandfirstbank.com` | `GET /api/cards?email=...` ; carte affichée |  |
| 17 | Nom complet affiché | Carte chargée | Prénom + nom en haut en gras |  |
| 18 | Titre (poste) bilingue | Changer la langue FR↔EN | Le libellé du poste bascule `labelFr` ↔ `labelEn` |  |
| 19 | Département bilingue | Changer la langue FR↔EN | Le libellé du département bascule selon la langue |  |
| 20 | Adresse fixe | Carte affichée | « Place de l'Indépendance », BP 11834 Yaoundé, Telex 8907 KN |  |
| 21 | Email cliquable | Cliquer sur l'email | Ouvre le client email (`mailto:`) |  |
| 22 | Téléphone fixe cliquable | Cliquer « 222 233 068 » | Déclenche `tel:` |  |
| 23 | Fax cliquable | Cliquer « 222 221 785 » | Déclenche `tel:` |  |
| 24 | Mobile (optionnel) | Carte avec mobile renseigné | Ligne mobile visible, lien `tel:` |  |
| 25 | Mobile absent | Carte sans mobile | Ligne mobile masquée (pas de cellule vide) |  |
| 26 | Site web cliquable | Cliquer le site web | Ouverture `https://www.afrilandfirstbank.com` dans un nouvel onglet |  |
| 27 | Carte responsive mobile | Ouvrir sur smartphone (< 640 px) | Carte recentrée et réduite ; pas de débordement horizontal |  |
| 28 | Carte responsive desktop | Ouvrir sur grand écran | Carte affichée à taille normale |  |
| 29 | Erreur paramètre manquant | Ouvrir `/card` sans `?email=` | Message « Veuillez fournir un email (paramètre ?email=...) » |  |
| 30 | Erreur carte introuvable | Passer un email inconnu | Message « Carte introuvable pour cet email » |  |
| 31 | Bouton langue sur la carte | Cliquer FR/EN depuis la carte | Libellés basculent ; persiste au rechargement |  |
| 32 | Bouton retour | Cliquer la flèche retour | Retour à `/login` |  |

---

## 3. Partage de la carte

| N° | Fonctionnalités | Description | Résultat attendu | Résultat des tests |
|----|----|----|----|----|
| 33 | Ouvrir le menu de partage | Cliquer l'icône « Partager » | Popover affiché : section Image, Lien, QR, et lien employé (créateur uniquement) |  |
| 34 | Partager l'image (mobile Web Share) | Sur mobile, cliquer « Partager l'image de la carte » | `navigator.share()` appelé avec PNG ; toast « Partagé » |  |
| 35 | Télécharger l'image (desktop) | Sur desktop, cliquer « Partager l'image de la carte » | PNG téléchargé ; toast « Image téléchargée » |  |
| 36 | Partager le lien (mobile) | Cliquer « Partager le lien de la carte » sur mobile | `navigator.share()` avec URL ; toast « Partagé » |  |
| 37 | Copier le lien (desktop) | Desktop : cliquer « Partager le lien de la carte » | Lien copié dans le presse-papier ; toast « Lien copié » |  |
| 38 | Partager le QR (mobile) | Cliquer « Partager le QR code » | PNG du QR partagé via Web Share |  |
| 39 | Télécharger le QR (desktop) | Desktop | QR téléchargé en PNG |  |
| 40 | Copier lien employé | Propriétaire de la carte : cliquer « Copier le lien employé » | Lien avec paramètre `employee=1` copié ; toast « Lien employé copié » |  |
| 41 | Lien employé masqué | Visiteur non-propriétaire | L'option « Copier le lien employé » n'apparaît pas |  |
| 42 | Incrément compteur de partage | Déclencher n'importe quelle action de partage | `POST /api/cards/increment-share/{email}` ; `shareCount` +1 |  |
| 43 | Fermeture du popover | Cliquer hors du popover | Popover se ferme |  |

---

## 4. QR code et contact vCard

| N° | Fonctionnalités | Description | Résultat attendu | Résultat des tests |
|----|----|----|----|----|
| 44 | Ouvrir le popover QR | Cliquer l'icône QR | Popover affiche le QR code généré |  |
| 45 | Contenu du QR | Scanner le QR avec un téléphone | Ouvre l'URL publique de la carte |  |
| 46 | Bouton « Enregistrer le contact » | Cliquer le bouton vert | Génère et propose un fichier `.vcf` |  |
| 47 | Contenu vCard | Ouvrir le `.vcf` dans l'app Contacts | Nom, prénom, poste, département, email, téléphone, fax, mobile présents |  |
| 48 | Nom du fichier vCard | Vérifier le fichier téléchargé | Format `prenom_nom.vcf` (caractères spéciaux remplacés par `_`) |  |
| 49 | vCard via Web Share | Sur mobile | `navigator.share()` avec fichier `.vcf` |  |
| 50 | vCard téléchargement | Sur desktop ou navigateur sans Web Share | Téléchargement direct du `.vcf` |  |

---

## 5. Autres actions carte

| N° | Fonctionnalités | Description | Résultat attendu | Résultat des tests |
|----|----|----|----|----|
| 51 | Bouton « Appeler » | Cliquer l'icône téléphone | Déclenche `tel:` vers mobile (ou téléphone fixe si mobile absent) |  |
| 52 | Bouton « Envoyer email » | Cliquer l'icône enveloppe | Ouvre le client mail avec `mailto:{email}` |  |
| 53 | Bouton « Télécharger la carte » | Cliquer l'icône téléchargement | Génère un PNG 1200×680 ; téléchargé sous `prenom_nom.png` |  |
| 54 | Qualité image PNG | Ouvrir le PNG téléchargé | Fond blanc, nette, 2× pixel ratio |  |
| 55 | Désactivation pendant génération | Pendant le téléchargement | Boutons désactivés (état « busy ») |  |

---

## 6. Administration — structure et navigation

| N° | Fonctionnalités | Description | Résultat attendu | Résultat des tests |
|----|----|----|----|----|
| 56 | Garde d'accès `/admin` | Accéder à `/admin` sans être connecté | Redirection vers `/login` |  |
| 57 | Structure interface admin | Connexion admin réussie | 4 onglets visibles : Cartes, Directions, Titres/Postes, Statistiques de partage |  |
| 58 | Onglet actif visuellement | Naviguer d'un onglet à l'autre | L'onglet courant apparaît en rouge sur fond rose clair |  |
| 59 | Titre d'entête | Onglet ouvert | « Gestion des cartes de visite » affiché en haut |  |
| 60 | Langue admin | Cliquer FR/EN dans l'entête | Tous les libellés admin basculent |  |
| 61 | Bouton thème | Cliquer l'icône soleil | Bouton réactif (thème dark non implémenté côté UI) |  |

---

## 7. Administration — Cartes

| N° | Fonctionnalités | Description | Résultat attendu | Résultat des tests |
|----|----|----|----|----|
| 62 | Chargement liste cartes | Ouvrir l'onglet Cartes | `GET /api/cards?limit=20&offset=0` ; tableau avec au plus 20 lignes |  |
| 63 | Colonnes tableau | Liste affichée | Email, Nom, Département, Titre, Actions |  |
| 64 | Compteur résultats | Liste chargée | « X résultat(s) » affiché en bas |  |
| 65 | Recherche | Saisir texte dans la barre de recherche | Appel avec `q=...` ; liste filtrée |  |
| 66 | Pagination précédent | Sur page ≥ 2 | Bouton « Précédent » actif ; retourne page précédente |  |
| 67 | Pagination suivant | Résultats > 20 | Bouton « Suivant » actif ; page suivante chargée |  |
| 68 | Indicateur « X / Y » | Pagination | Numéro de page courante / total affiché |  |
| 69 | Création d'une carte | Cliquer « Créer une carte » puis remplir et enregistrer | `POST /api/cards` ; carte apparaît dans la liste |  |
| 70 | Formulaire — section Identité | Formulaire ouvert | Email✱, Prénom, Nom |  |
| 71 | Formulaire — section Organisation | Formulaire ouvert | Sélecteurs Département, Titre/Poste avec bouton rafraîchir |  |
| 72 | Formulaire — section Contact | Formulaire ouvert | Téléphone fixe et Fax en lecture seule, Mobile modifiable |  |
| 73 | Labels associés | Cliquer sur un libellé | Le focus passe sur le champ associé (accessibilité OK) |  |
| 74 | Validation email requis | Soumettre formulaire sans email | Message rouge ; soumission bloquée |  |
| 75 | Validation format email | Email mal formé | Message rouge sur le champ |  |
| 76 | Édition d'une carte | Cliquer « Modifier » sur une ligne | Formulaire basculé en mode « Modifier une carte » ; champs pré-remplis ; scroll auto |  |
| 77 | Annulation édition | Cliquer « Annuler » | Formulaire réinitialisé ; aucune modification serveur |  |
| 78 | Enregistrement édition | Modifier un champ puis « Enregistrer » | `PUT /api/cards/{id}` ; liste mise à jour |  |
| 79 | Upsert par email | Créer 2 cartes avec le même email | La 2ème met à jour la 1ère (pas de doublon) |  |
| 80 | Suppression d'une carte | Cliquer « Supprimer » sur une ligne | Confirmation JS ; `DELETE /api/cards/{id}` ; carte retirée |  |
| 81 | Annulation suppression | Refuser la confirmation | Aucun appel serveur ; carte conservée |  |
| 82 | Sélection unitaire | Cocher une case ligne | Compteur « Supprimer (1) » apparaît |  |
| 83 | Sélection page entière | Cliquer « Tout sélectionner (page) » | Toutes les cases de la page cochées |  |
| 84 | Suppression en masse | Cocher plusieurs + « Supprimer (N) » | Confirmation ; `POST /api/cards/bulk-delete` ; lignes retirées |  |
| 85 | Rafraîchissement référentiels | Cliquer ↻ à côté des selects Département/Titre | `GET /api/departments` + `/api/job-titles` ; listes mises à jour |  |
| 86 | Notification email auto (SMTP actif) | Créer/modifier une carte alors que SMTP activé | Email de notification envoyé à l'employé |  |

---

## 8. Administration — Import / Export Excel

| N° | Fonctionnalités | Description | Résultat attendu | Résultat des tests |
|----|----|----|----|----|
| 87 | Téléchargement modèle Excel | Cliquer « Modèle Excel » | `GET /api/admin/data-template?scope=cards` ; fichier `modele-cartes.xlsx` téléchargé |  |
| 88 | Contenu du modèle | Ouvrir le fichier | En-têtes : `email, first_name, last_name, company, title, phone, fax, mobile, department_fr, department_en, job_title_fr, job_title_en` + ligne exemple |  |
| 89 | Import Excel | Cliquer « Importer » puis sélectionner un `.xlsx` valide | `POST /api/admin/data-import?scope=cards` ; toast vert « X carte(s) importée(s) avec succès » |  |
| 90 | Import CSV | Importer un `.csv` avec les mêmes colonnes | Même comportement que `.xlsx` |  |
| 91 | Avertissements import | Import avec lignes invalides (email manquant, etc.) | Liste des avertissements affichée dans le toast |  |
| 92 | Erreur import | Fichier inexploitable | Message rouge avec raison retournée par le serveur |  |
| 93 | Création auto direction/titre | Import avec un département inconnu | Direction créée automatiquement ; avertissement « created automatically » |  |
| 94 | Upsert par email à l'import | Réimporter un fichier déjà importé | Les cartes existantes sont mises à jour, pas dupliquées |  |
| 95 | Export Excel | Cliquer « Exporter (Excel) » | Fichier `cartes.xlsx` téléchargé |  |
| 96 | Export CSV | Cliquer « Exporter (CSV) » | Fichier `cartes.csv` téléchargé (UTF-8 BOM, séparateur `;`) |  |
| 97 | Format hint | Lire la ligne d'aide sous les boutons | Description des colonnes attendues affichée |  |
| 98 | Fermeture du message transfert | Cliquer × sur le toast vert | Message effacé |  |

---

## 9. Administration — Gestion directions / départements

| N° | Fonctionnalités | Description | Résultat attendu | Résultat des tests |
|----|----|----|----|----|
| 99 | Ouvrir l'onglet Directions | Cliquer l'onglet | URL `/admin/departments` ; liste affichée |  |
| 100 | Colonnes liste | Tableau affiché | Libellé FR, Libellé EN, Actions |  |
| 101 | Message liste vide | Base sans direction | « Aucune direction enregistrée » |  |
| 102 | Ajout direction | Cliquer « Ajouter une direction » puis remplir et enregistrer | `POST /api/departments` ; entrée en liste |  |
| 103 | Validation libellés | Soumettre sans libellé | Messages d'erreur sur FR et EN |  |
| 104 | Modification direction | Cliquer « Modifier » sur une ligne | Formulaire pré-rempli ; `PUT /api/departments/{id}` |  |
| 105 | Suppression direction | Cliquer « Supprimer » | Confirmation ; `DELETE /api/departments/{id}` ; entrée retirée |  |
| 106 | Recherche directions | Saisir dans la barre | Liste filtrée (param `q`) |  |

---

## 10. Administration — Gestion titres / postes

| N° | Fonctionnalités | Description | Résultat attendu | Résultat des tests |
|----|----|----|----|----|
| 107 | Ouvrir l'onglet Titres/Postes | Cliquer l'onglet | URL `/admin/job-titles` ; liste affichée |  |
| 108 | Ajout titre | Cliquer « Ajouter un titre » puis enregistrer | `POST /api/job-titles` ; entrée en liste |  |
| 109 | Modification titre | Cliquer « Modifier » | `PUT /api/job-titles/{id}` |  |
| 110 | Suppression titre | Cliquer « Supprimer » | Confirmation ; `DELETE /api/job-titles/{id}` |  |
| 111 | Message liste vide | Base sans titre | « Aucun titre / poste enregistré » |  |

---

## 11. Administration — Statistiques de partage

| N° | Fonctionnalités | Description | Résultat attendu | Résultat des tests |
|----|----|----|----|----|
| 112 | Ouvrir l'onglet Statistiques | Cliquer l'onglet | Cartes chargées avec `shareCount` |  |
| 113 | Total des partages | Entête | « Total des partages : X » calculé |  |
| 114 | Recherche | Saisir un nom/email | Lignes filtrées côté client |  |
| 115 | Tri Nom | Cliquer l'entête Nom | Tri alphabétique ascendant |  |
| 116 | Tri Email | Cliquer l'entête Email | Tri ascendant par email |  |
| 117 | Tri Partages | Cliquer l'entête Nombre de partages | Tri numérique |  |
| 118 | Inversion tri | Recliquer la même colonne | Ordre inversé ; flèche pivotée |  |
| 119 | Accessibilité entêtes triables | Naviguer au clavier (Tab + Enter) | Entêtes activables au clavier (balise `<button>`) |  |
| 120 | Message liste vide | Aucun résultat | « Aucune carte trouvée » |  |

---

## 12. Administration — Configuration SMTP

> Accessible via l'URL directe `/admin/smtp` (API : `/api/admin/smtp-settings`).

| N° | Fonctionnalités | Description | Résultat attendu | Résultat des tests |
|----|----|----|----|----|
| 121 | Chargement config | Ouvrir la page | `GET /api/admin/smtp-settings` ; champs pré-remplis |  |
| 122 | Checkbox notifications auto | Cocher/décocher | Active/désactive l'envoi automatique après création/modification |  |
| 123 | Champs connexion | Saisir hôte, port, protocole, user | Valeurs conservées par le formulaire |  |
| 124 | Mot de passe — conservation | Laisser le champ vide | Le mot de passe stocké n'est pas écrasé |  |
| 125 | Mot de passe — effacement | Cocher « Effacer le mot de passe stocké » et enregistrer | Mot de passe supprimé côté serveur |  |
| 126 | Checkboxes TLS | Activer SMTP Auth / STARTTLS / SSL | Valeurs envoyées en PUT ; persistées |  |
| 127 | Enregistrement config | Cliquer « Enregistrer » | `PUT /api/admin/smtp-settings` 200 ; message « Configuration SMTP enregistrée » |  |
| 128 | Validation des champs | Champ port hors 1–65535 ou email expéditeur invalide | Message « Veuillez corriger les champs invalides » |  |
| 129 | Test SMTP | Saisir email destinataire puis « Envoyer un test » | `POST /api/admin/smtp-settings/test` ; message « Email de test envoyé » ; email reçu |  |
| 130 | Test SMTP — destinataire manquant | Cliquer « Envoyer un test » sans email | Message « Veuillez saisir l'email destinataire du test » |  |
| 131 | Test SMTP — erreur serveur | SMTP injoignable | Message « Impossible d'envoyer l'email de test » |  |

---

## 13. Session et sécurité

| N° | Fonctionnalités | Description | Résultat attendu | Résultat des tests |
|----|----|----|----|----|
| 132 | Cookie HttpOnly | Inspecter le cookie `vcard_admin_session` | Flag `HttpOnly` présent ; non lisible en JS |  |
| 133 | Cookie SameSite | Inspecter le cookie | Attribut `SameSite` défini (valeur selon config) |  |
| 134 | Expiration session | Modifier manuellement la date système de +9 h ou attendre | Cookie expiré ; accès admin retourne 401 puis `/login` |  |
| 135 | Protection CSRF | Envoyer un POST admin depuis un autre domaine | 403 / rejet par le filtre CSRF |  |
| 136 | Rate limiter login | Lancer 10 logins parallèles | Certaines requêtes reçoivent 429 |  |
| 137 | Logout côté client | Cliquer « Déconnexion » | Cookie retiré (`Max-Age=0`) ; impossible de revenir sur `/admin/cards` sans relogin |  |

---

## 14. Internationalisation et persistance UI

| N° | Fonctionnalités | Description | Résultat attendu | Résultat des tests |
|----|----|----|----|----|
| 138 | Langue par défaut | Premier accès (localStorage vide) | Interface en français |  |
| 139 | Basculement FR ↔ EN | Cliquer le bouton FR/EN | Libellés, placeholders et messages d'erreur basculent intégralement |  |
| 140 | Persistance de la langue | Rafraîchir la page après bascule | La langue choisie est réappliquée |  |
| 141 | Libellés dynamiques bilingues | Carte avec `labelFr` / `labelEn` | Le label correspondant à la langue est affiché ; fallback sur l'autre si vide |  |

---

## 15. Responsivité et accessibilité

| N° | Fonctionnalités | Description | Résultat attendu | Résultat des tests |
|----|----|----|----|----|
| 142 | Layout mobile | Réduire la fenêtre < 640 px | Pas de débordement horizontal ; boutons accessibles |  |
| 143 | Layout desktop | Fenêtre > 1024 px | Tableau pleine largeur ; mise en page confortable |  |
| 144 | Navigation clavier — formulaires | `Tab` dans les formulaires admin | Focus visible ; chaque champ accessible ; `Enter` soumet |  |
| 145 | Navigation clavier — entêtes triables | `Tab` puis `Enter` sur un entête Statistiques | Tri activé au clavier (entête = `<button>`) |  |
| 146 | Labels accessibles | Inspecter les champs admin cartes | Chaque `<input>` a un `<label for="...">` associé |  |
| 147 | Popovers et propagation clavier | Ouvrir le menu partage puis appuyer sur `Esc`/`Tab` | Le popover ne se referme pas accidentellement en tapant à l'intérieur |  |

---

## 16. Notifications et retours utilisateur

| N° | Fonctionnalités | Description | Résultat attendu | Résultat des tests |
|----|----|----|----|----|
| 148 | Toast copie de lien | Action de copie exécutée | « Lien copié dans le presse-papier » 2,5 s |  |
| 149 | Toast image téléchargée | Téléchargement réussi | « Image téléchargée » 2,5 s |  |
| 150 | Toast partagé | Partage Web Share réussi | « Partagé » 2,5 s |  |
| 151 | Toast import cartes | Import réussi | « X carte(s) importée(s) avec succès » + liste d'avertissements |  |
| 152 | Bannière erreur import | Import échoué | Message rouge avec raison |  |
| 153 | Bannière erreur SMTP | Save ou test SMTP échoué | Message rouge spécifique |  |
| 154 | Confirmations suppression | Suppression unitaire ou en masse | `confirm()` JS affiche la question avant action |  |

---

## Protocole de test recommandé

1. **Pré-requis** : déployer l'application (`docker compose up`), créer au moins 1 département, 1 titre et 1 carte de test ; initialiser le compte admin via variables d'environnement.
2. **Environnements à couvrir** :
   - Navigateurs desktop : Chrome, Firefox, Edge, Safari (version N et N-1).
   - Navigateurs mobiles : Safari iOS, Chrome Android.
3. **Données de test** : un fichier `cartes-test.xlsx` (10 lignes dont 1 email manquant, 1 département inconnu) pour couvrir les chemins heureux + warnings.
4. **Compte SMTP** : Mailtrap ou Ethereal pour vérifier les notifications sans polluer les boîtes réelles.
5. **Chaque test** doit être exécuté :
   - en FR puis en EN,
   - avec un utilisateur admin,
   - et en mode employé (quand applicable).
6. **Consigner** le résultat dans la dernière colonne (OK / KO) et joindre une capture en cas de KO.
