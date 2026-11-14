/* Günlüğüm — Seri ve Evren Rehberleri ziyaretçi sayfası */
(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const safeUrl = value => { try { const url = new URL(String(value || '')); return url.protocol === 'https:' ? esc(url.href) : ''; } catch (_) { return ''; } };
  const root = window.SITE_ROOT || new URL('../', location.href).href;
  const status = (message, state = 'info') => { const node = $('#franchiseStatus'); if (node) { node.textContent = message; node.dataset.state = state; } };
  const guideGrid = $('#franchiseGuideGrid');
  const detail = $('#franchiseDetail');
  const empty = $('#franchiseEmpty');
  const query = new URLSearchParams(location.search);
  const selectedSlug = query.get('seri') || '';
  let guides = [];

  function imageMarkup(url, title, className = '') {
    const image = safeUrl(url);
    return image
      ? `<img class="${className}" src="${image}" alt="${esc(title)}" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.remove()">`
      : `<span class="${className ? className + ' ' : ''}franchise-guide-placeholder" aria-hidden="true">⌘</span>`;
  }

  function renderDirectory(filter = '') {
    const value = filter.trim().toLocaleLowerCase('tr-TR');
    const list = guides.filter(guide => !value || `${guide.title} ${guide.description || ''}`.toLocaleLowerCase('tr-TR').includes(value));
    $('#franchiseCount').textContent = `${list.length} seri / evren rehberi`;
    guideGrid.hidden = false;
    detail.hidden = true;
    guideGrid.innerHTML = list.map(guide => `
      <article class="franchise-guide-card">
        <a class="franchise-guide-media" href="?seri=${encodeURIComponent(guide.slug)}" aria-label="${esc(guide.title)} rehberini aç">
          ${imageMarkup(guide.cover, guide.title)}
          <span class="franchise-guide-count">${(guide.entries || []).length} yapım</span>
        </a>
        <div class="franchise-guide-copy">
          <h2>${esc(guide.title)}</h2>
          <p>${esc(guide.description || guide.intro || 'Bu seri için hazırladığım oyun sırası ve evren rehberi.')}</p>
          <a class="franchise-guide-open" href="?seri=${encodeURIComponent(guide.slug)}">Rehberi görüntüle <span aria-hidden="true">↗</span></a>
        </div>
      </article>`).join('');
    empty.hidden = guides.length > 0;
    if (guides.length && !list.length) {
      empty.hidden = false;
      empty.querySelector('h2').textContent = 'Aramana uygun rehber bulunamadı';
      empty.querySelector('p').textContent = 'Farklı bir seri veya evren adı deneyebilirsin.';
    } else if (!guides.length) {
      empty.querySelector('h2').textContent = 'Henüz seri rehberi eklenmemiş';
      empty.querySelector('p').textContent = 'Yeni rehberler ekledikçe burada serilerin sırasını ve bağlantılı oyunları bulabilirsin.';
    }
    $('#franchisePageTitle').textContent = 'Seri ve Evren Rehberleri';
    $('#franchisePageDescription').textContent = 'Bir oyun serisine nereden başlamalı? Hazırladığım rehberlerde serilerin oyunlarını, bağlantılarını ve önerdiğim oynama sırasını bir arada bulabilirsin.';
    document.title = 'Seri ve Evren Rehberleri | Günlüğüm';
    $('#franchiseTools').hidden = false;
    status(guides.length ? `${guides.length} rehber listeleniyor.` : 'Yönetim panelinden ilk seri rehberini ekleyebilirsin.');
  }

  function renderDetail(guide) {
    const entries = [...(guide.entries || [])].sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
    const cover = safeUrl(guide.cover);
    const orderTitle = guide.orderTitle || 'Önerdiğim oynama sırası';
    const intro = guide.intro || '';
    detail.innerHTML = `
      <header class="franchise-detail-head">
        <div><p class="franchise-detail-eyebrow">SERİ &amp; EVREN REHBERİ</p><h2>${esc(guide.title)}</h2><p class="franchise-detail-description">${esc(guide.description || '')}</p></div>
        ${cover ? `<div class="franchise-detail-cover"><img src="${cover}" alt="${esc(guide.title)}" referrerpolicy="no-referrer"></div>` : ''}
      </header>
      ${intro ? `<div class="franchise-detail-intro">${esc(intro)}</div>` : ''}
      <div class="franchise-order-head"><div><h3>${esc(orderTitle)}</h3><p>${esc(guide.orderNote || 'Aşağıdaki sıralama bu seriye başlamak veya devam etmek için hazırladığım rehberdir.')}</p></div><small>${entries.length} yapım</small></div>
      <div class="franchise-timeline">${entries.map((entry, index) => {
        const title = entry.title || 'Başlıksız yapım';
        const poster = safeUrl(entry.image);
        const linked = entry.gameId ? `${root}oyun/#${encodeURIComponent(entry.gameId)}` : '';
        const meta = [entry.year || '', entry.type || ''].filter(Boolean).map(esc).join(' · ');
        return `<article class="franchise-step">
          <span class="franchise-step-number">${String(index + 1).padStart(2, '0')}</span>
          <span class="franchise-step-poster">${poster ? `<img src="${poster}" alt="${esc(title)} kapak görseli" loading="lazy" decoding="async" referrerpolicy="no-referrer">` : '<span class="franchise-step-placeholder" aria-hidden="true">▧</span>'}</span>
          <div class="franchise-step-copy"><p class="franchise-step-meta">${meta ? `<span>${meta}</span>` : ''}</p><h4>${esc(title)}</h4>${entry.description ? `<p>${esc(entry.description)}</p>` : ''}</div>
          ${linked ? `<a class="franchise-step-link" href="${esc(linked)}">Arşivimde aç ↗</a>` : ''}
        </article>`;
      }).join('')}</div>
      <div class="franchise-detail-actions"><a class="franchise-back" href="./">← Tüm rehberler</a><button class="franchise-share" type="button" id="franchiseShare">Bu rehberi paylaş ↗</button></div>`;
    guideGrid.hidden = true;
    detail.hidden = false;
    empty.hidden = true;
    $('#franchiseTools').hidden = true;
    $('#franchisePageTitle').textContent = guide.title;
    $('#franchisePageDescription').textContent = guide.description || 'Bu oyun serisi için hazırladığım rehber ve önerdiğim oynama sırası.';
    $('#franchiseCount').textContent = `${entries.length} yapım`;
    document.title = `${guide.title} | Seri ve Evren Rehberi | Günlüğüm`;
    status('Seri rehberi açıldı.');
    $('#franchiseShare')?.addEventListener('click', async event => {
      const url = location.href;
      const button = event.currentTarget;
      try {
        if (navigator.share) await navigator.share({ title: guide.title, text: `${guide.title} — Günlüğüm seri rehberi`, url });
        else if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(url); button.textContent = 'Bağlantı kopyalandı ✓'; }
        else window.prompt('Rehber bağlantısı:', url);
      } catch (error) { if (error?.name !== 'AbortError') window.prompt('Rehber bağlantısı:', url); }
    });
  }

  $('#franchiseSearch')?.addEventListener('input', event => renderDirectory(event.target.value));

  fetch(new URL('data/franchise-guides.json', root).href, { cache: 'no-cache' })
    .then(response => { if (!response.ok) throw new Error(`HTTP ${response.status}`); return response.json(); })
    .then(raw => {
      if (!raw || !Array.isArray(raw.guides)) throw new Error('Seri rehberi verisi beklenen biçimde değil.');
      guides = raw.guides.filter(item => item && item.slug && item.title && Array.isArray(item.entries) && item.entries.length)
        .map(item => ({ ...item, entries: [...item.entries].sort((a, b) => Number(a.order || 0) - Number(b.order || 0)) }));
      const guide = selectedSlug ? guides.find(item => item.slug === selectedSlug) : null;
      if (selectedSlug && guide) renderDetail(guide);
      else renderDirectory();
    })
    .catch(error => {
      console.error('Seri ve evren rehberleri yüklenemedi:', error);
      guides = [];
      renderDirectory();
      status('Seri rehberleri yüklenemedi. Bağlantını kontrol edip sayfayı yenile.', 'error');
    });
})();
