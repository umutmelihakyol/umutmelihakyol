/* Günlüğüm medya ekleri: yayın/mağaza bağlantıları, PC profilleri ve içerik QR kodu. */
(() => {
  'use strict';
  if (window.__gunlugumMediaExtrasLoaded) return;
  window.__gunlugumMediaExtrasLoaded = true;

  const script = document.currentScript;
  if (!script || !script.src) return;
  const rootURL = new URL('../', script.src);
  const cssURL = new URL('assets/css/media-extras.css?v=3', rootURL);
  if (!document.querySelector('link[data-media-extras-css]')) {
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = cssURL.href;
    css.dataset.mediaExtrasCss = 'true';
    document.head.appendChild(css);
  }

  const linkTypeLabels = { official: 'Resmî site', store: 'Mağaza sayfası', trailer: 'Fragman / tanıtım', wiki: 'Wiki / rehber', mods: 'Mod / yama', support: 'Destek sayfası', community: 'Topluluk', other: 'Diğer' };
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
      const response = await fetch(url.href, { cache: 'default' });
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
  function renderLinks(record, host) {
    const items = Array.isArray(record.links) ? record.links : [];
    if (!items.length) return;
    const box = section('İlgili bağlantılar', 'Yalnızca bu içerik için eklediğin bağlantılar gösterilir.');
    const list = el('div', 'media-provider-list');
    items.forEach(item => {
      if (!item || typeof item !== 'object') return;
      const name = safeText(item.name);
      const href = safeText(item.url);
      if (!name || !/^https:\/\//i.test(href)) return;
      const type = safeText(item.type) || 'other';
      const row = el('a', 'media-provider');
      row.href = href;
      row.target = '_blank';
      row.rel = 'noopener noreferrer';
      row.append(el('span', 'media-provider-icon', type === 'mods' ? '⚙' : type === 'trailer' ? '▶' : type === 'wiki' ? '▤' : type === 'store' ? '↗' : '↗'));
      const copy = el('span', 'media-provider-copy');
      copy.append(el('strong', '', name), el('small', '', linkTypeLabels[type] || 'Diğer'));
      if (item.note) copy.append(el('span', 'media-provider-note', safeText(item.note)));
      row.appendChild(copy);
      row.appendChild(el('span', 'media-provider-arrow', '↗'));
      list.appendChild(row);
    });
    if (list.childElementCount) { box.appendChild(list); host.appendChild(box); }
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
  let localQrPromise = null;
  function loadLocalQrLibrary() {
    if (window.GunlugumQrCore) return Promise.resolve(window.GunlugumQrCore);
    if (localQrPromise) return localQrPromise;
    localQrPromise = new Promise((resolve, reject) => {
      const qrScript = document.createElement('script');
      qrScript.src = new URL('scripts/qrcode-local.js?v=1', rootURL).href;
      qrScript.async = true;
      qrScript.onload = () => window.GunlugumQrCore
        ? resolve(window.GunlugumQrCore)
        : reject(new Error('QR modülü yüklenemedi.'));
      qrScript.onerror = () => reject(new Error('Yerel QR dosyasına ulaşılamadı.'));
      document.head.appendChild(qrScript);
    }).catch(error => {
      localQrPromise = null;
      throw error;
    });
    return localQrPromise;
  }
  function createLocalQrDataUrl(qrCore, text) {
    const qr = new qrCore.QRCode(-1, qrCore.ErrorCorrectLevel.L);
    qr.addData(text);
    qr.make();
    const count = qr.getModuleCount();
    const quietZone = 4;
    const targetPixels = 320;
    const scale = Math.max(3, Math.floor(targetPixels / (count + quietZone * 2)));
    const size = (count + quietZone * 2) * scale;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Bu tarayıcı QR görseli oluşturamıyor.');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, size, size);
    context.fillStyle = '#000000';
    for (let row = 0; row < count; row += 1) {
      for (let col = 0; col < count; col += 1) {
        if (qr.isDark(row, col)) {
          context.fillRect((col + quietZone) * scale, (row + quietZone) * scale, scale, scale);
        }
      }
    }
    return canvas.toDataURL('image/png');
  }
  function renderQr(record, category) {
    const config = window.CATS && window.CATS[category];
    const box = section('Bu içeriğin QR kodu', 'QR görseli yalnızca istediğinde yüklenir.');
    const url = new URL(config && config.page ? config.page : location.href, rootURL);
    url.hash = record.id;
    const publicURL = url.href;
    const row = el('div', 'media-qr-row');
    const imageLink = el('a', 'media-qr-image-link');
    imageLink.href = publicURL;
    imageLink.target = '_blank';
    imageLink.rel = 'noopener noreferrer';
    imageLink.hidden = true;
    const image = el('img', 'media-qr-image');
    image.alt = `${safeText(record.title)} QR kodu`;
    image.loading = 'lazy';
    image.hidden = true;
    const unavailable = el('span', 'media-qr-unavailable', 'QR kodu oluşturulamadı. Yeniden deneyebilirsin.');
    unavailable.hidden = true;
    imageLink.append(image, unavailable);
    const details = el('div', 'media-qr-details');
    details.append(el('p', 'media-extra-muted', 'QR kodu bu tarayıcıda oluşturulur; bağlantı herhangi bir QR hizmetine gönderilmez.'));
    addCopyButton(details, publicURL, 'İçerik bağlantısını kopyala');
    const showQr = el('button', 'btn pri media-qr-generate', 'QR kodunu oluştur');
    showQr.type = 'button';
    const download = el('button', 'btn media-extra-download', 'QR PNG indir');
    download.type = 'button';
    download.disabled = true;
    let qrLoaded = false;
    let generating = false;
    const downloadName = `gunlugum-qr-${String(record.title || 'icerik').normalize('NFKD').replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'icerik'}.png`;

    showQr.addEventListener('click', async () => {
      if (qrLoaded || generating) return;
      generating = true;
      showQr.disabled = true;
      showQr.textContent = 'QR oluşturuluyor…';
      unavailable.hidden = true;
      image.hidden = true;
      imageLink.hidden = true;
      download.disabled = true;
      try {
        const qrCore = await loadLocalQrLibrary();
        const dataUrl = createLocalQrDataUrl(qrCore, publicURL);
        image.src = dataUrl;
        imageLink.href = publicURL;
        image.hidden = false;
        unavailable.hidden = true;
        imageLink.hidden = false;
        qrLoaded = true;
        download.disabled = false;
        showQr.textContent = 'QR hazır';
        showQr.disabled = true;
      } catch (error) {
        console.error('[Günlüğüm] QR kodu oluşturulamadı:', error);
        unavailable.hidden = false;
        imageLink.hidden = false;
        image.hidden = true;
        showQr.textContent = 'Tekrar dene';
        showQr.disabled = false;
      } finally {
        generating = false;
      }
    });
    download.addEventListener('click', () => {
      if (!qrLoaded || !image.src) {
        showQr.click();
        return;
      }
      const anchor = document.createElement('a');
      anchor.href = image.src;
      anchor.download = downloadName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    });
    details.append(showQr, download);
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
      renderLinks(record, host);
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
