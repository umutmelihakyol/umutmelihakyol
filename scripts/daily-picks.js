/* Günlüğüm — her gün arşivden otomatik seçilen oyun, dizi, film ve anime. */
(() => {
  'use strict';
  const root = document.getElementById('dailyPicks');
  if (!root) return;

  const grid = root.querySelector('#dailyPicksGrid');
  const dateNode = root.querySelector('#dailyPicksDate');
  const categories = [
    { key: 'oyun', label: 'Bugünün Oyunu', mark: '🎮', offset: 0 },
    { key: 'dizi', label: 'Bugünün Dizisi', mark: '📺', offset: 7 },
    { key: 'film', label: 'Bugünün Filmi', mark: '🎬', offset: 13 },
    { key: 'anime', label: 'Bugünün Animesi', mark: '✦', offset: 19 }
  ];
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

  function istanbulDate() {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Istanbul', year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(new Date());
    const value = Object.fromEntries(parts.map(part => [part.type, part.value]));
    return `${value.year}-${value.month}-${value.day}`;
  }

  function dayNumber(dateKey) {
    const [year, month, day] = dateKey.split('-').map(Number);
    return Math.floor(Date.UTC(year, month - 1, day) / 86400000);
  }

  function imageFor(record) {
    try {
      const raw = typeof window.IMAGE_SRC === 'function' ? window.IMAGE_SRC(record.image, 500) : record.image;
      const url = new URL(String(raw || ''), window.location.href);
      return ['https:', 'http:'].includes(url.protocol) ? url.href : '';
    } catch (_) { return ''; }
  }

  function excerpt(record) {
    const raw = record.shortDescription || record.description || record.overview || record.note || record.personalReview || '';
    const clean = String(raw).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    if (clean) {
      if (clean.length <= 148) return clean;
      const cut = clean.slice(0, 145);
      const boundary = cut.lastIndexOf(' ');
      return `${cut.slice(0, boundary > 95 ? boundary : 145).trim()}…`;
    }
    const facts = [record.year, ...(Array.isArray(record.genres) ? record.genres.slice(0, 2) : [])].filter(Boolean);
    return facts.length ? facts.join(' · ') : 'Kişisel arşivimden bugünün seçkisi.';
  }

  function getPick(list, index, offset) {
    if (!Array.isArray(list) || !list.length) return null;
    // İstek listesi henüz izlenmemiş/oynanmamış yapımları öne çıkarmasın.
    const watched = list.filter(record => record && record.status !== 'istek');
    const usable = (watched.length ? watched : list).filter(record => record && record.title);
    if (!usable.length) return null;
    usable.sort((a, b) => String(a.id || a.title).localeCompare(String(b.id || b.title), 'tr'));
    return usable[(index + offset) % usable.length];
  }

  function cardMarkup(meta, record) {
    if (!record) {
      return `<article class="daily-pick-card is-empty"><div class="daily-pick-cover daily-pick-fallback">${meta.mark}</div><div class="daily-pick-copy"><span class="daily-pick-label">${meta.label}</span><strong>Henüz içerik yok</strong><p>Bu kategoriye içerik eklediğimde burada görünecek.</p></div></article>`;
    }
    const image = imageFor(record);
    const url = new URL('icerik/', window.SITE_ROOT || window.location.href);
    url.searchParams.set('tip', meta.key);
    url.searchParams.set('id', record.id);
    const description = excerpt(record);
    const score = record.score !== null && record.score !== undefined && record.score !== '' && Number.isFinite(Number(record.score))
      ? `<span class="daily-pick-score">★ ${Number(record.score).toLocaleString('tr-TR', { maximumFractionDigits: 1 })}</span>` : '';
    return `<a class="daily-pick-card daily-pick-${meta.key}" href="${esc(url.href)}" aria-label="${esc(meta.label)}: ${esc(record.title)} ayrıntılarını aç">
      <span class="daily-pick-cover">${image ? `<img src="${esc(image)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.remove();this.parentElement.classList.add('image-missing')">` : `<span class="daily-pick-fallback">${meta.mark}</span>`}<span class="daily-pick-cover-shade"></span><span class="daily-pick-label">${meta.mark} ${meta.label}</span></span>
      <span class="daily-pick-copy"><strong>${esc(record.title)}</strong><span class="daily-pick-description">${esc(description)}</span><span class="daily-pick-meta">${score}${record.year ? `<span>${esc(record.year)}</span>` : ''}<span class="daily-pick-open">Ayrıntıları gör ↗</span></span></span>
    </a>`;
  }

  function render(data) {
    if (!data || typeof data !== 'object') return;
    const dateKey = istanbulDate();
    const ordinal = dayNumber(dateKey);
    const today = new Date(`${dateKey}T12:00:00+03:00`);
    dateNode.textContent = new Intl.DateTimeFormat('tr-TR', { timeZone: 'Europe/Istanbul', weekday: 'long', day: 'numeric', month: 'long' }).format(today);
    grid.innerHTML = categories.map(meta => cardMarkup(meta, getPick(data[meta.key], ordinal, meta.offset))).join('');
    root.hidden = false;
    root.dataset.date = dateKey;
  }

  function update() {
    if (window.__gunlugumContentData) render(window.__gunlugumContentData);
  }
  window.addEventListener('gunlugum:content-ready', update);
  if (window.__gunlugumContentReady) update();
})();
