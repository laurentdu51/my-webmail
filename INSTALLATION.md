# Guide d'Installation - Messagerie Email Web

## Prérequis

- Node.js 18+ et npm
- Un compte Supabase (gratuit)
- Accès à un serveur IMAP (votre serveur local)
- Accès à un serveur SMTP pour l'envoi

## Installation

### 1. Cloner ou télécharger le projet

```bash
# Si vous avez git
git clone <url-du-projet>
cd <nom-du-projet>

# Ou décompressez l'archive téléchargée
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configuration Supabase

#### 3.1 Créer un projet Supabase

1. Allez sur [https://supabase.com](https://supabase.com)
2. Créez un compte gratuit si nécessaire
3. Créez un nouveau projet
4. Notez l'URL du projet et la clé anonyme (anon key)

#### 3.2 Configurer le fichier .env

Ouvrez le fichier `.env` et modifiez les valeurs :

```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_cle_anon_key_ici
```

#### 3.3 Appliquer les migrations de base de données

Dans le dashboard Supabase :

1. Allez dans "SQL Editor"
2. Copiez le contenu du fichier `supabase/migrations/20251016171651_create_email_accounts.sql`
3. Collez-le dans l'éditeur SQL
4. Exécutez la requête

#### 3.4 Déployer les Edge Functions

Les Edge Functions permettent de se connecter aux serveurs IMAP/SMTP de manière sécurisée.

**Fonction IMAP (lecture des emails):**

1. Dans Supabase, allez dans "Edge Functions"
2. Créez une nouvelle fonction nommée `imap-fetch`
3. Copiez le contenu de `supabase/functions/imap-fetch/index.ts`
4. Déployez la fonction

**Fonction SMTP (envoi d'emails):**

1. Créez une nouvelle fonction nommée `smtp-send`
2. Copiez le contenu de `supabase/functions/smtp-send/index.ts`
3. Déployez la fonction

### 4. Lancer l'application

#### En développement

```bash
npm run dev
```

L'application sera accessible sur `http://localhost:5173`

#### En production

```bash
# Construire l'application
npm run build

# Les fichiers de production sont dans le dossier dist/
# Déployez le contenu du dossier dist/ sur votre serveur web
```

## Configuration de votre compte email

### 1. Créer un compte utilisateur

1. Ouvrez l'application dans votre navigateur
2. Cliquez sur "S'inscrire"
3. Entrez votre email et mot de passe
4. Connectez-vous

### 2. Ajouter votre compte email

Après connexion, configurez votre compte email :

#### Configuration IMAP (Réception)
- **Serveur IMAP** : Adresse de votre serveur local (ex: `mail.votredomaine.com` ou `192.168.1.100`)
- **Port IMAP** : Généralement `993` (IMAP SSL) ou `143` (IMAP STARTTLS)
- **Nom d'utilisateur** : Votre identifiant IMAP
- **Mot de passe** : Votre mot de passe IMAP

#### Configuration SMTP (Envoi)
- **Serveur SMTP** : Adresse de votre serveur SMTP externe (ex: `smtp.gmail.com`)
- **Port SMTP** : Généralement `587` (STARTTLS) ou `465` (SSL)
- **Nom d'utilisateur** : Votre identifiant SMTP
- **Mot de passe** : Votre mot de passe SMTP
- **Utiliser TLS/SSL** : Coché (recommandé)

### 3. Exemples de configuration

#### Pour Gmail (SMTP uniquement)
- Serveur SMTP : `smtp.gmail.com`
- Port : `587`
- Utilisateur : votre adresse Gmail
- Mot de passe : mot de passe d'application (pas votre mot de passe Gmail normal)

#### Pour un serveur local
- Serveur IMAP : `192.168.1.100` ou `mail.local`
- Port IMAP : `993`
- Utilisateur : selon votre configuration serveur
- Mot de passe : selon votre configuration serveur

## Déploiement en production

### Option 1 : Netlify

```bash
npm run build
# Glissez-déposez le dossier dist/ sur Netlify
```

### Option 2 : Vercel

```bash
npm install -g vercel
vercel
```

### Option 3 : Serveur web classique

```bash
npm run build
# Copiez le contenu du dossier dist/ vers votre serveur web
# Configurez votre serveur (Apache/Nginx) pour servir les fichiers
```

## Dépannage

### Problème : "Cannot connect to IMAP server"

- Vérifiez que le serveur IMAP est accessible depuis Internet
- Vérifiez les identifiants et le port
- Assurez-vous que le pare-feu autorise les connexions

### Problème : "Failed to send email"

- Vérifiez les paramètres SMTP
- Certains fournisseurs (Gmail) nécessitent des "mots de passe d'application"
- Vérifiez que le serveur SMTP accepte les connexions

### Problème : "Not authenticated"

- Déconnectez-vous et reconnectez-vous
- Vérifiez que la configuration Supabase est correcte dans le fichier .env

## Sécurité

- Les mots de passe sont stockés dans la base de données Supabase
- Les connexions utilisent HTTPS en production
- Les Edge Functions sécurisent les connexions IMAP/SMTP
- Activez l'authentification à deux facteurs sur Supabase (recommandé)

## Support

Pour toute question, consultez la documentation de :
- [Supabase](https://supabase.com/docs)
- [Vite](https://vitejs.dev/)
- [React](https://react.dev/)
