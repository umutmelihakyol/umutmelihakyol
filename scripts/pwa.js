/* Günlüğüm PWA: kurulum düğmesi ve Service Worker kaydı. */
(() => {
  'use strict';

  const thisScript = document.currentScript;
  if (!thisScript || !thisScript.src) return;

  const scriptURL = new URL(thisScript.src, window.location.href);
  const rootURL = new URL('../', scriptURL);
  const swURL = new URL('service-worker.js', rootURL);
  const cssURL = new URL('assets/css/pwa.css', rootURL);

  // PWA CSS'ini, her sayfada doğru depo yolundan yükle.
  if (!document.querySelector('link[data-gunlugum-pwa-css]')) {
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = `${cssURL.href}?v=1`;
    css.dataset.gunlugumPwaCss = 'true';
    document.head.appendChild(css);
  }

  // Service Worker kapsamı depo köküdür; alt sayfalar da bu kapsamda kalır.
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register(swURL.href, { scope: rootURL.pathname })
        .catch((error) => console.warn('Günlüğüm çevrimdışı desteği başlatılamadı:', error));
    }, { once: true });
  }

  const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  if (standalone) return;

  const actionBar = document.querySelector('.top .acts, .tech-page-top .acts, header .acts');
  if (!actionBar || actionBar.querySelector('.pwa-install-btn')) return;

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'btn pwa-install-btn';
  button.title = 'Günlüğüm uygulamasını yükle';
  button.setAttribute('aria-label', 'Günlüğüm uygulamasını yükle');
  button.innerHTML = `
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <rect x="5" y="2.5" width="14" height="19" rx="2.5"></rect>
      <path d="M9 6h6M10 18h4"></path>
    </svg>
    <span class="pwa-install-label">Uygulamayı Yükle</span>`;

  const themeButton = actionBar.querySelector('#themeBtn');
  if (themeButton) actionBar.insertBefore(button, themeButton);
  else actionBar.appendChild(button);

  let installPrompt = null;
  let helpOverlay = null;

  function closeHelp() {
    if (!helpOverlay) return;
    helpOverlay.remove();
    helpOverlay = null;
    button.focus();
  }

  function showHelp() {
    if (helpOverlay) return;
    const ua = navigator.userAgent || '';
    const isAppleMobile = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroid = /Android/i.test(ua);
    let heading = 'Günlüğüm’ü uygulama olarak yükle';
    let instructions;

    if (isAppleMobile) {
      instructions = [
        'Bu sayfayı Safari tarayıcısında aç.',
        'Paylaş düğmesine dokun.',
        '“Ana Ekrana Ekle” seçeneğini seçip Ekle’ye dokun.'
      ];
    } else if (isAndroid) {
      instructions = [
        'Chrome menüsünü (⋮) aç.',
        '“Uygulamayı yükle” veya “Ana ekrana ekle” seçeneğine dokun.',
        'Onay ekranında Yükle seçeneğini kullan.'
      ];
    } else {
      instructions = [
        'Chrome’da adres çubuğundaki yükleme simgesini veya menüde “Uygulamayı yükle” seçeneğini kullan.',
        'Microsoft Edge’de menü → Uygulamalar → Bu siteyi uygulama olarak yükle yolunu izle.',
        'Seçenek görünmüyorsa siteyi HTTPS üzerinden açıp birkaç saniye bekle.'
      ];
    }

    helpOverlay = document.createElement('div');
    helpOverlay.className = 'pwa-help-overlay';
    helpOverlay.innerHTML = `
      <section class="pwa-help-dialog" role="dialog" aria-modal="true" aria-labelledby="pwaHelpTitle">
        <h2 id="pwaHelpTitle">${heading}</h2>
        <p>Tarayıcına göre şu adımları izle:</p>
        <ol>${instructions.map((item) => `<li>${item}</li>`).join('')}</ol>
        <div class="pwa-help-actions"><button type="button" class="btn pwa-help-close">Kapat</button></div>
      </section>`;
    document.body.appendChild(helpOverlay);
    helpOverlay.querySelector('.pwa-help-close').addEventListener('click', closeHelp);
    helpOverlay.addEventListener('click', (event) => {
      if (event.target === helpOverlay) closeHelp();
    });
    helpOverlay.querySelector('.pwa-help-close').focus();
  }

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    installPrompt = event;
    button.classList.add('pwa-install-ready');
  });

  window.addEventListener('appinstalled', () => {
    button.hidden = true;
    installPrompt = null;
    closeHelp();
  });

  button.addEventListener('click', async () => {
    if (!installPrompt) {
      showHelp();
      return;
    }
    const promptEvent = installPrompt;
    installPrompt = null;
    try {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      if (choice && choice.outcome === 'accepted') button.hidden = true;
    } catch (error) {
      console.warn('Uygulama kurulum istemi açılamadı:', error);
      showHelp();
    }
  });
})();
