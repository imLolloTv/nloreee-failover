/**
 * nloreee.it — Reverse proxy + failover verso Pangolin/Traefik
 *
 * Flusso:
 *   utente -> nloreee.it -> questo Worker -> ORIGIN_HOSTNAME (Pangolin/Traefik sulla VPS)
 *   se l'origin non risponde / va in timeout / restituisce 502-504 -> pagina fallback statica
 *
 * ============================================================
 * VARIABILI DA CONFIGURARE (Worker > Settings > Variables and Secrets)
 * ============================================================
 *
 * ORIGIN_HOSTNAME   (testo, NON secret)
 *   Hostname reale della VPS/Pangolin da contattare in fetch().
 *   Deve essere DIVERSO da nloreee.it per evitare che il Worker richiami se stesso.
 *   Esempio: "origin.nloreee.it" oppure un hostname dedicato non esposto pubblicamente
 *   agli utenti (es. un sottodominio proxato da Cloudflare che punta all'IP della VPS,
 *   oppure un hostname raggiungibile solo perché Cloudflare lo risolve).
 *
 * ORIGIN_HOST_HEADER   (testo, NON secret)
 *   Valore dell'header Host da inviare a Traefik/Pangolin affinché instradi la richiesta
 *   verso il router corretto. Nella maggior parte dei setup Pangolin coincide con
 *   l'hostname "pubblico" originale che Traefik si aspetta di vedere (es. "nloreee.it"
 *   stesso, se è quello che Traefik ha configurato come regola Host()).
 *   Se lasci vuoto, viene usato ORIGIN_HOSTNAME.
 *
 * ORIGIN_TIMEOUT_MS   (testo, opzionale, default 5000)
 *   Timeout in millisecondi prima di considerare l'origin non raggiungibile.
 *
 * Nessun secret è strettamente necessario per questa versione: non ci sono
 * credenziali da inviare all'origin. Se in futuro serve un token per autenticarsi
 * (es. header di Pangolin), aggiungilo come Secret (Encrypt) e leggilo da env,
 * MAI hardcoded nel codice.
 * ============================================================
 */

const DEFAULT_TIMEOUT_MS = 5000;

// Status code dell'origin che fanno scattare il failover.
// Scelta: errori di gateway/infrastruttura, non tutti i non-2xx.
// Motivazione: un 404 o un 500 applicativo sono risposte "vere" del tuo sito
// (magari un bug da correggere, o una pagina che non esiste) e mostrarle è più utile
// che nasconderle dietro una fallback page.
//
// 502/503/504 sono gli errori di gateway "standard" (RFC) che Traefik/Pangolin
// possono restituire quando il backend non è pronto o non risponde.
//
// 521/522/523/524/525/526/530 sono invece errori generati DA CLOUDFLARE STESSO
// (non dall'origin) quando ORIGIN_HOSTNAME è anch'esso un record proxato da
// Cloudflare e Cloudflare non riesce a stabilire/mantenere la connessione con
// la VPS reale (server giù, timeout TCP, handshake TLS fallito, ecc.). In questi
// casi fetch() NON lancia un'eccezione: restituisce una Response "completata" con
// quello status e la pagina di errore HTML di Cloudflare come corpo — per questo
// vanno intercettati esplicitamente qui, altrimenti verrebbero rilanciati al
// client così come sono invece di mostrare il nostro fallback.
const FAILOVER_STATUS_CODES = new Set([502, 503, 504, 521, 522, 523, 524, 525, 526, 530]);

// Path che possono esistere SIA nella build di fallback (ASSETS) SIA sull'origin:
// - /_next/  -> chunk JS/CSS generati da Next.js. Sia il sito vero (sulla VPS)
//   che la pagina di fallback (build in fallback-app/out) usano questo prefisso,
//   ma con hash diversi per ogni build (es. turbopack-xxxx.js). NON si può
//   servire ciecamente da ASSETS: quando l'origin è SU, l'HTML viene da lì e
//   referenzia gli hash della build VPS — servirli da ASSETS dà 404 a raffica,
//   la pagina resta bloccata su "LOADING ..." senza stili e senza hydration.
// - /failover/ -> file in fallback-app/public/failover/ (logo, suoni, favicon
//   della pagina offline). In genere esistono solo in ASSETS.
// Strategia: prova prima ASSETS; se 404, passa al proxy verso l'origin.
// Se anche l'origin fallisce, per questi path restituisci il 404 di ASSETS
// (non fallback.html, che come .js/.css darebbe solo errori MIME in console).
const FALLBACK_ASSET_PREFIXES = ["/_next/", "/failover/"];

export default {
  async fetch(request, env, ctx) {
    const incomingUrlForAssets = new URL(request.url);
    const isAssetPath = FALLBACK_ASSET_PREFIXES.some((p) =>
      incomingUrlForAssets.pathname.startsWith(p)
    );
    if (isAssetPath) {
      const assetResponse = await env.ASSETS.fetch(request);
      // Trovato nella build di fallback (caso origin GIÙ: la pagina offline
      // carica i SUOI chunk) -> servilo subito, senza toccare l'origin.
      if (assetResponse.status !== 404) {
        return assetResponse;
      }
      // Non è un file della build di fallback: quasi sicuramente è un asset
      // del sito vero (caso origin SU). Prova il proxy; se anche quello
      // fallisce, ritorna il 404 originale invece di fallback.html.
      const proxied = await proxyToOrigin(request, env);
      return proxied !== null ? proxied : assetResponse;
    }

    const proxied = await proxyToOrigin(request, env);
    if (proxied !== null) {
      return proxied;
    }
    return fallbackResponse(env, request);
  },
};

