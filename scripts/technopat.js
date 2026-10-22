(() => {
  'use strict';
  const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const safeForumURL = value => {
    try {
      const url = new URL(value);
      return url.protocol === 'https:' && (url.hostname === 'technopat.net' || url.hostname.endsWith('.technopat.net')) ? url.href : '';
    } catch { return ''; }
  };
  const kind = document.body.dataset.techKind;
  const sourceKey = kind === 'guides' ? 'guides' : 'reviews';
  const titleText = kind === 'guides' ? 'Rehberlerim' : 'İncelemelerim';
  const sourceLabels = {
    Oyun: '🎮', Anime: '✦', Film: '▣', Dizi: '▤', Teknoloji: '⌘', Genel: '✧'
  };
  const filtersRoot = document.querySelector('#techFilters');
  const articlesRoot = document.querySelector('#techArticles');
  const resultsLabel = document.querySelector('#techResultsMeta');
  const emptyMessage = document.querySelector('#techEmptyTemplate');
  let articles = [];
  let activeFilter = 'Tümü';

  function renderFilters() {
    const categories = ['Tümü', 'Oyun', 'Anime', 'Film', 'Dizi', 'Teknoloji', 'Genel'];
    filtersRoot.innerHTML = categories.map(category => {
      const count = category === 'Tümü' ? articles.length : articles.filter(item => item.category === category).length;
      return `<button class="tech-filter" type="button" data-filter="${escapeHTML(category)}" aria-pressed="${activeFilter === category}">${escapeHTML(category)}<small>${count}</small></button>`;
    }).join('');
  }

  function renderArticles() {
    const filtered = articles.filter(item => activeFilter === 'Tümü' || item.category === activeFilter);
    resultsLabel.textContent = `${filtered.length} içerik listeleniyor`;
    if (!filtered.length) {
      articlesRoot.innerHTML = `<div class="tech-empty"><strong>Bu kategoride henüz bağlantı yok.</strong>Yeni bir inceleme veya rehber yayınladığında ilgili bağlantıyı <code>data/technopat.json</code> dosyasına ekleyebilirsin.</div>`;
      return;
    }
    articlesRoot.innerHTML = filtered.map(item => {
      const url = safeForumURL(item.url);
      const tag = item.tag || (kind === 'guides' ? 'Rehber' : 'İnceleme');
      return `<article class="tech-article">
        <div class="tech-article-band"><span class="tech-mini-icon" aria-hidden="true">${escapeHTML(sourceLabels[item.category] || '✧')}</span><span class="tech-badge">${escapeHTML(tag)}</span></div>
        <div class="tech-article-body">
          <h2>${escapeHTML(item.title)}</h2>
          <p>${escapeHTML(item.description || 'Technopat Sosyal üzerinde yayımladığım içeriğe göz atabilirsin.')}</p>
          <div class="tech-article-foot"><span class="tech-article-category">${escapeHTML(item.category || 'Genel')}</span>${url ? `<a class="tech-read-link" href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">Forumda oku <span aria-hidden="true">↗</span></a>` : '<span class="tech-article-category">Bağlantı eklenmeli</span>'}</div>
        </div>
      </article>`;
    }).join('');
  }

  filtersRoot.addEventListener('click', event => {
    const button = event.target.closest('[data-filter]');
    if (!button) return;
    activeFilter = button.dataset.filter;
    renderFilters();
    renderArticles();
  });

  fetch('../../data/technopat.json', {cache: 'no-store'})
    .then(response => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then(data => {
      articles = Array.isArray(data[sourceKey]) ? data[sourceKey].filter(item => item && safeForumURL(item.url)) : [];
      document.title = `${titleText} · Technopat | Günlüğüm`;
      const heading = document.querySelector('#techPageTitle');
      if (heading) heading.textContent = titleText;
      renderFilters();
      renderArticles();
    })
    .catch(() => {
      resultsLabel.textContent = 'İçerikler yüklenemedi';
      articlesRoot.innerHTML = '<div class="tech-empty"><strong>İçerik listesi yüklenemedi.</strong><code>data/technopat.json</code> dosyasının GitHub deponuzda bulunduğunu ve adresinin doğru olduğunu kontrol edin.</div>';
    });
})();
