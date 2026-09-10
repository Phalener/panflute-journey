# Panflute Journey 🏔️

Una web app per pubblicare e ascoltare album di panflute tradizionale: un'area
pubblica dove i visitatori sfogliano copertine e ascoltano gli album, e una
dashboard privata da cui l'admin carica album, copertine e MP3.

```
Homepage → copertine album → pagina album → tracklist → player persistente
Admin:    login → dashboard → crea album → carica cover + MP3 → pubblica
```

---

## 1. Architettura e scelte tecniche

| Livello    | Tecnologia                                             |
|------------|---------------------------------------------------------|
| Frontend   | React 18 + TypeScript + Vite, CSS puro (design system custom, nessun framework CSS) |
| Backend    | Node.js + TypeScript + Express                          |
| Database   | **SQLite** (via `better-sqlite3`)                        |
| Auth       | JWT (token in `localStorage`, verificato ad ogni richiesta admin) |
| Upload     | `multer`, salvataggio su filesystem in `backend/uploads/albums/<id>/` |
| Audio      | elemento HTML5 `<audio>` pilotato da un React Context globale (`PlayerContext`), così la riproduzione sopravvive alla navigazione tra pagine |

### Perché SQLite e non PostgreSQL

Per una prima versione, PostgreSQL aggiunge un servizio da installare,
configurare e mantenere in esecuzione senza portare benefici concreti al caso
d'uso: pochi album, un solo admin, nessuna scrittura concorrente pesante.
SQLite vive in un singolo file (`backend/data/panflute.db`), richiede zero
setup, e con `better-sqlite3` (sincrono, molto veloce) il codice è comunque
scritto con query SQL parametrizzate standard — passare a PostgreSQL in
futuro significa sostituire il modulo `backend/src/db/index.ts` e adattare
qualche query, non riscrivere l'app. L'architettura (repository/router
separati da un client `db`) è pensata apposta per rendere questo passaggio
indolore quando la libreria crescerà.

### Struttura cartelle

```
panflute-journey/
├── backend/
│   ├── src/
│   │   ├── index.ts            # entry point Express
│   │   ├── env.ts              # lettura variabili .env
│   │   ├── db/                 # connessione SQLite + schema
│   │   ├── middleware/         # auth (JWT) e upload (multer)
│   │   ├── routes/             # auth, albums (pubblico), admin (protetto)
│   │   ├── scripts/            # createAdmin.ts
│   │   └── types/
│   ├── uploads/albums/<id>/    # cover.jpg, 01-track.mp3, ...
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/              # Home, AlbumPage, Admin*
│   │   ├── components/         # Header, AlbumCard, PlayerBar, ...
│   │   ├── context/            # AuthContext, PlayerContext
│   │   ├── services/api.ts     # client fetch verso il backend
│   │   └── index.css           # design system (colori, tipografia)
│   ├── .env.example
│   └── package.json
└── README.md
```

### Schema database

```
users
 └─ id, email, password_hash, created_at

albums
 └─ id, title, description, year, cover_filename,
    is_published, is_featured, created_at, updated_at

tracks
 └─ id, album_id (FK → albums), title, filename,
    duration_seconds, position, created_at
```

Relazione: un `album` contiene molte `tracks` (`ON DELETE CASCADE`, quindi
eliminando un album vengono eliminate anche le sue tracce nel database — i
file MP3/cover sul filesystem vengono rimossi esplicitamente dal codice).

### API principali

```
GET    /api/albums                      lista album pubblicati (?search=... per la ricerca)
GET    /api/albums/featured             album in evidenza per l'hero
GET    /api/albums/:id                  dettaglio album pubblicato + tracklist
GET    /api/tracks/:id                  singola traccia

POST   /api/auth/login                  login admin → { token }
GET    /api/auth/me                     verifica sessione corrente

# Tutte le rotte seguenti richiedono header "Authorization: Bearer <token>"
GET    /api/admin/albums                tutti gli album (pubblicati e bozze)
POST   /api/admin/albums                crea album (title, description, year)
PUT    /api/admin/albums/:id            aggiorna metadati / pubblica / metti in evidenza
DELETE /api/admin/albums/:id            elimina album, tracce e file
POST   /api/admin/albums/:id/cover      carica/sostituisce la cover (multipart, campo "cover")
DELETE /api/admin/albums/:id/cover      rimuove la cover
POST   /api/admin/albums/:id/tracks     carica una o più tracce MP3 (multipart, campo "tracks")
PUT    /api/admin/tracks/:id            rinomina una traccia
PUT    /api/admin/albums/:id/tracks/reorder   salva il nuovo ordine (orderedTrackIds)
POST   /api/admin/tracks/:id/replace    sostituisce il file MP3 di una traccia
DELETE /api/admin/tracks/:id            elimina una traccia
```

Sicurezza: tutte le rotte `/api/admin/*` passano dal middleware `requireAuth`
che verifica il JWT; senza token valido rispondono `401`. Multer valida
`mimetype` (solo `audio/mpeg` per le tracce, `image/jpeg|png|webp` per le
cover), limita la dimensione file (`MAX_UPLOAD_MB`, default 25MB) e il numero
di file per richiesta.

