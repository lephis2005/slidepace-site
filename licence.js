// SlidePace — page « Votre licence » (licence.html et fr/licence.html).
// Même logique que la page sandbox (site-sandbox/licence.html) : numéro de transaction Paddle →
// POST /activate sur la fonction de licence → licence signée → activation en un clic dans l'extension.
// Aucune ressource tierce, aucun cookie, aucun stockage dans le navigateur.
(function () {
  'use strict';

  // Page chargée dans un cadre (iframe) d'un autre site : elle ne fait rien (audit du 24/10, I2). Une page piégée ne
  // peut ainsi ni demander une licence ni l'envoyer à l'extension ; GitHub Pages ne permet pas l'en-tête anti-cadre.
  const framed = (() => {
    try {
      return window.top !== window.self;
    } catch (_) {
      return true; // accès refusé à window.top : cadre d'une autre origine
    }
  })();
  if (framed) return;

  // Adresse de la fonction de licence (Cloudflare Workers), identique à licenseApi de src/pro-config.js (branche main).
  // api.slidepace.com depuis le 2026-10-18 : branchée sur la fonction sandbox jusqu'au jour J, puis sur la fonction réelle.
  const LICENSE_API = 'https://api.slidepace.com';

  // Extension publiée sur le Chrome Web Store. L'identifiant de la version de développement n'est
  // essayé que si l'adresse contient ?dev=1 ET que la page est servie en local (localhost ou 127.0.0.1, tests du
  // propriétaire) : jamais sur slidepace.com (audit technique E1).
  const STORE_EXTENSION_ID = 'dchbmbjjgcdjkhkkmebpnbhgegchobca';
  const DEV_EXTENSION_ID = 'ophmejbfngjolbfjmbholmeponmdipoi';

  const params = new URLSearchParams(location.search);
  const LOCAL_PAGE = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  const EXTENSION_IDS =
    params.get('dev') === '1' && LOCAL_PAGE ? [STORE_EXTENSION_ID, DEV_EXTENSION_ID] : [STORE_EXTENSION_ID];

  const LANG = document.documentElement.lang === 'fr' ? 'fr' : 'en';

  const TEXTS = {
    en: {
      checking: 'Checking your purchase…',
      confirming: 'Payment being confirmed by Paddle…',
      retrying: 'Checking your purchase… new attempt in a few seconds.',
      slow: 'Paddle’s confirmation is taking longer than expected. Try again in a few minutes with the button above: your purchase is not lost.',
      copied: 'Copied ✓',
      notActivated: 'SlidePace did not answer from this page (extension missing, or another Chrome profile). Activate the key by hand, as shown below.',
      otherLicense: 'SlidePace already holds a license from another purchase, so this page does not replace it. To use this key: open SlidePace, click “Remove license”, then “I have a license key” and paste this key.',
      errors: {
        bad_request: 'This does not look like a Paddle transaction number. Check it on your Paddle receipt (it starts with txn_) and copy-paste it rather than typing it.',
        unknown: 'Number not found at Paddle. Check it on your Paddle receipt (it starts with txn_) and copy-paste it rather than typing it.',
        invalid: 'This purchase does not match a valid SlidePace Pro license (refunded or expired?). Write to contact@slidepace.com if you think this is a mistake.',
        pending: 'Payment not yet confirmed by Paddle.',
        rate_limited: 'Too many requests at the moment. Try again in a few minutes: your purchase is not lost.',
        unavailable: 'The license service is not responding right now (too many requests or unavailable). Try again in a few minutes: your purchase is not lost.',
      },
    },
    fr: {
      checking: 'Vérification de l’achat…',
      confirming: 'Paiement en cours de confirmation par Paddle…',
      retrying: 'Vérification de l’achat… nouvel essai dans quelques secondes.',
      slow: 'La confirmation de Paddle prend plus de temps que prévu. Réessayez dans quelques minutes avec le bouton ci-dessus : votre achat n’est pas perdu.',
      copied: 'Copiée ✓',
      notActivated: 'SlidePace n’a pas répondu depuis cette page (extension absente, ou autre profil Chrome). Activez la clé à la main, comme indiqué ci-dessous.',
      otherLicense: 'SlidePace contient déjà une licence d’un autre achat : cette page ne la remplace pas. Pour utiliser cette clé : ouvrez SlidePace, cliquez sur « Retirer la licence », puis sur « J’ai une clé de licence » et collez cette clé.',
      errors: {
        bad_request: 'Ce numéro ne ressemble pas à un numéro de transaction Paddle. Vérifiez-le sur votre reçu Paddle (il commence par txn_) et copiez-collez-le plutôt que de le taper.',
        unknown: 'Numéro introuvable chez Paddle. Vérifiez-le sur votre reçu Paddle (il commence par txn_) et copiez-collez-le plutôt que de le taper.',
        invalid: 'Cet achat ne correspond pas à une licence SlidePace Pro valide (remboursé ou expiré ?). Écrivez à contact@slidepace.com si vous pensez qu’il s’agit d’une erreur.',
        pending: 'Paiement pas encore confirmé par Paddle.',
        rate_limited: 'Trop de demandes pour le moment. Réessayez dans quelques minutes : votre achat n’est pas perdu.',
        unavailable: 'Le service de licence ne répond pas pour le moment (trop de demandes ou indisponible). Réessayez dans quelques minutes : votre achat n’est pas perdu.',
      },
    },
  };
  const T = TEXTS[LANG];

  // « Conservez cette clé » en 7 langues (copie de store/pro/texts.json, champ keepKey).
  // Page française : toujours en français ; page anglaise : langue du navigateur, anglais par défaut.
  const KEEP_KEY = {
    en: "Keep this key. It lets you activate SlidePace Pro on another computer or after reinstalling. You can save it in a password manager or a note. Lost your key? Don't worry: you can find it again at any time on this page with the transaction number shown on your Paddle receipt (sent by email).",
    fr: 'Conservez cette clé. Elle vous permettra d’activer SlidePace Pro sur un autre ordinateur ou après une réinstallation. Vous pouvez la copier dans un gestionnaire de mots de passe ou une note. Clé perdue ? Pas d’inquiétude : retrouvez-la à tout moment sur cette page avec le numéro de transaction indiqué dans votre reçu Paddle (envoyé par email).',
    es: 'Guarda esta clave. Te permitirá activar SlidePace Pro en otro ordenador o tras una reinstalación. Puedes copiarla en un gestor de contraseñas o en una nota. ¿Has perdido la clave? No te preocupes: puedes recuperarla en cualquier momento en esta página con el número de transacción que aparece en tu recibo de Paddle (enviado por correo electrónico).',
    pt_BR: 'Guarde esta chave. Ela permite ativar o SlidePace Pro em outro computador ou após uma reinstalação. Você pode copiá-la em um gerenciador de senhas ou em uma nota. Perdeu a chave? Não se preocupe: você pode recuperá-la a qualquer momento nesta página com o número da transação indicado no seu recibo da Paddle (enviado por e-mail).',
    de: 'Bewahren Sie diesen Schlüssel auf. Damit können Sie SlidePace Pro auf einem anderen Computer oder nach einer Neuinstallation aktivieren. Sie können ihn in einem Passwort-Manager oder einer Notiz speichern. Schlüssel verloren? Kein Problem: Sie finden ihn jederzeit auf dieser Seite wieder – mit der Transaktionsnummer aus Ihrer Paddle-Quittung (per E-Mail erhalten).',
    it: 'Conserva questa chiave. Ti permetterà di attivare SlidePace Pro su un altro computer o dopo una reinstallazione. Puoi copiarla in un gestore di password o in una nota. Chiave persa? Nessun problema: puoi ritrovarla in qualsiasi momento su questa pagina con il numero di transazione indicato nella ricevuta Paddle (inviata via email).',
    ja: 'このキーは大切に保管してください。別のパソコンや再インストール後に SlidePace Pro を有効化する際に必要です。パスワード管理ツールやメモにコピーしておくと便利です。キーを紛失しても大丈夫です。Paddle の領収書（メールで送信）に記載された取引番号を使えば、このページでいつでも再取得できます。',
  };
  // Seules les clés propres des tables comptent (revue adverse du 2026-10-22 : « ?lang=constructor » affichait du code).
  const own = (table, key) => Object.prototype.hasOwnProperty.call(table, key);
  function keepKeyLang() {
    if (LANG === 'fr') return 'fr';
    const wanted = [params.get('lang'), ...(navigator.languages || [navigator.language])];
    for (const raw of wanted.filter(Boolean)) {
      const l = raw.replace('-', '_');
      if (own(KEEP_KEY, l)) return l;
      if (l.toLowerCase().startsWith('pt')) return 'pt_BR';
      if (own(KEEP_KEY, l.slice(0, 2))) return l.slice(0, 2);
    }
    return 'en';
  }

  const $ = (id) => document.getElementById(id);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const kl = keepKeyLang();
  $('keep-key').textContent = KEEP_KEY[kl];
  $('keep-key').lang = kl.replace('_', '-');

  // Activation en un clic : l'extension n'écoute que https://slidepace.com (externally_connectable)
  // et revérifie l'origine. Renvoie la réponse de l'extension si elle a accepté la licence, sinon false.
  async function sendToExtension(token) {
    const runtime = window.chrome && window.chrome.runtime;
    if (!runtime || !runtime.sendMessage) return false;
    for (const id of EXTENSION_IDS) {
      const reply = await new Promise((resolve) => {
        try {
          runtime.sendMessage(id, { type: 'slidepace-activate', token }, (r) => {
            void window.chrome.runtime.lastError; // extension absente : pas d'erreur visible
            resolve(r);
          });
        } catch (_) {
          resolve(null);
        }
      });
      if (reply && reply.ok) return reply;
      // Licence d'un autre achat déjà enregistrée (refus volontaire de l'extension, 1.2.1 et suivantes) : on le dit.
      if (reply && reply.reason === 'other_license') otherLicense = true;
    }
    return false;
  }
  let otherLicense = false;

  // La licence reçue est affichée ; elle n'est envoyée à l'extension que sur un clic de l'utilisateur sur « Activer dans
  // SlidePace » (audit du 24/10, I2 : jamais d'activation sans geste, même au retour du paiement avec #txn=, ou ?txn= des anciens liens).
  let shownToken = '';
  // Décision 3 du propriétaire du 25/10 (relecture sécurité de la session 28) : « Activer » ne devient cliquable
  // qu'environ 500 ms après l'affichage de la licence, pour qu'un double-clic commencé sur une autre page ne l'active pas.
  const ARM_MS = 500;
  let armedAt = 0;
  function showLicense(token) {
    shownToken = token;
    $('result').classList.remove('hidden');
    $('token').value = token;
    $('activate').disabled = true;
    armedAt = Date.now() + ARM_MS;
    setTimeout(() => {
      $('activate').disabled = false;
    }, ARM_MS);
    $('activate').classList.remove('hidden');
    $('activated').classList.add('hidden');
    $('next-step').classList.add('hidden');
    $('activate-err').classList.add('hidden');
    $('manual').classList.remove('hidden');
  }

  $('activate').addEventListener('click', async () => {
    if (!shownToken || Date.now() < armedAt) return;
    $('activate').disabled = true;
    otherLicense = false;
    const reply = await sendToExtension(shownToken);
    $('activate').disabled = false;
    $('activate').classList.toggle('hidden', !!reply);
    $('activated').classList.toggle('hidden', !reply);
    $('next-step').classList.toggle('hidden', !(reply && reply.needsPermission));
    $('manual').classList.toggle('hidden', !!reply);
    $('activate-err').textContent = reply ? '' : otherLicense ? T.otherLicense : T.notActivated;
    $('activate-err').classList.toggle('hidden', !!reply);
  });

  // Juste après le paiement, Paddle met quelques secondes à finaliser l'achat : tant que la fonction
  // répond « pending » (ou n'est pas joignable), on réessaie toutes les 5 s pendant 60 s
  // (13 demandes au plus, la première comprise : la fonction accepte 60 demandes/min par adresse IP, partagée par tout un réseau
  // d'école ou d'entreprise). Jamais de « licence non valide » dans ce cas.
  // Chaque demande (POST en JSON) exige une pré-vérification CORS (OPTIONS) ; la fonction la fait garder 2 h au navigateur
  // (Access-Control-Max-Age: 7200, décision du 22/10) : une seule par visite, et non une avant chaque essai. D'où, par
  // acheteur, 14 requêtes au plus par minute et 4 au plus en 10 s, sous la règle de la zone (plus de 10 en 10 s bloquées).
  const RETRY_MS = 5000;
  const MAX_WAIT_MS = 60000;
  // Une requête qui ne répond pas est abandonnée au bout de 20 s (audit du 22/10, C10) : la boucle et le bouton ne
  // restent jamais bloqués. Navigateur trop ancien pour AbortSignal.timeout : requête sans délai, comme avant.
  const REQUEST_TIMEOUT_MS = 20000;
  const timeoutSignal = () =>
    typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function' ? AbortSignal.timeout(REQUEST_TIMEOUT_MS) : undefined;

  async function askLicense(txn) {
    try {
      const res = await fetch(LICENSE_API + '/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId: txn }),
        signal: timeoutSignal(),
      });
      return await res.json();
    } catch (_) {
      // Réseau coupé, délai dépassé, page de blocage de Cloudflare (sans en-tête CORS, ou HTML) : « indisponible ».
      return { ok: false, reason: 'unavailable' };
    }
  }

  async function fetchLicense(txn, { fromCheckout = false } = {}) {
    $('go').disabled = true;
    $('state').className = 'muted';
    $('state').textContent = T.checking;
    // « unknown » juste après un paiement peut aussi être un délai de Paddle : on patiente.
    const paddleDelay = (reason) => reason === 'pending' || (fromCheckout && reason === 'unknown');
    const retryable = (reason) => paddleDelay(reason) || reason === 'unavailable' || reason === 'rate_limited';
    const deadline = Date.now() + MAX_WAIT_MS;
    let body = await askLicense(txn);
    while (!body.ok && retryable(body.reason) && Date.now() < deadline) {
      // Décision 4 de l'audit du 22/10 : « confirmation par Paddle » seulement quand c'est Paddle qui fait attendre ;
      // blocage, service indisponible ou recherche faite à la main : texte neutre.
      $('state').textContent = paddleDelay(body.reason) ? T.confirming : T.retrying;
      await sleep(RETRY_MS);
      body = await askLicense(txn);
    }
    $('go').disabled = false;
    if (body.ok && body.token) {
      $('state').textContent = '';
      return showLicense(body.token);
    }
    $('state').className = 'status-err';
    $('state').textContent = paddleDelay(body.reason) ? T.slow : own(T.errors, body.reason) ? T.errors[body.reason] : T.errors.unavailable;
  }

  $('lookup').addEventListener('submit', (e) => {
    e.preventDefault();
    const txn = $('txn').value.replace(/\s+/g, '').toLowerCase(); // espaces et majuscules ignorés
    if (txn) fetchLicense(txn);
  });
  $('copy').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText($('token').value);
    } catch (_) {
      $('token').select(); // presse-papiers refusé : la clé est sélectionnée, Ctrl+C suffit
      return;
    }
    $('copy').textContent = T.copied;
  });

  // Retour de la page de prix : #txn=… (Paddle). Le numéro de transaction suffit à obtenir la licence : il voyage dans
  // le fragment, jamais envoyé au serveur qui sert la page (audit du 22/10, B4) ; ?txn=… reste accepté (anciens liens).
  // On le retire aussitôt de l'adresse (historique, favoris, captures, liens partagés), sans recharger (audit C2).
  const fromHash = new URLSearchParams((location.hash || '').replace(/^#/, '')).get('txn');
  const fromUrl = fromHash || params.get('txn');
  if (fromUrl) {
    params.delete('txn');
    const rest = params.toString();
    history.replaceState(null, '', location.pathname + (rest ? '?' + rest : '') + (fromHash ? '' : location.hash));
    $('txn').value = fromUrl;
    fetchLicense(fromUrl, { fromCheckout: true });
  }
})();
