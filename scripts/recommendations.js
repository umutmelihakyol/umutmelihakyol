/* Günlüğüm — öneriler sayfası */
(() => {
  'use strict';
  const grid = document.getElementById('recommendationsGrid');
  if (!grid) return;
  const categoryMeta = {
    oyun: { label: 'Oyun', mark: '🎮' },
    film: { label: 'Film', mark: '🎬' },
    dizi: { label: 'Dizi', mark: '▣' },
    anime: { label: 'Anime', mark: '✦' }
  };
  const categoryOrder = ['oyun', 'film', 'dizi', 'anime'];
  const state = { items: [], active: 'all', loading: true };
  const el = id => document.getElementById(id);
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);
  const safeUrl = value => {
    try {
      const raw = typeof window.IMAGE_SRC === 'function' ? window.IMAGE_SRC(value, 650) : value;
      const url = new URL(String(raw || ''), window.location.href);
      return /^https?:$/.test(url.protocol) ? url.href : '';
    } catch (_) { return ''; }
  };
  const formatScore = value => Number(value).toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 1 });
  function normalize(raw) {
    if (!Array.isArray(raw)) return [];
    return raw.map(item => {
      if (!item || typeof item !== 'object') return null;
      const category = String(item.category || '');
      const score = Number(item.score);
      const title = String(item.title || '').trim();
      const review = String(item.review || '').trim();
      if (!categoryMeta[category] || !title || !review || !Number.isFinite(score) || score < 0 || score > 10) return null;
      return {
        id: String(item.id || `${category}-${item.itemId || title}`), category,
        itemId: String(item.itemId || ''), title,
        image: String(item.image || ''), score, review,
        createdAt: String(item.createdAt || '')
      };
    }).filter(Boolean);
  }
  function cardMarkup(item) {
    const meta = categoryMeta[item.category];
    const image = safeUrl(item.image);
    const imageMarkup = image
      ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(item.title)} kapak görseli" loading="lazy" decoding="async" referrerpolicy="no-referrer">`
      : '';
    const category = window.CATS?.[item.category];
    const href = category && item.itemId
      ? `${category.page}#${encodeURIComponent(item.itemId)}` : '';
    const link = href
      ? `<a class="recommendation-card-link" href="${escapeHtml(href)}">Arşivde görüntüle <span aria-hidden="true">↗</span></a>`
      : '';
    return `<article class="recommendation-card">
      <div class="recommendation-card-media">
        ${imageMarkup}
        <span class="recommendation-card-type">${meta.mark} ${meta.label}</span>
        <span class="recommendation-card-score" aria-label="Puanım ${formatScore(item.score)} / 10">★ ${formatScore(item.score)}<small>/10</small></span>
      </div>
      <div class="recommendation-card-body">
        <h2 class="recommendation-card-title">${escapeHtml(item.title)}</h2>
        <p class="recommendation-review-label">DEĞERLENDİRMEM</p>
        <p class="recommendation-review">${escapeHtml(item.review)}</p>
        ${link}
      </div>
    </article>`;
  }
  function render() {
    const visible = state.active === 'all' ? state.items : state.items.filter(item => item.category === state.active);
    el('recommendationsCount').textContent = `${visible.length} öneri`;
    grid.innerHTML = visible.map(cardMarkup).join('');
    el('recommendationsEmpty').hidden = visible.length > 0;
    if (state.loading) {
      el('recommendationsStatus').textContent = 'Önerilerim yükleniyor…';
    } else {
      el('recommendationsStatus').textContent = state.items.length ? '' : 'Henüz yayımlanmış öneri bulunmuyor.';
    }
    document.querySelectorAll('[data-recommendation-filter]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.recommendationFilter === state.active));
    });
  }
  document.querySelector('.recommendations-filters')?.addEventListener('click', event => {
    const button = event.target.closest('[data-recommendation-filter]');
    if (!button) return;
    const next = button.dataset.recommendationFilter;
    if (next !== 'all' && !categoryMeta[next]) return;
    state.active = next;
    render();
  });
  async function load() {
    try {
      const base = window.SITE_ROOT || new URL('../', window.location.href).href;
      const response = await fetch(new URL('data/recommendations.json', base).href, { cache: 'no-cache' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      state.items = normalize(await response.json());
      state.items.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)) || b.score - a.score);
      state.loading = false;
      render();
    } catch (error) {
      state.loading = false;
      state.items = [];
      el('recommendationsStatus').textContent = 'Öneriler şu anda yüklenemedi. Biraz sonra yeniden deneyebilirsin.';
      el('recommendationsCount').textContent = 'Veri yüklenemedi';
      el('recommendationsEmpty').hidden = false;
      grid.innerHTML = '';
      console.warn('Öneriler yüklenemedi:', error);
    }
  }
  render();
  load();
})();
