/* Günlüğüm — oyun, film, dizi ve anime için paylaşılabilir tam sayfa ayrıntıları. */
(() => {
  'use strict';

  const $ = selector => document.querySelector(selector);
  const main = $('#contentDetail');
  if (!main) return;

  const root = window.SITE_ROOT || new URL('../', location.href).href;
  const params = new URLSearchParams(location.search);
  const aliases = { game: 'oyun', games: 'oyun', movie: 'film', movies: 'film', series: 'dizi', tv: 'dizi' };
  const type = aliases[params.get('tip') || params.get('type')] || params.get('tip') || params.get('type') || '';
  const id = params.get('id') || '';
  const categories = {
    oyun: { label: 'Oyun', plural: 'Oyunlar', file: 'data/games.json', back: 'oyun/', person: 'developer', personLabel: 'Geliştirici', duration: [['hours', 'Oynama süresi', 'saat']] },
    film: { label: 'Film', plural: 'Filmler', file: 'data/movies.json', back: 'film/', person: 'director', personLabel: 'Yönetmen', duration: [['minutes', 'Süre', 'dakika']] },
    dizi: { label: 'Dizi', plural: 'Diziler', file: 'data/series.json', back: 'dizi/', person: 'creator', personLabel: 'Yaratıcı', duration: [['seasons', 'Sezon', 'sezon'], ['episodes', 'Bölüm', 'bölüm']] },
    anime: { label: 'Anime', plural: 'Animeler', file: 'data/anime.json', back: 'anime/', person: 'studio', personLabel: 'Stüdyo', duration: [['episodes', 'Bölüm', 'bölüm']] }
  };
  const cfg = categories[type];
  let allItems = [];
  let currentItem = null;
  let franchiseGuides = [];
  let mediaReviews = { films: [], series: [] };

  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const safeUrl = value => {
    try { const url = new URL(String(value || ''), location.href); return ['https:', 'http:'].includes(url.protocol) ? url.href : ''; }
    catch (_) { return ''; }
  };
  const imageUrl = value => {
    const safe = safeUrl(value);
    if (!safe) return '';
    try { return typeof window.IMAGE_SRC === 'function' ? window.IMAGE_SRC(safe, 900) : safe; }
    catch (_) { return safe; }
  };
  const fmt = value => Number(value).toLocaleString('tr-TR', { maximumFractionDigits: 1 });
  const has = value => value !== null && value !== undefined && value !== '';
  const rootUrl = path => new URL(path, root).href;
  const itemUrl = (category, itemId) => `${rootUrl('icerik/')}?tip=${encodeURIComponent(category)}&id=${encodeURIComponent(itemId)}`;
  const statusText = (category, status) => {
    const lists = {
      oyun: { bitirdim: 'Bitirdim', oynuyorum: 'Oynuyorum', biraktim: 'Yarım bıraktım', istek: 'İstek listesi' },
      film: { bitirdim: 'İzledim', oynuyorum: 'İzliyorum', biraktim: 'Yarım bıraktım', istek: 'İzleme listesi' },
      dizi: { bitirdim: 'Bitirdim', oynuyorum: 'İzliyorum', biraktim: 'Yarım bıraktım', istek: 'İzleme listesi' },
      anime: { bitirdim: 'Bitirdim', oynuyorum: 'İzliyorum', biraktim: 'Yarım bıraktım', istek: 'İzleme listesi' }
    };
    return lists[category]?.[status] || status || 'Arşivimde';
  };
  const normalize = value => String(value || '').toLocaleLowerCase('tr-TR').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9ığüşöç]/g, '');
  const setMeta = (selector, value, attribute = 'content') => { const node = document.querySelector(selector); if (node && value) node.setAttribute(attribute, value); };

  function panel(icon, eyebrow, title, body, extra = '') {
    if (!body) return '';
    return `<section class="content-detail-panel ${extra}"><header class="content-detail-panel-head"><span class="content-detail-panel-icon" aria-hidden="true">${icon}</span><div><p>${esc(eyebrow)}</p><h2>${esc(title)}</h2></div></header>${body}</section>`;
  }

  function renderFacts(item) {
    const rows = [];
    if (has(item.year)) rows.push(['Yıl', item.year]);
    if (has(item.platform)) rows.push([type === 'oyun' ? 'Platform' : 'İzleme yeri', item.platform]);
    if (has(item[cfg.person])) rows.push([cfg.personLabel, item[cfg.person]]);
    cfg.duration.forEach(([key, label, unit]) => { if (has(item[key])) rows.push([label, `${fmt(item[key])} ${unit}`]); });
    if (has(item.finished)) {
      const date = /^\d{4}-\d{2}-\d{2}$/.test(String(item.finished)) ? new Date(`${item.finished}T12:00:00`) : new Date(item.finished);
      rows.push([type === 'oyun' ? 'Tamamlama tarihi' : 'İzleme tarihi', Number.isNaN(date.getTime()) ? item.finished : date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })]);
    }
    if (type === 'oyun' && item.ownershipStatus) rows.push(['Kütüphane durumu', item.ownershipStatus === 'owned' ? 'Kütüphanemde' : item.ownershipStatus]);
    return rows.length ? `<dl class="content-detail-facts">${rows.map(([label, value]) => `<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl>` : '';
  }

  function renderProsCons(item) {
    const pros = Array.isArray(item.pros) ? item.pros.filter(Boolean) : [];
    const cons = Array.isArray(item.cons) ? item.cons.filter(Boolean) : [];
    if (!pros.length && !cons.length) return '';
    const column = (title, values) => values.length ? `<section><h3>${title}</h3><ul>${values.map(value => `<li>${esc(value)}</li>`).join('')}</ul></section>` : '';
    return `<div class="content-detail-proscons">${column('Beğendiğim yönler', pros)}${column('Eksik bulduğum yönler', cons)}</div>`;
  }

  function renderRatings(item) {
    if (!item.ratings || typeof item.ratings !== 'object') return '';
    const labels = [['story', 'Hikâye'], ['gameplay', 'Oynanış'], ['visuals', 'Görsellik'], ['audio', 'Ses / müzik'], ['characters', 'Karakterler'], ['originality', 'Özgünlük'], ['pacing', 'Tempo / kurgu']];
    const entries = labels.filter(([key]) => has(item.ratings[key]) && Number.isFinite(Number(item.ratings[key])) && Number(item.ratings[key]) >= 0 && Number(item.ratings[key]) <= 10);
    if (!entries.length) return '';
    const avg = entries.reduce((sum, [key]) => sum + Number(item.ratings[key]), 0) / entries.length;
    const body = `<div class="content-detail-rating-list">${entries.map(([key, label]) => `<div class="content-detail-rating"><span>${label}</span><span class="content-detail-rating-track"><i style="width:${Number(item.ratings[key]) * 10}%"></i></span><strong>${fmt(item.ratings[key])}</strong></div>`).join('')}</div><p class="content-detail-empty-note" style="margin-top:12px">Alt puan ortalaması: <b>${fmt(avg)}/10</b></p>`;
    return panel('↗', 'PUANLAMA', 'Alt puanlarım', body);
  }

  function getLinkedGuides(item) {
    if (type !== 'oyun') return [];
    return franchiseGuides.filter(guide => Array.isArray(guide.entries) && guide.entries.some(entry => String(entry.gameId || '') === String(item.id)));
  }

  function renderLinks(item) {
    const links = [];
    const add = (label, value) => { const href = safeUrl(value); if (href && !links.some(link => link.href === href)) links.push({ label, href }); };
    (Array.isArray(item.links) ? item.links : []).forEach(link => add(link.name || 'Dış bağlantı', link.url));
    add(type === 'anime' ? 'MyAnimeList sayfası' : type === 'film' ? 'Letterboxd / inceleme bağlantısı' : 'Bağlantılı sayfa', item.review);
    add('Steam / mağaza sayfası', item.steamUrl || item.storeUrl || item.externalUrl || item.officialUrl);
    if (type === 'oyun') {
      getLinkedGuides(item).forEach(guide => {
        const guideEntry = (guide.entries || []).find(entry => String(entry.gameId || '') === String(item.id));
        const steam = guideEntry?.steam && typeof guideEntry.steam === 'object' ? guideEntry.steam : null;
        add(steam?.appId ? 'Steam mağaza sayfası' : 'Oyun sayfası', guideEntry?.externalUrl || guideEntry?.url);
        add(`Seri rehberi: ${guide.title}`, rootUrl(`seriler/?seri=${encodeURIComponent(guide.slug)}`));
      });
    }
    if (['film', 'dizi'].includes(type)) {
      const bucket = type === 'film' ? mediaReviews.films : mediaReviews.series;
      const entry = bucket.find(record => normalize(record.title) === normalize(item.title));
      if (entry) add('Technopat incelemem', entry.url);
    }
    if (!links.length) return '';
    return panel('↗', 'BAĞLANTILAR', 'İlgili sayfalar', `<div class="content-detail-links">${links.map(link => `<a class="content-detail-link" href="${esc(link.href)}" target="_blank" rel="noopener noreferrer"><span>${esc(link.label)}</span><span aria-hidden="true">↗</span></a>`).join('')}</div>`);
  }

  function renderRelated(item) {
    const genres = new Set((item.genres || []).map(normalize).filter(Boolean));
    const list = allItems.filter(other => String(other.id) !== String(item.id)).map(other => ({ other, overlap: (other.genres || []).filter(genre => genres.has(normalize(genre))).length }))
      .filter(entry => entry.overlap > 0).sort((a, b) => b.overlap - a.overlap || (Number(b.other.score) || 0) - (Number(a.other.score) || 0)).slice(0, 4).map(entry => entry.other);
    if (!list.length) return '';
    return panel('✦', 'ARŞİVİMDEN', 'Benzer içerikler', `<div class="content-detail-related">${list.map(other => {
      const src = imageUrl(other.image);
      return `<a class="content-detail-related-card" href="${esc(itemUrl(type, other.id))}">${src ? `<img src="${esc(src)}" alt="${esc(other.title)}" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.remove()">` : `<span class="content-detail-related-fallback">${esc(String(other.title || '?').slice(0, 1))}</span>`}<strong>${esc(other.title)}</strong></a>`;
    }).join('')}</div>`);
  }

  function renderPurchase(item) {
    if (type !== 'oyun') return '';
    const rows = [];
    const acquisition = { purchase: 'Satın alındı', bundle: 'Paket içinden edinildi', key: 'Anahtar ile edinildi', free: 'Ücretsiz edinildi', subscription: 'Abonelik üzerinden', other: 'Diğer' };
    const ownership = { owned: 'Kütüphanemde', subscription: 'Abonelik erişimi', borrowed: 'Ödünç', unavailable: 'Şu anda erişimim yok' };
    const currency = /^[A-Z]{3}$/.test(String(item.purchaseCurrency || '')) ? item.purchaseCurrency : 'TRY';
    const money = value => { try { return new Intl.NumberFormat('tr-TR', { style: 'currency', currency, maximumFractionDigits: 2 }).format(Number(value)); } catch (_) { return `${fmt(value)} ${currency}`; } };
    if (item.acquisitionType) rows.push(['Edinme türü', acquisition[item.acquisitionType] || item.acquisitionType]);
    if (has(item.purchasePrice)) rows.push(['Ödediğim tutar', money(item.purchasePrice)]);
    if (has(item.listPrice)) rows.push(['Liste fiyatı', money(item.listPrice)]);
    if (item.purchaseStore) rows.push(['Mağaza / kaynak', item.purchaseStore]);
    if (item.purchaseDate) rows.push(['Edinme tarihi', item.purchaseDate]);
    if (item.ownershipStatus) rows.push(['Kütüphane durumu', ownership[item.ownershipStatus] || item.ownershipStatus]);
    if (!rows.length && !item.purchaseNote) return '';
    const details = rows.length ? `<dl class="content-detail-facts">${rows.map(([label, value]) => `<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl>` : '';
    const note = item.purchaseNote ? `<p class="content-detail-empty-note" style="margin-top:10px">${esc(item.purchaseNote)}</p>` : '';
    return panel('◈', 'OYUN KÜTÜPHANESİ', 'Satın alma ve erişim', `${details}${note}`);
  }

  function renderScoreHistory(item) {
    const entries = Array.isArray(item.scoreHistory) ? item.scoreHistory.filter(entry => entry && entry.date).slice().sort((a, b) => String(b.date).localeCompare(String(a.date))) : [];
    if (!entries.length) return '';
    const rows = entries.map(entry => {
      const date = new Date(`${String(entry.date).slice(0, 10)}T12:00:00`);
      const dateLabel = Number.isNaN(date.getTime()) ? entry.date : date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
      const before = has(entry.previousScore) ? `${fmt(entry.previousScore)}/10` : '—';
      const after = has(entry.score) ? `${fmt(entry.score)}/10` : 'Puan kaldırıldı';
      return `<li><strong>${esc(before)} → ${esc(after)}</strong><span>${esc(dateLabel)}</span>${entry.reason ? `<p>${esc(entry.reason)}</p>` : ''}</li>`;
    }).join('');
    return panel('↗', 'PUAN GEÇMİŞİ', 'Değerlendirme geçmişim', `<ul class="content-detail-history">${rows}</ul>`);
  }

  function renderHistory(item) {
    const entries = Array.isArray(item.repeatHistory) ? item.repeatHistory.filter(entry => entry && entry.date).slice().sort((a, b) => String(b.date).localeCompare(String(a.date))) : [];
    if (!entries.length) return '';
    const rows = entries.map(entry => {
      const date = new Date(`${String(entry.date).slice(0, 10)}T12:00:00`);
      const dateLabel = Number.isNaN(date.getTime()) ? entry.date : date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
      const duration = has(entry.duration) ? `${fmt(entry.duration)} ${type === 'oyun' ? 'saat' : type === 'film' ? 'dakika' : 'bölüm'}` : '';
      const details = [entry.platform, duration, has(entry.score) ? `Puan ${fmt(entry.score)}/10` : ''].filter(Boolean).join(' · ');
      return `<li><strong>${esc(dateLabel)}</strong>${details ? `<span>${esc(details)}</span>` : ''}${entry.note ? `<p>${esc(entry.note)}</p>` : ''}</li>`;
    }).join('');
    return panel('↻', 'ZAMAN İÇİNDE', type === 'oyun' ? 'Tekrar oynama geçmişi' : 'Yeniden izleme geçmişi', `<ul class="content-detail-history">${rows}</ul>`);
  }

  function renderItem(item) {
    currentItem = item;
    const title = item.title || 'Başlıksız içerik';
    const score = has(item.score) && Number.isFinite(Number(item.score)) ? `<div class="content-detail-score"><strong>${fmt(item.score)}</strong><span>/ 10 · Kişisel puanım</span></div>` : `<div class="content-detail-score"><strong>—</strong><span>Henüz puanlamadım</span></div>`;
    const genres = Array.isArray(item.genres) ? item.genres.filter(Boolean) : [];
    const img = imageUrl(item.image);
    const status = statusText(type, item.status);
    const badges = [status ? `<span class="content-detail-badge">${esc(status)}</span>` : '', item.favorite === true ? '<span class="content-detail-badge is-favorite">♥ Favorim</span>' : '', item.recommended === true ? '<span class="content-detail-badge is-recommended">Öneriyorum</span>' : item.recommended === false ? '<span class="content-detail-badge is-not-recommended">Önermiyorum</span>' : ''].filter(Boolean).join('');
    const subtitle = [has(item.year) ? item.year : '', item.platform || ''].filter(Boolean).join(' · ');
    const note = String(item.note || item.personalReview || item.evaluation || '').trim();
    const noteBody = note ? `<p class="content-detail-note">${esc(note)}</p>` : '<p class="content-detail-empty-note">Bu kayıt için ayrıca bir kişisel değerlendirme metni eklememişim. Puanım ve içerik bilgilerim yukarıda yer alıyor.</p>';
    const facts = renderFacts(item);
    const factsPanel = facts ? panel('⌘', 'ARŞİV KAYDI', 'İçerik bilgileri', facts) : '';
    const prosCons = renderProsCons(item);
    const prosConsPanel = prosCons ? panel('±', 'NOTLARIM', 'Artılar ve eksiler', prosCons) : '';
    const notePanel = panel('✎', 'KİŞİSEL ARŞİV', 'Değerlendirmem', noteBody);
    const related = renderRelated(item);
    const canonical = itemUrl(type, item.id);
    const desc = (note || `${title} için kişisel arşiv kaydım, puanım ve içerik bilgilerim.`).replace(/\s+/g, ' ').slice(0, 220);
    document.title = `${title} | ${categories[type].label} | Günlüğüm`;
    setMeta('meta[name="description"]', desc);
    setMeta('meta[property="og:title"]', `${title} | Günlüğüm`);
    setMeta('meta[property="og:description"]', desc);
    setMeta('meta[property="og:url"]', canonical);
    setMeta('link[rel="canonical"]', canonical, 'href');
    if (img) { setMeta('meta[property="og:image"]', img); setMeta('meta[name="twitter:image"]', img); }
    document.body.dataset.detailType = type;
    $('#contentDetailBack').href = rootUrl(categories[type].back);
    $('#contentDetailBack').textContent = `← ${categories[type].plural} arşivine dön`;

    main.innerHTML = `
      <nav class="content-detail-crumbs" aria-label="İçerik yolu"><a href="${esc(root)}">Ana sayfa</a><span aria-hidden="true">/</span><a href="${esc(rootUrl(categories[type].back))}">${esc(categories[type].plural)}</a><span aria-hidden="true">/</span><span>${esc(title)}</span></nav>
      <article class="content-detail-shell">
        <header class="content-detail-hero"${img ? ` style="--detail-backdrop:url('${esc(img)}')"` : ''}>
          <div class="content-detail-poster${img ? '' : ' is-missing'}">${img ? `<img src="${esc(img)}" alt="${esc(title)} kapak görseli" fetchpriority="high" decoding="async" referrerpolicy="no-referrer" onerror="this.remove();this.parentElement.classList.add('is-missing');this.parentElement.textContent='▧'">` : esc(String(title).trim().slice(0, 1).toLocaleUpperCase('tr-TR'))}</div>
          <div class="content-detail-copy"><p class="content-detail-kicker"><span class="content-detail-kind">${categories[type].label}</span><span>GÜNLÜĞÜM ARŞİVİ</span></p><h1 class="content-detail-title">${esc(title)}</h1>${subtitle ? `<p class="content-detail-subtitle">${esc(subtitle)}</p>` : ''}<div class="content-detail-badges">${badges}</div>${score}${genres.length ? `<div class="content-detail-genres" aria-label="Türler">${genres.map(genre => `<span>${esc(genre)}</span>`).join('')}</div>` : ''}</div>
        </header>
        <div class="content-detail-body"><div class="content-detail-primary">${notePanel}${factsPanel}${prosConsPanel}${renderHistory(item)}${renderScoreHistory(item)}</div><aside class="content-detail-aside">${renderRatings(item)}${renderPurchase(item)}${renderLinks(item)}${related}</aside></div>
        <div class="content-detail-actions"><a class="btn" href="${esc(rootUrl(categories[type].back))}#${encodeURIComponent(item.id)}">Arşiv kaydını aç ↗</a><button class="btn content-detail-share" id="contentDetailShare" type="button">Paylaş ↗</button><button class="btn content-detail-copy" id="contentDetailCopy" type="button">Bağlantıyı kopyala</button></div>
      </article>`;

    $('#contentDetailShare')?.addEventListener('click', async event => {
      const button = event.currentTarget;
      const url = canonical;
      try {
        if (navigator.share) await navigator.share({ title, text: `${title} — Günlüğüm arşiv kaydı`, url });
        else if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(url); button.textContent = 'Bağlantı kopyalandı ✓'; }
        else window.prompt('İçerik bağlantısı:', url);
      } catch (error) { if (error?.name !== 'AbortError') window.prompt('İçerik bağlantısı:', url); }
    });
    $('#contentDetailCopy')?.addEventListener('click', async event => {
      const button = event.currentTarget;
      try {
        if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(canonical);
        else { const field = document.createElement('textarea'); field.value = canonical; field.style.position = 'fixed'; field.style.opacity = '0'; document.body.appendChild(field); field.select(); if (!document.execCommand('copy')) throw new Error('Kopyalama desteklenmiyor'); field.remove(); }
        button.textContent = 'Kopyalandı ✓';
        window.setTimeout(() => { if (button.isConnected) button.textContent = 'Bağlantıyı kopyala'; }, 2200);
      } catch (_) { window.prompt('Bağlantıyı kopyala:', canonical); }
    });
  }

  function showError(title, message, archiveHref = '../') {
    document.title = `${title} | Günlüğüm`;
    $('#contentDetailStatus')?.remove();
    main.innerHTML = `<section class="content-detail-empty"><h1>${esc(title)}</h1><p>${esc(message)}</p><a href="${esc(archiveHref)}">Arşive dön ↗</a></section>`;
  }

  if (!cfg || !id) {
    showError('İçerik bulunamadı', 'Bu ayrıntı bağlantısı eksik veya geçersiz. İçerik kartından yeniden açabilirsin.');
    return;
  }

  Promise.all([
    fetch(new URL(cfg.file, root).href, { cache: 'no-cache' }).then(response => { if (!response.ok) throw new Error(`${cfg.file} yüklenemedi`); return response.json(); }),
    type === 'oyun' ? fetch(new URL('data/franchise-guides.json', root).href, { cache: 'no-cache' }).then(response => response.ok ? response.json() : { guides: [] }).catch(() => ({ guides: [] })) : Promise.resolve({ guides: [] }),
    ['film', 'dizi'].includes(type) ? fetch(new URL('data/technopat-media-reviews.json', root).href, { cache: 'no-cache' }).then(response => response.ok ? response.json() : { films: [], series: [] }).catch(() => ({ films: [], series: [] })) : Promise.resolve({ films: [], series: [] })
  ]).then(([records, guideData, reviewData]) => {
    if (!Array.isArray(records)) throw new Error('Arşiv verisinin biçimi beklenenden farklı.');
    allItems = records;
    franchiseGuides = Array.isArray(guideData.guides) ? guideData.guides : [];
    mediaReviews = { films: Array.isArray(reviewData.films) ? reviewData.films : [], series: Array.isArray(reviewData.series) ? reviewData.series : [] };
    const item = records.find(record => String(record.id) === String(id));
    if (!item) { showError('İçerik bulunamadı', 'Bu kayıt arşivde bulunamadı veya kaldırılmış olabilir.', rootUrl(cfg.back)); return; }
    $('#contentDetailStatus')?.remove();
    renderItem(item);
    try { window.goatcounter?.count?.({ path: `icerik/${type}/${id}`, title: item.title, event: true }); } catch (_) {}
  }).catch(error => {
    console.error('İçerik ayrıntısı yüklenemedi:', error);
    showError('İçerik yüklenemedi', 'Arşiv bilgilerine şu anda ulaşılamıyor. İnternet bağlantını kontrol edip sayfayı yenile.');
  });
})();
