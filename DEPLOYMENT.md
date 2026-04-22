# Guide de déploiement — DigitalCardApp

Ce guide explique comment déployer **DigitalCardApp** sur **Ubuntu** (20.04 / 22.04 / 24.04) et **Windows** (10 / 11 / Server 2019+).

L'application comprend trois composants :

| Composant          | Technologie                          | Port interne | Port exposé (Docker) |
|--------------------|--------------------------------------|--------------|----------------------|
| `digital-card-web` | Angular 17 servi par Nginx           | 8080         | **8766**             |
| `vcard-api`        | Spring Boot 3.4.5 / Java 17          | 9999         | **8767**             |
| `db`               | PostgreSQL 16                        | 5432         | **5555**             |

Deux modes de déploiement sont documentés :

1. **Déploiement Docker** (recommandé — identique sur Ubuntu et Windows).
2. **Déploiement natif** (installation manuelle de Java, Node, PostgreSQL).

---

## 1. Pré-requis communs

| Outil                 | Version minimale | Vérification            |
|-----------------------|------------------|-------------------------|
| Git                   | 2.30+            | `git --version`         |
| Docker Engine         | 24+              | `docker --version`      |
| Docker Compose plugin | v2+              | `docker compose version`|

**Pour le déploiement natif uniquement :**

| Outil        | Version     | Vérification          |
|--------------|-------------|------------------------|
| JDK          | 17          | `java -version`        |
| Maven        | 3.9+        | `mvn -version`         |
| Node.js      | 20 LTS      | `node -v`              |
| npm          | 10+         | `npm -v`               |
| PostgreSQL   | 16          | `psql --version`       |

---

## 2. Récupération du code source

```bash
git clone <URL_DU_DEPOT> DigitalCardApp
cd DigitalCardApp
```

Structure du projet :

```
DigitalCardApp/
├── docker-compose.yml        # Orchestration des 3 services
├── vcard-api/                # Backend Spring Boot
├── digital-card-web/         # Frontend Angular
└── DEPLOYMENT.md             # Ce fichier
```

---

# PARTIE A — Déploiement avec Docker (recommandé)

Méthode **identique** sur Ubuntu et Windows. Elle installe automatiquement PostgreSQL, compile et démarre le backend et le frontend dans des conteneurs isolés.

## A.1. Installation de Docker

### Sur Ubuntu

```bash
# Mise à jour du système
sudo apt update && sudo apt upgrade -y

# Dépendances
sudo apt install -y ca-certificates curl gnupg

# Clé et dépôt officiels Docker
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Installation
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Autoriser votre utilisateur à lancer Docker sans sudo
sudo usermod -aG docker $USER
newgrp docker

# Vérification
docker --version
docker compose version
```

### Sur Windows

1. Télécharger **Docker Desktop for Windows** : <https://www.docker.com/products/docker-desktop/>
2. Activer **WSL 2** (exigé par Docker Desktop) :
   ```powershell
   wsl --install
   ```
   Redémarrer la machine.
3. Installer Docker Desktop, cocher **« Use WSL 2 based engine »**.
4. Lancer Docker Desktop et attendre le statut **Running**.
5. Vérifier dans PowerShell :
   ```powershell
   docker --version
   docker compose version
   ```

## A.2. Configuration de production

Avant le premier démarrage, **ouvrir `docker-compose.yml`** et adapter les variables sensibles :

```yaml
backend:
  environment:
    ADMIN_EMAIL: admin@votre-domaine.com
    ADMIN_PASSWORD: <MOT_DE_PASSE_FORT>
    ADMIN_SESSION_SECRET: <CHAINE_ALEATOIRE_64_CARACTERES_MIN>
    CORS_ORIGINS: https://votre-domaine.com
    PGPASSWORD: <MOT_DE_PASSE_POSTGRES_FORT>
    APP_COOKIE_SECURE: "true"     # Obligatoire si HTTPS
    APP_COOKIE_SAME_SITE: "Strict"

db:
  environment:
    POSTGRES_PASSWORD: <MOT_DE_PASSE_POSTGRES_FORT>  # doit être identique à PGPASSWORD
```

> **Astuce** : pour générer un secret de session :
> - Ubuntu : `openssl rand -base64 64`
> - Windows (PowerShell) : `[Convert]::ToBase64String((1..64 | % {Get-Random -Max 256}))`

## A.3. Construction et lancement

Depuis la racine du projet :

```bash
docker compose up --build -d
```

Suivre les logs :

```bash
docker compose logs -f
```

Vérifier que les 3 services sont `Up (healthy)` :

```bash
docker compose ps
```

## A.4. Vérification

