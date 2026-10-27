/* Günlüğüm — geçerli sayfadan ayrılmadan açılan gelişmiş arama paneli. */
(() => {
  'use strict';
  const script = document.currentScript;
  if (!script || !script.src) return;
  const rootURL = new URL('../', script.src);
  window.GUNLUGUM_ROOT = rootURL.href;

  // Arama sayfasının kendisindeyken üst düğme aynı sayfanın bağlantısı olarak kalsın.
  if (/\/ara\/?$/i.test(location.pathname)) return;

  let dialog = null;
  let initialization = null;
  let opener = null;
  let savedScroll = { x: 0, y: 0 };
  let searchScriptReady = false;

  const addStylesheet = (name, version) => {
    const href = new URL(`assets/css/${name}?v=${version}`, rootURL).href;
    const existing = [...document.querySelectorAll('link[rel="stylesheet"]')].find((link) => link.href === href);
    if (existing) return existing.sheet ? Promise.resolve() : new Promise((resolve) => {
      existing.addEventListener('load', resolve, { once: true });
      existing.addEventListener('error', resolve, { once: true });
    });
    return new Promise((resolve) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.dataset.gunlugumSearchStyle = name;
      link.addEventListener('load', resolve, { once: true });
      link.addEventListener('error', resolve, { once: true });
      document.head.appendChild(link);
    });
  };

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const existing = [...document.scripts].find((node) => node.src === src);
      if (existing) {
        if (existing.dataset.loaded === 'true') { resolve(); return; }
        existing.addEventListener('load', resolve, { once: true });
        existing.addEventListener('error', reject, { once: true });
        return;
      }
      const node = document.createElement('script');
      node.src = src;
      node.dataset.gunlugumSearchScript = 'true';
      node.addEventListener('load', () => { node.dataset.loaded = 'true'; resolve(); }, { once: true });
      node.addEventListener('error', () => reject(new Error('Arama betiği yüklenemedi.')), { once: true });
      document.body.appendChild(node);
    });
  }

  function closeDialog() {
    if (dialog?.open) dialog.close();
  }

  async function ensureDialog() {
    if (dialog && searchScriptReady) return dialog;
    if (initialization) return initialization;
    initialization = (async () => {
      await Promise.all([addStylesheet('search.css', 2), addStylesheet('search-overlay.css', 1)]);
      const pageURL = new URL('ara/', rootURL);
      const response = await fetch(pageURL.href, { cache: 'no-cache' });
      if (!response.ok) throw new Error(`Arama arayüzü yüklenemedi (${response.status}).`);
      const html = await response.text();
      const page = new DOMParser().parseFromString(html, 'text/html');
      const panel = page.querySelector('.search-panel');
      const notice = page.querySelector('#searchNotice');
      const results = page.querySelector('.search-results');
      if (!panel || !notice || !results) throw new Error('Arama arayüzü eksik içeriyor.');

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
            <p id="searchOverlayDescription">Arşivinde ara; kapattığında kaldığın sayfaya ve konuma dön.</p>
          </div>
          <button class="search-overlay-close" type="button" aria-label="Aramayı kapat" title="Kapat"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button>
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
      dialog.addEventListener('click', (event) => { if (event.target === dialog) closeDialog(); });
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
    opener = trigger;
    savedScroll = { x: window.scrollX, y: window.scrollY };
    trigger?.setAttribute('aria-expanded', 'true');
    try {
      const panel = await ensureDialog();
      if (!panel.open) panel.showModal();
      document.body.classList.add('search-overlay-open');
      requestAnimationFrame(() => document.getElementById('searchQuery')?.focus({ preventScroll: true }));
    } catch (error) {
      trigger?.setAttribute('aria-expanded', 'false');
      console.warn('Günlüğüm araması panel olarak açılamadı; arama sayfasına geçiliyor:', error);
      if (trigger?.href) location.href = trigger.href;
    }
  }

  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('a.top-search-link, a.home-tool-search');
    if (!trigger || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    openSearch(trigger);
  });

  document.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      const trigger = document.querySelector('a.top-search-link, a.home-tool-search');
      if (trigger) openSearch(trigger);
    }
  });
})();
