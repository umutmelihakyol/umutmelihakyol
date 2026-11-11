/* Yönetim paneli — Technopat dizi ve film önerileri */
(() => {
  'use strict';
  const PATH = 'data/technopat-recommendations.json';
  const TYPES = ['films', 'series'];
  const LABELS = { films: 'Film', series: 'Dizi' };
  const el = id => document.getElementById(id);
  const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));
  const safeForumURL = value => {
    try {
      const url = new URL(String(value || ''));
      return url.protocol === 'https:' && (url.hostname === 'technopat.net' || url.hostname.endsWith('.technopat.net')) ? url.href : '';
    } catch (_) { return ''; }
  };
  const safeImageURL = value => {
    const raw = String(value || '').trim();
    if (!raw) return '';
    try { const url = new URL(raw); return /^https?:$/.test(url.protocol) ? url.href : ''; }
    catch (_) { return ''; }
  };
  const makeId = () => `tech-rec-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  let data = { films: [], series: [] };
  let sha = null;
  let loaded = false;
  let dirty = false;
  let editing = null;

  function status(message, state = 'info') {
    const box = el('tprAdminStatus');
    if (!box) return;
    box.textContent = message;
    box.dataset.state = state;
  }
  function normalize(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('JSON dosyasının en üst düzeyi bir nesne olmalı.');
    const clean = { films: [], series: [] };
    const seen = new Set();
    for (const type of TYPES) {
      const records = raw[type] === undefined ? [] : raw[type];
      if (!Array.isArray(records)) throw new Error(`${LABELS[type]} alanı bir liste olmalı.`);
      clean[type] = records.map((entry, index) => {
        if (!entry || typeof entry !== 'object' || Array.isArray(entry)) throw new Error(`${LABELS[type]} listesindeki ${index + 1}. kayıt geçersiz.`);
        const id = String(entry.id || makeId());
        if (seen.has(id)) throw new Error(`Aynı öneri kimliği birden fazla kullanılmış: ${id}`);
        seen.add(id);
        return {
          id,
          title: String(entry.title || '').trim(),
          description: String(entry.description || '').trim(),
          url: String(entry.url || '').trim(),
          image: String(entry.image || '').trim(),
          createdAt: String(entry.createdAt || new Date().toISOString()),
          updatedAt: String(entry.updatedAt || entry.createdAt || new Date().toISOString())
        };
      });
    }
    return clean;
  }
  function updateSummary() {
    const total = data.films.length + data.series.length;
    el('tprSummary').innerHTML = [
      { label: 'Filmler', value: data.films.length },
      { label: 'Diziler', value: data.series.length },
      { label: 'Toplam öneri', value: total }
    ].map(item => `<div class="stat-card"><b>${item.value}</b><div>${item.label}</div><small class="meta">Kayıt</small></div>`).join('') +
      `<div class="stat-card"><b>${dirty ? 'Düzenlendi' : 'Temiz'}</b><div>Durum</div><small class="meta">${dirty ? 'GitHub’a kaydedilmemiş taslak' : 'GitHub ile eşleşiyor'}</small></div>`;
    el('tprListCount').textContent = `${total} öneri`;
  }
  function filteredEntries() {
    const filter = el('tprListType').value;
    return TYPES.filter(type => filter === 'all' || filter === type).flatMap(type => data[type].map((item, index) => ({ ...item, type, index })));
  }
  function renderList() {
    const host = el('tprAdminList');
    const entries = filteredEntries();
    if (!entries.length) {
      host.innerHTML = '<p class="meta">Bu listede henüz öneri yok. Aşağıdaki formdan yeni bir dizi veya film önerisi ekleyebilirsin.</p>';
      updateSummary();
      return;
    }
    host.innerHTML = entries.map(item => `<article class="tech-admin-item">
      <div class="tech-admin-item-main"><strong>${escapeHTML(item.title)}</strong> <span class="badge">${LABELS[item.type]}</span>
        <p>${escapeHTML(item.description || 'Açıklama girilmemiş.')}</p>
        <a href="${escapeHTML(item.url)}" target="_blank" rel="noopener noreferrer">Technopat konusunu aç ↗</a>
        ${item.image ? `<p class="meta">Kapak görseli: ${escapeHTML(item.image)}</p>` : ''}
      </div>
      <div class="tech-admin-actions"><button class="btn" type="button" data-tpr-edit="${escapeHTML(item.id)}" data-tpr-type="${item.type}">Düzenle</button><button class="btn" type="button" data-tpr-delete="${escapeHTML(item.id)}" data-tpr-type="${item.type}">Sil</button></div>
    </article>`).join('');
    updateSummary();
  }
  function markDirty(message = 'Taslak değiştirildi. Değişiklikleri yayına almak için GitHub’a kaydet.') {
    dirty = true;
    updateSummary();
    status(message, 'dirty');
  }
  function clearForm() {
    editing = null;
    el('tprFormType').value = 'films';
    el('tprFormTitle').value = '';
    el('tprFormDescription').value = '';
    el('tprFormUrl').value = '';
    el('tprFormImage').value = '';
    el('tprFormHeading').textContent = 'Yeni dizi veya film önerisi';
    el('tprApplyBtn').textContent = 'Öneriyi ekle';
    el('tprCancelEditBtn').hidden = true;
  }
  function validate(item) {
    if (!TYPES.includes(item.type)) return 'İçerik türünü seç.';
    if (!item.title) return 'Başlık zorunludur.';
    if (item.title.length > 180) return 'Başlık 180 karakterden kısa olmalı.';
    if (item.description.length > 700) return 'Açıklama 700 karakterden uzun olamaz.';
    if (!item.url) return 'Technopat konu bağlantısı zorunludur.';
    if (!safeForumURL(item.url)) return 'Bağlantı HTTPS kullanmalı ve technopat.net alan adına ait olmalı.';
    if (item.image && !safeImageURL(item.image)) return 'Kapak görseli http:// veya https:// ile başlayan geçerli bir adres olmalı.';
    return '';
  }
  async function load(force = false) {
    if (loaded && !force) { renderList(); return; }
    if (force && dirty && !confirm('GitHub’dan yeniden yüklemek kaydedilmemiş öneri değişikliklerini silecek. Devam edilsin mi?')) return;
    if (typeof tok !== 'function' || !tok()) { status('Bu bölümü kullanmak için yönetim paneline tekrar giriş yap.', 'error'); return; }
    const button = el('tprLoadBtn');
    button.disabled = true;
    status(`${PATH} GitHub deposundan yükleniyor…`);
    try {
      const file = await getRepoFile(PATH);
      sha = file?.sha || null;
      data = file ? normalize(JSON.parse(b64ToStr(file.content))) : { films: [], series: [] };
      loaded = true;
      dirty = false;
      clearForm();
      renderList();
      status(file ? 'Technopat dizi ve film önerileri GitHub’dan yüklendi.' : 'Öneri dosyası henüz yok. İlk kaydetme işlemi dosyayı oluşturacak.', 'success');
    } catch (error) {
      status(`Öneriler yüklenemedi: ${error.message}${typeof hint === 'function' ? hint(error.status) : ''}`, 'error');
    } finally { button.disabled = false; }
  }

  el('tprLoadBtn')?.addEventListener('click', () => load(true));
  el('tprListType')?.addEventListener('change', renderList);
  el('tprClearBtn')?.addEventListener('click', clearForm);
  el('tprCancelEditBtn')?.addEventListener('click', clearForm);
  el('tprApplyBtn')?.addEventListener('click', () => {
    if (!loaded) { status('Önce GitHub’dan Getir / Yenile düğmesiyle mevcut listeyi yükle.', 'error'); return; }
    const item = {
      type: el('tprFormType').value,
      title: el('tprFormTitle').value.trim(),
      description: el('tprFormDescription').value.trim(),
      url: el('tprFormUrl').value.trim(),
      image: el('tprFormImage').value.trim()
    };
    const error = validate(item);
    if (error) { status(error, 'error'); return; }
    const duplicate = data[item.type].find(entry => entry.title.toLocaleLowerCase('tr-TR') === item.title.toLocaleLowerCase('tr-TR') && entry.id !== editing?.id);
    if (duplicate) { status('Bu başlık aynı kategoride zaten bulunuyor. Mevcut kaydı düzenleyebilirsin.', 'error'); return; }
    const now = new Date().toISOString();
    if (editing) {
      const previousType = editing.type;
      const previousIndex = data[previousType].findIndex(entry => entry.id === editing.id);
      if (previousIndex < 0) { status('Düzenlenecek kayıt bulunamadı. Listeyi yenile.', 'error'); clearForm(); return; }
      const previous = data[previousType][previousIndex];
      data[previousType].splice(previousIndex, 1);
      const updated = { ...previous, title: item.title, description: item.description, url: item.url, image: safeImageURL(item.image), updatedAt: now };
      data[item.type].unshift(updated);
      status('Öneri güncellendi. Değişiklik henüz GitHub’a kaydedilmedi.', 'dirty');
    } else {
      data[item.type].unshift({ id: makeId(), title: item.title, description: item.description, url: item.url, image: safeImageURL(item.image), createdAt: now, updatedAt: now });
      status('Öneri taslağa eklendi. Yayına almak için GitHub’a kaydet.', 'dirty');
    }
    dirty = true;
    el('tprListType').value = item.type;
    clearForm();
    renderList();
  });
  el('tprAdminList')?.addEventListener('click', event => {
    const editButton = event.target.closest('[data-tpr-edit]');
    if (editButton) {
      const type = editButton.dataset.tprType;
      const item = data[type]?.find(entry => entry.id === editButton.dataset.tprEdit);
      if (!item) return;
      editing = { type, id: item.id };
      el('tprFormType').value = type;
      el('tprFormTitle').value = item.title;
      el('tprFormDescription').value = item.description;
      el('tprFormUrl').value = item.url;
      el('tprFormImage').value = item.image || '';
      el('tprFormHeading').textContent = 'Öneriyi düzenle';
      el('tprApplyBtn').textContent = 'Değişiklikleri uygula';
      el('tprCancelEditBtn').hidden = false;
      el('tprEditorPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
      el('tprFormTitle').focus();
      return;
    }
    const deleteButton = event.target.closest('[data-tpr-delete]');
    if (deleteButton) {
      const type = deleteButton.dataset.tprType;
      const item = data[type]?.find(entry => entry.id === deleteButton.dataset.tprDelete);
      if (!item || !confirm(`“${item.title}” öneriler arasından kaldırılsın mı?`)) return;
      data[type] = data[type].filter(entry => entry.id !== item.id);
      if (editing?.id === item.id) clearForm();
      markDirty(`“${item.title}” taslaktan kaldırıldı. Değişiklik henüz GitHub’a kaydedilmedi.`);
      renderList();
    }
  });
  el('tprSaveBtn')?.addEventListener('click', async () => {
    if (typeof tok !== 'function' || !tok()) { status('Kaydetmek için yönetim paneline tekrar giriş yap.', 'error'); return; }
    if (!loaded) { status('Önce GitHub’dan Getir / Yenile düğmesine bas.', 'error'); return; }
    if (!dirty) { status('Kaydedilecek bir değişiklik yok.', 'success'); return; }
    const invalid = [];
    for (const type of TYPES) data[type].forEach((item, index) => {
      const error = validate({ ...item, type });
      if (error) invalid.push(`${LABELS[type]} ${index + 1}. kayıt: ${error}`);
    });
    if (invalid.length) { status(`Kaydetmeden önce hataları düzelt: ${invalid.slice(0, 4).join(' ')}`, 'error'); return; }
    const button = el('tprSaveBtn');
    button.disabled = true;
    status('Öneriler GitHub’a kaydediliyor…');
    try {
      const nextSha = await putRepoFile(PATH, JSON.stringify(data, null, 2), 'Technopat dizi ve film önerileri güncellendi', sha);
      if (!nextSha) throw new Error('GitHub yeni dosya SHA değeri döndürmedi.');
      sha = nextSha;
      dirty = false;
      updateSummary();
      status('Öneriler GitHub’a kaydedildi. Yayına yansıması birkaç dakika sürebilir.', 'success');
    } catch (error) {
      status(`Öneriler kaydedilemedi: ${error.message}${typeof hint === 'function' ? hint(error.status) : ''}`, 'error');
    } finally { button.disabled = false; }
  });

  window.loadTechnopatRecommendationsAdmin = load;
})();
