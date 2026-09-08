# Chess Online

Jeu d'échecs 2 joueurs en ligne, sans compte, avec Node.js, Express, Socket.IO et Canvas.

## 1. Installation

Installer Node.js 18 ou plus récent.

Dans le dossier du projet :

```bash
npm install
npm start
```

Ouvrir ensuite :

```text
http://localhost:3000
```

Pour tester à deux sur le même PC : ouvrir deux fenêtres/onglets, créer une partie dans la première, puis saisir le code dans la seconde.

## 2. Fonctionnalités

- 2 joueurs exactement par salon.
- Code de salon de 6 caractères.
- Attribution automatique Blancs / Noirs.
- Reconnexion par jeton stocké dans `localStorage`.
- Échiquier Canvas responsive.
- Interface tactile et souris.
- Échiquier inversé pour les Noirs.
- Validation serveur des coups.
- Échec, mat, pat.
- Roque court et long.
- Prise en passant.
- Promotion en Reine, Tour, Fou ou Cavalier.
- Horloge de 1 à 5 minutes par joueur.
- Sons et musique synthétisés avec Web Audio API.
- Nettoyage des salons abandonnés.

## 3. Déploiement Render

1. Créer un dépôt GitHub et y envoyer le dossier `chess-online`.
2. Dans Render, choisir **New > Web Service**.
3. Sélectionner le dépôt GitHub.
4. Build Command :

```text
npm install
```

5. Start Command :

```text
npm start
```

6. Déployer.

Le serveur écoute `process.env.PORT` et utilise `3000` par défaut en local.

## 4. Railway

Importer le dépôt GitHub. Railway détectera Node.js. La commande de démarrage est :

```text
npm start
```

Railway fournit automatiquement `PORT`.

## 5. Architecture

```text
chess-online/
├── server/
│   ├── server.js
│   ├── rooms.js
│   └── chessEngine.js
├── public/
│   ├── index.html
│   ├── style.css
│   ├── audio.js
│   ├── menu.js
│   └── game.js
├── package.json
├── .gitignore
└── README.md
```

## 6. Sécurité

Le navigateur n'envoie que le déplacement demandé (`from`, `to`, et éventuellement la promotion). Le serveur vérifie la couleur, le tour, la légalité du coup, l'échec du roi et les règles spéciales avant de modifier la partie.

Le score et l'état de l'échiquier ne sont jamais acceptés depuis le client.

## 7. Limites de cette première version

Les salons sont conservés en mémoire. Un redémarrage du serveur supprime les parties en cours. Pour une infrastructure multi-instance ou une persistance longue durée, il faudra ajouter Redis ou une base de données.

Le contrôle principal est « toucher/glisser conceptuellement » via Pointer Events : sur téléphone, toucher la pièce puis la destination est le mode recommandé. Une vraie prévisualisation de trajectoire n'est pas nécessaire aux échecs et n'est donc pas ajoutée.

## 8. Test Internet

Après déploiement :

- Joueur 1 ouvre l'URL et crée une partie.
- Il partage le code de 6 caractères.
- Joueur 2 ouvre la même URL sur son téléphone ou ordinateur.
- Il saisit le code.
- Les Blancs commencent.
