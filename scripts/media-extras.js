/* Günlüğüm medya ekleri: yayın/mağaza bağlantıları, PC profilleri ve içerik QR kodu. */
(() => {
  'use strict';
  if (window.__gunlugumMediaExtrasLoaded) return;
  window.__gunlugumMediaExtrasLoaded = true;

  const script = document.currentScript;
  if (!script || !script.src) return;
  const rootURL = new URL('../', script.src);
  const cssURL = new URL('assets/css/media-extras.css?v=1', rootURL);
  if (!document.querySelector('link[data-media-extras-css]')) {
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = cssURL.href;
    css.dataset.mediaExtrasCss = 'true';
    document.head.appendChild(css);
  }

  const labelType = {
    streaming: 'Yayın servisi', rental: 'Kirala', purchase: 'Satın al',
    store: 'Mağaza', platform: 'Platform', free: 'Ücretsiz erişim', subscription: 'Abonelik'
  };
  const cache = new Map();
  const modal = document.querySelector('#dlg');
  if (!modal) return;

  function safeText(value) { return String(value ?? '').trim(); }
  function siteCategory() { return document.body.dataset.cat || ''; }
  function getId() {
    const raw = location.hash.slice(1);
    if (!raw) return '';
    try { return decodeURIComponent(raw); } catch (_) { return raw; }
  }
  async function loadRecords(category) {
    if (cache.has(category)) return cache.get(category);
    const promise = (async () => {
      const config = window.CATS && window.CATS[category];
      if (!config || !config.file) return [];
      const url = new URL(config.file, rootURL);
      url.searchParams.set('_mediaExtras', '1');
      const response = await fetch(url.href, { cache: 'no-cache' });
      if (!response.ok) throw new Error(`Kayıtlar yüklenemedi (${response.status})`);
      const records = await response.json();
      return Array.isArray(records) ? records : [];
    })();
    cache.set(category, promise);
    try { return await promise; }
    catch (error) { cache.delete(category); throw error; }
  }
  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function addCopyButton(parent, value, label) {
    const button = el('button', 'btn media-extra-copy', label || 'Kopyala');
    button.type = 'button';
    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(value);
        button.textContent = 'Kopyalandı';
      } catch (_) {
        window.prompt('Kopyalamak için seç:', value);
      }
    });
    parent.appendChild(button);
  }
  function section(title, subtitle) {
    const box = el('section', 'media-extra-section');
    box.append(el('h3', '', title));
    if (subtitle) box.append(el('p', 'media-extra-muted', subtitle));
    return box;
  }
  function renderAvailability(record, host) {
    const items = Array.isArray(record.availability) ? record.availability : [];
    const box = section('Nerede izlenir veya oynanır?', items.length ? 'Bağlantılar kayda özel olarak yönetim panelinden düzenlenir.' : 'Bu içerik için henüz platform bilgisi eklenmemiş.');
    if (items.length) {
      const list = el('div', 'media-provider-list');
      items.forEach(item => {
        if (!item || typeof item !== 'object') return;
        const name = safeText(item.name || item.provider);
        const href = safeText(item.url);
        if (!name || !/^https:\/\//i.test(href)) return;
        const row = el('a', 'media-provider');
        row.href = href;
        row.target = '_blank';
        row.rel = 'noopener noreferrer';
        row.append(el('span', 'media-provider-icon', item.type === 'store' ? '🛒' : item.type === 'streaming' ? '▶' : '↗'));
        const copy = el('span', 'media-provider-copy');
        copy.append(el('strong', '', name), el('small', '', labelType[safeText(item.type)] || 'Platform'));
        if (item.note) copy.append(el('span', 'media-provider-note', safeText(item.note)));
        row.appendChild(copy);
        const arrow = el('span', 'media-provider-arrow', '↗');
        row.appendChild(arrow);
        list.appendChild(row);
      });
      box.appendChild(list);
    }
    host.appendChild(box);
  }
  function renderProfiles(record, host) {
    if (siteCategory() !== 'oyun') return;
    const profiles = Array.isArray(record.installProfiles) ? record.installProfiles : [];
    const box = section('PC oyunu kurulum profilleri', profiles.length ? 'Kayıtlı kurulum ve uyumluluk notları.' : 'Bu oyun için henüz kurulum profili eklenmemiş. Profilleri yönetim panelindeki içerik formundan ekleyebilirsin.');
    profiles.forEach((profile, index) => {
      if (!profile || typeof profile !== 'object') return;
      const card = el('article', 'install-profile');
      const head = el('div', 'install-profile-head');
      head.append(el('h4', '', safeText(profile.name) || `Profil ${index + 1}`));
      if (profile.version) head.append(el('span', 'media-extra-badge', safeText(profile.version)));
      card.appendChild(head);
      const fields = [
        ['Platform', profile.platform], ['Uyumluluk katmanı', profile.compatibility],
        ['Başlatma seçenekleri', profile.launchOptions], ['Grafik ayarları', profile.graphicsSettings],
        ['Mod listesi', Array.isArray(profile.mods) ? profile.mods.join('\n') : profile.mods], ['Notlar', profile.notes]
      ];
      fields.forEach(([label, value]) => {
        const txt = safeText(value);
        if (!txt) return;
        const field = el('div', 'install-profile-field');
        field.append(el('span', 'install-profile-label', label), el('pre', 'install-profile-value', txt));
        if (label === 'Başlatma seçenekleri' || label === 'Grafik ayarları' || label === 'Mod listesi') addCopyButton(field, txt, 'Kopyala');
        card.appendChild(field);
      });
      box.appendChild(card);
    });
    host.appendChild(box);
  }
  function renderQr(record, category) {
    const config = window.CATS && window.CATS[category];
    const box = section('Bu içeriğin QR kodu', 'Telefonunla okutarak doğrudan bu kaydın bağlantısını aç.');
    const url = new URL(config && config.page ? config.page : location.href, rootURL);
    url.hash = record.id;
    const publicURL = url.href;
    const qrURL = new URL('https://api.qrserver.com/v1/create-qr-code/');
    qrURL.searchParams.set('size', '260x260');
    qrURL.searchParams.set('margin', '2');
    qrURL.searchParams.set('format', 'png');
    qrURL.searchParams.set('data', publicURL);
    const row = el('div', 'media-qr-row');
    const imageLink = el('a', 'media-qr-image-link');
    imageLink.href = qrURL.href;
    imageLink.target = '_blank';
    imageLink.rel = 'noopener noreferrer';
    const image = el('img', 'media-qr-image');
    image.src = qrURL.href;
    image.alt = `${safeText(record.title)} QR kodu`;
    image.loading = 'lazy';
    image.referrerPolicy = 'no-referrer';
    image.addEventListener('error', () => {
      image.hidden = true;
      imageLink.append(el('span', 'media-qr-unavailable', 'QR kodu çevrimiçi üretilemedi.'));
    }, { once: true });
    imageLink.appendChild(image);
    const details = el('div', 'media-qr-details');
    details.append(el('p', 'media-extra-muted', 'QR kodu herkese açık içerik bağlantısına yönlendirir. Kod üretimi için QR hizmetine bu bağlantı gönderilir.'));
    addCopyButton(details, publicURL, 'İçerik bağlantısını kopyala');
    const download = el('button', 'btn pri media-extra-download', 'QR PNG indir');
    download.type = 'button';
    download.addEventListener('click', async () => {
      const old = download.textContent;
      download.disabled = true;
      download.textContent = 'Hazırlanıyor…';
      try {
        const response = await fetch(qrURL.href, { mode: 'cors', cache: 'no-store' });
        if (!response.ok) throw new Error('QR indirilemedi');
        const blob = await response.blob();
        const objectURL = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = objectURL;
        a.download = `gunlugum-qr-${String(record.title || 'icerik').normalize('NFKD').replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'icerik'}.png`;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(objectURL), 1000);
      } catch (_) {
        window.open(qrURL.href, '_blank', 'noopener');
        download.textContent = 'QR görseli açıldı';
        setTimeout(() => { if (download.isConnected) download.textContent = old; }, 2200);
      } finally { download.disabled = false; if (download.textContent === 'Hazırlanıyor…') download.textContent = old; }
    });
    details.appendChild(download);
    row.append(imageLink, details);
    box.appendChild(row);
    return box;
  }
  async function render() {
    if (!modal.open) return;
    const category = siteCategory();
    if (!category || !window.CATS?.[category]) return;
    const id = getId();
    const title = safeText(modal.querySelector('.inner h2')?.textContent);
    if (!id && !title) return;
    const old = modal.querySelector('.media-extras');
    if (old && old.dataset.recordKey === `${category}:${id || title}`) return;
    old?.remove();
    const host = el('div', 'media-extras');
    host.dataset.recordKey = `${category}:${id || title}`;
    const anchor = Array.from(modal.querySelector('.inner')?.children || []).find(child => child.querySelector?.('.card-gen-btn'));
    if (!anchor) return;
    anchor.before(host);
    try {
      const records = await loadRecords(category);
      const record = records.find(item => String(item.id) === id) || records.find(item => safeText(item.title) === title);
      if (!record) {
        host.append(el('p', 'media-extra-muted', 'Bu kayıt için ek bilgiler bulunamadı.')); return;
      }
      host.replaceChildren();
      renderAvailability(record, host);
      renderProfiles(record, host);
      host.appendChild(renderQr(record, category));
    } catch (error) {
      host.append(el('p', 'media-extra-muted', 'Ek bilgiler yüklenemedi. Sayfayı yenileyip tekrar dene.'));
      console.warn('Günlüğüm medya ekleri:', error);
    }
  }
  let queued = false;
  function scheduleRender() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; render(); });
  }
  const observer = new MutationObserver(scheduleRender);
  observer.observe(modal, { childList: true, subtree: true, attributes: true, attributeFilter: ['open'] });
  modal.addEventListener('close', () => { modal.querySelector('.media-extras')?.remove(); });
  window.addEventListener('hashchange', scheduleRender);
  document.addEventListener('click', event => {
    if (event.target.closest('#grid a[href^="#"], #soonList a[href^="#"]')) setTimeout(scheduleRender, 50);
  }, true);
  scheduleRender();
})();
