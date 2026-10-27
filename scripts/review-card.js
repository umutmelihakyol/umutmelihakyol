/* Günlüğüm — ortak, paylaşılabilir inceleme kartı oluşturucu. */
(function () {
  'use strict';

  const FORMATS = {
    portrait: { label: 'Dikey gönderi · 4:5', width: 1080, height: 1350, cover: 420, noteLines: 4, ratingRows: 3 },
    square: { label: 'Kare gönderi · 1:1', width: 1080, height: 1080, cover: 310, noteLines: 2, ratingRows: 2 },
    story: { label: 'Hikâye · 9:16', width: 1080, height: 1920, cover: 560, noteLines: 8, ratingRows: 6 }
  };
  const THEMES = {
    midnight: { label: 'Gece', bg: '#101820', panel: '#18252c', text: '#f1f6f7', mute: '#a9bac2', line: '#31444d', accent: '#79d4d3', tag: '#253a43', yes: '#8be0b5', no: '#ffab9a' },
    light: { label: 'Açık', bg: '#eaf0ed', panel: '#ffffff', text: '#1d2a2c', mute: '#667575', line: '#d6e1dc', accent: '#2b7b78', tag: '#e4f0eb', yes: '#247b54', no: '#ad514b' },
    violet: { label: 'Mor Gece', bg: '#100f20', panel: '#201b35', text: '#f7f3ff', mute: '#b8b1d2', line: '#433b61', accent: '#b7a0ff', tag: '#302847', yes: '#8fe1bd', no: '#ffa5a7' }
  };
  const RATING_LABELS = [
    ['story', 'Hikâye'], ['gameplay', 'Oynanış'], ['visuals', 'Görsellik'], ['audio', 'Ses / Müzik'],
    ['characters', 'Karakterler'], ['originality', 'Özgünlük'], ['pacing', 'Tempo / Kurgu']
  ];
  const stateByCanvas = new WeakMap();
  const imageCache = new Map();

  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const has = value => value !== null && value !== undefined && value !== '';
  const num = value => Number(value).toLocaleString('tr-TR', { maximumFractionDigits: 1 });
  const dateText = value => {
    if (!value) return '';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('tr-TR', { year: 'numeric', month: 'short' });
  };
  const slug = value => String(value || 'inceleme').toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 75) || 'inceleme';

  function roundedRect(ctx, x, y, w, h, r) {
    const radius = Math.max(0, Math.min(r, w / 2, h / 2));
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  function drawCover(ctx, img, x, y, w, h) {
    if (!img || !img.width || !img.height) return;
    const sourceRatio = img.width / img.height;
    const targetRatio = w / h;
    let sx = 0, sy = 0, sw = img.width, sh = img.height;
    if (sourceRatio > targetRatio) { sw = img.height * targetRatio; sx = (img.width - sw) / 2; }
    else { sh = img.width / targetRatio; sy = (img.height - sh) / 2; }
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  }

  function loadImage(url) {
    if (!url) return Promise.resolve(null);
    const cacheKey = String(url);
    if (imageCache.has(cacheKey)) return imageCache.get(cacheKey);
    const promise = new Promise(resolve => {
      let parsed;
      try { parsed = new URL(cacheKey, location.href); } catch { resolve(null); return; }
      if (!/^https?:$/.test(parsed.protocol)) { resolve(null); return; }
      const sameOrigin = parsed.origin === location.origin;
      const sources = sameOrigin ? [parsed.href] : [
        parsed.href,
        `https://wsrv.nl/?url=${encodeURIComponent(parsed.href)}&w=1080&output=webp`,
        `https://images.weserv.nl/?url=${encodeURIComponent(parsed.href)}&w=1080&output=webp`
      ];
      let index = 0;
      const next = () => {
        if (index >= sources.length) return resolve(null);
        const image = new Image();
        image.crossOrigin = 'anonymous';
        image.referrerPolicy = 'no-referrer';
        image.onload = () => resolve(image);
        image.onerror = () => { index += 1; next(); };
        image.src = sources[index];
      };
      next();
    });
    imageCache.set(cacheKey, promise);
    return promise;
  }

  function wrapText(ctx, value, maxWidth, maxLines = 99) {
    const words = String(value || '').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
    if (!words.length) return [];
    const lines = [];
    let line = '';
    for (const word of words) {
      const nextLine = line ? `${line} ${word}` : word;
      if (ctx.measureText(nextLine).width <= maxWidth || !line) {
        line = nextLine;
      } else {
        lines.push(line);
        line = word;
        if (lines.length === maxLines - 1) break;
      }
    }
    if (line && lines.length < maxLines) lines.push(line);
    const drawnText = lines.join(' ');
    const originalText = words.join(' ');
    if (drawnText.length < originalText.length && lines.length) {
      let last = lines[lines.length - 1];
      while (last && ctx.measureText(`${last}…`).width > maxWidth) last = last.slice(0, -1).trimEnd();
      lines[lines.length - 1] = `${last}…`;
    }
    return lines;
  }

  function drawPill(ctx, text, x, y, theme, opts = {}) {
    const fontSize = opts.fontSize || 20;
    ctx.font = `700 ${fontSize}px "Plus Jakarta Sans", Arial, sans-serif`;
    const padX = opts.padX ?? 18;
    const h = opts.height || 40;
    const w = Math.min(opts.maxWidth || 500, ctx.measureText(text).width + padX * 2);
    roundedRect(ctx, x, y, w, h, h / 2);
    ctx.fillStyle = opts.fill || theme.tag;
    ctx.fill();
    ctx.strokeStyle = opts.stroke || theme.line;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = opts.color || theme.text;
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + padX, y + h / 2 + 1, w - padX * 2);
    ctx.textBaseline = 'alphabetic';
    return w;
  }

  function getFacts(record, categoryKey, cfg) {
    const items = [];
    if (has(record.year)) items.push(String(record.year));
    if (record.platform) items.push(String(record.platform));
    const personKey = cfg?.person?.key;
    if (personKey && record[personKey]) items.push(String(record[personKey]));
    if (categoryKey === 'oyun' && has(record.hours)) items.push(`${num(record.hours)} saat`);
    if (categoryKey === 'film' && has(record.minutes)) items.push(`${num(record.minutes)} dk`);
    if ((categoryKey === 'dizi' || categoryKey === 'anime') && has(record.episodes)) items.push(`${num(record.episodes)} bölüm`);
    const finished = dateText(record.finished);
    if (finished) items.push(`Tamamlandı: ${finished}`);
    return [...new Set(items)].slice(0, 4);
  }

  async function render(canvas, categoryKey, record, options = {}) {
    if (!(canvas instanceof HTMLCanvasElement) || !record) return false;
    const currentRender = (stateByCanvas.get(canvas)?.token || 0) + 1;
    let resolveReady;
    const readyPromise = new Promise(resolve => { resolveReady = resolve; });
    const renderState = { token: currentRender, recordId: String(record.id ?? ''), categoryKey, format: options.format || 'portrait', theme: options.theme || 'midnight', ready: false, promise: readyPromise };
    stateByCanvas.set(canvas, renderState);
    const format = FORMATS[options.format] || FORMATS.portrait;
    const theme = THEMES[options.theme] || THEMES.midnight;
    const cfg = window.CATS?.[categoryKey] || { name: 'Yapım', plural: 'Arşiv', st: {} };
    try { if (document.fonts?.ready) await document.fonts.ready; } catch { /* Sistem fontlarına devam et. */ }
    const image = await loadImage(record.image);
    if (stateByCanvas.get(canvas)?.token !== currentRender) { resolveReady(false); return false; }

    canvas.width = format.width;
    canvas.height = format.height;
    canvas.dataset.recordId = String(record.id ?? '');
    canvas.dataset.categoryKey = categoryKey;
    canvas.dataset.format = options.format || 'portrait';
    canvas.dataset.theme = options.theme || 'midnight';
    const ctx = canvas.getContext('2d');
    if (!ctx) { renderState.ready = true; resolveReady(false); return false; }
    const W = format.width, H = format.height, margin = 26;
    const cardX = margin, cardY = margin, cardW = W - margin * 2, cardH = H - margin * 2;
    const coverH = Math.min(format.cover, cardH * .42);
    const contentX = cardX + 56, contentW = cardW - 112;
    const footerY = cardY + cardH - 82;
    const safeBottom = footerY - 28;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, W, H);
    const bgGrad = ctx.createLinearGradient(0, 0, W, H);
    bgGrad.addColorStop(0, theme.accent + '34');
    bgGrad.addColorStop(.52, theme.bg);
    bgGrad.addColorStop(1, theme.bg);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = theme.accent + '14';
    ctx.beginPath(); ctx.arc(W - 40, 75, 230, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = theme.accent + '10';
    ctx.beginPath(); ctx.arc(30, H - 60, 260, 0, Math.PI * 2); ctx.fill();

    ctx.save();
    roundedRect(ctx, cardX, cardY, cardW, cardH, 30);
    ctx.clip();
    ctx.fillStyle = theme.panel;
    ctx.fillRect(cardX, cardY, cardW, cardH);
    ctx.fillStyle = theme.bg;
    ctx.fillRect(cardX, cardY, cardW, coverH);
    if (image) drawCover(ctx, image, cardX, cardY, cardW, coverH);
    else {
      const fallback = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + coverH);
      fallback.addColorStop(0, theme.accent + '55');
      fallback.addColorStop(1, theme.bg);
      ctx.fillStyle = fallback;
      ctx.fillRect(cardX, cardY, cardW, coverH);
      ctx.fillStyle = theme.accent + '44';
      ctx.font = '800 250px "Plus Jakarta Sans", Arial, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(String(record.title || 'G').trim().charAt(0).toLocaleUpperCase('tr-TR') || 'G', cardX + cardW - 54, cardY + coverH - 24);
      ctx.textAlign = 'left';
    }
    const coverGradient = ctx.createLinearGradient(0, cardY, 0, coverH + cardY + 90);
    coverGradient.addColorStop(0, 'rgba(0,0,0,.60)');
    coverGradient.addColorStop(.42, 'rgba(0,0,0,.05)');
    coverGradient.addColorStop(1, theme.panel);
    ctx.fillStyle = coverGradient;
    ctx.fillRect(cardX, cardY, cardW, coverH + 90);

    // Brand stamp.
    roundedRect(ctx, cardX + 34, cardY + 30, 42, 42, 13);
    ctx.fillStyle = theme.accent;
    ctx.fill();
    ctx.fillStyle = theme.bg;
    ctx.font = '800 27px "Plus Jakarta Sans", Arial, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('G', cardX + 55, cardY + 51);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 22px "Plus Jakarta Sans", Arial, sans-serif';
    ctx.fillText('GÜNLÜĞÜM', cardX + 89, cardY + 57);

    const categoryName = cfg.name || cfg.plural || 'Arşiv';
    drawPill(ctx, categoryName.toLocaleUpperCase('tr-TR'), cardX + 34, cardY + 91, theme, { fill: 'rgba(8,14,18,.62)', stroke: '#ffffff4a', color: '#ffffff', fontSize: 17, height: 34, padX: 15 });
    const statusKey = record.status || 'bitirdim';
    const statusText = cfg.st?.[statusKey] || ({ bitirdim: 'Tamamlandı', oynuyorum: 'Devam Ediyor', biraktim: 'Yarım Bıraktım', istek: 'İstek Listesi' }[statusKey] || statusKey);
    const score = has(record.score) && Number.isFinite(Number(record.score)) ? Math.max(0, Math.min(10, Number(record.score))) : null;
    if (score !== null) {
      const scoreW = 120, scoreH = 112, sx = cardX + cardW - scoreW - 28, sy = cardY + 26;
      roundedRect(ctx, sx, sy, scoreW, scoreH, 22);
      ctx.fillStyle = theme.panel + 'ed'; ctx.fill();
      ctx.strokeStyle = theme.accent; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = theme.mute; ctx.font = '700 16px "Plus Jakarta Sans", Arial, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('PUANIM', sx + scoreW / 2, sy + 29);
      ctx.fillStyle = theme.accent; ctx.font = '800 45px "Plus Jakarta Sans", Arial, sans-serif';
      ctx.fillText(num(score), sx + scoreW / 2, sy + 79);
      ctx.fillStyle = theme.mute; ctx.font = '600 15px "Plus Jakarta Sans", Arial, sans-serif';
      ctx.fillText('/ 10', sx + scoreW / 2, sy + 101); ctx.textAlign = 'left';
    }
    const stateColor = statusKey === 'bitirdim' ? theme.yes : statusKey === 'biraktim' ? theme.no : theme.accent;
    drawPill(ctx, statusText, cardX + 34, cardY + coverH - 60, theme, { fill: 'rgba(8,14,18,.72)', stroke: stateColor + 'aa', color: '#ffffff', fontSize: 18, height: 40, padX: 18 });
    if (record.favorite === true) drawPill(ctx, '★ FAVORİM', cardX + cardW - 175, cardY + coverH - 60, theme, { fill: 'rgba(8,14,18,.72)', stroke: '#ffe18a99', color: '#ffe18a', fontSize: 16, height: 40, padX: 15, maxWidth: 145 });
    ctx.restore();

    let y = cardY + coverH + 54;
    ctx.fillStyle = theme.text;
    ctx.font = '800 47px "Plus Jakarta Sans", Arial, sans-serif';
    const titleLines = wrapText(ctx, record.title || 'Başlıksız yapım', contentW, 2);
    titleLines.forEach(line => { ctx.fillText(line, contentX, y, contentW); y += 57; });
    y += 5;

    const facts = getFacts(record, categoryKey, cfg);
    if (facts.length) {
      ctx.fillStyle = theme.mute;
      ctx.font = '600 21px "Plus Jakarta Sans", Arial, sans-serif';
      const factText = facts.join('   ·   ');
      const factLines = wrapText(ctx, factText, contentW, 2);
      factLines.forEach(line => { ctx.fillText(line, contentX, y); y += 31; });
    }
    y += 14;

    const genres = Array.isArray(record.genres) ? record.genres.filter(Boolean).slice(0, 6) : [];
    let gx = contentX, gy = y, rowH = 43, rows = 1;
    for (const genre of genres) {
      ctx.font = '700 17px "Plus Jakarta Sans", Arial, sans-serif';
      const itemW = Math.min(contentW, ctx.measureText(String(genre)).width + 32);
      if (gx + itemW > contentX + contentW) {
        if (rows >= 2) break;
        rows += 1; gx = contentX; gy += rowH + 8;
      }
      if (gx + itemW > contentX + contentW) continue;
      drawPill(ctx, String(genre), gx, gy, theme, { fontSize: 17, height: rowH, padX: 16 });
      gx += itemW + 10;
    }
    if (genres.length) y = gy + rowH + 18;

    // The remaining content is fitted above the fixed footer to avoid clipped text.
    const note = String(record.note || '').trim();
    const ratings = RATING_LABELS
      .filter(([key]) => categoryKey === 'oyun' || key !== 'gameplay')
      .map(([key, label]) => ({ label, value: record.ratings?.[key] }))
      .filter(item => has(item.value) && Number.isFinite(Number(item.value)) && Number(item.value) >= 0 && Number(item.value) <= 10);
    const pros = (Array.isArray(record.pros) ? record.pros : []).filter(Boolean).slice(0, 2);
    const cons = (Array.isArray(record.cons) ? record.cons : []).filter(Boolean).slice(0, 2);
    const availableLines = Math.max(0, Math.floor((safeBottom - y - 40) / 31));
    const noteMax = Math.min(format.noteLines, Math.max(0, availableLines - (ratings.length ? Math.min(ratings.length, format.ratingRows) + 2 : 0)));
    if (note && noteMax > 0 && y + 60 < safeBottom) {
      ctx.fillStyle = theme.accent;
      ctx.font = '800 17px "Plus Jakarta Sans", Arial, sans-serif';
      ctx.fillText('KİŞİSEL DEĞERLENDİRMEM', contentX, y + 17);
      y += 48;
      ctx.fillStyle = theme.text;
      ctx.font = '400 23px "Plus Jakarta Sans", Arial, sans-serif';
      const noteLines = wrapText(ctx, note, contentW, Math.min(noteMax, Math.floor((safeBottom - y - 14) / 31)));
      noteLines.forEach(line => { ctx.fillText(line, contentX, y, contentW); y += 31; });
      y += 12;
    }

    const maxRatings = Math.min(ratings.length, format.ratingRows, Math.max(0, Math.floor((safeBottom - y - 42) / 42)));
    if (maxRatings > 0) {
      ctx.fillStyle = theme.accent;
      ctx.font = '800 17px "Plus Jakarta Sans", Arial, sans-serif';
      ctx.fillText('PUAN DETAYLARI', contentX, y + 17); y += 33;
      for (const item of ratings.slice(0, maxRatings)) {
        ctx.fillStyle = theme.mute; ctx.font = '600 18px "Plus Jakarta Sans", Arial, sans-serif';
        ctx.fillText(item.label, contentX, y + 18);
        const barX = contentX + 230, barW = Math.max(150, contentW - 330), barY = y + 6;
        roundedRect(ctx, barX, barY, barW, 14, 7); ctx.fillStyle = theme.line; ctx.fill();
        roundedRect(ctx, barX, barY, barW * Math.max(0, Math.min(10, Number(item.value))) / 10, 14, 7); ctx.fillStyle = theme.accent; ctx.fill();
        ctx.fillStyle = theme.text; ctx.font = '800 18px "Plus Jakarta Sans", Arial, sans-serif'; ctx.textAlign = 'right';
        ctx.fillText(`${num(item.value)}/10`, contentX + contentW, y + 18); ctx.textAlign = 'left';
        y += 38;
      }
      y += 6;
    }

    const remaining = safeBottom - y;
    if ((pros.length || cons.length) && remaining > 82) {
      const colGap = 16, colW = pros.length && cons.length ? (contentW - colGap) / 2 : contentW;
      const drawProsCons = (label, items, x, color) => {
        if (!items.length) return;
        roundedRect(ctx, x, y, colW, Math.min(88, remaining - 4), 14);
        ctx.fillStyle = theme.tag; ctx.fill(); ctx.strokeStyle = theme.line; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.fillStyle = color; ctx.font = '800 16px "Plus Jakarta Sans", Arial, sans-serif'; ctx.fillText(label, x + 16, y + 25);
        ctx.fillStyle = theme.text; ctx.font = '600 16px "Plus Jakarta Sans", Arial, sans-serif';
        let lineY = y + 50;
        items.slice(0, 2).forEach(item => {
          if (lineY < y + 78) {
            const line = wrapText(ctx, `• ${item}`, colW - 30, 1)[0] || '';
            ctx.fillText(line, x + 16, lineY, colW - 30);
            lineY += 22;
          }
        });
      };
      drawProsCons('ARTILAR', pros, contentX, theme.yes);
      drawProsCons('EKSİLER', cons, contentX + (pros.length ? colW + colGap : 0), theme.no);
    }

    ctx.strokeStyle = theme.line; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(contentX, footerY); ctx.lineTo(contentX + contentW, footerY); ctx.stroke();
    ctx.fillStyle = theme.text; ctx.font = '800 20px "Plus Jakarta Sans", Arial, sans-serif';
    ctx.fillText('GÜNLÜĞÜM', contentX, footerY + 35);
    ctx.fillStyle = theme.mute; ctx.font = '600 16px "Plus Jakarta Sans", Arial, sans-serif';
    ctx.fillText('Kişisel arşivim · İnceleme kartı', contentX, footerY + 59);
    const permalink = makePermalink(categoryKey, record);
    ctx.textAlign = 'right';
    ctx.fillStyle = theme.accent;
    ctx.font = '700 16px "Plus Jakarta Sans", Arial, sans-serif';
    ctx.fillText(permalink.replace(/^https?:\/\//, ''), contentX + contentW, footerY + 35, contentW * .48);
    ctx.textAlign = 'left';

    // Subtle border.
    ctx.strokeStyle = theme.line; ctx.lineWidth = 2;
    roundedRect(ctx, cardX + 1, cardY + 1, cardW - 2, cardH - 2, 30); ctx.stroke();
    renderState.ready = true;
    resolveReady(true);
    return true;
  }

  function makePermalink(categoryKey, record) {
    const cfg = window.CATS?.[categoryKey];
    const base = cfg?.page || new URL(`${categoryKey}/`, location.origin + '/').href;
    const url = new URL(base, location.href);
    if (has(record.id)) url.hash = String(record.id);
    return url.href;
  }

  function blobFromCanvas(canvas) {
    return new Promise((resolve, reject) => {
      try {
        canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('PNG görseli oluşturulamadı.')), 'image/png');
      } catch (error) { reject(error); }
    });
  }

  function filename(record) { return `gunlugum-inceleme-${slug(record?.title)}.png`; }
  function saveBlob(blob, record) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename(record);
    link.style.display = 'none';
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  async function getBlob(record, categoryKey, options = {}) {
    let canvas = options.canvas;
    const formatKey = options.format || 'portrait';
    const themeKey = options.theme || 'midnight';
    let state = canvas && stateByCanvas.get(canvas);
    const matches = state && state.recordId === String(record.id ?? '') && state.categoryKey === categoryKey && state.format === formatKey && state.theme === themeKey;
    if (matches && !state.ready) await state.promise;
    state = canvas && stateByCanvas.get(canvas);
    const readyMatches = state && state.ready && state.recordId === String(record.id ?? '') && state.categoryKey === categoryKey && state.format === formatKey && state.theme === themeKey;
    if (!readyMatches) {
      canvas = document.createElement('canvas');
      const ok = await render(canvas, categoryKey, record, { format: formatKey, theme: themeKey });
      if (!ok) throw new Error('Kart hazırlanamadı. Lütfen tekrar dene.');
    }
    return blobFromCanvas(canvas);
  }

  async function download(record, categoryKey, options = {}) {
    const blob = await getBlob(record, categoryKey, options);
    saveBlob(blob, record);
    return blob;
  }

  async function shareOrDownload(record, categoryKey, options = {}) {
    const blob = await getBlob(record, categoryKey, options);
    if (typeof File === 'function') {
      const file = new File([blob], filename(record), { type: 'image/png' });
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: `${record.title} – Günlüğüm`, text: `${record.title} için Günlüğüm inceleme kartı: ${makePermalink(categoryKey, record)}` });
          return 'shared';
        } catch (error) {
          if (error?.name === 'AbortError') throw error;
          // Paylaşım API'si cihazda bulunup dosyayı desteklemiyorsa indirmeye geri dön.
        }
      }
    }
    saveBlob(blob, record);
    return 'downloaded';
  }

  function ensureDialog() {
    let dialog = document.getElementById('reviewCardDialog');
    if (dialog) return dialog;
    dialog = document.createElement('dialog');
    dialog.id = 'reviewCardDialog';
    dialog.className = 'review-card-dialog';
    dialog.setAttribute('aria-labelledby', 'reviewCardTitle');
    dialog.innerHTML = `
      <div class="rcd-top">
        <div><p class="rcd-kicker">PAYLAŞILABİLİR GÖRSEL</p><h2 id="reviewCardTitle">İnceleme kartını hazırla</h2><p class="rcd-subtitle" id="rcdRecordLabel"></p></div>
        <button type="button" class="btn rcd-close" data-rcd-close aria-label="Pencereyi kapat">✕</button>
      </div>
      <div class="rcd-layout">
        <div class="rcd-settings">
          <label>Görsel formatı<select id="rcdFormat"><option value="portrait">Dikey gönderi · 4:5</option><option value="square">Kare gönderi · 1:1</option><option value="story">Hikâye · 9:16</option></select></label>
          <label>Kart teması<select id="rcdTheme"><option value="midnight">Gece</option><option value="light">Açık</option><option value="violet">Mor Gece</option></select></label>
          <p class="rcd-tip">Kart, puanını, durumunu, kişisel notlarını ve varsa alt puanlarını içerir. İndirdiğin PNG'yi forumlarda ve sosyal medyada paylaşabilirsin.</p>
          <div class="rcd-actions"><button type="button" class="btn pri" id="rcdDownload">↓ PNG indir</button><button type="button" class="btn" id="rcdShare">↗ Görseli paylaş</button><button type="button" class="btn" id="rcdCopyLink">Bağlantıyı kopyala</button></div>
          <p class="rcd-status" id="rcdStatus" role="status" aria-live="polite">Kart hazırlanıyor…</p>
        </div>
        <div class="rcd-preview-wrap"><canvas id="rcdCanvas" width="1080" height="1350" aria-label="İnceleme kartı önizlemesi"></canvas></div>
      </div>`;
    document.body.append(dialog);
    const close = () => dialog.close();
    dialog.querySelector('[data-rcd-close]').addEventListener('click', close);
    dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
    dialog.querySelector('#rcdFormat').addEventListener('change', () => renderDialog(dialog));
    dialog.querySelector('#rcdTheme').addEventListener('change', () => renderDialog(dialog));
    dialog.querySelector('#rcdDownload').addEventListener('click', async event => {
      const button = event.currentTarget, record = dialog._record, cat = dialog._category;
      if (!record) return;
      button.disabled = true;
      dialog.querySelector('#rcdStatus').textContent = 'PNG hazırlanıyor…';
      try { await download(record, cat, dialogOptions(dialog)); dialog.querySelector('#rcdStatus').textContent = 'PNG dosyası indirildi.'; }
      catch (error) { dialog.querySelector('#rcdStatus').textContent = error.message || 'İndirme başarısız oldu.'; }
      finally { button.disabled = false; }
    });
    dialog.querySelector('#rcdShare').addEventListener('click', async event => {
      const button = event.currentTarget, record = dialog._record, cat = dialog._category;
      if (!record) return;
      button.disabled = true;
      const status = dialog.querySelector('#rcdStatus');
      status.textContent = 'Paylaşım hazırlanıyor…';
      try {
        const result = await shareOrDownload(record, cat, dialogOptions(dialog));
        status.textContent = result === 'shared' ? 'Paylaşım penceresi açıldı.' : 'Tarayıcı doğrudan paylaşımı desteklemiyor; PNG indirildi.';
      } catch (error) {
        status.textContent = error.name === 'AbortError' ? 'Paylaşım iptal edildi.' : (error.message || 'Paylaşım başarısız oldu.');
      } finally { button.disabled = false; }
    });
    dialog.querySelector('#rcdCopyLink').addEventListener('click', async () => {
      const status = dialog.querySelector('#rcdStatus');
      const url = makePermalink(dialog._category, dialog._record);
      try {
        await navigator.clipboard.writeText(url);
        status.textContent = 'Yapım bağlantısı kopyalandı.';
      } catch {
        window.prompt('Yapım bağlantısını kopyala:', url);
      }
    });
    return dialog;
  }

  function dialogOptions(dialog) {
    return { format: dialog.querySelector('#rcdFormat').value, theme: dialog.querySelector('#rcdTheme').value, canvas: dialog.querySelector('#rcdCanvas') };
  }

  async function renderDialog(dialog) {
    if (!dialog._record) return;
    const status = dialog.querySelector('#rcdStatus');
    status.textContent = 'Kart önizlemesi hazırlanıyor…';
    try {
      await render(dialog.querySelector('#rcdCanvas'), dialog._category, dialog._record, dialogOptions(dialog));
      status.textContent = 'Önizleme hazır. PNG indirebilir veya görseli paylaşabilirsin.';
    } catch (error) { status.textContent = error.message || 'Önizleme oluşturulamadı.'; }
  }

  function openEditor(record, categoryKey, options = {}) {
    const dialog = ensureDialog();
    dialog._record = record;
    dialog._category = categoryKey;
    dialog.querySelector('#rcdRecordLabel').textContent = `${record.title || 'Başlıksız yapım'} · ${window.CATS?.[categoryKey]?.name || 'Arşiv'}`;
    dialog.querySelector('#rcdFormat').value = options.format || 'portrait';
    dialog.querySelector('#rcdTheme').value = options.theme || 'midnight';
    if (!dialog.open) dialog.showModal();
    renderDialog(dialog);
  }

  window.GunlugumReviewCard = { FORMATS, THEMES, render, download, shareOrDownload, openEditor, makePermalink };
})();
