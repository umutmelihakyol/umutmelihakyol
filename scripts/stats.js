(() => {
  'use strict';
  const $ = (selector) => document.querySelector(selector);
  const escapeHTML = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char]);
  const validNumber = (value) => value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value));
  const asNumber = (value) => validNumber(value) ? Number(value) : 0;
  const number = (value, maximumFractionDigits = 1) => Number(value || 0).toLocaleString('tr-TR', { maximumFractionDigits });
  const CATEGORIES = [
    { key:'oyun', label:'Oyun', icon:'🎮', href:'../oyun/' },
    { key:'dizi', label:'Dizi', icon:'📺', href:'../dizi/' },
    { key:'film', label:'Film', icon:'🎬', href:'../film/' },
    { key:'anime', label:'Anime', icon:'✨', href:'../anime/' }
  ];
  const STATUS = [
    { key:'bitirdim', label:'Tamamlandı', icon:'✓', className:'status-done' },
    { key:'oynuyorum', label:'Devam Eden / İzleniyor', icon:'▶', className:'status-active' },
    { key:'biraktim', label:'Yarım Bırakıldı', icon:'Ⅱ', className:'status-dropped' },
    { key:'istek', label:'İstek Listesi', icon:'＋', className:'status-wishlist' }
  ];
  const TIERS = [
    { label:'S (10)', color:'#ffc247', match:(score) => score >= 10 },
    { label:'A+ (9)', color:'#b68cff', match:(score) => score >= 9 && score < 10 },
    { label:'A (8)', color:'#55c9f7', match:(score) => score >= 8 && score < 9 },
    { label:'B (7)', color:'#4ed8a4', match:(score) => score >= 7 && score < 8 },
    { label:'C (6)', color:'#ff914d', match:(score) => score >= 6 && score < 7 },
    { label:'D (≤5)', color:'#ff6878', match:(score) => score < 6 }
  ];
  const data = {};
  let selectedCategory = 'all';
  let loadingCount = 0;

  function recordsFor(key) {
    return Array.isArray(data[key]) ? data[key] : [];
  }
  function getSelectedRecords() {
    const chosen = selectedCategory === 'all' ? CATEGORIES : CATEGORIES.filter((category) => category.key === selectedCategory);
    return chosen.flatMap((category) => recordsFor(category.key).map((record) => ({ ...record, _category:category.key, _categoryLabel:category.label })))
      .filter((record) => record && typeof record.title === 'string');
  }
  function formatHours(hours) {
    if (!Number.isFinite(hours) || hours <= 0) return '0 sa';
    if (hours < 1) return `${Math.round(hours * 60)} dk`;
    return `${number(hours)} sa`;
  }
  function categoryDuration(categoryKey) {
    const records = recordsFor(categoryKey);
    if (categoryKey === 'oyun') {
      const known = records.filter((record) => validNumber(record.hours));
      return { hours:known.reduce((sum, record) => sum + asNumber(record.hours), 0), count:known.length, approximate:false, note:`${known.length} oyunda kayıtlı saat` };
    }
    if (categoryKey === 'film') {
      const watched = records.filter((record) => record.status === 'bitirdim' && validNumber(record.minutes));
      return { hours:watched.reduce((sum, record) => sum + asNumber(record.minutes), 0) / 60, count:watched.length, approximate:false, note:`${watched.length} tamamlanan filmin süresi` };
    }
    const episodeMinutes = categoryKey === 'dizi' ? 42 : 24;
    const completed = records.filter((record) => record.status === 'bitirdim' && validNumber(record.episodes));
    const episodes = completed.reduce((sum, record) => sum + asNumber(record.episodes), 0);
    return {
      hours: episodes * episodeMinutes / 60,
      count: completed.length,
      episodes,
      approximate: completed.length > 0,
      note:completed.length ? `≈${episodeMinutes} dk/bölüm · ${number(episodes, 0)} tamamlanan bölüm` : 'Tamamlanan yapımlar için süre kaydı yok'
    };
  }
  function selectedDuration(records) {
    if (selectedCategory !== 'all') return categoryDuration(selectedCategory);
    const all = CATEGORIES.map((category) => ({ ...category, duration:categoryDuration(category.key) }));
    const hours = all.reduce((sum, category) => sum + category.duration.hours, 0);
    const hasApproximation = all.some((category) => category.duration.approximate);
    const byCategory = all.map((category) => `${category.icon} ${formatHours(category.duration.hours)}`).join(' · ');
    return { hours, count:records.length, approximate:hasApproximation, note:byCategory };
  }
  function tierCounts(records) {
    const scores = records.filter((record) => validNumber(record.score)).map((record) => asNumber(record.score)).filter((score) => score >= 0 && score <= 10);
    return TIERS.map((tier) => ({ ...tier, count:scores.filter(tier.match).length, total:scores.length }));
  }
  function scoreStats(records) {
    const scores = records.filter((record) => validNumber(record.score)).map((record) => asNumber(record.score)).filter((score) => score >= 0 && score <= 10);
    return { count:scores.length, average:scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : null };
  }
  function statusCounts(records) {
    const countBy = Object.fromEntries(STATUS.map((status) => [status.key, records.filter((record) => record.status === status.key).length]));
    return countBy;
  }
  function genreCounts(records) {
    const counts = new Map();
    records.forEach((record) => {
      const genres = Array.isArray(record.genres) ? record.genres : [];
      [...new Set(genres.filter((genre) => typeof genre === 'string' && genre.trim()))].forEach((genre) => counts.set(genre, (counts.get(genre) || 0) + 1));
    });
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'tr'));
  }
  function recordURL(record) {
    const category = CATEGORIES.find((item) => item.key === record._category);
    const id = String(record.id || '');
    return category ? `${category.href}#${encodeURIComponent(id)}` : '#';
  }
  function renderMetrics(records) {
    const scores = scoreStats(records);
    const completed = records.filter((record) => record.status === 'bitirdim').length;
    const duration = selectedDuration(records);
    const selectedLabel = selectedCategory === 'all' ? 'Yapım' : CATEGORIES.find((item) => item.key === selectedCategory)?.label || 'Yapım';
    $('#metricTotal').textContent = number(records.length, 0);
    $('#metricUnit').textContent = selectedCategory === 'all' ? 'Yapım' : selectedLabel;
    $('#metricTotalNote').textContent = `${number(records.length, 0)} arşiv kaydı`;
    $('#metricTime').textContent = `${duration.approximate ? '≈' : ''}${formatHours(duration.hours)}`;
    $('#metricTimeLabel').textContent = selectedCategory === 'oyun' ? 'Kayıtlı oynama süresi' : selectedCategory === 'film' ? 'Tamamlanan filmlerin süresi' : selectedCategory === 'dizi' ? 'Tahmini izleme süresi' : selectedCategory === 'anime' ? 'Tahmini izleme süresi' : 'Kayıtlı / tahmini süre';
    $('#metricTimeNote').textContent = duration.note;
    $('#metricAverage').textContent = scores.average === null ? '—' : number(scores.average);
    $('#metricAverageNote').textContent = `${number(scores.count, 0)} puanlanmış yapım`;
    $('#metricFinished').textContent = number(completed, 0);
    $('#metricFinishedNote').textContent = `${records.length ? number(completed / records.length * 100, 0) : '0'}% tamamlanma oranı`;
  }
  function renderTiers(records) {
    const tiers = tierCounts(records);
    const max = Math.max(1, ...tiers.map((tier) => tier.count));
    const total = tiers.reduce((sum, tier) => sum + tier.count, 0);
    $('#ratingCount').textContent = `${number(total, 0)}\nDeğerlendirme`;
    $('#ratingSubtitle').textContent = selectedCategory === 'all' ? 'Tüm kategorilerdeki puanlarım' : `${CATEGORIES.find((item) => item.key === selectedCategory)?.label || ''} puanlarım`;
    $('#tierList').innerHTML = tiers.map((tier) => {
      const percent = total ? tier.count / total * 100 : 0;
      return `<div class="tier-row"><span class="tier-name"><i class="tier-dot" style="--tier-color:${tier.color}"></i>${escapeHTML(tier.label)}</span><div class="tier-track" aria-label="${escapeHTML(tier.label)} puan grubu: ${tier.count}"><div class="tier-fill" style="--tier-color:${tier.color};width:${tier.count / max * 100}%"></div></div><span class="tier-value"><strong>${number(tier.count, 0)}</strong>%${number(percent, 0)}</span></div>`;
    }).join('');
  }
  function renderGenres(records) {
    const genres = genreCounts(records);
    $('#genreCount').textContent = `${genres.length}\nKategori`;
    $('#genreSubtitle').textContent = selectedCategory === 'all' ? 'Oyun, dizi, film ve animelerde' : `${CATEGORIES.find((item) => item.key === selectedCategory)?.label || ''} türleri`;
    $('#genreCloud').innerHTML = genres.slice(0, 18).map(([genre, count]) => `<span class="genre-chip">${escapeHTML(genre)} <span>${number(count, 0)}</span></span>`).join('');
    $('#genreEmpty').hidden = genres.length > 0;
  }
  function renderStatuses(records) {
    const counts = statusCounts(records);
    const maxTotal = records.length || 1;
    $('#statusSubtitle').textContent = selectedCategory === 'all' ? 'Tüm arşiv kayıtlarının durumu' : `${CATEGORIES.find((item) => item.key === selectedCategory)?.label || ''} kayıtlarının durumu`;
    $('#statusGrid').innerHTML = STATUS.map((status) => {
      const count = counts[status.key] || 0;
      const percent = count / maxTotal * 100;
      let label = status.label;
      if (selectedCategory === 'oyun') label = ({bitirdim:'Bitirdim',oynuyorum:'Oynuyorum',biraktim:'Yarım bıraktım',istek:'İstek listesi'})[status.key];
      else if (selectedCategory !== 'all') label = ({bitirdim:'İzledim / Bitirdim',oynuyorum:'İzliyorum',biraktim:'Yarım bıraktım',istek:'İzleme listesi'})[status.key];
      return `<article class="status-item ${status.className}"><div class="status-topline"><span class="status-symbol" aria-hidden="true">${status.icon}</span><span>${escapeHTML(label)}</span></div><div><strong class="status-number">${number(count, 0)}</strong><span class="status-percent">(%${number(percent, 0)})</span></div><div class="status-bar"><span style="width:${percent}%"></span></div></article>`;
    }).join('');
  }
  function renderComparison() {
    $('#comparisonGrid').innerHTML = CATEGORIES.map((category) => {
      const records = recordsFor(category.key).filter((record) => record && typeof record.title === 'string');
      const scored = scoreStats(records);
      const completed = records.filter((record) => record.status === 'bitirdim').length;
      return `<a class="comparison-card" href="${category.href}"><span class="comparison-title"><span class="comparison-icon" aria-hidden="true">${category.icon}</span>${category.label}</span><span class="comparison-primary">${number(records.length, 0)} <small>kayıt</small></span><span class="comparison-meta"><span>Ortalama puan</span><strong>${scored.average === null ? '—' : `${number(scored.average)} / 10`}</strong></span><span class="comparison-meta"><span>Tamamlanan</span><strong>${number(completed, 0)}</strong></span><span class="comparison-link">Arşive git ↗</span></a>`;
    }).join('');
  }
  function renderTopRated(records) {
    const ranked = records.filter((record) => validNumber(record.score) && asNumber(record.score) >= 0 && asNumber(record.score) <= 10)
      .sort((a, b) => asNumber(b.score) - asNumber(a.score) || String(a.title).localeCompare(String(b.title), 'tr'))
      .slice(0, 8);
    $('#topRatedCount').textContent = ranked.length ? `${ranked.length} özel yapım` : '';
    $('#topRatedSubtitle').textContent = selectedCategory === 'all' ? 'Tüm kategorilerden seçilen en yüksek puanlar' : `${CATEGORIES.find((item) => item.key === selectedCategory)?.label || ''} kategorisindeki en yüksek puanlar`;
    $('#ratedGrid').innerHTML = ranked.map((record) => {
      const rawImage = typeof record.image === 'string' && /^https?:\/\//i.test(record.image) ? record.image : '';
      const image = rawImage && typeof window.IMAGE_SRC === 'function' ? window.IMAGE_SRC(rawImage, 400) : rawImage;
      const year = validNumber(record.year) ? number(record.year, 0) : '';
      const meta = [record._categoryLabel, year].filter(Boolean).join(' · ');
      return `<a class="rated-card" href="${recordURL(record)}"><div class="rated-poster">${image ? `<img src="${escapeHTML(image)}" alt="${escapeHTML(record.title)}" loading="lazy" decoding="async">` : '<span aria-hidden="true">✦</span>'}<span class="rated-score">★ ${number(asNumber(record.score))}</span></div><div class="rated-copy"><strong>${escapeHTML(record.title)}</strong><span>${escapeHTML(meta || 'Arşiv kaydı')}</span></div></a>`;
    }).join('');
    $('#ratedEmpty').hidden = ranked.length > 0;
  }
  function render() {
    const records = getSelectedRecords();
    renderMetrics(records);
    renderTiers(records);
    renderGenres(records);
    renderStatuses(records);
    renderTopRated(records);
    document.querySelectorAll('[data-category]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.category === selectedCategory)));
  }
  function showNotice(message) {
    const notice = $('#statsNotice');
    notice.hidden = false;
    notice.textContent = message;
  }
  async function loadData() {
    const tasks = CATEGORIES.map(async (category) => {
      const config = window.CATS && window.CATS[category.key];
      const file = config?.file || `data/${category.key === 'film' ? 'movies' : category.key === 'dizi' ? 'series' : category.key === 'oyun' ? 'games' : 'anime'}.json`;
      try {
        const root = window.SITE_ROOT || new URL('../', location.href).href;
        const response = await fetch(new URL(file, root).href, { cache:'no-cache' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const json = await response.json();
        if (!Array.isArray(json)) throw new Error('JSON veri biçimi geçersiz');
        data[category.key] = json;
      } catch (error) {
        data[category.key] = [];
        loadingCount += 1;
        console.error(`Günlüğüm istatistik verisi yüklenemedi (${category.key}):`, error);
      }
    });
    await Promise.all(tasks);
    renderComparison();
    render();
    if (loadingCount) showNotice(`${loadingCount} kategori verisi yüklenemedi. Bu kategorilerin istatistikleri eksik görünebilir; bağlantıyı kontrol edip sayfayı yenile.`);
    window.__gunlugumContentReady = true;
    window.dispatchEvent(new Event('gunlugum:content-ready'));
  }

  $('#categoryFilters').addEventListener('click', (event) => {
    const button = event.target.closest('button[data-category]');
    if (!button) return;
    selectedCategory = button.dataset.category;
    render();
  });
  loadData().catch((error) => {
    console.error('İstatistikler oluşturulamadı:', error);
    showNotice('İstatistikler yüklenemedi. Lütfen internet bağlantısını kontrol edip sayfayı yenile.');
  });
})();
