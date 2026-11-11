/* Günlüğüm — GameCapsuleTV esintili ortak site kabuğu.
   Bütün sayfalarda aynı gezinme, tema ve etkileşim dilini kullanır.
   Arşiv verilerine ve mevcut sayfa işlevlerine müdahale etmez. */
(() => {
  'use strict';

  const body = document.body;
  const root = document.documentElement;
  if (!body || body.dataset.gcShell === '1') return;

  const paths = {
    home: '/',
    games: '/oyun/',
    movies: '/film/',
    series: '/dizi/',
    anime: '/anime/',
    technopat: '/technopat/incelemeler/',
    guides: '/technopat/rehberler/',
    techMediaReviews: '/technopat/dizi-film-incelemeleri/',
    stats: '/istatistik/',
    people: '/kisiler/',
    giveaway: '/cekilis/',
    search: '/ara/',
    costs: '/oyun/maliyet/',
    admin: '/admin/'
  };

  const path = decodeURI(location.pathname)
    .replace(/index\.html$/i, '')
    .replace(/\/+$/, '') || '/';

  let current = null;
  if (path === '/') current = 'home';
  else if (path.startsWith('/oyun/maliyet')) current = 'costs';
  else if (path.startsWith('/oyun')) current = 'games';
  else if (path.startsWith('/film')) current = 'movies';
  else if (path.startsWith('/dizi')) current = 'series';
  else if (path.startsWith('/anime')) current = 'anime';
  else if (path.startsWith('/technopat/dizi-film-incelemeleri')) current = 'techMediaReviews';
  else if (path.startsWith('/technopat/rehberler')) current = 'guides';
  else if (path.startsWith('/technopat')) current = 'technopat';
  else if (path.startsWith('/istatistik')) current = 'stats';
  else if (path.startsWith('/kisiler')) current = 'people';
  else if (path.startsWith('/cekilis')) current = 'giveaway';
  else if (path.startsWith('/ara')) current = 'search';
  else if (path.startsWith('/admin')) current = 'admin';

  const icon = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const icons = {
    home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    games: '<path d="M6 12h4m-2-2v4m7-2h.01M18 10h.01M6 7h12a4 4 0 0 1 3.8 5.2l-1.1 3.7a2 2 0 0 1-3.3 1l-2.1-2H8.7l-2.1 2a2 2 0 0 1-3.3-1l-1.1-3.7A4 4 0 0 1 6 7z"/>',
    movies: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 4v16M17 4v16M3 9h4m-4 6h4m10-6h4m-4 6h4"/>',
    series: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M9 3v18m6-18v18M4 8h5m-5 8h5m6-8h5m-5 8h5"/>',
    anime: '<path d="m12 3 2.2 5.7L20 11l-5.8 2.2L12 19l-2.2-5.8L4 11l5.8-2.3L12 3z"/><path d="m19 16 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16z"/>',
    technopat: '<path d="M4 5h16v11H8l-4 4z"/><path d="M8 9h8M8 12h5"/>',
    stats: '<path d="M4 19V5m0 14h17"/><rect x="7" y="11" width="3" height="5" rx=".5"/><rect x="13" y="7" width="3" height="9" rx=".5"/><rect x="19" y="3" width="2" height="13" rx=".5"/>',
    people: '<circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0m2-9a3 3 0 1 0 0-6m1 9a5 5 0 0 1 3 5"/>',
    giveaway: '<path d="M4 8h16v13H4zM2 5h20v3H2zM12 5v16"/><path d="M12 5H7.5a2.5 2.5 0 1 1 2.2-3.7L12 5zm0 0h4.5a2.5 2.5 0 1 0-2.2-3.7L12 5z"/>',
    search: '<circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.5 4.5"/>',
    admin: '<path d="M12 3 4 6v5c0 5 3.4 8.5 8 10 4.6-1.5 8-5 8-10V6z"/><path d="m9 12 2 2 4-4"/>',
    costs: '<circle cx="12" cy="12" r="9"/><path d="M15 8.5c-.7-.7-1.7-1-3-1-1.7 0-2.8.8-2.8 2s1 1.8 2.8 2.3 2.8 1.1 2.8 2.5-1.2 2.4-3 2.4c-1.2 0-2.4-.5-3.1-1.2M12 5.5v13"/>'
  };

  const makeLink = (key, label, desc, emoji) => ({ key, href: paths[key], label, desc, emoji: emoji || '✦' });
  const groups = [
    {
      label: 'Arşivim',
      items: [
        makeLink('home', 'Ana sayfa', 'Günlüğüm ana ekranı', '⌂'),
        makeLink('games', 'Oyunlar', 'Oynadığım ve arşivlediğim oyunlar', '🎮'),
        makeLink('movies', 'Filmler', 'Film koleksiyonum', '🎬'),
        makeLink('series', 'Diziler', 'Dizi koleksiyonum', '📺'),
        makeLink('anime', 'Animeler', 'Anime koleksiyonum', '✦')
      ]
    },
    {
      label: 'Keşfet ve analiz et',
      items: [
        makeLink('technopat', 'Technopat incelemeleri', 'Yayımladığım incelemeler', '✎'),
        makeLink('guides', 'Technopat rehberleri', 'Hazırladığım rehberler', '▤'),
        makeLink('techMediaReviews', 'Dizi ve film incelemelerim', 'Technopat Sosyal üzerinde yayımladığım dizi ve film incelemeleri', '🎬'),
        makeLink('stats', 'İstatistikler', 'Arşiv ve puan analizleri', '▥'),
        makeLink('people', 'Kişiler ve stüdyolar', 'Yapımların arkasındaki isimler', '♙'),
        makeLink('search', 'Gelişmiş arama', 'Tüm arşivde filtreli arama', '⌕')
      ]
    },
    {
      label: 'Araçlar',
      items: [
        makeLink('costs', 'Oyun maliyeti', 'Mağaza ve kütüphane takibi', '₺'),
        makeLink('giveaway', 'Çekiliş', 'Zaman ayarlı çekiliş alanı', '✧'),
        makeLink('admin', 'Yönetim paneli', 'Arşiv ve site içeriklerini yönet', '⚙')
      ]
    }
  ];

  const brand = '<a class="gc-brand" href="/" aria-label="Günlüğüm ana sayfa"><span class="gc-brand-mark" aria-hidden="true">G</span><span class="gc-brand-copy">Günlüğüm<small>UMUT MELİH AKYOL</small></span></a>';
  const navKeys = ['home', 'games', 'movies', 'series', 'anime', 'technopat', 'stats'];
  const navLabels = { home: 'Ana Sayfa', games: 'Oyunlar', movies: 'Filmler', series: 'Diziler', anime: 'Anime', technopat: 'Technopat', stats: 'İstatistik' };
  const topNav = navKeys.map(key => `<a href="${paths[key]}"${current === key ? ' aria-current="page"' : ''}>${navLabels[key]}</a>`).join('');

  const header = document.createElement('header');
  header.className = 'gc-header';
  header.innerHTML = `<div class="gc-header-inner">${brand}<nav class="gc-nav-links" aria-label="Ana gezinme">${topNav}</nav><div class="gc-header-actions"><a class="gc-icon-button" href="${paths.search}" aria-label="Arşivde ara" title="Arşivde ara">${icon(icons.search)}</a><button class="gc-menu-trigger" id="gcMenuOpen" type="button" aria-label="Tüm menüyü aç" aria-controls="gcMenuPanel" aria-expanded="false">${icon('<path d="M4 6h16M4 12h16M4 18h16"/>')}</button></div></div>`;

  const overlay = document.createElement('div');
  overlay.className = 'gc-menu-overlay';
  overlay.id = 'gcMenuOverlay';
  overlay.setAttribute('aria-hidden', 'true');

  const drawer = document.createElement('aside');
  drawer.className = 'gc-menu-panel';
  drawer.id = 'gcMenuPanel';
  drawer.setAttribute('role', 'dialog');
  drawer.setAttribute('aria-modal', 'true');
  drawer.setAttribute('aria-label', 'Site menüsü');
  drawer.setAttribute('aria-hidden', 'true');
  drawer.tabIndex = -1;
  drawer.innerHTML = `<div class="gc-menu-head">${brand}<button class="gc-menu-close" id="gcMenuClose" type="button" aria-label="Menüyü kapat">${icon('<path d="m6 6 12 12M18 6 6 18"/>')}</button></div><div class="gc-menu-scroll">${groups.map(group => `<section class="gc-menu-group"><p class="gc-menu-label">${group.label}</p>${group.items.map(item => `<a class="gc-menu-link${current === item.key ? ' is-active' : ''}" href="${item.href}"${current === item.key ? ' aria-current="page"' : ''}><span class="gc-menu-icon">${item.emoji}</span><span class="gc-menu-copy"><strong>${item.label}</strong><small>${item.desc}</small></span><span class="gc-menu-arrow" aria-hidden="true">›</span></a>`).join('')}</section>`).join('')}</div>`;

  const mobile = document.createElement('nav');
  mobile.className = 'gc-mobile-nav';
  mobile.setAttribute('aria-label', 'Mobil gezinme');
  const mobileItems = [
    ['games', 'Oyun', icons.games],
    ['movies', 'Film', icons.movies],
    ['home', 'Ana sayfa', icons.home],
    ['anime', 'Anime', icons.anime],
    ['search', 'Ara', icons.search]
  ];
  mobile.innerHTML = mobileItems.map(([key, label, svg]) => `<a class="gc-mobile-link${key === 'home' ? ' gc-mobile-home' : ''}" href="${paths[key]}"${current === key ? ' aria-current="page"' : ''}>${key === 'home' ? '<span>G</span>' : icon(svg)}${key === 'home' ? '' : `<span>${label}</span>`}</a>`).join('');

  const oldNav = document.querySelector('.folio-nav');
  if (oldNav) oldNav.classList.add('gc-folio-hidden');
  body.insertBefore(header, body.firstChild);
  body.append(overlay, drawer, mobile);
  body.dataset.gcShell = '1';
  body.classList.add('gc-shell-mounted');

  const openBtn = header.querySelector('#gcMenuOpen');
  const closeBtn = drawer.querySelector('#gcMenuClose');
  let lastFocus = null;

  const openMenu = () => {
    lastFocus = document.activeElement;
    drawer.classList.add('is-open');
    overlay.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    overlay.setAttribute('aria-hidden', 'false');
    openBtn.setAttribute('aria-expanded', 'true');
    body.classList.add('gc-menu-open');
    closeBtn.focus();
  };

  const closeMenu = () => {
    if (!drawer.classList.contains('is-open')) return;
    drawer.classList.remove('is-open');
    overlay.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    overlay.setAttribute('aria-hidden', 'true');
    openBtn.setAttribute('aria-expanded', 'false');
    body.classList.remove('gc-menu-open');
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
  };

  openBtn.addEventListener('click', openMenu);
  closeBtn.addEventListener('click', closeMenu);
  overlay.addEventListener('click', closeMenu);
  drawer.addEventListener('click', event => {
    if (event.target.closest('a')) closeMenu();
  });
  document.addEventListener('keydown', event => {
    if (!drawer.classList.contains('is-open')) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      closeMenu();
      return;
    }
    if (event.key === 'Tab') {
      const focusable = [...drawer.querySelectorAll('a[href],button:not([disabled])')];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  // Eski sayfalardaki tema düğmelerinin ve yönetim panelinin de aynı tercihi
  // kullanmasını sağlar. Önceki sürümün "theme" anahtarı da geriye dönük okunur.
  let theme = 'dark';
  try {
    theme = localStorage.getItem('gc-theme') || localStorage.getItem('theme') || 'dark';
  } catch (_) {}
  if (theme !== 'light' && theme !== 'dark') theme = 'dark';

  const themeMeta = document.querySelector('meta[name="theme-color"]');
  const syncTheme = () => {
    root.dataset.theme = theme;
    if (themeMeta) themeMeta.setAttribute('content', theme === 'dark' ? '#08090f' : '#f4f3fa');
    document.querySelectorAll('#themeBtn, #adminThemeToggle').forEach(button => {
      button.setAttribute('aria-pressed', String(theme === 'dark'));
      button.setAttribute('title', theme === 'dark' ? 'Açık temaya geç' : 'Koyu temaya geç');
    });
  };
  const toggleTheme = () => {
    theme = theme === 'dark' ? 'light' : 'dark';
    syncTheme();
    try {
      localStorage.setItem('gc-theme', theme);
      localStorage.setItem('theme', theme);
    } catch (_) {}
  };
  window.toggleTheme = toggleTheme;
  document.querySelectorAll('#themeBtn').forEach(button => {
    button.removeAttribute('onclick');
    button.addEventListener('click', toggleTheme);
  });
  // Yönetim panelinin kendi düğmesi, sayfa içindeki DOMContentLoaded
  // dinleyicisi üzerinden window.toggleTheme çağırır; çift geçiş oluşturma.
  syncTheme();

  // Sayfa bloklarını hafifçe görünür kıl; hareket azaltma tercihini gözet.
  if (window.matchMedia && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const candidates = document.querySelectorAll('.hero,.stats-hero,.search-hero,.tech-hero,.people-hero,.gw-intro,.home-collections,.home-tools,.tech-hub,.recentWrap,.panel,.stats-panel,.cost-intro');
    candidates.forEach((el, index) => {
      el.style.animation = `gcReveal .55s cubic-bezier(.2,.7,.2,1) ${Math.min(index, 7) * 45}ms both`;
    });
    const style = document.createElement('style');
    style.textContent = '@keyframes gcReveal{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}';
    document.head.append(style);
  }
})();