| Service          | URL locale                                        |
|------------------|---------------------------------------------------|
| Frontend         | <http://localhost:8766>                           |
| API backend      | <http://localhost:8767/api>                       |
| Swagger UI       | <http://localhost:8766/swagger-ui/index.html>     |
| Healthcheck API  | <http://localhost:8767/actuator/health>           |
| PostgreSQL       | `localhost:5555` (user: `vcard`, db: `vcard`)     |

Si vous déployez sur un serveur distant, remplacez `localhost` par l'IP/hostname du serveur et **ouvrez les ports** correspondants sur le pare-feu (voir section C).

## A.5. Commandes utiles

```bash
# Arrêt propre
docker compose down

# Arrêt + suppression du volume Postgres (⚠ efface les données)
docker compose down -v

# Redémarrage d'un seul service
docker compose restart backend

# Recompiler après un pull Git
git pull
docker compose up --build -d

# Accéder à la base
docker compose exec db psql -U vcard -d vcard
```

---

# PARTIE B — Déploiement natif

À utiliser si vous ne pouvez pas exécuter Docker (environnement restreint, VPS minimal, etc.).

## B.1. Déploiement natif sur Ubuntu

### B.1.1. Installation de Java 17

```bash
sudo apt update
sudo apt install -y openjdk-17-jdk maven
java -version   # doit afficher 17.x
mvn -version
```

### B.1.2. Installation de Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v   # doit afficher v20.x
```

### B.1.3. Installation de PostgreSQL 16

```bash
sudo apt install -y postgresql-common
sudo /usr/share/postgresql-common/pgdg/apt.postgresql.org.sh -y
sudo apt install -y postgresql-16

sudo systemctl enable --now postgresql

# Création de la base et de l'utilisateur
sudo -u postgres psql <<EOF
CREATE USER vcard WITH PASSWORD 'VOTRE_MOT_DE_PASSE';
CREATE DATABASE vcard OWNER vcard;
GRANT ALL PRIVILEGES ON DATABASE vcard TO vcard;
\c vcard
CREATE EXTENSION IF NOT EXISTS pgcrypto;
EOF
```

### B.1.4. Build et lancement du backend

```bash
cd vcard-api
./mvnw clean package -DskipTests
```

L'artefact produit : `vcard-api/target/cardyo-backend-0.0.1-SNAPSHOT.jar`.

Créer un fichier d'environnement `/etc/cardyo.env` :

```bash
sudo tee /etc/cardyo.env >/dev/null <<'EOF'
PGHOST=localhost
PGPORT=5432
PGDATABASE=vcard
PGUSER=vcard
PGPASSWORD=VOTRE_MOT_DE_PASSE
ADMIN_EMAIL=admin@votre-domaine.com
ADMIN_PASSWORD=MotDePasseFort
ADMIN_SESSION_SECRET=ChaineAleatoireLongue
CORS_ORIGINS=https://votre-domaine.com
APP_COOKIE_SECURE=true
APP_COOKIE_SAME_SITE=Strict
EOF
sudo chmod 600 /etc/cardyo.env
```

Créer le service systemd `/etc/systemd/system/cardyo-backend.service` :

```ini
[Unit]
Description=Cardyo Backend (Spring Boot)
After=network.target postgresql.service
Requires=postgresql.service

[Service]
Type=simple
User=cardyo
EnvironmentFile=/etc/cardyo.env
WorkingDirectory=/opt/cardyo
ExecStart=/usr/bin/java -jar /opt/cardyo/cardyo-backend.jar
SuccessExitStatus=143
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
# Créer l'utilisateur dédié et déployer le jar
sudo useradd --system --shell /usr/sbin/nologin cardyo
sudo mkdir -p /opt/cardyo
sudo cp target/cardyo-backend-0.0.1-SNAPSHOT.jar /opt/cardyo/cardyo-backend.jar
sudo chown -R cardyo:cardyo /opt/cardyo

# Activer et démarrer
sudo systemctl daemon-reload
sudo systemctl enable --now cardyo-backend
sudo systemctl status cardyo-backend
```

### B.1.5. Build du frontend

```bash
cd ../digital-card-web
npm ci
npm run build
```

Fichiers statiques produits : `digital-card-web/dist/digital-card-web/browser/`.

### B.1.6. Configuration de Nginx

```bash
sudo apt install -y nginx

