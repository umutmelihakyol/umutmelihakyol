/* Yönetim paneli — yıllara göre favoriler */
(() => {
  'use strict';
  const path = 'data/yearly-favorites.json';
  const keys = ['oyun', 'dizi', 'film', 'anime'];
  const labels = { oyun: 'En sevdiğim oyun', dizi: 'En sevdiğim dizi', film: 'En sevdiğim film', anime: 'En sevdiğim anime' };
  const defaults = [2027, 2026, 2025];
  let data = { years: [] };
  let sha = null;
  let loaded = false;
  let dirty = false;
  let archives = { oyun: [], dizi: [], film: [], anime: [] };

  const el = id => document.getElementById(id);
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);
  const emptyData = () => ({ years: defaults.map(year => ({ year, favorites: { oyun: '', dizi: '', film: '', anime: '' } })) });

  function status(message, state = 'info') {
    const box = el('yfaStatus');
    if (!box) return;
    box.textContent = message;
    box.dataset.state = state;
  }

  function normalize(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Yıllık favori dosyasının en üst düzeyi nesne olmalı.');
    if (raw.years !== undefined && !Array.isArray(raw.years)) throw new Error('years alanı bir dizi olmalı.');
    const source = Array.isArray(raw.years) ? raw.years : [];
    const seen = new Set();
    const years = source.map((entry, index) => {
      const year = Number(entry?.year);
      if (!Number.isInteger(year) || year < 1900 || year > 2100) throw new Error(`${index + 1}. yıl 1900 ile 2100 arasında olmalı.`);
      if (seen.has(year)) return null;
      seen.add(year);
      const current = entry.favorites && typeof entry.favorites === 'object' && !Array.isArray(entry.favorites) ? entry.favorites : {};
      const favorites = {};
      keys.forEach(key => { favorites[key] = String(current[key] ?? '').trim(); });
      return { year, favorites };
    }).filter(Boolean).sort((a, b) => b.year - a.year);
    return { years };
  }

  function updateSummary() {
    const count = data.years.reduce((total, entry) => total + keys.filter(key => Boolean(entry.favorites[key])).length, 0);
    el('yfaSummary').textContent = `${data.years.length} yıl · ${count} favori${dirty ? ' · Kaydedilmemiş değişiklik' : ''}`;
  }

  function render() {
    const host = el('yfaYears');
    if (!host) return;
    if (!data.years.length) {
      host.innerHTML = '<div class="yfa-empty">Henüz yıl eklenmedi. Yukarıdan bir yıl ekleyebilirsin.</div>';
      updateSummary();
      return;
    }
    host.innerHTML = [...data.years].sort((a, b) => b.year - a.year).map(entry => {
      const selects = keys.map(key => {
        const options = (archives[key] || []).filter(item => item && item.id !== undefined && item.id !== null).map(item => {
          const title = String(item.title || 'Başlıksız içerik');
          const suffix = item.year ? ` · ${item.year}` : '';
          return `<option value="${escapeHtml(item.id)}" ${String(entry.favorites[key]) === String(item.id) ? 'selected' : ''}>${escapeHtml(title + suffix)}</option>`;
        }).join('');
        const selectedId = String(entry.favorites[key] || '');
        const selectedExists = !selectedId || (archives[key] || []).some(item => String(item.id) === selectedId);
        const missingOption = selectedId && !selectedExists ? `<option value="${escapeHtml(selectedId)}" selected>Arşiv kaydı bulunamadı · ${escapeHtml(selectedId)}</option>` : '';
        return `<label>${labels[key]}<select data-yfa-year="${entry.year}" data-yfa-category="${key}"><option value="">Favori seçilmedi</option>${missingOption}${options}</select></label>`;
      }).join('');
      const selectedCount = keys.filter(key => Boolean(entry.favorites[key])).length;
      return `<article class="yfa-year-card">
        <div class="yfa-year-head"><div><strong>${entry.year}</strong><small>${selectedCount} / 4 favori seçildi</small></div><button class="btn" type="button" data-yfa-remove-year="${entry.year}" aria-label="${entry.year} yılını kaldır">Yılı kaldır</button></div>
        <div class="yfa-select-grid">${selects}</div>
      </article>`;
    }).join('');
    updateSummary();
  }

  async function readJsonFile(repoFile, label) {
    if (!repoFile) return [];
    let parsed;
    try { parsed = JSON.parse(b64ToStr(repoFile.content)); }
    catch (_) { throw new Error(`${label} JSON dosyası okunamadı.`); }
    if (!Array.isArray(parsed)) throw new Error(`${label} arşiv dosyası bir liste olmalı.`);
    return parsed;
  }

  async function load(force = false) {
    if (loaded && !force) { render(); return; }
    if (force && dirty && !confirm('GitHub’dan yeniden yüklemek kaydedilmemiş yıllık favori değişikliklerini silecek. Devam edilsin mi?')) return;
    if (typeof tok !== 'function' || !tok()) { status('Bu bölümü kullanmak için yönetim paneline tekrar giriş yap.', 'error'); return; }
    const button = el('yfaLoadBtn');
    button.disabled = true;
    status('Favori listesi ve mevcut arşiv kayıtları GitHub’dan yükleniyor…');
    try {
      const [favoriteFile, ...archiveFiles] = await Promise.all([
        getRepoFile(path),
        ...keys.map(key => getRepoFile(CATS[key].file))
      ]);
      const nextArchives = {};
      for (let index = 0; index < keys.length; index++) {
        nextArchives[keys[index]] = await readJsonFile(archiveFiles[index], CATS[keys[index]].plural);
      }
      archives = nextArchives;
      sha = favoriteFile?.sha || null;
      data = favoriteFile ? normalize(JSON.parse(b64ToStr(favoriteFile.content))) : emptyData();
      loaded = true;
      dirty = false;
      render();
      status(favoriteFile ? 'Yıllık favoriler ve içerik arşivleri GitHub’dan yüklendi.' : 'Favori dosyası henüz oluşturulmamış. 2025, 2026 ve 2027 yılları hazır; ilk kayıtta dosya oluşturulacak.', 'success');
    } catch (error) {
      status(`Yıllık favoriler yüklenemedi: ${error.message}${typeof hint === 'function' ? hint(error.status) : ''}`, 'error');
    } finally {
      button.disabled = false;
    }
  }

  function markDirty(message = 'Seçim değiştirildi. Değişiklikleri ziyaretçilere yansıtmak için GitHub’a kaydet.') {
    dirty = true;
    updateSummary();
    status(message, 'dirty');
  }

  el('yfaLoadBtn')?.addEventListener('click', () => load(true));
  el('yfaAddYearBtn')?.addEventListener('click', () => {
    if (!loaded) { status('Önce GitHub’dan Getir düğmesiyle mevcut verileri yükle.', 'error'); return; }
    const year = Number(el('yfaNewYear').value);
    if (!Number.isInteger(year) || year < 1900 || year > 2100) { status('1900 ile 2100 arasında geçerli bir yıl gir.', 'error'); el('yfaNewYear').focus(); return; }
    if (data.years.some(entry => entry.year === year)) { status(`${year} yılı zaten listede bulunuyor.`, 'error'); return; }
    data.years.push({ year, favorites: { oyun: '', dizi: '', film: '', anime: '' } });
    data.years.sort((a, b) => b.year - a.year);
    dirty = true;
    render();
    markDirty(`${year} yılı eklendi. Şimdi favorilerini seçebilirsin.`);
  });

  el('yfaYears')?.addEventListener('change', event => {
    const select = event.target.closest('select[data-yfa-year][data-yfa-category]');
    if (!select) return;
    const year = Number(select.dataset.yfaYear);
    const key = select.dataset.yfaCategory;
    if (!keys.includes(key)) return;
    const entry = data.years.find(item => item.year === year);
    if (!entry) return;
    entry.favorites[key] = select.value;
    const count = keys.filter(category => Boolean(entry.favorites[category])).length;
    const note = select.value ? `${year} yılı için ${labels[key].toLocaleLowerCase('tr-TR')} seçildi.` : `${year} yılı için ${labels[key].toLocaleLowerCase('tr-TR')} kaldırıldı.`;
    const yearCard = select.closest('.yfa-year-card');
    const small = yearCard?.querySelector('.yfa-year-head small');
    if (small) small.textContent = `${count} / 4 favori seçildi`;
    markDirty(note);
  });

  el('yfaYears')?.addEventListener('click', event => {
    const button = event.target.closest('[data-yfa-remove-year]');
    if (!button) return;
    const year = Number(button.dataset.yfaRemoveYear);
    if (!confirm(`${year} yılı ve o yıla ait favori seçimleri kaldırılsın mı?`)) return;
    data.years = data.years.filter(entry => entry.year !== year);
    render();
    markDirty(`${year} yılı taslaktan kaldırıldı.`);
  });

  el('yfaSaveBtn')?.addEventListener('click', async () => {
    if (!loaded) { status('Önce GitHub’dan Getir düğmesiyle mevcut verileri yükle.', 'error'); return; }
    if (typeof tok !== 'function' || !tok()) { status('Kaydetmek için yönetim paneline tekrar giriş yap.', 'error'); return; }
    if (!dirty) { status('Kaydedilecek yeni bir değişiklik yok.', 'success'); return; }
    const years = [...data.years].sort((a, b) => b.year - a.year);
    const unique = new Set(years.map(entry => entry.year));
    if (unique.size !== years.length) { status('Aynı yıl birden fazla kez eklenmiş. Listeyi kontrol et.', 'error'); return; }
    const button = el('yfaSaveBtn');
    button.disabled = true;
    status('Yıllık favori vitrini GitHub’a kaydediliyor…');
    try {
      const nextSha = await putRepoFile(path, JSON.stringify({ years }, null, 2), 'Yıllık favoriler vitrini yönetim panelinden güncellendi', sha);
      if (!nextSha) throw new Error('GitHub yeni dosya SHA değeri döndürmedi.');
      sha = nextSha;
      data = { years };
      dirty = false;
      render();
      status('Yıllık favoriler GitHub’a kaydedildi. Anasayfaya yansıması birkaç dakika sürebilir.', 'success');
    } catch (error) {
      status(`Favoriler kaydedilemedi: ${error.message}${typeof hint === 'function' ? hint(error.status) : ''}`, 'error');
    } finally {
      button.disabled = false;
    }
  });

  document.querySelector('[data-tab="yearly-favorites"]')?.addEventListener('click', () => {
    if (!loaded) load(false);
  });
})();
