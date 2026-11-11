/* Günlüğüm — admin panelinden düzenlenebilen ortak yayın navigasyonu. */
(() => {
  const body = document.body;
  if (!body || body.dataset.navBuilt === '1') return;
  const script = document.currentScript;
  const root = new URL('../', script && script.src ? script.src : location.href);
  const fallback = [
    ['home', 'Ana sayfa', '/'], ['oyun', 'Oyunlar', '/oyun/'], ['film', 'Filmler', '/film/'],
    ['dizi', 'Diziler', '/dizi/'], ['anime', 'Anime', '/anime/'],
    ['technopat', 'Yazılarım', '/technopat/incelemeler/'],
    ['tech-media-reviews', 'Dizi/Film incelemelerim', '/technopat/dizi-film-incelemeleri/'],
    ['stats', 'İstatistik', '/istatistik/'], ['people', 'Kişiler', '/kisiler/'],
    ['recommendations', 'Önerilerim', '/oneriler/'], ['giveaway', 'Çekiliş', '/cekilis/'], ['search', 'Arama', '/ara/']
  ].map(([id, label, href]) => ({ id, label, href, enabled: true }));
  const normalize = value => (value || '/').replace(/index\.html$/i, '').replace(/\/$/, '') || '/';
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const resolveHref = href => /^https?:\/\//i.test(href || '') ? href : new URL(String(href || '/').replace(/^\/+/, ''), root).href;

  async function build() {
    let settings = window.SITE_SETTINGS;
    if (!settings && window.SITE_SETTINGS_PROMISE) settings = await window.SITE_SETTINGS_PROMISE;
    if (!settings) {
      try { const response = await fetch(new URL('data/site-settings.json', root).href); if (response.ok) settings = await response.json(); } catch (_) {}
    }
    const rawItems = settings && Array.isArray(settings.navigation) && settings.navigation.length
      ? settings.navigation
      : fallback;
    const baseItems = rawItems.filter(item => {
      if (!item || item.enabled === false) return false;
      const category = settings?.coreCategories?.[item.id];
      return !(category && category.visible === false);
    });
    const customItems = (settings && Array.isArray(settings.customCategories) ? settings.customCategories : [])
      .filter(item => item && item.showInNav && item.slug)
      .map(item => ({ id: `custom-${item.slug}`, slug: item.slug, label: item.title, href: `/koleksiyon/?kategori=${encodeURIComponent(item.slug)}`, enabled: true, custom: true }));
    const items = [...baseItems, ...customItems];
    const path = normalize(location.pathname);
    const nav = document.createElement('nav');
    nav.className = 'folio-nav';
    nav.setAttribute('aria-label', 'Ana gezinme');
    nav.innerHTML = items.map(item => {
      const href = resolveHref(item.href);
      const target = new URL(href, location.href);
      const targetPath = normalize(target.pathname);
      let active = path === targetPath;
      if (item.id === 'home') active = path === '/';
      if (item.id === 'technopat') active = path.startsWith('/technopat/') && !path.startsWith('/technopat/dizi-film-incelemeleri');
      if (item.id === 'tech-media-reviews') active = path.startsWith('/technopat/dizi-film-incelemeleri');
      if (item.custom) active = path.startsWith('/koleksiyon') && new URLSearchParams(location.search).get('kategori') === item.slug;
      const searchAttrs = item.id === 'search' ? ' class="top-search-link" aria-label="Arama penceresini aç" title="Ara" aria-haspopup="dialog" aria-expanded="false"' : '';
      const external = target.origin !== location.origin ? ' target="_blank" rel="noopener noreferrer"' : '';
      return `<a href="${escape(href)}"${searchAttrs}${external}${active ? ' aria-current="page"' : ''}><span>${escape(item.label || 'Bağlantı')}</span></a>`;
    }).join('');

    const header = document.querySelector('.top, .tech-page-top, .gw-topbar');
    if (header) header.insertAdjacentElement('afterend', nav);
    else {
      const host = document.querySelector('.wrap, .people-wrap, .gw-wrap, main');
      if (host) host.prepend(nav);
    }
    body.dataset.navBuilt = '1';
  }
  build();
})();
