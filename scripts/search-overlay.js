/* Günlüğüm — gelişmiş aramayı geçerli sayfadan ayrılmadan modal olarak açar. */
(() => {
  'use strict';

  const script = document.currentScript;
  if (!script?.src) return;

  const rootURL = new URL('../', script.src);
  window.GUNLUGUM_ROOT = rootURL.href;
  const searchPath = new URL('ara/', rootURL).pathname.replace(/\/+$/, '').toLocaleLowerCase('tr-TR');

  // Arama sayfası doğrudan açıldıysa normal sayfa görünümünü koru.
  const currentPath = location.pathname.replace(/\/index\.html$/i, '').replace(/\/+$/, '').toLocaleLowerCase('tr-TR');
  if (currentPath === searchPath) return;

  let dialog = null;
  let initialization = null;
  let opener = null;
  let savedScroll = { x: 0, y: 0 };
  let searchScriptReady = false;
  let errorNotice = null;

  const addStylesheet = (name, version) => {
    const href = new URL(`assets/css/${name}?v=${version}`, rootURL).href;
    const existing = [...document.querySelectorAll('link[rel="stylesheet"]')]
      .find((link) => link.href === href);

    if (existing?.sheet) return Promise.resolve();
    return new Promise((resolve) => {
      const link = existing || document.createElement('link');
      link.addEventListener('load', resolve, { once: true });
      link.addEventListener('error', resolve, { once: true });
      if (!existing) {
        link.rel = 'stylesheet';
        link.href = href;
        link.dataset.gunlugumSearchStyle = name;
        document.head.appendChild(link);
      }
    });
  };

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const existing = [...document.scripts].find((node) => node.src === src);
      if (existing) {
        if (existing.dataset.loaded === 'true') {
          resolve();
          return;
        }
        existing.addEventListener('load', resolve, { once: true });
        existing.addEventListener('error', reject, { once: true });
        return;
      }

      const node = document.createElement('script');
      node.src = src;
      node.dataset.gunlugumSearchScript = 'true';
      node.addEventListener('load', () => {
        node.dataset.loaded = 'true';
        resolve();
      }, { once: true });
      node.addEventListener('error', () => reject(new Error('Arama betiği yüklenemedi.')), { once: true });
      document.body.appendChild(node);
    });
  }

  function showError(message) {
    if (!errorNotice) {
      errorNotice = document.createElement('div');
      errorNotice.className = 'search-overlay-error';
      errorNotice.setAttribute('role', 'alert');
      errorNotice.setAttribute('aria-live', 'assertive');
      document.body.appendChild(errorNotice);
    }
    errorNotice.textContent = message;
    errorNotice.hidden = false;
    window.clearTimeout(showError.timeout);
    showError.timeout = window.setTimeout(() => {
      if (errorNotice) errorNotice.hidden = true;
    }, 5500);
  }

  function closeDialog() {
    if (dialog?.open) dialog.close();
  }

  async function ensureDialog() {
    if (dialog && searchScriptReady) return dialog;
    if (initialization) return initialization;

    initialization = (async () => {
      await Promise.all([
        addStylesheet('search.css', 2),
        addStylesheet('search-overlay.css', 2)
      ]);

      const pageURL = new URL('ara/', rootURL);
      const response = await fetch(pageURL.href, { cache: 'no-cache' });
      if (!response.ok) throw new Error(`Arama arayüzü yüklenemedi (${response.status}).`);

      const html = await response.text();
      const page = new DOMParser().parseFromString(html, 'text/html');
      const panel = page.querySelector('.search-panel');
      const notice = page.querySelector('#searchNotice');
      const results = page.querySelector('.search-results');
      if (!panel || !notice || !results) throw new Error('Arama arayüzünün gerekli bölümleri bulunamadı.');

      dialog = document.createElement('dialog');
      dialog.className = 'search-overlay-dialog';
      dialog.id = 'searchOverlay';
      dialog.setAttribute('aria-labelledby', 'searchOverlayTitle');
      dialog.setAttribute('aria-describedby', 'searchOverlayDescription');

      const shell = document.createElement('div');
      shell.className = 'search-overlay-shell';
      shell.innerHTML = `
        <header class="search-overlay-header">
          <div class="search-overlay-heading">
            <span class="search-overlay-kicker">GÜNLÜĞÜM · TÜM ARŞİV</span>
            <h2 id="searchOverlayTitle">Ara</h2>
            <p id="searchOverlayDescription">Arşivinde ara; kapattığında kaldığın sayfa ve konum korunur.</p>
          </div>
          <button class="search-overlay-close" type="button" aria-label="Aramayı kapat" title="Kapat">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>
          </button>
        </header>
        <div class="search-overlay-scroll"><div class="search-overlay-content"></div></div>`;

      const content = shell.querySelector('.search-overlay-content');
      const intro = document.createElement('p');
      intro.className = 'search-overlay-intro';
      intro.textContent = 'Başlık, kişi, platform, not veya türe göre ara; istersen filtreleri daralt.';
      content.append(intro, panel.cloneNode(true), notice.cloneNode(true), results.cloneNode(true));
      dialog.appendChild(shell);
      document.body.appendChild(dialog);

      shell.querySelector('.search-overlay-close').addEventListener('click', closeDialog);
      dialog.addEventListener('click', (event) => {
        if (event.target === dialog) closeDialog();
      });
      dialog.addEventListener('close', () => {
        document.body.classList.remove('search-overlay-open');
        opener?.setAttribute('aria-expanded', 'false');
        if (opener?.isConnected) opener.focus({ preventScroll: true });
        const pos = savedScroll;
        requestAnimationFrame(() => window.scrollTo({ left: pos.x, top: pos.y, behavior: 'auto' }));
      });

      await loadScript(new URL('scripts/search.js?v=2', rootURL).href);
      searchScriptReady = true;
      return dialog;
    })().catch((error) => {
      initialization = null;
      dialog?.remove();
      dialog = null;
      throw error;
    });

    return initialization;
  }

  async function openSearch(trigger) {
    opener = trigger || null;
    savedScroll = { x: window.scrollX, y: window.scrollY };
    trigger?.setAttribute('aria-expanded', 'true');

    try {
      const panel = await ensureDialog();
      document.body.classList.add('search-overlay-open');
      if (!panel.open) panel.showModal();
      requestAnimationFrame(() => document.getElementById('searchQuery')?.focus({ preventScroll: true }));
    } catch (error) {
      document.body.classList.remove('search-overlay-open');
      trigger?.setAttribute('aria-expanded', 'false');
      console.error('Günlüğüm arama paneli açılamadı:', error);
      // İstenen davranış gereği hata durumunda da kullanıcı başka bir sayfaya yönlendirilmez.
      showError('Arama şu anda yüklenemedi. Bağlantını kontrol edip yeniden deneyebilirsin.');
    }
  }

  function isSearchLink(anchor) {
    if (!anchor?.href || anchor.hasAttribute('download') || (anchor.target && anchor.target !== '_self')) return false;
    try {
      const destination = new URL(anchor.href, location.href);
      const destinationPath = destination.pathname.replace(/\/index\.html$/i, '').replace(/\/+$/, '').toLocaleLowerCase('tr-TR');
      return destination.origin === location.origin && destinationPath === searchPath;
    } catch (_) {
      return false;
    }
  }

  // Sabit üst düğmeleri, ana sayfa arama kartını, alt bağlantıları ve dinamik menüyü yakalar.
  document.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const anchor = event.target instanceof Element ? event.target.closest('a[href]') : null;
    if (!anchor || !isSearchLink(anchor)) return;
    event.preventDefault();
    event.stopPropagation();
    openSearch(anchor);
  }, true);

  document.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      const trigger = document.querySelector('a.top-search-link, a.home-tool-search');
      openSearch(trigger);
    }
  });
})();
