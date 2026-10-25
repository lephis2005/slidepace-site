// SlidePace — boutons d'achat de la page de prix (pricing.html et fr/pricing.html).
// Tant que PRO_ON_SALE vaut false, la page reste « Bientôt disponible » (état du HTML sans script).
// Paddle.js n'est chargé qu'au clic sur une offre (audit C10) : aucune ressource tierce avant un choix.
(function () {
  'use strict';

  // ⚠ Lancement Pro uniquement (voir site/A-COMPLETER.md) : passer à true APRÈS avoir rempli PADDLE ci-dessous.
  const PRO_ON_SALE = true;

  // Compte Paddle RÉEL (jamais les valeurs sandbox) : jeton client « live_… » et identifiants de prix « pri_… ».
  // Paddle → Developer tools → Authentication (jeton client) ; Catalog → Products (prix). Ces valeurs sont publiques
  // par nature (visibles dans toute page de paiement Paddle), mais elles ne sont écrites qu'au lancement.
  const PADDLE = {
    clientToken: 'live_2507c1348121a943b2e7825e367',
    prices: { annual: 'pri_01m5fbmcd6wzraaxgdk8th9xf0', lifetime: 'pri_01m5fbtynwjf4ctey19r0xp2rx' },
  };
  const PADDLE_JS = 'https://cdn.paddle.com/paddle/v2/paddle.js';

  const LANG = document.documentElement.lang === 'fr' ? 'fr' : 'en';
  const TEXTS = {
    en: { loading: 'Opening the secure Paddle checkout…', failed: 'The payment window could not be loaded. Check your connection (or an ad blocker) and try again.' },
    fr: { loading: 'Ouverture du paiement sécurisé Paddle…', failed: 'La fenêtre de paiement n’a pas pu se charger. Vérifiez votre connexion (ou un bloqueur de publicité) et réessayez.' },
  };
  const T = TEXTS[LANG];

  const filled = (v) => typeof v === 'string' && v !== '' && !v.includes('REMPLIR');
  const ready = PRO_ON_SALE && filled(PADDLE.clientToken) && filled(PADDLE.prices.annual) && filled(PADDLE.prices.lifetime);
  if (PRO_ON_SALE && !ready) console.error('SlidePace : PRO_ON_SALE = true mais le jeton ou les prix Paddle ne sont pas remplis.');
  if (!ready) return; // page « Bientôt disponible », inchangée

  document.querySelectorAll('[data-sale="off"]').forEach((el) => el.classList.add('hidden'));
  document.querySelectorAll('[data-sale="on"]').forEach((el) => el.classList.remove('hidden'));

  const status = document.getElementById('buy-status');
  // Page de licence à côté de la page de prix (même langue).
  const licenceUrl = new URL('licence.html', location.href);

  let paddlePromise = null;
  function loadPaddle() {
    if (paddlePromise) return paddlePromise;
    paddlePromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = PADDLE_JS;
      s.onload = () => {
        try {
          // Environnement réel par défaut (pas de Paddle.Environment.set('sandbox') ici).
          window.Paddle.Initialize({
            token: PADDLE.clientToken,
            eventCallback(event) {
              // Paiement terminé : on va chercher la licence avec le numéro de transaction
              // (la page de licence le retire aussitôt de l'adresse).
              if (event.name === 'checkout.completed' && event.data && event.data.transaction_id) {
                // Fragment (#txn=) : jamais envoyé au serveur qui sert la page de licence (audit du 22/10, B4).
                licenceUrl.hash = 'txn=' + encodeURIComponent(event.data.transaction_id);
                location.href = licenceUrl.href;
              }
            },
          });
          resolve(window.Paddle);
        } catch (e) {
          reject(e);
        }
      };
      s.onerror = () => reject(new Error('paddle.js'));
      document.head.appendChild(s);
    });
    paddlePromise.catch(() => (paddlePromise = null)); // nouvel essai possible au clic suivant
    return paddlePromise;
  }

  document.querySelectorAll('[data-plan]').forEach((button) =>
    button.addEventListener('click', async () => {
      const buttons = document.querySelectorAll('[data-plan]');
      buttons.forEach((b) => (b.disabled = true));
      status.className = 'muted';
      status.textContent = T.loading;
      try {
        const paddle = await loadPaddle();
        paddle.Checkout.open({
          items: [{ priceId: PADDLE.prices[button.dataset.plan], quantity: 1 }],
          settings: { displayMode: 'overlay', locale: LANG, theme: 'light' },
        });
        status.textContent = '';
      } catch (_) {
        status.className = 'status-err';
        status.textContent = T.failed;
      } finally {
        buttons.forEach((b) => (b.disabled = false));
      }
    })
  );
})();
