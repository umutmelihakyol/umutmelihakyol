/* Günlüğüm — kategori bazlı kişisel öneri listeleri */
(() => {
  'use strict';
  const grid = document.getElementById('recommendationsGrid');
  if (!grid) return;

  const categoryMeta = {
    oyun: { label: 'Oyunlar', singular: 'oyun', mark: '🎮', description: 'Oynamaktan keyif aldığım ve başkalarına da önerdiğim oyunlar.' },
    dizi: { label: 'Diziler', singular: 'dizi', mark: '▣', description: 'İzlediğim ve dizi severlere tavsiye ettiğim yapımlar.' },
    film: { label: 'Filmler', singular: 'film', mark: '🎬', description: 'Bende iz bırakan ve izlenmesini tavsiye ettiğim filmler.' },
    anime: { label: 'Animeler', singular: 'anime', mark: '✦', description: 'Sevdiğim ve anime izleyenlere önermek istediğim seriler.' }
  };
  const el = id => document.getElementById(id);
  const state = { items: [], active: 'oyun', loading: true };
  let messageTimer = null;

  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);
  const safeImage = value => {
    try {
      const raw = typeof window.IMAGE_SRC === 'function' ? window.IMAGE_SRC(value, 650) : value;
      const url = new URL(String(raw || ''), window.location.href);
      return /^https?:$/.test(url.protocol) ? url.href : '';
    } catch (_) { return ''; }
  };
  const safeExternalUrl = value => {
    try {
      const url = new URL(String(value || '').trim());
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
        id: String(item.id || `${category}-${item.itemId || title}`),
        category,
        itemId: String(item.itemId || ''),
        title,
        image: String(item.image || ''),
        score,
        review,
        link: safeExternalUrl(item.link),
        createdAt: String(item.createdAt || '')
      };
    }).filter(Boolean);
  }

  function setCategoryInUrl(category, { replace = false } = {}) {
    const url = new URL(window.location.href);
    url.searchParams.set('kategori', category);
    url.hash = '';
    const method = replace ? 'replaceState' : 'pushState';
    history[method](history.state, '', `${url.pathname}${url.search}${url.hash}`);
  }

  function recommendationUrl(item) {
    const url = new URL(window.location.href);
    url.searchParams.set('kategori', item.category);
    url.hash = `recommendation-${item.id}`;
    return url.href;
  }

  function categoryUrl(category) {
    const url = new URL(window.location.href);
    url.searchParams.set('kategori', category);
    url.hash = '';
    return url.href;
  }

  function cardMarkup(item) {
    const image = safeImage(item.image);
    const imageMarkup = image
      ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(item.title)} kapak görseli" loading="lazy" decoding="async" referrerpolicy="no-referrer">`
      : '<span class="recommendation-card-placeholder" aria-hidden="true">✦</span>';
    const externalLink = item.link
      ? `<a class="recommendation-card-action recommendation-card-external" href="${escapeHtml(item.link)}" target="_blank" rel="noopener noreferrer">Dış bağlantıyı aç <span aria-hidden="true">↗</span></a>`
      : '';
    return `<article class="recommendation-card" id="recommendation-${escapeHtml(item.id)}" data-recommendation-id="${escapeHtml(item.id)}">
      <div class="recommendation-card-media">${imageMarkup}
        <span class="recommendation-card-score" aria-label="Puanım ${formatScore(item.score)} / 10">★ ${formatScore(item.score)}<small>/10</small></span>
      </div>
      <div class="recommendation-card-body">
        <h2 class="recommendation-card-title">${escapeHtml(item.title)}</h2>
        <p class="recommendation-review-label">DEĞERLENDİRMEM</p>
        <p class="recommendation-review">${escapeHtml(item.review)}</p>
        <div class="recommendation-card-actions">
          ${externalLink}
          <button class="recommendation-card-action recommendation-card-share" type="button" data-share-recommendation="${escapeHtml(item.id)}" aria-label="${escapeHtml(item.title)} öneri kartının bağlantısını paylaş">Öneriyi paylaş <span aria-hidden="true">↗</span></button>
        </div>
      </div>
    </article>`;
  }

  function showStatus(message, tone = 'info') {
    const status = el('recommendationsStatus');
    if (!status) return;
    window.clearTimeout(messageTimer);
    status.textContent = message;
    status.dataset.state = tone;
    if (message) messageTimer = window.setTimeout(() => {
      if (!state.loading) status.textContent = '';
    }, 3600);
  }

  async function copyText(value) {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(value);
      return;
    }
    const input = document.createElement('textarea');
    input.value = value;
    input.setAttribute('readonly', '');
    input.style.position = 'fixed';
    input.style.opacity = '0';
    document.body.appendChild(input);
    input.select();
    const copied = document.execCommand('copy');
    input.remove();
    if (!copied) throw new Error('Tarayıcı panoya kopyalamaya izin vermedi.');
  }

  function render() {
    const meta = categoryMeta[state.active];
    const visible = state.items.filter(item => item.category === state.active);
    el('recommendationsCount').textContent = `${visible.length} ${meta.singular}`;
    el('recommendationsCategoryHeading').textContent = meta.label;
    el('recommendationsCategoryDescription').textContent = meta.description;
    el('recommendationsCopyNames').textContent = `Tüm ${meta.singular} isimlerini kopyala`;
    el('recommendationsCopyNames').disabled = visible.length === 0;
    el('recommendationsCopyNames').setAttribute('aria-label', `${visible.length} ${meta.singular} adını kopyala`);
    el('recommendationsShareList').textContent = `${meta.label} listesinin bağlantısını kopyala`;
    grid.innerHTML = visible.map(cardMarkup).join('');
    el('recommendationsEmpty').hidden = visible.length > 0;
    el('recommendationsStatus').textContent = state.loading
      ? 'Önerilerim yükleniyor…'
      : (visible.length ? '' : `Henüz ${meta.singular} önerisi eklemedim.`);
    document.querySelectorAll('[data-recommendation-filter]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.recommendationFilter === state.active));
    });
    document.title = `${meta.label} | Önerilerim | Günlüğüm`;
  }

  function selectCategory(category, { updateUrl = true, replace = false } = {}) {
    if (!categoryMeta[category]) return;
    state.active = category;
    if (updateUrl) setCategoryInUrl(category, { replace });
    render();
  }

  async function shareRecommendation(item) {
    // Paylaşım her zaman bu sitedeki puan ve değerlendirme kartına gider.
    // Admin panelinde girilen harici bağlantı, paylaşım metninde ayrıca kaynak olarak sunulur.
    const url = recommendationUrl(item);
    const text = `${item.title}\nPuanım: ${formatScore(item.score)}/10\n${item.review}` +
      (item.link ? `\n\nİçerik bağlantısı: ${item.link}` : '');
    if (navigator.share) {
      try {
        await navigator.share({ title: `${item.title} — Önerilerim`, text, url });
        return;
      } catch (error) {
        if (error?.name === 'AbortError') return;
      }
    }
    try {
      await copyText(url);
      showStatus(`“${item.title}” için öneri kartının bağlantısı kopyalandı.`, 'success');
    } catch (error) {
      showStatus(error.message || 'Öneri bağlantısı kopyalanamadı.', 'error');
    }
  }

  document.querySelector('.recommendations-filters')?.addEventListener('click', event => {
    const button = event.target.closest('[data-recommendation-filter]');
    if (!button) return;
    selectCategory(button.dataset.recommendationFilter);
  });

  el('recommendationsCopyNames')?.addEventListener('click', async () => {
    const visible = state.items.filter(item => item.category === state.active);
    if (!visible.length) return;
    try {
      // Kasıtlı olarak yalnızca adlar kopyalanır; kategori, puan veya değerlendirme eklenmez.
      await copyText(visible.map(item => item.title).join('\n'));
      showStatus(`${visible.length} içerik adı (yalnızca isimler) panoya kopyalandı.`, 'success');
    } catch (error) {
      showStatus(error.message || 'İsimler kopyalanamadı.', 'error');
    }
  });

  el('recommendationsShareList')?.addEventListener('click', async () => {
    try {
      await copyText(categoryUrl(state.active));
      showStatus(`${categoryMeta[state.active].label} listesinin bağlantısı kopyalandı.`, 'success');
    } catch (error) {
      showStatus(error.message || 'Liste bağlantısı kopyalanamadı.', 'error');
    }
  });

  grid.addEventListener('click', event => {
    const button = event.target.closest('[data-share-recommendation]');
    if (!button) return;
    const item = state.items.find(entry => entry.id === button.dataset.shareRecommendation);
    if (item) shareRecommendation(item);
  });

  window.addEventListener('popstate', () => {
    const requested = new URL(window.location.href).searchParams.get('kategori');
    if (categoryMeta[requested]) selectCategory(requested, { updateUrl: false });
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
      const hash = decodeURIComponent(window.location.hash.replace(/^#/, ''));
      if (hash.startsWith('recommendation-')) {
        requestAnimationFrame(() => document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
      }
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

  const requestedCategory = new URL(window.location.href).searchParams.get('kategori');
  state.active = categoryMeta[requestedCategory] ? requestedCategory : 'oyun';
  if (!categoryMeta[requestedCategory]) setCategoryInUrl(state.active, { replace: true });
  render();
  load();
})();
