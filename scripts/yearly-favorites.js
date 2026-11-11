/* Anasayfa — yıllara göre favoriler vitrini */
(() => {
  'use strict';
  const root = document.getElementById('yearlyFavorites');
  if (!root) return;

  const categoryMeta = {
    oyun: { label: 'Oyun', eyebrow: 'YILIN FAVORİ OYUNU', mark: '🎮' },
    dizi: { label: 'Dizi', eyebrow: 'YILIN FAVORİ DİZİSİ', mark: '📺' },
    film: { label: 'Film', eyebrow: 'YILIN FAVORİ FİLMİ', mark: '🎬' },
    anime: { label: 'Anime', eyebrow: 'YILIN FAVORİ ANİMESİ', mark: '✦' }
  };
  const order = ['oyun', 'dizi', 'film', 'anime'];
  let yearlyData = { years: [] };
  let archiveData = null;
  let activeYear = null;

  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);
  const safeImage = value => {
    try {
      const raw = typeof window.IMAGE_SRC === 'function' ? window.IMAGE_SRC(value, 700) : value;
      const url = new URL(String(raw || ''), window.location.href);
      return /^https?:$/.test(url.protocol) ? url.href : '';
    } catch (_) { return ''; }
  };
  const safeYearData = raw => {
    if (!raw || typeof raw !== 'object' || !Array.isArray(raw.years)) return { years: [] };
    const seen = new Set();
    const years = raw.years.map(entry => {
      const year = Number(entry?.year);
      if (!Number.isInteger(year) || year < 1900 || year > 2100 || seen.has(year)) return null;
      seen.add(year);
      const source = entry.favorites && typeof entry.favorites === 'object' ? entry.favorites : {};
      const favorites = {};
      order.forEach(key => { favorites[key] = String(source[key] ?? '').trim(); });
      return { year, favorites };
    }).filter(Boolean).sort((a, b) => b.year - a.year);
    return { years };
  };

  function matchingRecords(yearEntry) {
    const rows = [];
    order.forEach(key => {
      const id = yearEntry.favorites?.[key];
      if (!id) return;
      const record = (archiveData?.[key] || []).find(item => String(item.id) === String(id));
      if (record) rows.push({ key, record });
    });
    return rows;
  }

  function cardMarkup(key, record) {
    const meta = categoryMeta[key];
    const image = safeImage(record.image);
    const imageMarkup = image
      ? `<img src="${escapeHtml(image)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer">`
      : '';
    const detail = [record.year, record.platform].filter(value => value !== null && value !== undefined && String(value).trim() !== '').join(' · ');
    const score = record.score !== null && record.score !== undefined && record.score !== '' && Number.isFinite(Number(record.score))
      ? `<span class="yf-score" aria-label="Puan ${Number(record.score).toLocaleString('tr-TR',{maximumFractionDigits:1})}">★ ${Number(record.score).toLocaleString('tr-TR',{maximumFractionDigits:1})}</span>`
      : '';
    const cats = window.CATS || {};
    const href = `${cats[key]?.page || '#'}#${encodeURIComponent(String(record.id ?? ''))}`;
    return `<a class="yf-card yf-card--${key}" href="${escapeHtml(href)}" aria-label="${escapeHtml(record.title || meta.label)} ayrıntılarını görüntüle">
      <span class="yf-card-media" aria-hidden="true">${imageMarkup}</span>
      <span class="yf-card-shade" aria-hidden="true"></span>
      <span class="yf-card-top"><span class="yf-type-pill">${meta.mark} ${meta.label.toLocaleUpperCase('tr-TR')}</span>${score}</span>
      <span class="yf-card-copy"><span class="yf-card-eyebrow">${meta.eyebrow}</span><strong class="yf-card-title">${escapeHtml(record.title || 'Başlıksız içerik')}</strong>${detail ? `<span class="yf-card-meta"><span>${escapeHtml(detail)}</span></span>` : ''}</span>
      <span class="yf-card-arrow" aria-hidden="true">↗</span>
    </a>`;
  }

  function render() {
    const available = yearlyData.years.map(entry => ({ entry, rows: matchingRecords(entry) })).filter(item => item.rows.length);
    if (!available.length) {
      root.hidden = true;
      return;
    }
    root.hidden = false;
    if (!available.some(item => item.entry.year === activeYear)) activeYear = available[0].entry.year;

    const tabs = root.querySelector('#yfYearTabs');
    const grid = root.querySelector('#yfGrid');
    tabs.innerHTML = available.map(({ entry }) => `<button type="button" data-yf-year="${entry.year}" aria-selected="${entry.year === activeYear ? 'true' : 'false'}">${entry.year}</button>`).join('');
    const selected = available.find(item => item.entry.year === activeYear) || available[0];
    grid.innerHTML = selected.rows.map(({ key, record }) => cardMarkup(key, record)).join('');
    root.querySelector('#yfYearCount').textContent = `${selected.rows.length} / 4 FAVORİ`;
  }

  root.addEventListener('click', event => {
    const button = event.target.closest('[data-yf-year]');
    if (!button) return;
    const year = Number(button.dataset.yfYear);
    if (!Number.isInteger(year)) return;
    activeYear = year;
    render();
  });

  async function loadFavorites() {
    try {
      const base = window.SITE_ROOT || new URL('../', window.location.href).href;
      const url = new URL('data/yearly-favorites.json', base);
      const response = await fetch(url.href, { cache: 'no-cache' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      yearlyData = safeYearData(await response.json());
      render();
    } catch (error) {
      // Vitrin henüz yapılandırılmadıysa veya dosya bulunmuyorsa sayfayı etkileme.
      root.hidden = true;
      if (error?.message && !/404/.test(error.message)) console.warn('Yıllık favoriler yüklenemedi:', error);
    }
  }

  window.renderYearlyFavorites = data => {
    if (data && typeof data === 'object') archiveData = data;
    render();
  };
  window.addEventListener('gunlugum:content-ready', () => {
    if (window.__gunlugumContentData) archiveData = window.__gunlugumContentData;
    render();
  });
  if (window.__gunlugumContentData) archiveData = window.__gunlugumContentData;
  loadFavorites();
})();
