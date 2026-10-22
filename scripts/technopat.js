(() => {
  'use strict';

  const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));

  const safeForumURL = value => {
    try {
      const url = new URL(value);
      return url.protocol === 'https:' && (url.hostname === 'technopat.net' || url.hostname.endsWith('.technopat.net')) ? url.href : '';
    } catch {
      return '';
    }
  };

  // Türkçe karakterleri dikkate alarak daha toleranslı bir arama sağlar.
  const normalize = value => String(value ?? '')
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  const kind = document.body.dataset.techKind;
  const sourceKey = kind === 'guides' ? 'guides' : 'reviews';
  const titleText = kind === 'guides' ? 'Rehberlerim' : 'İncelemelerim';
  const sourceLabels = {
    Oyun: '🎮', Anime: '✦', Film: '▣', Dizi: '▤', Teknoloji: '⌘', Genel: '✧'
  };

  const filtersRoot = document.querySelector('#techFilters');
  const articlesRoot = document.querySelector('#techArticles');
  const resultsLabel = document.querySelector('#techResultsMeta');
  const searchInput = document.querySelector('#techSearch');
  const tagSelect = document.querySelector('#techTagFilter');
  const sortSelect = document.querySelector('#techSort');
  const clearButton = document.querySelector('#techClearFilters');

  let articles = [];
  let activeFilter = 'Tümü';
  let activeTag = '';
  let searchQuery = '';
  let sortMode = 'default';

  function matchesSearch(item) {
    if (!searchQuery) return true;
    const searchable = [item.title, item.description, item.category, item.tag, item.url]
      .map(normalize)
      .join(' ');
    return searchable.includes(searchQuery);
  }

  function getSearchMatches() {
    return articles.filter(matchesSearch);
  }

  function getBaseMatches() {
    return getSearchMatches().filter(item => !activeTag || (item.tag || (kind === 'guides' ? 'Rehber' : 'İnceleme')) === activeTag);
  }

  function renderTagOptions() {
    const currentValue = activeTag;
    const searchMatches = getSearchMatches();
    const allTags = [...new Set(articles.map(item => item.tag || (kind === 'guides' ? 'Rehber' : 'İnceleme')))]
      .sort((a, b) => a.localeCompare(b, 'tr'));

    tagSelect.innerHTML = '<option value="">Tüm etiketler</option>' + allTags.map(tag => {
      const count = searchMatches.filter(item => (item.tag || (kind === 'guides' ? 'Rehber' : 'İnceleme')) === tag).length;
      return `<option value="${escapeHTML(tag)}">${escapeHTML(tag)} (${count})</option>`;
    }).join('');

    if (currentValue && allTags.includes(currentValue)) {
      tagSelect.value = currentValue;
    } else {
      activeTag = '';
      tagSelect.value = '';
    }
  }

  function renderFilters() {
    const categories = ['Tümü', 'Oyun', 'Anime', 'Film', 'Dizi', 'Teknoloji', 'Genel'];
    const base = getBaseMatches();
    filtersRoot.innerHTML = categories.map(category => {
      const count = category === 'Tümü' ? base.length : base.filter(item => (item.category || 'Genel') === category).length;
      return `<button class="tech-filter" type="button" data-filter="${escapeHTML(category)}" aria-pressed="${activeFilter === category}">${escapeHTML(category)}<small>${count}</small></button>`;
    }).join('');
  }

  function sortArticles(items) {
    const result = [...items];
    if (sortMode === 'title-asc') {
      result.sort((a, b) => String(a.title || '').localeCompare(String(b.title || ''), 'tr', { sensitivity: 'base' }));
    } else if (sortMode === 'title-desc') {
      result.sort((a, b) => String(b.title || '').localeCompare(String(a.title || ''), 'tr', { sensitivity: 'base' }));
    } else if (sortMode === 'category') {
      result.sort((a, b) => String(a.category || 'Genel').localeCompare(String(b.category || 'Genel'), 'tr', { sensitivity: 'base' }) || String(a.title || '').localeCompare(String(b.title || ''), 'tr', { sensitivity: 'base' }));
    }
    return result;
  }

  function renderArticles() {
    const base = getBaseMatches();
    const filtered = sortArticles(base.filter(item => activeFilter === 'Tümü' || (item.category || 'Genel') === activeFilter));
    const hasAnyFilter = Boolean(searchQuery || activeTag || activeFilter !== 'Tümü');
    resultsLabel.textContent = searchQuery
      ? `${filtered.length} / ${articles.length} içerik gösteriliyor · Arama: “${searchInput.value.trim()}”`
      : `${filtered.length} / ${articles.length} içerik gösteriliyor`;

    if (!filtered.length) {
      const message = hasAnyFilter
        ? 'Aramanla eşleşen içerik bulunamadı. Arama metnini veya filtreleri değiştirebilirsin.'
        : 'Bu bölümde henüz içerik bulunmuyor. Yeni bir yazı eklediğinde burada görünecek.';
      articlesRoot.innerHTML = `<div class="tech-empty"><strong>İçerik bulunamadı.</strong>${escapeHTML(message)}</div>`;
      return;
    }

    articlesRoot.innerHTML = filtered.map(item => {
      const url = safeForumURL(item.url);
      const category = item.category || 'Genel';
      const tag = item.tag || (kind === 'guides' ? 'Rehber' : 'İnceleme');
      return `<article class="tech-article">
        <div class="tech-article-band"><span class="tech-mini-icon" aria-hidden="true">${escapeHTML(sourceLabels[category] || '✧')}</span><span class="tech-badge">${escapeHTML(tag)}</span></div>
        <div class="tech-article-body">
          <h2>${escapeHTML(item.title)}</h2>
          <p>${escapeHTML(item.description || 'Technopat Sosyal üzerinde yayımladığım içeriğe göz atabilirsin.')}</p>
          <div class="tech-article-foot"><span class="tech-article-category">${escapeHTML(category)}</span>${url ? `<a class="tech-read-link" href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">Forumda oku <span aria-hidden="true">↗</span></a>` : '<span class="tech-article-category">Bağlantı eklenmeli</span>'}</div>
        </div>
      </article>`;
    }).join('');
  }

  function refreshResults() {
    renderTagOptions();
    renderFilters();
    renderArticles();
  }

  filtersRoot.addEventListener('click', event => {
    const button = event.target.closest('[data-filter]');
    if (!button) return;
    activeFilter = button.dataset.filter;
    renderFilters();
    renderArticles();
  });

  searchInput.addEventListener('input', () => {
    searchQuery = normalize(searchInput.value);
    refreshResults();
  });

  tagSelect.addEventListener('change', () => {
    activeTag = tagSelect.value;
    renderFilters();
    renderArticles();
  });

  sortSelect.addEventListener('change', () => {
    sortMode = sortSelect.value;
    renderArticles();
  });

  clearButton.addEventListener('click', () => {
    searchInput.value = '';
    tagSelect.value = '';
    sortSelect.value = 'default';
    searchQuery = '';
    activeTag = '';
    sortMode = 'default';
    activeFilter = 'Tümü';
    refreshResults();
    searchInput.focus();
  });

  fetch('../../data/technopat.json', { cache: 'no-cache' })
    .then(response => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then(data => {
      articles = Array.isArray(data[sourceKey])
        ? data[sourceKey].filter(item => item && item.title && safeForumURL(item.url))
        : [];
      document.title = `${titleText} · Technopat | Günlüğüm`;
      const heading = document.querySelector('#techPageTitle');
      if (heading) heading.textContent = titleText;
      refreshResults();
    })
    .catch(() => {
      resultsLabel.textContent = 'İçerikler yüklenemedi';
      articlesRoot.innerHTML = '<div class="tech-empty"><strong>İçerik listesi yüklenemedi.</strong><code>data/technopat.json</code> dosyasının GitHub deponuzda bulunduğunu ve adresinin doğru olduğunu kontrol edin.</div>';
    });
})();
