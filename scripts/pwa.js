/* Günlüğüm PWA: yükleme düğmesi, güncel Service Worker ve PWA stili. */
(() => {
  'use strict';

  const currentScript = document.currentScript;
  if (!currentScript || !currentScript.src) return;

  const scriptURL = new URL(currentScript.src, window.location.href);
  const rootURL = new URL('../', scriptURL);
  const serviceWorkerURL = new URL('service-worker.js', rootURL);
  const pwaCssURL = new URL('assets/css/pwa.css', rootURL);

  if (!document.querySelector('link[data-gunlugum-pwa-css]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `${pwaCssURL.href}?v=2`;
    link.dataset.gunlugumPwaCss = 'true';
    document.head.appendChild(link);
  }

  // Kayıt kök kapsamlıdır; aynı kapsamı her kayıtta koru ve SW dosyasını HTTP önbelleğinden alma.
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    const register = () => navigator.serviceWorker.register(serviceWorkerURL.href, {
      scope: rootURL.pathname,
      updateViaCache: 'none'
    }).then((registration) => {
      // Bu çağrı güncellenmiş Service Worker'ın beklemeden kontrol edilmesini sağlar.
      registration.update().catch(() => {});
      return registration;
    }).catch((error) => {
      console.warn('Günlüğüm çevrimdışı desteği başlatılamadı:', error);
      return null;
    });

    if (document.readyState === 'complete') register();
    else window.addEventListener('load', register, { once: true });
  }

  const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  if (standalone) return;

  const actionBar = document.querySelector('.top .acts, .tech-page-top .acts, header .acts');
  if (!actionBar || actionBar.querySelector('.pwa-install-btn')) return;

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'btn ico pwa-install-btn';
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
    const heading = 'Günlüğüm’ü uygulama olarak yükle';
    let instructions;

    if (isAppleMobile) {
      instructions = ['Bu sayfayı Safari tarayıcısında aç.', 'Paylaş düğmesine dokun.', '“Ana Ekrana Ekle” seçeneğini seçip Ekle’ye dokun.'];
    } else if (isAndroid) {
      instructions = ['Chrome menüsünü (⋮) aç.', '“Uygulamayı yükle” veya “Ana ekrana ekle” seçeneğine dokun.', 'Onay ekranında Yükle seçeneğini kullan.'];
    } else {
      instructions = [
        'Chrome’da adres çubuğundaki yükleme simgesini veya menüde “Uygulamayı yükle” seçeneğini kullan.',
        'Microsoft Edge’de menü → Uygulamalar → Bu siteyi uygulama olarak yükle yolunu izle.',
        'Seçenek görünmüyorsa sayfanın HTTPS üzerinden açıldığını ve manifestin yüklendiğini kontrol et.'
      ];
    }

    helpOverlay = document.createElement('div');
    helpOverlay.className = 'pwa-help-overlay';
    const dialog = document.createElement('section');
    dialog.className = 'pwa-help-dialog';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-labelledby', 'pwaHelpTitle');
    const title = document.createElement('h2');
    title.id = 'pwaHelpTitle';
    title.textContent = heading;
    const paragraph = document.createElement('p');
    paragraph.textContent = 'Tarayıcına göre şu adımları izle:';
    const list = document.createElement('ol');
    instructions.forEach((instruction) => {
      const li = document.createElement('li');
      li.textContent = instruction;
      list.appendChild(li);
    });
    const actions = document.createElement('div');
    actions.className = 'pwa-help-actions';
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'btn pwa-help-close';
    close.textContent = 'Kapat';
    actions.appendChild(close);
    dialog.append(title, paragraph, list, actions);
    helpOverlay.appendChild(dialog);
    document.body.appendChild(helpOverlay);
    close.addEventListener('click', closeHelp);
    helpOverlay.addEventListener('click', (event) => {
      if (event.target === helpOverlay) closeHelp();
    });
    close.focus();
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