---

## 2. Prerequisiti

- [Node.js](https://nodejs.org) 18 o superiore (consigliato 20+)
- npm (incluso con Node.js)

Non serve installare database esterni: SQLite è incluso come libreria.

---

## 3. Installazione

Clona o scarica il progetto, poi installa le dipendenze di entrambe le parti:

```bash
cd backend
npm install

cd ../frontend
npm install
```

---

## 4. Configurazione (.env)

### Backend

```bash
cd backend
cp .env.example .env
```

Apri `backend/.env` e imposta almeno:

```
JWT_SECRET=una-stringa-lunga-e-casuale       # obbligatorio in produzione
CLIENT_ORIGIN=http://localhost:5173          # URL del frontend, per il CORS
```

Le altre variabili (`PORT`, `DATABASE_PATH`, `UPLOADS_DIR`, `MAX_UPLOAD_MB`)
hanno valori di default sensati per lo sviluppo locale.

### Frontend

```bash
cd frontend
cp .env.example .env
```

In sviluppo locale puoi lasciare `VITE_API_URL` vuoto: Vite instrada
automaticamente `/api` e `/uploads` verso `http://localhost:4000` (vedi
`vite.config.ts`). In produzione, se frontend e backend non sono sullo stesso
dominio, imposta `VITE_API_URL=https://tuo-backend.example.com`.

---

## 5. Creazione del database

Non serve alcun comando: al primo avvio del backend, `backend/src/db/index.ts`
crea automaticamente il file SQLite (`backend/data/panflute.db`) e le tabelle
necessarie.

---

## 6. Avvio del backend

```bash
cd backend
npm run dev
```

L'API sarà disponibile su `http://localhost:4000`. Verifica con:

```bash
curl http://localhost:4000/api/health
```

---

## 7. Avvio del frontend

In un secondo terminale:

```bash
cd frontend
npm run dev
```

Il sito sarà disponibile su `http://localhost:5173`.

---

## 8. Creazione dell'utente admin

Con il backend configurato (variabili `.env` presenti), esegui:

```bash
cd backend
npm run create-admin
```

Lo script chiede email e password da terminale (la password non viene
mostrata mentre la digiti). In alternativa puoi impostare `ADMIN_EMAIL` e
`ADMIN_PASSWORD` nel file `.env` prima di lanciare il comando, per crearlo
senza interazione — ricordati di rimuoverli dal `.env` dopo l'uso.

Accedi poi da `http://localhost:5173/admin/login` con le credenziali create.

---

## 9. Caricamento del primo album

1. Vai su `/admin/login` ed effettua il login.
2. Dalla dashboard clicca **“+ New album”**, inserisci titolo, descrizione ed
   eventuale anno, poi **“Create album”**.
3. Verrai portato sulla pagina di modifica dell'album appena creato.

---

## 10. Caricamento degli MP3

Nella pagina di modifica dell'album, nella sezione **Tracks**, clicca sulla
zona tratteggiata (o trascina i file) per selezionare uno o più file MP3
contemporaneamente. I titoli vengono proposti automaticamente dal nome del
file e possono essere rinominati cliccando sul campo di testo. L'ordine si
regola con le frecce ↑ ↓ accanto a ogni traccia; ogni traccia ha un player
integrato per un ascolto di anteprima prima della pubblicazione.

---

## 11. Caricamento della cover

Sempre nella pagina di modifica dell'album, clicca sul riquadro quadrato a
sinistra per scegliere un'immagine (JPG, PNG o WEBP, preferibilmente
quadrata). Caricandone una nuova, la precedente viene sostituita e rimossa
dal server.

Quando album, cover e tracce sono pronti, spunta **“Published”** e salva: da
quel momento l'album compare sul sito pubblico. Spunta anche **“Feature this
album”** per mostrarlo nell'hero della homepage (un solo album alla volta può
essere in evidenza).

---

## 12. Utilizzo del player

Cliccando su una copertina o su una traccia parte la riproduzione e compare
la barra del player in fondo allo schermo, con play/pausa, traccia
precedente/successiva, barra di avanzamento cliccabile e controllo del
volume. Il player resta visibile e continua a suonare mentre navighi tra le
pagine del sito.

---

## Build per la produzione

```bash
# Backend
cd backend
npm run build      # compila in backend/dist
npm start          # avvia da dist/index.js

# Frontend
cd frontend
npm run build       # genera frontend/dist, pronto per essere servito da qualsiasi hosting statico (Netlify, Vercel, Nginx, ecc.)
```

In produzione ricordati di:
- impostare un `JWT_SECRET` robusto e diverso da quello di sviluppo;
- impostare `CLIENT_ORIGIN` sul dominio reale del frontend;
- servire il backend dietro HTTPS;
- fare backup periodici di `backend/data/panflute.db` e `backend/uploads/`.

---

## Note su GitHub

Il repository include già un `.gitignore` che esclude `node_modules`, le
build (`dist/`), il database locale e i file `.env` con eventuali segreti —
va tutto bene per una prima `git init && git add . && git commit`.
