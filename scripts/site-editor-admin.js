/* Günlüğüm — merkezi site düzenleyici. Tüm ayarlar data/site-settings.json dosyasında tutulur. */
(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
  const C = window.CONFIG || {};
  const CATS = window.CATS || {};
  const PATH = 'data/site-settings.json';
  const API = `https://api.github.com/repos/${encodeURIComponent(C.owner || '')}/${encodeURIComponent(C.repo || '')}/contents/`;
  const token = () => { try { return sessionStorage.getItem('gh_t') || ''; } catch (_) { return ''; } };
  const headers = () => ({ Authorization: `Bearer ${token()}`, Accept: 'application/vnd.github+json' });
  const encode = value => {
    const bytes = new TextEncoder().encode(value);
    let binary = '';
    bytes.forEach(byte => { binary += String.fromCharCode(byte); });
    return btoa(binary);
  };
  const decode = value => new TextDecoder().decode(Uint8Array.from(atob(String(value).replace(/\s/g, '')), char => char.charCodeAt(0)));
  const defaultSettings = () => ({
    version: 1,
    site: { title: 'Günlüğüm', tagline: 'Oynadığım, izlediğim her şey tek yerde.', introText: 'Oyunlarımı ve izlediğim yapımları tek yerde topluyor, kendi arşivimi keşfediyorum.' },
    home: {
      collectionsEyebrow:'KOLEKSİYONLARIM', collectionsTitle:'Kategorilere göz at', toolsEyebrow:'KEŞFET VE YÖNET', toolsTitle:'Arşiv araçları', toolsDescription:'Arşivini analiz et, içeriklerini bul, yaratıcıları keşfet ve önerilerimi incele.',
      yearlyFavoritesKicker:'YILLAR İÇİNDEKİ FAVORİLERİM', yearlyFavoritesTitle:'Yıllara göre favorilerim', yearlyFavoritesDescription:'Her yılın bende iz bırakan oyunları, filmleri, dizileri ve animeleri.',
      technopatKicker:'TECHNOPAT SOSYAL', technopatTitle:"Technopat'taki yazılarım", technopatDescription:"İncelemelerimi, rehberlerimi ve Technopat'ta yayımladığım dizi-film yazılarını tek yerde keşfet.",
      recentKicker:'ARŞİVE YENİ EKLENENLER', recentTitle:'Son eklenenler', recentDescription:'Arşivime en son eklediğim oyunları ve yapımları keşfet.',
      statsCardTitle:'Arşiv istatistiklerim',statsCardDescription:'Puanlarını, tamamladığın yapımları ve izleme/oynama sürelerini incele.',statsCardAction:'İstatistikleri görüntüle',
      searchCardTitle:'Gelişmiş arama',searchCardDescription:'Tür, puan, durum, yıl ve platform filtreleriyle aradığın kayda ulaş.',searchCardAction:'Arşivde ara',
      peopleCardTitle:'Kişiler ve stüdyolar',peopleCardDescription:'Oyun geliştiricilerini, yönetmenleri ve sevdiğin yapımların arkasındaki ekipleri keşfet.',peopleCardAction:'Profilleri keşfet',
      recommendationsCardTitle:'Önerilerim',recommendationsCardDescription:'Beğendiğim oyunları, filmleri, dizileri ve animeleri kendi puanım ve değerlendirmemle keşfet.',recommendationsCardAction:'Önerilerimi görüntüle',
      technopatReviewsCardTitle:'İncelemeler',technopatReviewsCardDescription:'Deneyimlerim, değerlendirmelerim ve puanladığım yapımlar.',
      technopatGuidesCardTitle:'Rehberler',technopatGuidesCardDescription:'Oyunlar ve teknoloji hakkında hazırladığım yol gösterici içerikler.',
      technopatMediaCardTitle:'Dizi ve Film İncelemelerim',technopatMediaCardDescription:'Technopat Sosyal üzerinde yayımladığım dizi ve film incelemeleri.'
    },
    pages: { statsTitle:'Arşiv İstatistikleri', recommendationsTitle:'Önerilerim', technopatMediaTitle:'Dizi ve Film İncelemelerim', technopatReviewsTitle:'Technopat İncelemelerim', technopatGuidesTitle:'Technopat Rehberlerim', peopleTitle:'Kişiler ve Stüdyolar', searchTitle:'Gelişmiş Arama', giveawayTitle:'Çekiliş Arenası', costTitle:'Oyun Maliyeti ve Kütüphane' },
    homeVisibility: { intro:true, collections:true, yearlyFavorites:true, tools:true, technopat:true, recent:true },
    coreCategories: {
      oyun:{plural:'Oyunlar',title:'Oyunlarım',description:'Oynadığım oyunlar, puanlarım ve incelemelerim',soon:'Yakında bitireceklerim',visible:true},
      film:{plural:'Filmler',title:'Filmlerim',description:'İzlediğim filmler, puanlarım ve yorumlarım',soon:'Şu an izlediklerim',visible:true},
      dizi:{plural:'Diziler',title:'Dizilerim',description:'İzlediğim diziler, puanlarım ve yorumlarım',soon:'Şu an izlediklerim',visible:true},
      anime:{plural:'Animeler',title:'Animelerim',description:'İzlediğim animeler, puanlarım ve yorumlarım',soon:'Şu an izlediklerim',visible:true}
    },
    navigation: [
      {id:'home',label:'Ana sayfa',href:'/',enabled:true,builtin:true},{id:'oyun',label:'Oyunlar',href:'/oyun/',enabled:true,builtin:true},{id:'film',label:'Filmler',href:'/film/',enabled:true,builtin:true},{id:'dizi',label:'Diziler',href:'/dizi/',enabled:true,builtin:true},{id:'anime',label:'Anime',href:'/anime/',enabled:true,builtin:true},{id:'technopat',label:'Yazılarım',href:'/technopat/incelemeler/',enabled:true,builtin:true},{id:'tech-media-reviews',label:'Dizi/Film incelemelerim',href:'/technopat/dizi-film-incelemeleri/',enabled:true,builtin:true},{id:'stats',label:'İstatistik',href:'/istatistik/',enabled:true,builtin:true},{id:'people',label:'Kişiler',href:'/kisiler/',enabled:true,builtin:true},{id:'recommendations',label:'Önerilerim',href:'/oneriler/',enabled:true,builtin:true},{id:'giveaway',label:'Çekiliş',href:'/cekilis/',enabled:true,builtin:true},{id:'search',label:'Arama',href:'/ara/',enabled:true,builtin:true}
    ], customCategories: []
  });
  let settings = defaultSettings(), settingsSha = null, loaded = false, dirty = false;
  let editingSlug = null, pendingItems = [], archiveCache = {};

  const status = (message, state = 'info') => {
    const node = $('#siteEditorStatus');
    if (!node) return;
    node.textContent = message;
    node.dataset.state = state;
  };
  const markDirty = message => { dirty = true; status(message || 'Taslakta kaydedilmemiş değişiklikler var.', 'dirty'); };
  async function getFile(path) {
    const response = await fetch(`${API}${path}?ref=${encodeURIComponent(C.branch || 'main')}`, { headers: headers(), cache: 'no-store' });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`GitHub ${response.status}: ${(await response.json().catch(() => ({}))).message || 'Dosya okunamadı.'}`);
    return response.json();
  }
  async function putFile(path, content, message, knownSha) {
    let sha = knownSha || null;
    for (let attempt = 0; attempt < 2; attempt++) {
      if (!sha) { const existing = await getFile(path); sha = existing && existing.sha; }
      const body = { message, content: encode(content), branch: C.branch || 'main' };
      if (sha) body.sha = sha;
      const response = await fetch(`${API}${path}`, { method: 'PUT', headers: headers(), body: JSON.stringify(body) });
      if (response.ok) return response.json();
      if ((response.status === 409 || response.status === 422) && attempt === 0) { sha = null; continue; }
      throw new Error(`GitHub ${response.status}: ${(await response.json().catch(() => ({}))).message || 'Kayıt yapılamadı.'}`);
    }
  }
  function mergeDefaults(raw) {
    const defaults = defaultSettings();
    const result = { ...defaults, ...(raw || {}) };
    result.site = { ...defaults.site, ...(raw?.site || {}) };
    result.home = { ...defaults.home, ...(raw?.home || {}) };
    result.pages = { ...defaults.pages, ...(raw?.pages || {}) };
    result.homeVisibility = { ...defaults.homeVisibility, ...(raw?.homeVisibility || {}) };
    result.coreCategories = { ...defaults.coreCategories, ...(raw?.coreCategories || {}) };
    Object.keys(defaults.coreCategories).forEach(key => { result.coreCategories[key] = { ...defaults.coreCategories[key], ...(raw?.coreCategories?.[key] || {}) }; });
    result.navigation = Array.isArray(raw?.navigation) ? raw.navigation : defaults.navigation;
    result.customCategories = Array.isArray(raw?.customCategories) ? raw.customCategories : [];
    result.customTextOverrides = Array.isArray(raw?.customTextOverrides) ? raw.customTextOverrides : [];
    return result;
  }
  function input(id, value) { const node = $('#'+id); if (node) node.value = value ?? ''; }
  function populateForm() {
    input('seSiteTitle', settings.site.title); input('seTagline', settings.site.tagline); input('seIntroText', settings.site.introText);
    Object.keys(settings.home).forEach(key => input('se'+key[0].toUpperCase()+key.slice(1), settings.home[key]));
    const pageMap = { statsTitle:'StatsTitle', recommendationsTitle:'RecommendationsTitle', technopatMediaTitle:'TechnopatMediaTitle', technopatReviewsTitle:'TechnopatReviewsTitle', technopatGuidesTitle:'TechnopatGuidesTitle', peopleTitle:'PeopleTitle', searchTitle:'SearchTitle', giveawayTitle:'GiveawayTitle', costTitle:'CostTitle' };
    Object.entries(pageMap).forEach(([key, suffix]) => input('se'+suffix, settings.pages[key]));
    Object.entries(settings.homeVisibility).forEach(([key, visible]) => { const node = $('#seHomeVisibility'+key[0].toUpperCase()+key.slice(1)); if (node) node.checked = visible !== false; });
    renderCoreCategories(); renderNavigation(); renderCustomCategories(); renderTextOverrides();
  }
  function renderCoreCategories() {
    const host = $('#siteCoreCategoryEditor'); if (!host) return;
    host.innerHTML = Object.entries(CATS).map(([key, cfg]) => {
      const item = settings.coreCategories[key] || {};
      return `<article class="site-core-category" data-core-category="${esc(key)}">
        <div class="site-core-category-top"><strong>${esc(cfg.name || key)} arşivi</strong><label class="site-inline-toggle"><input type="checkbox" data-core-field="visible" ${item.visible !== false ? 'checked' : ''}> Sitede göster</label></div>
        <div class="f">
          <label>Kategori adı<input data-core-field="plural" value="${esc(item.plural || cfg.plural)}" maxlength="60"></label>
          <label>Sayfa başlığı<input data-core-field="title" value="${esc(item.title || cfg.title)}" maxlength="80"></label>
          <label>Aktif takip başlığı<input data-core-field="soon" value="${esc(item.soon || cfg.soon)}" maxlength="80"></label>
          <label class="wide">Kategori açıklaması<input data-core-field="description" value="${esc(item.description || cfg.desc)}" maxlength="220"></label>
        </div>
      </article>`;
    }).join('');
  }
  function renderNavigation() {
    const host = $('#siteNavigationList'); if (!host) return;
    host.innerHTML = settings.navigation.map((item, index) => `<div class="site-nav-editor-row" data-nav-index="${index}">
      <label>Menü adı<input data-nav-field="label" value="${esc(item.label)}" maxlength="60"></label>
      <label>Bağlantı<input data-nav-field="href" value="${esc(item.href)}" maxlength="240"></label>
      <label class="site-inline-toggle"><input type="checkbox" data-nav-field="enabled" ${item.enabled !== false ? 'checked' : ''}> Görünür</label>
      <div class="site-nav-row-actions"><button class="btn" type="button" data-nav-up="1" title="Yukarı taşı" ${index===0?'disabled':''}>↑</button><button class="btn" type="button" data-nav-down="1" title="Aşağı taşı" ${index===settings.navigation.length-1?'disabled':''}>↓</button>${item.builtin ? '<span class="site-builtin-tag">Hazır</span>' : '<button class="btn del" type="button" data-nav-delete="1">Sil</button>'}</div>
    </div>`).join('') || '<p class="meta">Henüz menü bağlantısı yok.</p>';
  }
  function renderTextOverrides() {
    const host = $('#siteTextOverridesList'); if (!host) return;
    const list = settings.customTextOverrides || [];
    host.innerHTML = list.length ? list.map((item, index) => `<div class="site-text-override-row" data-text-override-index="${index}"><label>Element ID<input data-override-field="id" value="${esc(item.id)}" placeholder="Örn. recentTitle"></label><label>Görünen metin<input data-override-field="text" value="${esc(item.text)}" placeholder="Yeni başlık"></label><button class="btn del" type="button" data-override-delete="1">Sil</button></div>`).join('') : '<p class="meta">Henüz özel metin kuralı yok. Sayfadaki benzersiz bir HTML element ID\'si ile ek başlıkları değiştirebilirsin.</p>';
  }
  function renderCustomCategories() {
    const host = $('#siteCustomCategoryList'); if (!host) return;
    const list = settings.customCategories;
    $('#siteCustomCategoryCount').textContent = `${list.length} kategori`;
    host.innerHTML = list.length ? list.map(item => `<article class="site-custom-category-card">
      <div><strong>${esc(item.title)}</strong><span class="site-custom-category-slug">/koleksiyon/?kategori=${esc(item.slug)}</span><p>${esc(item.description || 'Açıklama yok')} · ${(item.items || []).length} içerik</p><div class="site-editor-checks compact"><span>${item.showInHome ? 'Ana sayfada' : 'Ana sayfada gizli'}</span><span>${item.showInNav ? 'Menüde' : 'Menüde gizli'}</span></div></div>
      <div class="site-nav-row-actions"><button class="btn" type="button" data-collection-edit="${esc(item.slug)}">Düzenle</button><button class="btn del" type="button" data-collection-delete="${esc(item.slug)}">Sil</button></div>
    </article>`).join('') : '<p class="meta">Henüz özel kategori oluşturulmadı. İlk koleksiyonunu aşağıdaki formdan ekleyebilirsin.</p>';
  }
  async function loadArchive(category) {
    if (archiveCache[category]) return archiveCache[category];
    const cfg = CATS[category];
    if (!cfg) return [];
    try {
      const file = await getFile(cfg.file);
      const list = file ? JSON.parse(decode(file.content)) : [];
      archiveCache[category] = Array.isArray(list) ? list : [];
    } catch (error) {
      try { const response = await fetch(new URL(cfg.file, new URL('../', location.href)).href); archiveCache[category] = response.ok ? await response.json() : []; }
      catch (_) { archiveCache[category] = []; }
      if (!archiveCache[category].length) status(`${cfg.plural} arşivi yüklenemedi: ${error.message}`, 'error');
    }
    return archiveCache[category];
  }
  async function fillRecordSelect() {
    const category = $('#seRecordCategory').value;
    const list = await loadArchive(category);
    const select = $('#seRecordSelect');
    select.innerHTML = list.map(item => `<option value="${esc(item.id)}">${esc(item.title || 'Başlıksız içerik')}</option>`).join('') || '<option value="">Bu arşivde içerik yok</option>';
  }
  function renderPendingItems() {
    const host = $('#seCustomItemsList');
    if (!pendingItems.length) { host.innerHTML = '<p class="meta">Henüz içerik eklenmedi.</p>'; return; }
    host.innerHTML = pendingItems.map((entry, index) => {
      const cfg = CATS[entry.category] || {};
      const item = (archiveCache[entry.category] || []).find(record => String(record.id) === String(entry.id));
      return `<div class="site-custom-item-row"><span><b>${esc(item?.title || entry.title || 'İçerik')}</b><small>${esc(cfg.plural || entry.category)}</small></span><button class="btn del" type="button" data-pending-remove="${index}">Çıkar</button></div>`;
    }).join('');
  }
  function resetCategoryForm() {
    editingSlug = null; pendingItems = [];
    input('seCustomTitle', ''); input('seCustomSlug', ''); input('seCustomDescription', '');
    $('#seCustomShowHome').checked = true; $('#seCustomShowNav').checked = false;
    $('#siteCustomCategoryFormTitle').textContent = 'Yeni kategori oluştur'; $('#seCustomApplyBtn').textContent = 'Kategoriyi Oluştur';
    renderPendingItems();
  }
  function slugify(value) {
    return String(value || '').toLocaleLowerCase('tr').replace(/ı/g,'i').replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ş/g,'s').replace(/ö/g,'o').replace(/ç/g,'c').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,60);
  }
  function setFormFromSettings() {
    settings.site.title = $('#seSiteTitle').value.trim() || 'Günlüğüm';
    settings.site.tagline = $('#seTagline').value.trim();
    settings.site.introText = $('#seIntroText').value.trim();
    Object.keys(settings.home).forEach(key => {
      const id = 'se'+key[0].toUpperCase()+key.slice(1); const node = $('#'+id); if (node) settings.home[key] = node.value.trim();
    });
    const pageMap = { statsTitle:'seStatsTitle', recommendationsTitle:'seRecommendationsTitle', technopatMediaTitle:'seTechnopatMediaTitle', technopatReviewsTitle:'seTechnopatReviewsTitle', technopatGuidesTitle:'seTechnopatGuidesTitle', peopleTitle:'sePeopleTitle', searchTitle:'seSearchTitle', giveawayTitle:'seGiveawayTitle', costTitle:'seCostTitle' };
    Object.entries(pageMap).forEach(([key,id]) => { if ($('#'+id)) settings.pages[key] = $('#'+id).value.trim(); });
    Object.keys(settings.homeVisibility).forEach(key => { const node = $('#seHomeVisibility'+key[0].toUpperCase()+key.slice(1)); if (node) settings.homeVisibility[key] = node.checked; });
    document.querySelectorAll('[data-core-category]').forEach(card => {
      const key = card.dataset.coreCategory; const target = settings.coreCategories[key] || (settings.coreCategories[key] = {});
      card.querySelectorAll('[data-core-field]').forEach(field => { target[field.dataset.coreField] = field.type === 'checkbox' ? field.checked : field.value.trim(); });
    });
    document.querySelectorAll('[data-text-override-index]').forEach(row => {
      const item = settings.customTextOverrides[Number(row.dataset.textOverrideIndex)]; if (!item) return;
      row.querySelectorAll('[data-override-field]').forEach(field => { item[field.dataset.overrideField] = field.value.trim(); });
    });
    document.querySelectorAll('[data-nav-index]').forEach(row => {
      const item = settings.navigation[Number(row.dataset.navIndex)]; if (!item) return;
      row.querySelectorAll('[data-nav-field]').forEach(field => { item[field.dataset.navField] = field.type === 'checkbox' ? field.checked : field.value.trim(); });
    });
  }
  async function loadSettings(force = false) {
    if (loaded && !force) { populateForm(); return; }
    if (force && dirty && !confirm('GitHub’dan yeniden yüklemek kaydedilmemiş site düzenlemelerini silecek. Devam edilsin mi?')) return;
    const button = $('#siteEditorLoadBtn'); button.disabled = true; status('Site ayarları GitHub deposundan yükleniyor…');
    try {
      const file = await getFile(PATH);
      settingsSha = file?.sha || null;
      settings = mergeDefaults(file ? JSON.parse(decode(file.content)) : defaultSettings());
      loaded = true; dirty = false; resetCategoryForm(); populateForm();
      await Promise.all(Object.keys(CATS).map(loadArchive));
      await fillRecordSelect();
      status(file ? 'Site ayarları yüklendi. Düzenleyip tek seferde kaydedebilirsin.' : 'Site ayar dosyası henüz yok; ilk kayıtta oluşturulacak.', 'success');
    } catch (error) { status(`Site ayarları yüklenemedi: ${error.message}`, 'error'); }
    finally { button.disabled = false; }
  }
  async function saveSettings() {
    if (!loaded) return status('Önce GitHub’dan Getir düğmesine bas.', 'error');
    if (!token()) return status('Oturum bulunamadı. Admin paneline yeniden giriş yap.', 'error');
    setFormFromSettings();
    const navigationInvalid = settings.navigation.some(item => !item.label || !item.href);
    if (navigationInvalid) return status('Menüde adı veya bağlantısı boş bir satır var.', 'error');
    for (const item of settings.navigation) {
      if (!/^https?:\/\//i.test(item.href) && !item.href.startsWith('/')) return status(`“${item.label}” bağlantısı / ile başlamalı veya tam HTTPS adresi olmalı.`, 'error');
      if (/^https?:\/\//i.test(item.href) && !/^https:\/\//i.test(item.href)) return status('Dış menü bağlantılarında HTTPS kullan.', 'error');
    }
    const slugs = settings.customCategories.map(item => item.slug);
    if (new Set(slugs).size !== slugs.length) return status('Özel kategori adresleri birbirinden farklı olmalı.', 'error');
    const button = $('#siteEditorSaveBtn'); button.disabled = true; status('Site ayarları GitHub’a kaydediliyor…');
    try {
      const result = await putFile(PATH, JSON.stringify(settings, null, 2) + '\n', 'Site ayarları admin panelinden güncellendi', settingsSha);
      settingsSha = result?.content?.sha || settingsSha; dirty = false;
      status('Site ayarları GitHub’a kaydedildi. Yayının güncellenmesi birkaç dakika sürebilir.', 'success');
    } catch (error) { status(`Kaydetme başarısız: ${error.message}`, 'error'); }
    finally { button.disabled = false; }
  }

  $('#siteEditorLoadBtn')?.addEventListener('click', () => loadSettings(true));
  $('#siteEditorSaveBtn')?.addEventListener('click', saveSettings);
  document.querySelectorAll('#tab-site-editor input, #tab-site-editor textarea').forEach(node => node.addEventListener('input', () => { if (loaded) markDirty(); }));
  document.querySelectorAll('#tab-site-editor input[type=checkbox]').forEach(node => node.addEventListener('change', () => { if (loaded) markDirty(); }));
  document.querySelector('.tab-btn[data-tab="site-editor"]')?.addEventListener('click', () => { if (!loaded) loadSettings(false); });

  $('#siteCoreCategoryEditor')?.addEventListener('input', () => { if (loaded) markDirty(); });
  $('#siteCoreCategoryEditor')?.addEventListener('change', () => { if (loaded) markDirty(); });
  $('#siteNavigationList')?.addEventListener('input', () => { if (loaded) markDirty(); });
  $('#siteNavigationList')?.addEventListener('change', () => { if (loaded) markDirty(); });
  $('#siteNavigationList')?.addEventListener('click', event => {
    const row = event.target.closest('[data-nav-index]'); if (!row) return;
    setFormFromSettings();
    const index = Number(row.dataset.navIndex);
    const del = event.target.closest('[data-nav-delete]');
    const up = event.target.closest('[data-nav-up]');
    const down = event.target.closest('[data-nav-down]');
    if (del) {
      const item = settings.navigation[index]; if (!item || item.builtin) return;
      settings.navigation.splice(index, 1); renderNavigation(); markDirty('Özel menü bağlantısı kaldırıldı. Değişiklikleri kaydetmelisin.');
    } else if (up && index > 0) {
      [settings.navigation[index-1], settings.navigation[index]] = [settings.navigation[index], settings.navigation[index-1]];
      renderNavigation(); markDirty('Menü sırası değiştirildi.');
    } else if (down && index < settings.navigation.length - 1) {
      [settings.navigation[index+1], settings.navigation[index]] = [settings.navigation[index], settings.navigation[index+1]];
      renderNavigation(); markDirty('Menü sırası değiştirildi.');
    }
  });
  $('#seNavAddBtn')?.addEventListener('click', () => {
    if (!loaded) return status('Önce site ayarlarını yükle.', 'error');
    setFormFromSettings();
    const label = $('#seNavNewLabel').value.trim(), href = $('#seNavNewHref').value.trim();
    if (!label || !href) return status('Yeni menü bağlantısı için ad ve adres gerekli.', 'error');
    if (!/^https:\/\//i.test(href) && !href.startsWith('/')) return status('Bağlantı / ile başlamalı veya tam HTTPS adresi olmalı.', 'error');
    settings.navigation.push({ id: `custom-link-${Date.now()}`, label, href, enabled: true, builtin: false });
    input('seNavNewLabel',''); input('seNavNewHref',''); renderNavigation(); markDirty('Menü bağlantısı eklendi. GitHub’a kaydetmeyi unutma.');
  });

  $('#siteTextOverridesList')?.addEventListener('input', () => { if (loaded) markDirty(); });
  $('#siteTextOverridesList')?.addEventListener('click', event => {
    const button = event.target.closest('[data-override-delete]'); if (!button) return;
    setFormFromSettings();
    const row = button.closest('[data-text-override-index]');
    settings.customTextOverrides.splice(Number(row.dataset.textOverrideIndex), 1); renderTextOverrides(); markDirty('Özel metin kuralı kaldırıldı.');
  });
  $('#seTextOverrideAddBtn')?.addEventListener('click', () => {
    if (!loaded) return status('Önce site ayarlarını yükle.', 'error');
    const id = $('#seTextOverrideId').value.trim().replace(/^#/, ''), text = $('#seTextOverrideText').value.trim();
    if (!/^[A-Za-z][A-Za-z0-9_:.\-]*$/.test(id)) return status('Geçerli bir element ID gir. Başında # kullanmana gerek yok.', 'error');
    if (!text) return status('Yeni başlık/metin boş bırakılamaz.', 'error');
    const index = settings.customTextOverrides.findIndex(item => item.id === id);
    const item = { id, text };
    if (index >= 0) settings.customTextOverrides[index] = item; else settings.customTextOverrides.push(item);
    input('seTextOverrideId',''); input('seTextOverrideText',''); renderTextOverrides(); markDirty('Özel metin kuralı eklendi. GitHub’a kaydetmelisin.');
  });
  $('#seRecordCategory')?.addEventListener('change', fillRecordSelect);
  $('#seRecordAddBtn')?.addEventListener('click', () => {
    if (!loaded) return status('Önce site ayarlarını yükle.', 'error');
    const category = $('#seRecordCategory').value, id = $('#seRecordSelect').value;
    if (!id) return status('Eklenecek bir arşiv kaydı seç.', 'error');
    if (pendingItems.some(item => item.category === category && String(item.id) === String(id))) return status('Bu içerik koleksiyonda zaten var.', 'error');
    const record = (archiveCache[category] || []).find(item => String(item.id) === String(id));
    pendingItems.push({ category, id: String(id), title: record?.title || '' });
    renderPendingItems(); markDirty('Koleksiyon içeriği eklendi. Kategoriyi oluştur/güncelle ve ardından site ayarlarını kaydet.');
  });
  $('#seCustomItemsList')?.addEventListener('click', event => {
    const button = event.target.closest('[data-pending-remove]'); if (!button) return;
    pendingItems.splice(Number(button.dataset.pendingRemove), 1); renderPendingItems(); markDirty('Koleksiyon içeriği çıkarıldı.');
  });
  $('#siteCustomCategoryList')?.addEventListener('click', event => {
    const edit = event.target.closest('[data-collection-edit]'), del = event.target.closest('[data-collection-delete]');
    if (edit) {
      const item = settings.customCategories.find(entry => entry.slug === edit.dataset.collectionEdit); if (!item) return;
      editingSlug = item.slug; pendingItems = (item.items || []).map(entry => ({ ...entry }));
      input('seCustomTitle', item.title); input('seCustomSlug', item.slug); input('seCustomDescription', item.description);
      $('#seCustomShowHome').checked = item.showInHome !== false; $('#seCustomShowNav').checked = !!item.showInNav;
      $('#siteCustomCategoryFormTitle').textContent = 'Kategoriyi düzenle'; $('#seCustomApplyBtn').textContent = 'Değişiklikleri Uygula'; renderPendingItems();
      $('#siteCustomCategoryForm').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    if (del) {
      const slug = del.dataset.collectionDelete; const item = settings.customCategories.find(entry => entry.slug === slug); if (!item) return;
      if (!confirm(`“${item.title}” kategorisi ve içindeki koleksiyon bağlantıları silinsin mi? Ana arşiv kayıtları silinmez.`)) return;
      settings.customCategories = settings.customCategories.filter(entry => entry.slug !== slug); renderCustomCategories();
      markDirty('Özel kategori silindi. Ana arşiv kayıtların korunuyor; değişikliği GitHub’a kaydetmelisin.');
      if (editingSlug === slug) resetCategoryForm();
    }
  });
  $('#seCustomTitle')?.addEventListener('input', () => { if (!editingSlug && !$('#seCustomSlug').value.trim()) $('#seCustomSlug').value = slugify($('#seCustomTitle').value); });
  $('#seCustomApplyBtn')?.addEventListener('click', () => {
    if (!loaded) return status('Önce site ayarlarını yükle.', 'error');
    const title = $('#seCustomTitle').value.trim(), slug = slugify($('#seCustomSlug').value.trim() || title), description = $('#seCustomDescription').value.trim();
    if (!title) return status('Kategori adı boş bırakılamaz.', 'error');
    if (!slug) return status('Kategori adresi oluşturulamadı. Daha farklı bir ad dene.', 'error');
    if (settings.customCategories.some(item => item.slug === slug && item.slug !== editingSlug)) return status('Bu kategori adresi zaten kullanılıyor.', 'error');
    const item = { slug, title, description, showInHome: $('#seCustomShowHome').checked, showInNav: $('#seCustomShowNav').checked, items: pendingItems.map(entry => ({ ...entry })) };
    if (editingSlug) {
      const index = settings.customCategories.findIndex(entry => entry.slug === editingSlug);
      if (index >= 0) settings.customCategories[index] = item;
    } else settings.customCategories.push(item);
    renderCustomCategories(); resetCategoryForm(); markDirty('Özel kategori taslağa eklendi/güncellendi. Site ayarlarını GitHub’a kaydetmelisin.');
  });
  $('#seCustomClearBtn')?.addEventListener('click', resetCategoryForm);

  window.initSiteEditorAdmin = loadSettings;
})();
