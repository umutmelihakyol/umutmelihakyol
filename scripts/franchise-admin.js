/* Admin — seri ve evren rehberleri yönetimi */
(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const PATH = 'data/franchise-guides.json';
  const CATS = window.CATS || {};
  let guides = [], games = [], sha = null, loaded = false, dirty = false, editingId = null, entries = [];
  const id = () => window.crypto?.randomUUID ? crypto.randomUUID() : `fg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
  const el = name => document.getElementById(name);
  const value = name => (el(name)?.value || '').trim();
  const status = (message, state = 'info') => { const node = el('franchiseAdminStatus'); if (node) { node.textContent = message; node.dataset.state = state; } };
  const summary = () => { const node = el('franchiseAdminSummary'); if (node) node.textContent = `${guides.length} rehber · ${guides.reduce((sum, guide) => sum + guide.entries.length, 0)} yapım${dirty ? ' · Kaydedilmemiş değişiklik' : ''}`; };
  const slugify = input => String(input || '').toLocaleLowerCase('tr-TR').replace(/ı/g,'i').replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ş/g,'s').replace(/ö/g,'o').replace(/ç/g,'c').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,70);
  const safeHttps = input => { if (!input) return ''; try { const url = new URL(input); return url.protocol === 'https:' ? url.href : ''; } catch (_) { return ''; } };
  const decode = file => JSON.parse(b64ToStr(file.content));
  const markDirty = message => { dirty = true; summary(); status(message || 'Değişiklikler taslakta. Ziyaretçilere yansıtmak için GitHub’a kaydet.', 'dirty'); };

  function normalize(raw) {
    if (!raw || typeof raw !== 'object' || !Array.isArray(raw.guides)) throw new Error('Seri rehberi dosyasının guides alanı bir liste olmalı.');
    const guideIds = new Set(), slugs = new Set();
    const result = raw.guides.map((guide, index) => {
      const title = String(guide.title || '').trim();
      const slug = slugify(guide.slug || title);
      if (!title || !slug) throw new Error(`${index + 1}. rehberin başlığı veya adresi boş.`);
      if (slugs.has(slug)) throw new Error(`“${slug}” adresi birden fazla rehberde kullanılıyor.`);
      slugs.add(slug);
      const guideId = String(guide.id || id());
      if (guideIds.has(guideId)) throw new Error(`Tekrarlanan rehber kimliği: ${guideId}`);
      guideIds.add(guideId);
      if (!Array.isArray(guide.entries)) throw new Error(`${title} rehberinin entries alanı liste olmalı.`);
      return {
        id: guideId, slug, title,
        description: String(guide.description || '').trim(),
        intro: String(guide.intro || '').trim(),
        cover: safeHttps(guide.cover),
        orderTitle: String(guide.orderTitle || 'Önerdiğim oynama sırası').trim(),
        orderNote: String(guide.orderNote || '').trim(),
        updatedAt: String(guide.updatedAt || new Date().toISOString()),
        entries: guide.entries.map((entry, entryIndex) => ({
          id: String(entry.id || id()), gameId: String(entry.gameId || ''),
          title: String(entry.title || '').trim(), year: String(entry.year || '').trim(),
          image: safeHttps(entry.image), type: String(entry.type || 'Ana oyun').trim(),
          description: String(entry.description || '').trim(), order: Number(entry.order || entryIndex + 1)
        })).filter(entry => entry.title).sort((a,b) => a.order-b.order)
      };
    });
    return result.sort((a,b) => a.title.localeCompare(b.title,'tr-TR'));
  }

  function renderEntries() {
    const host = el('franchiseAdminEntries');
    if (!entries.length) { host.innerHTML = '<div class="franchise-admin-empty">Bu rehbere henüz oyun eklenmedi.</div>'; return; }
    host.innerHTML = entries.map((entry, index) => `<article class="franchise-admin-entry" data-entry-index="${index}">
      <span class="franchise-admin-entry-num">${index + 1}</span>
      <div class="franchise-admin-entry-copy"><strong>${esc(entry.title)}</strong><small>${esc([entry.year,entry.type,entry.gameId ? 'Arşivle bağlantılı' : 'Manuel kayıt'].filter(Boolean).join(' · '))}</small>${entry.description ? `<small>${esc(entry.description)}</small>` : ''}</div>
      <div class="franchise-admin-entry-controls"><button class="btn" type="button" data-entry-up="${index}" ${index===0?'disabled':''} aria-label="Yukarı taşı">↑</button><button class="btn" type="button" data-entry-down="${index}" ${index===entries.length-1?'disabled':''} aria-label="Aşağı taşı">↓</button><button class="btn del" type="button" data-entry-remove="${index}">Çıkar</button></div>
    </article>`).join('');
  }

  function renderGuides() {
    const host = el('franchiseAdminList');
    if (!guides.length) host.innerHTML = '<div class="franchise-admin-empty">Henüz seri rehberi oluşturulmadı. İlk rehberini yukarıdaki formdan hazırlayabilirsin.</div>';
    else host.innerHTML = guides.map(guide => `<article class="franchise-admin-guide" data-guide-id="${esc(guide.id)}">
      <div class="franchise-admin-guide-cover">${guide.cover ? `<img src="${esc(guide.cover)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : ''}</div>
      <div class="franchise-admin-guide-copy"><strong>${esc(guide.title)}</strong><p>/seriler/?seri=${esc(guide.slug)} · ${guide.entries.length} yapım</p><p>${esc(guide.description || 'Açıklama eklenmemiş.')}</p></div>
      <div class="franchise-admin-guide-actions"><a class="btn" href="../seriler/?seri=${encodeURIComponent(guide.slug)}" target="_blank" rel="noopener">Önizle ↗</a><button class="btn" type="button" data-guide-edit="${esc(guide.id)}">Düzenle</button><button class="btn del" type="button" data-guide-delete="${esc(guide.id)}">Sil</button></div>
    </article>`).join('');
    summary();
  }

  function populateGameSelect(selected = '') {
    const select = el('fgEntryGame');
    const options = [...games].sort((a,b)=>String(a.title||'').localeCompare(String(b.title||''),'tr-TR')).map(game => `<option value="${esc(game.id)}">${esc(game.title || 'Başlıksız oyun')}${game.year ? ` · ${esc(game.year)}` : ''}</option>`).join('');
    select.innerHTML = `<option value="">Arşivde olmayan / elle eklenen yapım</option>${options}`;
    select.value = String(selected || '');
  }

  function resetEntryForm() {
    el('fgEntryGame').value = '';
    el('fgEntryTitle').value = '';
    el('fgEntryYear').value = '';
    el('fgEntryImage').value = '';
    el('fgEntryType').value = 'Ana oyun';
    el('fgEntryDescription').value = '';
  }

  function resetGuideForm() {
    editingId = null; entries = [];
    el('fgTitle').value = ''; el('fgSlug').value = ''; el('fgDescription').value = '';
    el('fgIntro').value = ''; el('fgCover').value = '';
    el('fgOrderTitle').value = 'Önerdiğim oynama sırası'; el('fgOrderNote').value = '';
    el('franchiseAdminFormTitle').textContent = 'Yeni seri / evren rehberi';
    el('franchiseAdminSaveGuide').textContent = 'Rehberi listeye ekle';
    el('franchiseAdminCancel').hidden = true;
    resetEntryForm(); renderEntries();
  }

  async function load(force = false) {
    if (loaded && !force) { renderGuides(); return; }
    if (force && dirty && !confirm('GitHub’dan yeniden yüklemek kaydedilmemiş seri rehberi değişikliklerini silecek. Devam edilsin mi?')) return;
    if (typeof tok !== 'function' || !tok()) { status('Bu bölümü kullanmak için yönetim paneline tekrar giriş yap.', 'error'); return; }
    const button = el('franchiseAdminLoad'); button.disabled = true;
    status('Seri rehberleri ve oyun arşivi GitHub’dan yükleniyor…');
    try {
      const [guideFile, gameFile] = await Promise.all([getRepoFile(PATH), getRepoFile(CATS.oyun.file)]);
      const rawGuides = guideFile ? decode(guideFile) : { version:1, guides:[] };
      const rawGames = gameFile ? decode(gameFile) : [];
      if (!Array.isArray(rawGames)) throw new Error('Oyun arşivi liste biçiminde değil.');
      guides = normalize(rawGuides); games = rawGames; sha = guideFile?.sha || null;
      loaded = true; dirty = false; populateGameSelect(); resetGuideForm(); renderGuides();
      status(guideFile ? 'Seri rehberleri ve oyun arşivi yüklendi.' : 'Seri rehberi dosyası henüz oluşturulmamış. İlk kayıtta otomatik oluşturulacak.', 'success');
    } catch (error) {
      status(`Seri rehberleri yüklenemedi: ${error.message}${typeof hint === 'function' ? hint(error.status) : ''}`, 'error');
    } finally { button.disabled = false; }
  }

  el('franchiseAdminLoad')?.addEventListener('click', () => load(true));
  el('fgTitle')?.addEventListener('input', () => { if (!editingId && !value('fgSlug')) el('fgSlug').value = slugify(value('fgTitle')); });
  el('fgEntryGame')?.addEventListener('change', event => {
    const game = games.find(item => String(item.id) === String(event.target.value));
    if (!game) return;
    el('fgEntryTitle').value = game.title || '';
    el('fgEntryYear').value = game.year || '';
    el('fgEntryImage').value = game.image || '';
  });
  el('fgEntryAdd')?.addEventListener('click', () => {
    if (!loaded) { status('Önce GitHub’dan Getir / Yenile düğmesine bas.', 'error'); return; }
    const gameId = el('fgEntryGame').value;
    const game = games.find(item => String(item.id) === String(gameId));
    const title = value('fgEntryTitle') || game?.title || '';
    if (!title) { status('Arşivden bir oyun seç veya yapım adını elle yaz.', 'error'); el('fgEntryTitle').focus(); return; }
    if (gameId && entries.some(entry => String(entry.gameId) === String(gameId))) { status('Bu oyun rehbere zaten eklenmiş.', 'error'); return; }
    const year = value('fgEntryYear');
    if (year && (!/^\d{4}$/.test(year) || Number(year) < 1950 || Number(year) > 2100)) { status('Yıl alanına 1950–2100 arasında dört haneli bir yıl gir.', 'error'); el('fgEntryYear').focus(); return; }
    const rawImage = value('fgEntryImage'), image = safeHttps(rawImage);
    if (rawImage && !image) { status('Görsel bağlantısı HTTPS ile başlamalı.', 'error'); el('fgEntryImage').focus(); return; }
    entries.push({ id:id(), gameId:gameId ? String(gameId) : '', title, year, image, type:value('fgEntryType') || 'Ana oyun', description:value('fgEntryDescription'), order:entries.length+1 });
    entries.forEach((entry,index)=>entry.order=index+1);
    resetEntryForm(); renderEntries(); markDirty('Yapım eklendi. Sırasını düzenleyebilir ve rehberi kaydedebilirsin.');
  });

  el('franchiseAdminEntries')?.addEventListener('click', event => {
    const remove = event.target.closest('[data-entry-remove]');
    const up = event.target.closest('[data-entry-up]');
    const down = event.target.closest('[data-entry-down]');
    if (remove) entries.splice(Number(remove.dataset.entryRemove),1);
    if (up) { const index=Number(up.dataset.entryUp); if(index>0)[entries[index-1],entries[index]]=[entries[index],entries[index-1]]; }
    if (down) { const index=Number(down.dataset.entryDown); if(index<entries.length-1)[entries[index+1],entries[index]]=[entries[index],entries[index+1]]; }
    if (remove || up || down) { entries.forEach((entry,index)=>entry.order=index+1); renderEntries(); markDirty('Oynama sırası güncellendi. Rehberi kaydetmeyi unutma.'); }
  });

  el('franchiseAdminSaveGuide')?.addEventListener('click', () => {
    if (!loaded) { status('Önce GitHub’dan Getir / Yenile düğmesine bas.', 'error'); return; }
    const title=value('fgTitle'), slug=slugify(value('fgSlug') || title), description=value('fgDescription'), intro=value('fgIntro'), rawCover=value('fgCover'), cover=safeHttps(rawCover);
    if (!title) { status('Rehber başlığı zorunludur.', 'error'); el('fgTitle').focus(); return; }
    if (!slug) { status('Rehber adresi oluşturulamadı. Başlığı veya adresi kontrol et.', 'error'); return; }
    if (rawCover && !cover) { status('Kapak görseli HTTPS bağlantısı olmalı.', 'error'); el('fgCover').focus(); return; }
    if (description.length>320 || intro.length>2400) { status('Açıklama en fazla 320, giriş yazısı 2400 karakter olabilir.', 'error'); return; }
    if (!entries.length) { status('Rehbere en az bir oyun eklemelisin.', 'error'); el('fgEntryGame').focus(); return; }
    if (guides.some(guide => guide.slug===slug && guide.id!==editingId)) { status('Bu sayfa adresi başka bir rehberde kullanılıyor.', 'error'); el('fgSlug').focus(); return; }
    const now=new Date().toISOString();
    const guide={ id:editingId || id(), slug, title, description, intro, cover, orderTitle:value('fgOrderTitle') || 'Önerdiğim oynama sırası', orderNote:value('fgOrderNote'), updatedAt:now, entries:entries.map((entry,index)=>({...entry,order:index+1})) };
    if (editingId) { const index=guides.findIndex(item=>item.id===editingId); if(index<0){status('Düzenlenecek rehber bulunamadı. Listeyi yenile.','error');return;} guides[index]=guide; }
    else guides.push(guide);
    guides.sort((a,b)=>a.title.localeCompare(b.title,'tr-TR'));
    renderGuides(); resetGuideForm(); markDirty('Rehber taslağı güncellendi. Ziyaretçilere yayımlamak için GitHub’a kaydet.');
  });

  el('franchiseAdminCancel')?.addEventListener('click', resetGuideForm);
  el('franchiseAdminList')?.addEventListener('click', event => {
    const edit=event.target.closest('[data-guide-edit]'), remove=event.target.closest('[data-guide-delete]');
    if (edit) {
      const guide=guides.find(item=>item.id===edit.dataset.guideEdit); if(!guide)return;
      editingId=guide.id; entries=guide.entries.map(item=>({...item}));
      el('fgTitle').value=guide.title; el('fgSlug').value=guide.slug; el('fgDescription').value=guide.description; el('fgIntro').value=guide.intro; el('fgCover').value=guide.cover; el('fgOrderTitle').value=guide.orderTitle; el('fgOrderNote').value=guide.orderNote;
      el('franchiseAdminFormTitle').textContent='Seri / evren rehberini düzenle'; el('franchiseAdminSaveGuide').textContent='Değişiklikleri uygula'; el('franchiseAdminCancel').hidden=false;
      renderEntries(); el('franchiseAdminForm').scrollIntoView({behavior:'smooth',block:'start'});
    }
    if (remove) {
      const guide=guides.find(item=>item.id===remove.dataset.guideDelete); if(!guide)return;
      if(!confirm(`“${guide.title}” rehberi kaldırılsın mı? Oyun arşivindeki kayıtlar silinmez.`))return;
      guides=guides.filter(item=>item.id!==guide.id); if(editingId===guide.id)resetGuideForm(); renderGuides(); markDirty('Rehber taslaktan kaldırıldı. Kalıcı olması için GitHub’a kaydet.');
    }
  });

  el('franchiseAdminSave')?.addEventListener('click', async () => {
    if (!loaded) { status('Önce GitHub’dan Getir / Yenile düğmesine bas.', 'error'); return; }
    if (editingId || value('fgTitle') || entries.length) { status('Önce rehber formundaki “Rehberi listeye ekle” veya “Değişiklikleri uygula” düğmesine bas. Ardından GitHub’a kaydedebilirsin.', 'error'); el('franchiseAdminForm').scrollIntoView({behavior:'smooth',block:'start'}); return; }
    if (typeof tok!=='function' || !tok()) { status('Kaydetmek için yönetim panelinde oturum aç.', 'error'); return; }
    if (!dirty) { status('Kaydedilecek değişiklik bulunmuyor.', 'success'); return; }
    const button=el('franchiseAdminSave'); button.disabled=true; status('Seri ve evren rehberleri GitHub’a kaydediliyor…');
    try {
      const payload={version:1,guides};
      const nextSha=await putRepoFile(PATH,JSON.stringify(payload,null,2),'Seri ve evren rehberleri yönetim panelinden güncellendi',sha);
      if(!nextSha)throw new Error('GitHub dosya SHA değeri döndürmedi.');
      sha=nextSha; dirty=false; renderGuides(); status('Seri ve evren rehberleri GitHub’a kaydedildi. Sitede görünmesi birkaç dakika sürebilir.','success');
    } catch(error) { status(`Rehberler kaydedilemedi: ${error.message}${typeof hint==='function'?hint(error.status):''}`,'error'); }
    finally { button.disabled=false; }
  });

  document.querySelector('[data-tab="franchise-guides"]')?.addEventListener('click', () => { if(!loaded)load(false); });
})();
