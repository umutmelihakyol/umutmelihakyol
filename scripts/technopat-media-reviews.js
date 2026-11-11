/* Günlüğüm — Technopat üzerinde paylaşılan dizi ve film incelemeleri */
(() => {
  'use strict';

  const $ = selector => document.querySelector(selector);
  const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));
  const safeForumURL = value => {
    try {
      const url = new URL(String(value || ''));
      return url.protocol === 'https:' && (url.hostname === 'technopat.net' || url.hostname.endsWith('.technopat.net')) ? url.href : '';
    } catch (_) { return ''; }
  };
  const safeImageURL = value => {
    try {
      const url = new URL(String(value || ''));
      return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : '';
    } catch (_) { return ''; }
  };
  const labels = { films: 'Film', series: 'Dizi' };
  const state = { items: { films: [], series: [] }, filter: 'all', query: '', sort: 'default' };
  const filters = $('#tprFilters');
  const grid = $('#tprArticles');
  const search = $('#tprSearch');
  const sort = $('#tprSort');
  const meta = $('#tprResultsMeta');

  function getVisible() {
    let items = Object.entries(state.items).flatMap(([type, records]) => records.map(record => ({ ...record, type })));
    if (state.filter !== 'all') items = items.filter(item => item.type === state.filter);
    if (state.query) {
      items = items.filter(item => [item.title, item.description, labels[item.type]].join(' ').toLocaleLowerCase('tr-TR').includes(state.query));
    }
    if (state.sort === 'title-asc') items.sort((a, b) => a.title.localeCompare(b.title, 'tr', { sensitivity: 'base' }));
    if (state.sort === 'title-desc') items.sort((a, b) => b.title.localeCompare(a.title, 'tr', { sensitivity: 'base' }));
    if (state.sort === 'type') items.sort((a, b) => labels[a.type].localeCompare(labels[b.type], 'tr') || a.title.localeCompare(b.title, 'tr'));
    return items;
  }

  function renderFilters() {
    const allCount = state.items.films.length + state.items.series.length;
    const buttons = [
      { key: 'all', label: 'Tümü', count: allCount },
      { key: 'films', label: 'Filmler', count: state.items.films.length },
      { key: 'series', label: 'Diziler', count: state.items.series.length }
    ];
    filters.innerHTML = buttons.map(item => `<button class="tech-filter" type="button" data-tpr-filter="${item.key}" aria-pressed="${state.filter === item.key}">${item.label}<small>${item.count}</small></button>`).join('');
  }

  function renderCards() {
    const items = getVisible();
    const total = state.items.films.length + state.items.series.length;
    meta.textContent = state.query ? `${items.length} / ${total} inceleme gösteriliyor` : `${items.length} inceleme`;
    if (!items.length) {
      const isEmpty = total === 0;
      grid.innerHTML = `<div class="tech-empty"><strong>${isEmpty ? 'Henüz inceleme eklenmemiş.' : 'Eşleşen inceleme bulunamadı.'}</strong>${isEmpty ? 'Technopat üzerinde paylaştığın ilk dizi veya film incelemeni yönetim panelinden eklediğinde burada görünecek.' : 'Arama ifadesini veya kategori filtresini değiştirebilirsin.'}</div>`;
      return;
    }
    grid.innerHTML = items.map(item => {
      const url = safeForumURL(item.url);
      const image = safeImageURL(item.image);
      const icon = item.type === 'films' ? '▣' : '▤';
      const cover = image
        ? `<img src="${escapeHTML(image)}" alt="" loading="lazy" referrerpolicy="no-referrer">`
        : `<span class="tpr-cover-placeholder" aria-hidden="true">${icon}</span>`;
      return `<article class="tech-article tpr-card tpr-card--${item.type}">
        <div class="tpr-card-media">${cover}<span class="tpr-type-badge">${labels[item.type]} incelemesi</span></div>
        <div class="tech-article-body tpr-card-body">
          <h2>${escapeHTML(item.title)}</h2>
          ${item.description ? `<p>${escapeHTML(item.description)}</p>` : '<p>Technopat Sosyal üzerinde paylaştığım inceleme yazısına göz atabilirsin.</p>'}
          <div class="tech-article-foot tpr-card-foot"><span class="tech-article-category">Technopat Sosyal</span>${url ? `<a class="tech-read-link" href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">İncelemeyi Technopat'ta oku <span aria-hidden="true">↗</span></a>` : ''}</div>
        </div>
      </article>`;
    }).join('');
  }

  filters.addEventListener('click', event => {
    const button = event.target.closest('[data-tpr-filter]');
    if (!button) return;
    state.filter = button.dataset.tprFilter;
    renderFilters();
    renderCards();
  });
  search.addEventListener('input', () => {
    state.query = search.value.trim().toLocaleLowerCase('tr-TR');
    renderCards();
  });
  sort.addEventListener('change', () => { state.sort = sort.value; renderCards(); });

  fetch('../../data/technopat-media-reviews.json', { cache: 'no-cache' })
    .then(response => { if (!response.ok) throw new Error(`HTTP ${response.status}`); return response.json(); })
    .then(data => {
      for (const type of ['films', 'series']) {
        state.items[type] = Array.isArray(data[type]) ? data[type].filter(item => item && item.title && safeForumURL(item.url)).map(item => ({
          id: String(item.id || ''), title: String(item.title), description: String(item.description || ''),
          url: safeForumURL(item.url), image: safeImageURL(item.image)
        })) : [];
      }
      renderFilters();
      renderCards();
      window.__gunlugumContentReady = true;
      window.dispatchEvent(new Event('gunlugum:content-ready'));
    })
    .catch(() => {
      meta.textContent = 'İncelemeler yüklenemedi';
      grid.innerHTML = '<div class="tech-empty"><strong>İnceleme listesi yüklenemedi.</strong><code>data/technopat-media-reviews.json</code> dosyasını ve bağlantısını kontrol et.</div>';
      window.__gunlugumContentReady = true;
      window.dispatchEvent(new Event('gunlugum:content-ready'));
    });
})();
