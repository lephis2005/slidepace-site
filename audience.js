// slidepace.com — mesure d'audience Cloudflare Web Analytics, sans cookie.
// Le script de Cloudflare n'est chargé que si vous ne vous y êtes pas opposé (indicateur « slidepace-audience-optout » dans le
// stockage local de votre navigateur) et si votre navigateur n'envoie pas le signal Global Privacy Control.
// Détails : https://slidepace.com/privacy.html#audience
(function () {
  'use strict';
  var KEY = 'slidepace-audience-optout';
  function storage() {
    try { var s = window.localStorage; s.getItem(KEY); return s; } catch (e) { return null; }
  }
  function gpc() { return navigator.globalPrivacyControl === true; }
  function allowed() { var s = storage(); return !!s && s.getItem(KEY) !== '1' && !gpc(); }

  if (allowed() && !document.querySelector('script[data-cf-beacon]')) {
    var tag = document.createElement('script');
    tag.type = 'module';
    tag.src = 'https://static.cloudflareinsights.com/beacon.min.js';
    tag.setAttribute('data-cf-beacon', '{"token": "9a28e463f5764f2196532c9c4c83b1e7"}');
    document.body.appendChild(tag);
  }

  // Politique de confidentialité : « Ne plus mesurer mes visites » / « Réactiver », et message d'état.
  var box = document.getElementById('audience-optout');
  if (!box) return;
  var state = box.querySelector('[data-audience-state]');
  var actions = box.querySelector('[data-audience-actions]');
  var off = box.querySelector('[data-audience="off"]');
  var on = box.querySelector('[data-audience="on"]');
  function render() {
    var s = storage();
    var now = !s ? 'blocked' : s.getItem(KEY) === '1' ? 'off' : gpc() ? 'gpc' : 'on';
    state.textContent = state.getAttribute('data-' + now);
    box.setAttribute('data-state', now);
    actions.hidden = !s;
    off.hidden = now === 'off';
    on.hidden = now !== 'off';
  }
  function choose(optOut) {
    return function (event) {
      event.preventDefault();
      var s = storage();
      try { if (s && optOut) s.setItem(KEY, '1'); else if (s) s.removeItem(KEY); } catch (e) { /* état affiché tel quel */ }
      render();
    };
  }
  off.addEventListener('click', choose(true));
  on.addEventListener('click', choose(false));
  render();
})();
