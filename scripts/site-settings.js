/* Günlüğüm — admin panelinden yönetilen site metinleri ve kategori ayarları. */
(() => {
  const current = document.currentScript;
  const root = new URL('../', current && current.src ? current.src : location.href);
  window.GUNLUGUM_ROOT = root;
  const fallback = { version: 1, site: {}, home: {}, pages: {}, homeVisibility: { intro:true, collections:true, yearlyFavorites:true, tools:true, technopat:true, recent:true }, coreCategories: {}, navigation: [], customCategories: [], customTextOverrides: [] };

  function get(obj, path) {
    return path.split('.').reduce((value, key) => value && value[key] !== undefined ? value[key] : undefined, obj);
  }
  function apply(settings) {
    window.SITE_SETTINGS = settings;
    const textNodes = document.querySelectorAll('[data-site-text]');
    textNodes.forEach((node) => {
      const value = get(settings, node.dataset.siteText);
      if (typeof value === 'string') node.textContent = value;
    });
    (settings.customTextOverrides || []).forEach(rule => {
      if (!rule || !rule.id || typeof rule.text !== 'string') return;
      const node = document.getElementById(rule.id);
      if (node) node.textContent = rule.text;
    });

    const homeSectionSelectors = {
      intro: '.hero', collections: '.home-collections', yearlyFavorites: '#yearlyFavorites',
      tools: '.home-tools', technopat: '.tech-hub', recent: '#recentWrap'
    };
    Object.entries(homeSectionSelectors).forEach(([key, selector]) => {
      const section = document.querySelector(selector);
      if (section) section.classList.toggle('admin-hidden-by-settings', settings.homeVisibility?.[key] === false);
    });

    const siteTitle = settings.site && settings.site.title;
    const siteTagline = settings.site && settings.site.tagline;
    const introText = settings.site && settings.site.introText;
    if (siteTitle) {
      const titleNode = document.querySelector('#title');
      if (titleNode && !document.body.classList.contains('admin-page') && !document.body.dataset.cat) titleNode.textContent = siteTitle;
      const loaderTitle = document.querySelector('.site-intro-loader__title');
      if (loaderTitle) loaderTitle.textContent = siteTitle;
      if (document.body.classList.contains('home')) document.title = `${siteTitle} | Oyun, Film, Dizi ve Anime Arşivi`;
    }
    const pageTitleKey = document.querySelector('[data-page-title-key]')?.dataset.pageTitleKey;
    const pageTitleValue = pageTitleKey && get(settings, `pages.${pageTitleKey}`);
    if (pageTitleValue) document.title = `${pageTitleValue} | ${siteTitle || 'Günlüğüm'}`;
    if (siteTagline) {
      const tagline = document.querySelector('#tagline');
      if (tagline) tagline.textContent = siteTagline;
    }
    if (introText) {
      const intro = document.querySelector('.home-intro-copy');
      if (intro) intro.textContent = introText;
    }

    const categoryKey = document.body.dataset.cat;
    if (categoryKey && window.CATS && window.CATS[categoryKey]) {
      const custom = settings.coreCategories && settings.coreCategories[categoryKey];
      if (custom) {
        const cfg = window.CATS[categoryKey];
        if (custom.plural) cfg.plural = custom.plural;
        if (custom.title) cfg.title = custom.title;
        if (custom.description) cfg.desc = custom.description;
        if (custom.soon) cfg.soon = custom.soon;
        const titleNode = document.querySelector('#title');
        const soonNode = document.querySelector('#soonTitle');
        if (titleNode && cfg.title) titleNode.textContent = cfg.title;
        if (soonNode && cfg.soon) soonNode.textContent = cfg.soon;
        document.title = `${cfg.title || cfg.plural} | ${siteTitle || 'Günlüğüm'}`;
      }
      const catsNav = document.querySelector('#cats');
      if (catsNav && settings.coreCategories) {
        catsNav.querySelectorAll('a').forEach((link) => {
          const entry = Object.entries(window.CATS).find(([, cfg]) => new URL(cfg.page, location.href).pathname === new URL(link.href, location.href).pathname);
          if (!entry) return;
          const [key, cfg] = entry;
          const custom = settings.coreCategories[key] || {};
          link.hidden = custom.visible === false;
          const icon = link.querySelector('svg');
          link.textContent = '';
          if (icon) link.appendChild(icon);
          link.append(` ${custom.plural || cfg.plural}`);
        });
      }
    }

    if (settings.navigation && Array.isArray(settings.navigation)) {
      const navMap = new Map(settings.navigation.map(item => [item.id, item]));
      document.querySelectorAll('.home-collections .tile[data-core-category]').forEach((tile) => {
        const key = tile.dataset.coreCategory;
        const custom = settings.coreCategories && settings.coreCategories[key];
        tile.hidden = !!(custom && custom.visible === false);
        if (custom && custom.plural) {
          const heading = tile.querySelector('h3');
          if (heading) heading.textContent = custom.plural;
        }
      });
    }
    window.dispatchEvent(new CustomEvent('gunlugum:site-settings-ready', { detail: settings }));
  }

  window.SITE_SETTINGS_PROMISE = fetch(new URL('data/site-settings.json', root).href + `?v=${Date.now()}`, { cache: 'no-store' })
    .then(response => response.ok ? response.json() : fallback)
    .catch(() => fallback)
    .then(settings => {
      const merged = { ...fallback, ...settings };
      merged.site = { ...fallback.site, ...(settings.site || {}) };
      merged.home = { ...fallback.home, ...(settings.home || {}) };
      merged.pages = { ...fallback.pages, ...(settings.pages || {}) };
      merged.homeVisibility = { ...fallback.homeVisibility, ...(settings.homeVisibility || {}) };
      merged.coreCategories = { ...fallback.coreCategories, ...(settings.coreCategories || {}) };
      merged.navigation = Array.isArray(settings.navigation) ? settings.navigation : [];
      merged.customCategories = Array.isArray(settings.customCategories) ? settings.customCategories : [];
      merged.customTextOverrides = Array.isArray(settings.customTextOverrides) ? settings.customTextOverrides : [];
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => apply(merged), { once: true });
      else apply(merged);
      return merged;
    });
})();