# Copier les fichiers statiques
sudo mkdir -p /var/www/cardyo
sudo cp -r dist/digital-card-web/browser/* /var/www/cardyo/
sudo chown -R www-data:www-data /var/www/cardyo
```

Créer `/etc/nginx/sites-available/cardyo` :

```nginx
server {
    listen 80;
    server_name votre-domaine.com;

    root /var/www/cardyo;
    index index.html;

    # Routage SPA
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy vers le backend
    location /api/ {
        proxy_pass         http://127.0.0.1:9999;
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }

    location /v3/api-docs    { proxy_pass http://127.0.0.1:9999; }
    location /swagger-ui/    { proxy_pass http://127.0.0.1:9999; }
}
```

Activer le site :

```bash
sudo ln -s /etc/nginx/sites-available/cardyo /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### B.1.7. HTTPS avec Let's Encrypt (fortement recommandé)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d votre-domaine.com
```

Certbot renouvellera automatiquement le certificat. Après activation HTTPS, vérifier que `APP_COOKIE_SECURE=true` est bien défini dans `/etc/cardyo.env`, puis :

```bash
sudo systemctl restart cardyo-backend
```

---

## B.2. Déploiement natif sur Windows

### B.2.1. Installation des outils

Via **winget** (PowerShell administrateur) :

```powershell
winget install EclipseAdoptium.Temurin.17.JDK
winget install Apache.Maven
winget install OpenJS.NodeJS.LTS
winget install PostgreSQL.PostgreSQL.16
winget install Git.Git
```

Fermer puis rouvrir PowerShell pour rafraîchir le `PATH`. Vérifier :

```powershell
java -version
mvn -version
node -v
psql --version
```

### B.2.2. Création de la base de données

Lancer **pgAdmin** ou ouvrir un terminal :

```powershell
psql -U postgres
```

```sql
CREATE USER vcard WITH PASSWORD 'VOTRE_MOT_DE_PASSE';
CREATE DATABASE vcard OWNER vcard;
\c vcard
CREATE EXTENSION IF NOT EXISTS pgcrypto;
\q
```

### B.2.3. Build du backend

```powershell
cd vcard-api
.\mvnw.cmd clean package -DskipTests
```

Artefact : `vcard-api\target\cardyo-backend-0.0.1-SNAPSHOT.jar`.

### B.2.4. Lancement du backend comme service Windows

Créer un fichier `run-backend.ps1` :

```powershell
$env:PGHOST = "localhost"
$env:PGPORT = "5432"
$env:PGDATABASE = "vcard"
$env:PGUSER = "vcard"
$env:PGPASSWORD = "VOTRE_MOT_DE_PASSE"
$env:ADMIN_EMAIL = "admin@votre-domaine.com"
$env:ADMIN_PASSWORD = "MotDePasseFort"
$env:ADMIN_SESSION_SECRET = "ChaineAleatoireLongue"
$env:CORS_ORIGINS = "https://votre-domaine.com"
$env:APP_COOKIE_SECURE = "true"
$env:APP_COOKIE_SAME_SITE = "Strict"

java -jar "C:\cardyo\cardyo-backend.jar"
```

Pour en faire un vrai **service Windows**, utiliser [NSSM](https://nssm.cc/) :

```powershell
# Après avoir placé nssm.exe dans le PATH
nssm install CardyoBackend "C:\Program Files\Eclipse Adoptium\jdk-17\bin\java.exe" "-jar C:\cardyo\cardyo-backend.jar"
nssm set CardyoBackend AppDirectory C:\cardyo
nssm set CardyoBackend AppEnvironmentExtra PGHOST=localhost PGPORT=5432 PGDATABASE=vcard PGUSER=vcard PGPASSWORD=VOTRE_MOT_DE_PASSE ADMIN_SESSION_SECRET=ChaineAleatoireLongue
nssm start CardyoBackend
```

Vérifier dans **services.msc** que `CardyoBackend` est bien en cours d'exécution.

### B.2.5. Build du frontend

```powershell
cd ..\digital-card-web
npm ci
npm run build
```

Fichiers produits dans `digital-card-web\dist\digital-card-web\browser\`.

### B.2.6. Hébergement du frontend (IIS ou Nginx pour Windows)

**Option 1 — IIS** (recommandé sur Windows Server) :

1. Installer IIS : **Panneau de configuration → Activer/désactiver les fonctionnalités Windows → Internet Information Services**.
2. Installer **URL Rewrite** : <https://www.iis.net/downloads/microsoft/url-rewrite>.
3. Installer **Application Request Routing (ARR)** : <https://www.iis.net/downloads/microsoft/application-request-routing>.
4. Copier `digital-card-web\dist\digital-card-web\browser\*` vers `C:\inetpub\wwwroot\cardyo`.
5. Créer un `web.config` dans ce répertoire pour gérer le routage SPA et le proxy API :

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="API proxy" stopProcessing="true">
          <match url="^api/(.*)" />
          <action type="Rewrite" url="http://localhost:9999/api/{R:1}" />
        </rule>
        <rule name="Angular SPA" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
          </conditions>
          <action type="Rewrite" url="/index.html" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>
```

6. Dans **IIS Manager** :
   - Créer un site pointant vers `C:\inetpub\wwwroot\cardyo`.
   - Activer **Proxy** au niveau du serveur (ARR → Server Proxy Settings → Enable proxy).

**Option 2 — Nginx pour Windows** : télécharger <https://nginx.org/en/download.html> et utiliser la même configuration que celle fournie pour Ubuntu (adapter les chemins avec `/`).

### B.2.7. HTTPS sur Windows

- Avec IIS : importer un certificat via **IIS Manager → Liaisons → Ajouter HTTPS**.
- Pour Let's Encrypt, utiliser [win-acme](https://www.win-acme.com/) : `wacs.exe` en mode interactif.

---

# PARTIE C — Tâches post-déploiement

## C.1. Ouverture du pare-feu

### Ubuntu (UFW)

```bash
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
# Optionnel : ports Docker si accès direct nécessaire
sudo ufw allow 8766/tcp
sudo ufw allow 8767/tcp
sudo ufw enable
sudo ufw status
```

### Windows

```powershell
New-NetFirewallRule -DisplayName "HTTP"  -Direction Inbound -Protocol TCP -LocalPort 80  -Action Allow
New-NetFirewallRule -DisplayName "HTTPS" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow
```

## C.2. Premier login

1. Ouvrir `https://votre-domaine.com`.
2. Se connecter à l'espace admin avec les identifiants définis dans `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
3. Configurer le SMTP via l'interface (table `smtp_settings`) pour activer l'envoi d'emails.

## C.3. Sauvegarde de la base

### Docker

```bash
docker compose exec db pg_dump -U vcard vcard > backup_$(date +%F).sql
```

### Natif Ubuntu

```bash
sudo -u postgres pg_dump vcard > backup_$(date +%F).sql
```

### Natif Windows

```powershell
pg_dump -U vcard -F c -b -v -f "C:\backups\vcard_$(Get-Date -Format yyyy-MM-dd).backup" vcard
```

Automatiser via **cron** (Ubuntu) ou **Planificateur de tâches** (Windows).

## C.4. Mise à jour applicative

```bash
git pull
# Mode Docker :
docker compose up --build -d
# Mode natif :
# 1) rebuilder le jar et les assets Angular
# 2) redémarrer cardyo-backend et recharger Nginx/IIS
```

Les migrations Flyway s'exécutent automatiquement au démarrage du backend.

## C.5. Journaux

| Mode     | Backend                                   | Frontend / Nginx                        |
|----------|-------------------------------------------|-----------------------------------------|
| Docker   | `docker compose logs -f backend`          | `docker compose logs -f frontend`       |
| Ubuntu   | `journalctl -u cardyo-backend -f`         | `/var/log/nginx/access.log` + `error.log` |
| Windows  | Observateur d'événements → Applications   | IIS : `C:\inetpub\logs\LogFiles\`       |

---

# PARTIE D — Dépannage

| Symptôme                                 | Cause probable                                    | Correction                                                                 |
|------------------------------------------|---------------------------------------------------|----------------------------------------------------------------------------|
| `Connection refused` vers PostgreSQL     | Mauvais `PGHOST`/`PGPORT`, service arrêté         | Vérifier `systemctl status postgresql` ou `docker compose ps`              |
| Flyway échoue au démarrage               | Schéma modifié manuellement, migration en échec   | Corriger la migration fautive ou `flyway repair`                           |
| Login admin refusé                       | `ADMIN_PASSWORD` non appliqué                     | Redémarrer le backend après modification des variables                     |
| Erreur CORS côté navigateur              | Origine absente de `CORS_ORIGINS`                 | Ajouter l'URL frontend dans `CORS_ORIGINS` et redémarrer le backend        |
| Cookies non envoyés en HTTPS             | `APP_COOKIE_SECURE=false`                         | Passer à `true` en HTTPS                                                   |
| Port 8766/8767 déjà utilisé              | Autre service local                               | Modifier le mapping dans `docker-compose.yml`                              |
| Build Angular échoue (`ENOMEM`)          | Mémoire insuffisante                              | `NODE_OPTIONS="--max-old-space-size=4096" npm run build`                   |

---

# PARTIE E — Checklist de mise en production

- [ ] `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, `PGPASSWORD` changés depuis les valeurs par défaut
- [ ] `CORS_ORIGINS` limité au(x) domaine(s) réel(s)
- [ ] HTTPS activé (Let's Encrypt / certificat d'entreprise)
- [ ] `APP_COOKIE_SECURE=true` et `APP_COOKIE_SAME_SITE=Strict`
- [ ] Pare-feu configuré, seuls 80/443 exposés publiquement
- [ ] Sauvegarde PostgreSQL planifiée
- [ ] Supervision / monitoring actif (Actuator, logs centralisés)
- [ ] Plan de mise à jour documenté et testé
