/* Yönetim paneli — kişisel öneriler listesi */
(() => {
  'use strict';
  const PATH = 'data/recommendations.json';
  const KEYS = ['oyun', 'film', 'dizi', 'anime'];
  const LABELS = { oyun: 'Oyun', film: 'Film', dizi: 'Dizi', anime: 'Anime' };
  let items = [];
  let archives = { oyun: [], film: [], dizi: [], anime: [] };
  let sha = null;
  let loaded = false;
  let dirty = false;
  let editingId = null;
  const el = id => document.getElementById(id);
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);
  const safeImage = value => {
    try { const url = new URL(String(value || '')); return /^https?:$/.test(url.protocol) ? url.href : ''; }
    catch (_) { return ''; }
  };
  const formatScore = value => Number(value).toLocaleString('tr-TR', { maximumFractionDigits: 1 });
  const newId = () => `rec-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

  function status(message, state = 'info') {
    const box = el('recAdminStatus');
    if (!box) return;
    box.textContent = message;
    box.dataset.state = state;
  }
  function normalize(raw) {
    if (!Array.isArray(raw)) throw new Error('Öneriler dosyası bir JSON listesi olmalı.');
    const seen = new Set();
    return raw.map((entry, index) => {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) throw new Error(`${index + 1}. öneri kaydı geçersiz.`);
      const category = String(entry.category || '');
      const score = Number(entry.score);
      const title = String(entry.title || '').trim();
      const review = String(entry.review || '').trim();
      const id = String(entry.id || newId());
      if (!KEYS.includes(category)) throw new Error(`${index + 1}. önerinin kategorisi geçersiz.`);
      if (!title || !review) throw new Error(`${index + 1}. öneride başlık veya değerlendirme boş.`);
      if (!Number.isFinite(score) || score < 0 || score > 10) throw new Error(`${index + 1}. önerinin puanı 0 ile 10 arasında olmalı.`);
      if (seen.has(id)) throw new Error(`Aynı öneri kimliği birden fazla kullanılmış: ${id}`);
      seen.add(id);
      return {
        id, category, itemId: String(entry.itemId || ''), title,
        image: safeImage(entry.image), score, review,
        createdAt: String(entry.createdAt || new Date().toISOString()),
        updatedAt: String(entry.updatedAt || entry.createdAt || new Date().toISOString())
      };
    }).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  }
  function updateSummary() {
    if (el('recSummary')) el('recSummary').textContent = `${items.length} öneri${dirty ? ' · Kaydedilmemiş değişiklik' : ''}`;
    if (el('recListCount')) el('recListCount').textContent = `${items.length} öneri`;
  }
  function getArchive(category, id) {
    return (archives[category] || []).find(record => String(record.id) === String(id));
  }
  function populateArchiveOptions(selectedId = '') {
    const category = el('recCategory')?.value || 'oyun';
    const select = el('recArchiveItem');
    if (!select) return;
    const records = [...(archives[category] || [])].filter(item => item && item.id !== undefined && item.id !== null)
      .sort((a, b) => String(a.title || '').localeCompare(String(b.title || ''), 'tr'));
    select.innerHTML = '<option value="">Bir yapım seç</option>' + records.map(item => {
      const suffix = item.year ? ` · ${item.year}` : '';
      return `<option value="${escapeHtml(item.id)}">${escapeHtml(String(item.title || 'Başlıksız içerik') + suffix)}</option>`;
    }).join('');
    select.value = String(selectedId || '');
    if (selectedId && select.value !== String(selectedId)) {
      select.insertAdjacentHTML('beforeend', `<option value="${escapeHtml(selectedId)}" selected>Arşiv kaydı bulunamadı · ${escapeHtml(selectedId)}</option>`);
      select.value = String(selectedId);
    }
    if (!records.length) select.innerHTML = '<option value="">Bu kategoride arşiv kaydı bulunamadı</option>';
  }
  function renderList() {
    const host = el('recAdminList');
    if (!host) return;
    if (!items.length) {
      host.innerHTML = '<p class="meta">Henüz öneri eklenmedi. Yukarıdaki formdan ilk önerini oluşturabilirsin.</p>';
      updateSummary();
      return;
    }
    host.innerHTML = items.map(item => {
      const image = safeImage(item.image);
      const cover = image ? `<img src="${escapeHtml(image)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : '<span class="rec-admin-item__placeholder" aria-hidden="true"></span>';
      return `<article class="rec-admin-item" data-rec-row="${escapeHtml(item.id)}">
        ${cover}
        <div class="rec-admin-item__copy">
          <strong>${escapeHtml(item.title)}</strong>
          <small>${LABELS[item.category]} · <span class="rec-admin-item__score">★ ${formatScore(item.score)} / 10</span></small>
          <p>${escapeHtml(item.review)}</p>
        </div>
        <div class="rec-admin-item__actions">
          <button class="btn" type="button" data-rec-edit="${escapeHtml(item.id)}">Düzenle</button>
          <button class="btn del" type="button" data-rec-remove="${escapeHtml(item.id)}">Kaldır</button>
        </div>
      </article>`;
    }).join('');
    updateSummary();
  }
  function markDirty(message) {
    dirty = true;
    updateSummary();
    status(message || 'Değişiklikler henüz GitHub’a kaydedilmedi.', 'dirty');
  }
  function resetForm() {
    editingId = null;
    el('recCategory').value = 'oyun';
    populateArchiveOptions();
    el('recScore').value = '';
    el('recReview').value = '';
    el('recFormHeading').textContent = 'Yeni öneri ekle';
    el('recAddBtn').textContent = '+ Önerilere ekle';
    el('recCancelEditBtn').hidden = true;
  }
  async function readArchiveFile(repoFile, category) {
    if (!repoFile) return [];
    let parsed;
    try { parsed = JSON.parse(b64ToStr(repoFile.content)); }
    catch (_) { throw new Error(`${LABELS[category]} arşiv dosyası okunamadı.`); }
    if (!Array.isArray(parsed)) throw new Error(`${LABELS[category]} arşiv dosyası liste biçiminde değil.`);
    return parsed;
  }
  async function load(force = false) {
    if (loaded && !force) { renderList(); return; }
    if (force && dirty && !confirm('GitHub’dan yeniden yüklemek kaydedilmemiş öneri değişikliklerini silecek. Devam edilsin mi?')) return;
    if (typeof tok !== 'function' || !tok()) { status('Bu bölümü kullanmak için yönetim paneline tekrar giriş yap.', 'error'); return; }
    const button = el('recLoadBtn');
    button.disabled = true;
    status('Öneri listesi ve arşiv kayıtları GitHub’dan yükleniyor…');
    try {
      const [recommendationFile, ...archiveFiles] = await Promise.all([
        getRepoFile(PATH), ...KEYS.map(key => getRepoFile(CATS[key].file))
      ]);
      const nextArchives = {};
      for (let index = 0; index < KEYS.length; index++) nextArchives[KEYS[index]] = await readArchiveFile(archiveFiles[index], KEYS[index]);
      archives = nextArchives;
      sha = recommendationFile?.sha || null;
      items = recommendationFile ? normalize(JSON.parse(b64ToStr(recommendationFile.content))) : [];
      loaded = true;
      dirty = false;
      resetForm();
      renderList();
      status(recommendationFile ? 'Öneriler ve mevcut arşiv kayıtları GitHub’dan yüklendi.' : 'Öneri dosyası henüz oluşturulmamış. İlk kaydetme işlemi dosyayı oluşturacak.', 'success');
    } catch (error) {
      status(`Öneriler yüklenemedi: ${error.message}${typeof hint === 'function' ? hint(error.status) : ''}`, 'error');
    } finally {
      button.disabled = false;
    }
  }

  el('recLoadBtn')?.addEventListener('click', () => load(true));
  el('recCategory')?.addEventListener('change', () => populateArchiveOptions());
  el('recArchiveItem')?.addEventListener('change', event => {
    const record = getArchive(el('recCategory').value, event.target.value);
    if (record && record.score !== null && record.score !== undefined && record.score !== '' && Number.isFinite(Number(record.score))) {
      el('recScore').value = String(record.score);
    }
  });
  el('recAddBtn')?.addEventListener('click', () => {
    if (!loaded) { status('Önce GitHub’dan Getir düğmesiyle arşivleri yükle.', 'error'); return; }
    const category = el('recCategory').value;
    const itemId = el('recArchiveItem').value;
    const record = getArchive(category, itemId);
    const rawScore = el('recScore').value.trim();
    const score = rawScore === '' ? NaN : Number(rawScore);
    const review = el('recReview').value.trim();
    if (!record) { status('Önce arşivinden önermek istediğin yapımı seç.', 'error'); el('recArchiveItem').focus(); return; }
    if (!Number.isFinite(score) || score < 0 || score > 10) { status('Puan 0 ile 10 arasında olmalı.', 'error'); el('recScore').focus(); return; }
    if (!review) { status('Kartta gösterilecek değerlendirmeyi yaz.', 'error'); el('recReview').focus(); return; }
    if (review.length > 1800) { status('Değerlendirme 1800 karakterden uzun olamaz.', 'error'); el('recReview').focus(); return; }
    const duplicate = items.find(item => item.category === category && item.itemId === String(itemId) && item.id !== editingId);
    if (duplicate) { status('Bu yapım öneriler listesinde zaten bulunuyor. Mevcut kaydı düzenleyebilirsin.', 'error'); return; }
    const now = new Date().toISOString();
    if (editingId) {
      const index = items.findIndex(item => item.id === editingId);
      if (index < 0) { status('Düzenlenecek öneri bulunamadı. Listeyi yenile.', 'error'); return; }
      const previous = items[index];
      items[index] = { ...previous, category, itemId: String(itemId), title: String(record.title || 'Başlıksız içerik'), image: safeImage(record.image), score, review, updatedAt: now };
      status('Öneri güncellendi. Ziyaretçilere yansıtmak için GitHub’a kaydet.', 'dirty');
    } else {
      items.unshift({ id: newId(), category, itemId: String(itemId), title: String(record.title || 'Başlıksız içerik'), image: safeImage(record.image), score, review, createdAt: now, updatedAt: now });
      status('Öneri listeye eklendi. Ziyaretçilere yansıtmak için GitHub’a kaydet.', 'dirty');
    }
    dirty = true;
    resetForm();
    renderList();
    updateSummary();
  });
  el('recCancelEditBtn')?.addEventListener('click', resetForm);
  el('recAdminList')?.addEventListener('click', event => {
    const editButton = event.target.closest('[data-rec-edit]');
    if (editButton) {
      const item = items.find(entry => entry.id === editButton.dataset.recEdit);
      if (!item) return;
      editingId = item.id;
      el('recCategory').value = item.category;
      populateArchiveOptions(item.itemId);
      el('recScore').value = String(item.score);
      el('recReview').value = item.review;
      el('recFormHeading').textContent = 'Öneriyi düzenle';
      el('recAddBtn').textContent = 'Değişiklikleri uygula';
      el('recCancelEditBtn').hidden = false;
      el('recEditorPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    const removeButton = event.target.closest('[data-rec-remove]');
    if (removeButton) {
      const item = items.find(entry => entry.id === removeButton.dataset.recRemove);
      if (!item || !confirm(`“${item.title}” öneriler listesinden kaldırılsın mı?`)) return;
      items = items.filter(entry => entry.id !== item.id);
      if (editingId === item.id) resetForm();
      markDirty(`“${item.title}” öneriler listesinden kaldırıldı. Değişikliği GitHub’a kaydetmelisin.`);
      renderList();
    }
  });
  el('recSaveBtn')?.addEventListener('click', async () => {
    if (!loaded) { status('Önce GitHub’dan Getir düğmesiyle önerileri yükle.', 'error'); return; }
    if (typeof tok !== 'function' || !tok()) { status('Kaydetmek için yönetim paneline tekrar giriş yap.', 'error'); return; }
    if (!dirty) { status('Kaydedilecek yeni bir değişiklik yok.', 'success'); return; }
    const button = el('recSaveBtn');
    button.disabled = true;
    status('Öneriler GitHub’a kaydediliyor…');
    try {
      const nextSha = await putRepoFile(PATH, JSON.stringify(items, null, 2), 'Öneriler listesi yönetim panelinden güncellendi', sha);
      if (!nextSha) throw new Error('GitHub yeni dosya SHA değeri döndürmedi.');
      sha = nextSha;
      dirty = false;
      status('Öneriler GitHub’a kaydedildi. Sayfaya yansıması birkaç dakika sürebilir.', 'success');
      updateSummary();
    } catch (error) {
      status(`Öneriler kaydedilemedi: ${error.message}${typeof hint === 'function' ? hint(error.status) : ''}`, 'error');
    } finally {
      button.disabled = false;
    }
  });
  document.querySelector('[data-tab="recommendations"]')?.addEventListener('click', () => {
    if (!loaded) load(false);
  });
})();
