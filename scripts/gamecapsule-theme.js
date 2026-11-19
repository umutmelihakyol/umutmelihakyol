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
    franchises: '/seriler/',
    technopat: '/technopat/incelemeler/',
    guides: '/technopat/rehberler/',
    techMediaReviews: '/technopat/dizi-film-incelemeleri/',
    stats: '/istatistik/',
    people: '/kisiler/',
    giveaway: '/cekilis/',
    search: '/ara/',
    recommendations: '/oneriler/',
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
  else if (path.startsWith('/seriler')) current = 'franchises';
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
    franchises: '<path d="M4 5h16v14H4z"/><path d="M8 9h8M8 12h5M8 15h8"/><path d="M7 3v2m10-2v2"/>',
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
        makeLink('anime', 'Animeler', 'Anime koleksiyonum', '✦'),
        makeLink('franchises', 'Seri & Evren Rehberi', 'Oyun serilerinin oynama sırası ve evren bağlantıları', '▤')
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
        makeLink('recommendations', 'Önerilerim', 'Oyun, film, dizi ve anime önerilerim', '♡'),
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
  const navKeys = ['home', 'games', 'movies', 'series', 'anime', 'franchises', 'technopat', 'stats'];
  const navLabels = { home: 'Ana Sayfa', games: 'Oyunlar', movies: 'Filmler', series: 'Diziler', anime: 'Anime', franchises: 'Seri & Evren', technopat: 'Technopat', stats: 'İstatistik' };
  const topNav = navKeys.map(key => `<a href="${paths[key]}"${current === key ? ' aria-current="page"' : ''}>${navLabels[key]}</a>`).join('');

  const header = document.createElement('header');
  header.className = 'gc-header';
  header.setAttribute('role', 'banner');
  header.innerHTML = `<div class="gc-header-inner">
    <div class="gc-header-leading">
      <div class="gc-history-actions" aria-label="Sayfa geçmişi">
        <button class="gc-history-button" id="gcHistoryBack" type="button" aria-label="Önceki sayfa" title="Geri">${icon('<path d="m15 18-6-6 6-6"/>')}</button>
        <button class="gc-history-button" id="gcHistoryForward" type="button" aria-label="Sonraki sayfa" title="İleri">${icon('<path d="m9 18 6-6-6-6"/>')}</button>
      </div>
    </div>
    <div class="gc-top-search-wrap">
      <form class="gc-top-search" id="gcTopSearchForm" role="search" aria-label="Arşivde ara" autocomplete="off">
        ${icon(icons.search)}
        <input id="gcTopSearchInput" type="search" autocomplete="off" placeholder="Oyun, film, dizi veya anime ara..." aria-label="Arşivde ara" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="gcTopSearchSuggestions">
        <kbd>Ctrl K</kbd>
        <button class="gc-top-search-advanced" id="gcTopSearchAdvanced" type="button" aria-label="Detaylı aramayı aç" title="Tüm filtrelerle ara">Detaylı arama <span aria-hidden="true">↗</span></button>
      </form>
      <div class="gc-top-search-suggestions" id="gcTopSearchSuggestions" role="listbox" aria-label="Hızlı arama sonuçları" hidden></div>
    </div>
    <div class="gc-header-actions">
      <button class="gc-theme-quick" id="gcThemeQuick" type="button" aria-label="Temayı değiştir" title="Açık/koyu tema">${icon('<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/>')}</button>
      <button class="gc-menu-trigger" id="gcMenuOpen" type="button" aria-label="Tüm menüyü aç" aria-controls="gcMenuPanel" aria-expanded="false">${icon('<path d="M4 6h16M4 12h16M4 18h16"/>')}</button>
    </div>
  </div>`;

  const overlay = document.createElement('div');
  overlay.className = 'gc-menu-overlay';
  overlay.id = 'gcMenuOverlay';
  overlay.setAttribute('aria-hidden', 'true');

  const drawer = document.createElement('aside');
  drawer.className = 'gc-menu-panel';
  drawer.id = 'gcMenuPanel';
  drawer.setAttribute('role', 'navigation');
  drawer.setAttribute('aria-label', 'Ana site menüsü');
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
  const desktopSidebarQuery = window.matchMedia('(min-width: 1101px)');
  let lastFocus = null;

  header.querySelector('#gcHistoryBack')?.addEventListener('click', () => {
    if (history.length > 1) history.back();
  });
  header.querySelector('#gcHistoryForward')?.addEventListener('click', () => history.forward());
  header.querySelector('#gcThemeQuick')?.addEventListener('click', () => window.toggleTheme?.());

  // Üst arama alanı: yazarken hızlı sonuçlar gösterir; Detaylı arama tüm filtre panelini açar.
  const topSearchWrap = header.querySelector('.gc-top-search-wrap');
  const topSearch = header.querySelector('#gcTopSearchForm');
  const topSearchInput = header.querySelector('#gcTopSearchInput');
  const suggestions = header.querySelector('#gcTopSearchSuggestions');
  const advancedSearchButton = header.querySelector('#gcTopSearchAdvanced');
  const rootScript = [...document.scripts].find(node => /gamecapsule-theme\.js(?:\?|$)/.test(node.src));
  const siteRootURL = rootScript?.src ? new URL('../', rootScript.src) : new URL('/', location.origin);
  const quickCategories = [
    { type: 'oyun', label: 'Oyun', icon: '🎮', file: 'data/games.json' },
    { type: 'film', label: 'Film', icon: '🎬', file: 'data/movies.json' },
    { type: 'dizi', label: 'Dizi', icon: '📺', file: 'data/series.json' },
    { type: 'anime', label: 'Anime', icon: '✦', file: 'data/anime.json' }
  ];
  let quickRecords = null;
  let quickLoadPromise = null;
  let quickMatches = [];
  let activeQuickIndex = -1;
  let quickSearchSequence = 0;
  const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
  const normalizeSearchText = value => String(value ?? '').toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ı/g, 'i').trim();
  const safeImage = value => {
    try {
      const url = new URL(String(value || ''), siteRootURL);
      return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
    } catch (_) { return ''; }
  };
  const setSuggestionsOpen = open => {
    if (!suggestions || !topSearchInput) return;
    suggestions.hidden = !open;
    topSearchInput.setAttribute('aria-expanded', String(open));
    topSearchWrap?.classList.toggle('has-suggestions', open);
  };
  const loadQuickRecords = () => {
    if (quickRecords) return Promise.resolve(quickRecords);
    if (quickLoadPromise) return quickLoadPromise;
    quickLoadPromise = Promise.all(quickCategories.map(async category => {
      try {
        const response = await fetch(new URL(category.file, siteRootURL).href, { cache: 'force-cache' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (!Array.isArray(data)) return [];
        return data.filter(item => item && item.id != null && item.title).map(item => ({
          ...item,
          _quickType: category.type,
          _quickLabel: category.label,
          _quickIcon: category.icon,
          _quickUrl: `${new URL('icerik/', siteRootURL).href}?tip=${encodeURIComponent(category.type)}&id=${encodeURIComponent(item.id)}`
        }));
      } catch (error) {
        console.warn(`Hızlı arama verisi yüklenemedi (${category.label}):`, error);
        return [];
      }
    })).then(groups => {
      quickRecords = groups.flat();
      return quickRecords;
    }).catch(error => {
      quickLoadPromise = null;
      throw error;
    });
    return quickLoadPromise;
  };
  const quickRelevance = (item, query) => {
    const title = normalizeSearchText(item.title);
    const aliases = normalizeSearchText([item.originalTitle, item.alternativeTitle, ...(Array.isArray(item.alternativeTitles) ? item.alternativeTitles : [])].filter(Boolean).join(' '));
    const extras = normalizeSearchText([item.platform, item.developer, item.director, item.creator, item.studio, ...(item.genres || [])].filter(Boolean).join(' '));
    if (title === query) return 1000;
    if (title.startsWith(query)) return 800;
    if (title.includes(query)) return 650;
    if (aliases.includes(query)) return 550;
    if (extras.includes(query)) return 220;
    const tokens = query.split(/\s+/).filter(Boolean);
    if (tokens.length > 1 && tokens.every(token => title.includes(token))) return 450;
    return 0;
  };
  const renderQuickSuggestions = (records, query) => {
    if (!suggestions) return;
    quickMatches = records;
    activeQuickIndex = -1;
    if (!records.length) {
      suggestions.innerHTML = `<div class="gc-top-search-empty"><strong>Sonuç bulunamadı</strong><span>Başka bir ifade deneyebilir veya detaylı aramayı açabilirsin.</span></div>`;
      setSuggestionsOpen(true);
      return;
    }
    suggestions.innerHTML = `<div class="gc-top-search-suggestion-head"><span>Hızlı sonuçlar</span><span>${records.length} kayıt</span></div>` + records.map((item, index) => {
      const image = safeImage(item.image);
      const score = item.score !== null && item.score !== undefined && item.score !== '' && Number.isFinite(Number(item.score)) ? `★ ${Number(item.score).toLocaleString('tr-TR', { maximumFractionDigits: 1 })}` : '';
      const meta = [item.year || '', ...(Array.isArray(item.genres) ? item.genres.slice(0, 2) : []), score].filter(Boolean).join(' · ');
      return `<a class="gc-top-search-suggestion" role="option" aria-selected="false" data-quick-index="${index}" href="${escapeHTML(item._quickUrl)}">${image ? `<img src="${escapeHTML(image)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer">` : `<span class="gc-top-search-suggestion-fallback">${escapeHTML(item._quickIcon)}</span>`}<span class="gc-top-search-suggestion-copy"><strong>${escapeHTML(item.title)}</strong><small>${escapeHTML(meta || item._quickLabel)}</small></span><span class="gc-top-search-suggestion-type">${escapeHTML(item._quickIcon)} ${escapeHTML(item._quickLabel)}</span><span class="gc-top-search-suggestion-arrow" aria-hidden="true">↗</span></a>`;
    }).join('') + `<button class="gc-top-search-show-all" type="button" id="gcTopSearchShowAll">Tüm sonuçları gör <span aria-hidden="true">↗</span></button>`;
    suggestions.querySelector('#gcTopSearchShowAll')?.addEventListener('click', openDetailedSearch);
    setSuggestionsOpen(true);
  };
  const openDetailedSearch = () => {
    const query = String(topSearchInput?.value || '').trim();
    setSuggestionsOpen(false);
    const currentPath = location.pathname.replace(/index\.html$/i, '').replace(/\/+$/, '') || '/';
    if (currentPath === '/ara') {
      const pageSearch = document.getElementById('searchQuery');
      if (pageSearch) {
        pageSearch.value = query;
        pageSearch.dispatchEvent(new Event('input', { bubbles: true }));
        pageSearch.focus({ preventScroll: false });
      }
      return;
    }
    if (typeof window.openArchiveSearch === 'function') window.openArchiveSearch(query);
    else location.href = `${paths.search}?searchQuery=${encodeURIComponent(query)}`;
  };
  let quickSearchTimer = 0;
  const updateQuickSuggestions = async () => {
    const sequence = ++quickSearchSequence;
    const query = normalizeSearchText(topSearchInput?.value || '');
    if (query.length < 2) { setSuggestionsOpen(false); quickMatches = []; return; }
    suggestions.innerHTML = '<div class="gc-top-search-loading">Arşiv aranıyor…</div>';
    setSuggestionsOpen(true);
    try {
      const records = await loadQuickRecords();
      if (sequence !== quickSearchSequence) return;
      const matches = records.map(item => ({ item, score: quickRelevance(item, query) }))
        .filter(entry => entry.score > 0)
        .sort((a, b) => b.score - a.score || String(a.item.title).localeCompare(String(b.item.title), 'tr-TR'))
        .slice(0, 7).map(entry => entry.item);
      renderQuickSuggestions(matches, query);
    } catch (_) {
      if (sequence !== quickSearchSequence) return;
      suggestions.innerHTML = '<div class="gc-top-search-empty"><strong>Hızlı arama yüklenemedi</strong><span>Detaylı arama ile devam edebilirsin.</span></div>';
      setSuggestionsOpen(true);
    }
  };
  topSearchInput?.addEventListener('input', () => {
    window.clearTimeout(quickSearchTimer);
    quickSearchTimer = window.setTimeout(updateQuickSuggestions, 120);
  });
  topSearchInput?.addEventListener('focus', () => {
    if (normalizeSearchText(topSearchInput.value).length >= 2) updateQuickSuggestions();
  });
  topSearchInput?.addEventListener('keydown', event => {
    if (event.key === 'Escape') { setSuggestionsOpen(false); return; }
    if (event.key === 'ArrowDown' && !suggestions.hidden) {
      event.preventDefault();
      activeQuickIndex = Math.min(activeQuickIndex + 1, quickMatches.length - 1);
    } else if (event.key === 'ArrowUp' && !suggestions.hidden) {
      event.preventDefault();
      activeQuickIndex = Math.max(activeQuickIndex - 1, 0);
    } else if (event.key === 'Enter' && !suggestions.hidden && activeQuickIndex >= 0 && quickMatches[activeQuickIndex]) {
      event.preventDefault();
      location.href = quickMatches[activeQuickIndex]._quickUrl;
      return;
    }
    if (!suggestions.hidden) {
      suggestions.querySelectorAll('[data-quick-index]').forEach((node, index) => {
        const active = index === activeQuickIndex;
        node.classList.toggle('is-active', active);
        node.setAttribute('aria-selected', String(active));
      });
    }
  });
  topSearch?.addEventListener('submit', event => { event.preventDefault(); openDetailedSearch(); });
  advancedSearchButton?.addEventListener('click', openDetailedSearch);
  suggestions?.addEventListener('click', event => {
    const link = event.target.closest('a[data-quick-index]');
    if (link) setSuggestionsOpen(false);
  });
  document.addEventListener('pointerdown', event => {
    if (topSearchWrap && !topSearchWrap.contains(event.target)) setSuggestionsOpen(false);
  });

  // Geniş ekranlarda menü kalıcı sol kenar çubuğudur; dar ekranlarda açılır çekmece olur.
  const syncNavigationMode = () => {
    const isDesktop = desktopSidebarQuery.matches;
    if (isDesktop) {
      drawer.classList.add('is-open');
      drawer.setAttribute('aria-hidden', 'false');
      overlay.classList.remove('is-open');
      overlay.setAttribute('aria-hidden', 'true');
      openBtn.setAttribute('aria-expanded', 'false');
      closeBtn.setAttribute('tabindex', '-1');
      body.classList.remove('gc-menu-open');
    } else {
      drawer.classList.remove('is-open');
      drawer.setAttribute('aria-hidden', 'true');
      overlay.classList.remove('is-open');
      overlay.setAttribute('aria-hidden', 'true');
      openBtn.setAttribute('aria-expanded', 'false');
      closeBtn.removeAttribute('tabindex');
      body.classList.remove('gc-menu-open');
    }
  };

  const openMenu = () => {
    if (desktopSidebarQuery.matches) return;
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
    if (desktopSidebarQuery.matches || !drawer.classList.contains('is-open')) return;
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
    if (!desktopSidebarQuery.matches && event.target.closest('a')) closeMenu();
  });
  document.addEventListener('keydown', event => {
    if (desktopSidebarQuery.matches || !drawer.classList.contains('is-open')) return;
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
  syncNavigationMode();
  if (typeof desktopSidebarQuery.addEventListener === 'function') {
    desktopSidebarQuery.addEventListener('change', syncNavigationMode);
  } else if (typeof desktopSidebarQuery.addListener === 'function') {
    desktopSidebarQuery.addListener(syncNavigationMode);
  }

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
