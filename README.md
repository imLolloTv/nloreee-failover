# nloreee-failover

Reverse proxy e failover per **nloreee.it**, costruito su Cloudflare Workers.

Il Worker fa da proxy verso l'origin reale (Pangolin/Traefik sulla VPS). Quando
l'origin non è raggiungibile — spento, in timeout, o che risponde con un errore di
gateway — il visitatore non vede una pagina di errore di Cloudflare o del browser,
ma una **pagina "OFFLINE"** costruita con Next.js e servita come asset statico
dallo stesso Worker.

```
utente ──► nloreee.it (Cloudflare) ──► Worker
                                     │
                    ┌────────────────┴────────────────┐
                    │                                 │
              origin OK                    origin KO / timeout
                    │                                 │
          risposta del sito            pagina "OFFLINE" (503, no-store)
          (body + status originali)
```

## Come funziona

1. Ogni richiesta che arriva a `nloreee.it` passa dal Worker
   (`run_worker_first = true`, vedi [`wrangler.toml`](wrangler.toml)).
2. Il Worker ricostruisce l'URL verso `ORIGIN_HOSTNAME`, inoltra metodo, body e
   header, e normalizza `Host` / `X-Forwarded-*` per Traefik.
3. Se `fetch()` verso l'origin va a timeout, lancia un'eccezione o restituisce un
   **codice di stato di failover**, il Worker risponde con la pagina offline.
4. Altrimenti restituisce la risposta dell'origin così com'è, senza cache
   aggressiva e senza alterare body o status.

### Quando scatta il failover

| Situazione | Esito |
| --- | --- |
| Timeout oltre `ORIGIN_TIMEOUT_MS` | pagina offline |
| Errore di rete / DNS / TLS | pagina offline |
| Loop di redirect (`ERR_TOO_MANY_REDIRECTS`) | pagina offline |
| `502`, `503`, `504` (errori gateway) | pagina offline |
| `521`, `522`, `523`, `524`, `525`, `526`, `530` (errori generati da Cloudflare quando l'origin è a sua volta proxato) | pagina offline |
| `404`, `410`, `4xx`, `5xx` applicativi | **mostrati così come sono** |

Gli ultimi due casi sono una scelta deliberata: un 404 o un 500 applicativo sono
risposte "vere" del sito e nasconderle dietro la pagina offline renderebbe più
difficile capire cosa è rotto.

Gli `5xx` di Cloudflare vanno intercettati esplicitamente perché `fetch()` **non**
lancia un'eccezione in quel caso: restituisce una `Response` "completata" con la
pagina di errore HTML di Cloudflare come body.

## Struttura del repository

```
.
├── worker.js                 # reverse proxy + logica di failover
├── wrangler.toml             # config del Worker e binding degli asset
├── package.json              # script di sviluppo e deploy
└── fallback-app/             # app Next.js della pagina offline
    ├── app/
    │   ├── fallback/         # route /fallback -> fallback.html
    │   ├── components/       # header, footer, tema, suoni, testo animato
    │   ├── hooks/            # useSounds
    │   ├── globals.css       # token di colore light/dark
    │   └── layout.tsx
    ├── public/failover/      # asset serviti come /failover/*
    └── next.config.ts        # output: "export" (build statica)
```

La pagina offline viene buildata con `output: "export"` in `fallback-app/out/`,
che è la cartella esposta dal binding `ASSETS`.

## Configurazione

Le variabili si impostano da **Cloudflare Dashboard → Worker → Settings →
Variables and Secrets**, oppure in locale in `.dev.vars` (vedi
[`.dev.vars.example`](.dev.vars.example)).

| Variabile | Obbligatoria | Default | Descrizione |
| --- | --- | --- | --- |
| `ORIGIN_HOSTNAME` | **sì** | — | Hostname reale della VPS/Pangolin contattato da `fetch()`. **Deve essere diverso da `nloreee.it`**, altrimenti il Worker richiama se stesso e si mette in loop. |
| `ORIGIN_HOST_HEADER` | no | `ORIGIN_HOSTNAME` | Valore dell'header `Host` da inviare a Traefik, perché instradi la richiesta verso il router giusto. Nella maggior parte dei setup Pangolin coincide con l'hostname pubblico originale. |
| `ORIGIN_TIMEOUT_MS` | no | `5000` | Timeout in ms prima di considerare l'origin irraggiungibile. |

Nessun secret è necessario: non ci sono credenziali da inoltrare all'origin. Se in
futuro serve un token (es. un header di autenticazione Pangolin), va aggiunto come
**Secret** e letto da `env`, mai hardcoded nel codice.

## Sviluppo

```bash
npm install                 # wrangler
npm run fallback:install    # dipendenze di fallback-app
npm run dev                 # build della pagina offline + wrangler dev
```

`npm run dev` compila `fallback-app` e poi avvia `wrangler dev` con l'origin
locale: senza `ORIGIN_HOSTNAME` impostata il Worker risponde 500 con un messaggio
esplicito, con l'origin configurata si può provare il failover puntandola a un
hostname irraggiungibile.

Per lavorare solo sulla pagina offline, con hot reload:

```bash
npm run fallback:dev        # http://localhost:3000/fallback
```

> `fallback-app` usa **bun** come package manager (`packageManager` in
> `package.json`, `bun.lock` versionato). I script npm del root funzionano comunque
> perché `npm run` delega solo al build di Next.js.

## Deploy

```bash
npm run deploy              # build della pagina offline + wrangler deploy
```

In alternativa, con **Cloudflare Workers Builds** (build automatico a ogni push):

| Campo | Valore |
| --- | --- |
| Build command | `npm run fallback:install && npm run fallback:build` |
| Deploy command | `npx wrangler deploy` |
| Root directory | `/` |

Le variabili si possono dichiarare anche nel pannello Builds. `keep_vars = true` in
[`wrangler.toml`](wrangler.toml) serve a non farle cancellare dai deploy.

## Dettagli da conoscere

- **`run_worker_first = true`** è essenziale: senza, Cloudflare serve gli asset
  direttamente per i path che coincidono e il Worker viene bypassato.
- **Gli asset non vengono mai prossati.** I path `/_next/` (chunk JS/CSS di Next.js)
  e `/failover/` (file in `fallback-app/public/failover/`) sono serviti sempre da
  `ASSETS`. Se fossero prossati, con la VPS giù ogni richiesta andrebbe in timeout
  e verrebbe sostituita dalla pagina offline invece che dal file reale: si
  romperebbe l'hydration (il pulsante "Riprova" smetterebbe di rispondere) e le
  immagini.
- **`redirect: "follow"`** lascia risolvere i redirect dell'origin al Worker
  invece di rilanciarli al browser. Un redirect legittimo si risolve in modo
  trasparente; un loop (es. Pangolin che, a risorsa disattivata, redirige verso lo
  stesso host pubblico) fa scattare il limite di redirect del runtime, che viene
  trasformato in pagina offline invece di arrivare al browser come
  `ERR_TOO_MANY_REDIRECTS`.
- **La pagina offline non viene mai cachata** (`Cache-Control: no-store`),
  altrimenti continuerebbe a essere mostrata anche dopo il ritorno online della VPS.