/**
 * Prova a contattare l'origin. Ritorna la Response da inviare al client,
 * oppure null se l'origin è irraggiungibile / dà errore di gateway
 * (e quindi il chiamante deve usare il fallback).
 * Per i path asset, null significa "né ASSETS né origin ce l'hanno":
 * il chiamante deve rispondere 404, non la pagina offline.
 */
async function proxyToOrigin(request, env) {

    const originHostname = env.ORIGIN_HOSTNAME;
    const originHostHeader = env.ORIGIN_HOST_HEADER || originHostname;
    const timeoutMs = parseInt(env.ORIGIN_TIMEOUT_MS, 10) || DEFAULT_TIMEOUT_MS;

    if (!originHostname) {
      // Configurazione mancante: non c'è motivo di fallire silenziosamente,
      // meglio un errore esplicito in log/risposta che aiuti a diagnosticare.
      return new Response(
        "Configurazione mancante: variabile ORIGIN_HOSTNAME non impostata sul Worker.",
        { status: 500 }
      );
    }

    const incomingUrl = new URL(request.url);

    // Costruiamo l'URL verso l'origin reale, mantenendo path e query string,
    // ma sostituendo host con ORIGIN_HOSTNAME (mai nloreee.it, per evitare loop).
    const originUrl = new URL(incomingUrl.pathname + incomingUrl.search, `https://${originHostname}`);

    // Copiamo gli header della richiesta originale e impostiamo/normalizziamo
    // quelli necessari per il corretto instradamento su Traefik/Pangolin.
    const proxyHeaders = new Headers(request.headers);

    // Host: deve essere quello che Traefik si aspetta per il routing (regola Host()).
    proxyHeaders.set("Host", originHostHeader);

    // X-Forwarded-*: informano l'origin di chi/come è arrivata realmente la richiesta,
    // preservando eventuali valori già presenti (es. se Cloudflare li ha già valorizzati)
    // e aggiungendo i nostri in coda dove ha senso concatenare.
    const forwardedHost = request.headers.get("X-Forwarded-Host") || incomingUrl.hostname;
    proxyHeaders.set("X-Forwarded-Host", forwardedHost);
    proxyHeaders.set("X-Forwarded-Proto", "https");

    const cfConnectingIp = request.headers.get("CF-Connecting-IP");
    const existingXff = request.headers.get("X-Forwarded-For");
    if (cfConnectingIp) {
      proxyHeaders.set(
        "X-Forwarded-For",
        existingXff ? `${existingXff}, ${cfConnectingIp}` : cfConnectingIp
      );
    }

    // Alcuni header hop-by-hop non vanno inoltrati.
    proxyHeaders.delete("cf-connecting-ip");
    proxyHeaders.delete("cf-ray");
    proxyHeaders.delete("cf-visitor");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const originRequestInit = {
        method: request.method,
        headers: proxyHeaders,
        // GET/HEAD non possono avere body; per gli altri metodi inoltriamo lo stream.
        body: ["GET", "HEAD"].includes(request.method) ? undefined : request.body,
        // "follow" (default): i redirect dell'origin vengono risolti dal Worker stesso,
        // non rilanciati al browser. Un redirect legittimo (poche redirezioni) si risolve
        // in modo trasparente e il client riceve direttamente il contenuto finale.
        // Un loop infinito (es. Pangolin che, a risorsa disattivata, redirige verso lo
        // stesso host pubblico nloreee.it) fa scattare il limite interno di redirect del
        // runtime: fetch() lancia un'eccezione, che viene intercettata sotto e trasformata
        // in pagina di fallback, invece di propagarsi al browser come ERR_TOO_MANY_REDIRECTS.
        redirect: "follow",
        signal: controller.signal,
      };

      const originResponse = await fetch(originUrl.toString(), originRequestInit);
      clearTimeout(timeoutId);

      if (FAILOVER_STATUS_CODES.has(originResponse.status)) {
        return null;
      }

      // Rispondiamo con il body/headers dell'origin così come sono,
      // senza aggiungere cache aggressiva.
      const responseHeaders = new Headers(originResponse.headers);
      return new Response(originResponse.body, {
        status: originResponse.status,
        statusText: originResponse.statusText,
        headers: responseHeaders,
      });
    } catch (err) {
      clearTimeout(timeoutId);
      // Copre: timeout (AbortError), DNS/connessione fallita, TLS error, ecc.
      return null;
    }
}


// Serve la pagina di fallback statica (build Next.js, cartella fallback-app/out,
// esposta tramite l'Assets binding "ASSETS" configurato in wrangler.toml) invece
// di un HTML inline. Forziamo path e status: qualunque sia l'URL originale
// richiesto, il fallback risponde sempre con /fallback.html e status 503.
async function fallbackResponse(env, request) {
  const assetUrl = new URL(request.url);
  assetUrl.pathname = "/fallback.html";
  assetUrl.search = "";

  const assetRequest = new Request(assetUrl.toString(), { method: "GET" });
  const assetResponse = await env.ASSETS.fetch(assetRequest);

  const headers = new Headers(assetResponse.headers);
  // Fondamentale: non far mai cachare la pagina di errore, altrimenti
  // continuerebbe a essere mostrata anche dopo il ritorno online della VPS.
  headers.set("Cache-Control", "no-store");

  return new Response(assetResponse.body, {
    status: 503,
    headers,
  });
}