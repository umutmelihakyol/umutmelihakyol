(() => {
  'use strict';
  const $ = (selector) => document.querySelector(selector);
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const CATEGORIES = [
    {key:'oyun',label:'Oyun',icon:'🎮',href:'../oyun/',file:'data/games.json'},
    {key:'dizi',label:'Dizi',icon:'📺',href:'../dizi/',file:'data/series.json'},
    {key:'film',label:'Film',icon:'🎬',href:'../film/',file:'data/movies.json'},
    {key:'anime',label:'Anime',icon:'✨',href:'../anime/',file:'data/anime.json'}
  ];
  const STATUS = {bitirdim:'Tamamlandı / İzledim',oynuyorum:'Devam ediyorum',biraktim:'Yarım bıraktım',istek:'İstek listesi'};
  let allRecords = [], filtered = [], visibleCount = 32, failed = [];
  const fields = ['searchQuery','categoryFilter','statusFilter','genreFilter','yearFilter','minScore','maxScore','platformFilter','sortFilter','favoriteOnly','reviewOnly','recommendedOnly'];
  const fieldValue = (id) => String($('#'+id).value ?? '').trim();
  const validScore = (r) => r.score !== null && r.score !== undefined && r.score !== '' && Number.isFinite(Number(r.score)) && Number(r.score) >= 0 && Number(r.score) <= 10;
  const textOf = (r) => [r.title,r.platform,r.developer,r.director,r.creator,r.studio,r.note,r.review,...(r.genres||[]),...(r.pros||[]),...(r.cons||[])].filter(Boolean).join(' ').toLocaleLowerCase('tr-TR');
  const getPerson = (r) => r.developer || r.director || r.creator || r.studio || '';
  const getDuration = (r) => {
    if (r._category === 'oyun' && r.hours != null) return `${r.hours} saat`;
    if (r._category === 'film' && r.minutes != null) return `${r.minutes} dk`;
    if (r._category === 'dizi') return [r.seasons != null ? `${r.seasons} sezon` : '',r.episodes != null ? `${r.episodes} bölüm` : ''].filter(Boolean).join(' · ');
    if (r._category === 'anime' && r.episodes != null) return `${r.episodes} bölüm`;
    return '';
  };
  function setURL() {
    const params = new URLSearchParams();
    fields.forEach((id) => {
      const el = $('#'+id);
      const value = el.type === 'checkbox' ? (el.checked ? '1' : '') : fieldValue(id);
      if (value && !['categoryFilter','statusFilter','genreFilter','sortFilter'].includes(id)) params.set(id, value);
      if (['categoryFilter','statusFilter','genreFilter','sortFilter'].includes(id) && value && value !== ({categoryFilter:'all',statusFilter:'all',genreFilter:'',sortFilter:'relevance'}[id])) params.set(id, value);
    });
    const query = params.toString();
    history.replaceState(history.state, '', location.pathname + (query ? `?${query}` : ''));
  }
  function loadURL() {
    const params = new URLSearchParams(location.search);
    fields.forEach((id) => {
      const el = $('#'+id), value = params.get(id);
      if (value === null) return;
      if (el.type === 'checkbox') el.checked = value === '1' || value === 'true';
      else el.value = value;
    });
  }
  function fillGenres() {
    const current = fieldValue('genreFilter');
    const genres = [...new Set(allRecords.flatMap((r) => Array.isArray(r.genres) ? r.genres : []).filter((g) => typeof g === 'string' && g.trim()))].sort((a,b)=>a.localeCompare(b,'tr-TR'));
    $('#genreFilter').innerHTML = '<option value="">Tüm türler</option>' + genres.map((g)=>`<option value="${esc(g)}">${esc(g)}</option>`).join('');
    $('#genreFilter').value = genres.includes(current) ? current : '';
  }
  function resultCard(r) {
    const image = typeof window.IMAGE_SRC === 'function' ? window.IMAGE_SRC(r.image, 400) : r.image;
    const imageHTML = image && /^https?:\/\//i.test(image) ? `<img src="${esc(image)}" alt="${esc(r.title)} kapağı" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.remove()">` : '<span aria-hidden="true">✦</span>';
    const meta = [r.year || '', getPerson(r), getDuration(r), STATUS[r.status || 'bitirdim'] || ''].filter(Boolean).join(' · ');
    const genres = (r.genres || []).slice(0, 3).map((g) => `<span>${esc(g)}</span>`).join('');
    return `<a class="search-result-card" href="${r._href}#${encodeURIComponent(String(r.id||''))}"><div class="search-poster">${imageHTML}<span class="search-cat">${r._icon} ${esc(r._label)}</span>${validScore(r)?`<span class="search-score">★ ${Number(r.score).toLocaleString('tr-TR',{maximumFractionDigits:1})}</span>`:''}</div><div class="search-result-copy"><strong>${esc(r.title)}</strong><span class="search-result-meta">${esc(meta || 'Arşiv kaydı')}</span>${genres?`<div class="search-result-tags">${genres}</div>`:''}</div></a>`;
  }
  function matchRecord(r) {
    const query = fieldValue('searchQuery').toLocaleLowerCase('tr-TR');
    if (query && !textOf(r).includes(query)) return false;
    const category = fieldValue('categoryFilter'), status = fieldValue('statusFilter'), genre = fieldValue('genreFilter');
    if (category !== 'all' && r._category !== category) return false;
    if (status !== 'all' && (r.status || 'bitirdim') !== status) return false;
    if (genre && !(r.genres || []).includes(genre)) return false;
    const year = fieldValue('yearFilter');
    if (year && Number(r.year) !== Number(year)) return false;
    const min = fieldValue('minScore'), max = fieldValue('maxScore');
    if ((min || max) && !validScore(r)) return false;
    if (min && Number(r.score) < Number(min)) return false;
    if (max && Number(r.score) > Number(max)) return false;
    const platform = fieldValue('platformFilter').toLocaleLowerCase('tr-TR');
    if (platform && !String(r.platform || '').toLocaleLowerCase('tr-TR').includes(platform)) return false;
    if ($('#favoriteOnly').checked && r.favorite !== true) return false;
    if ($('#reviewOnly').checked && ![r.review, r.note].some((v) => typeof v === 'string' && v.trim())) return false;
    if ($('#recommendedOnly').checked && r.recommended !== true) return false;
    return true;
  }
  function sortRecords(records) {
    const sort = fieldValue('sortFilter');
    const n = (r,k) => validScore({score:r[k]}) ? Number(r[k]) : -1;
    return records.sort((a,b) => {
      if (sort === 'relevance') {
        const query = fieldValue('searchQuery').toLocaleLowerCase('tr-TR');
        if (!query) return String(b.updatedAt||b.finished||'').localeCompare(String(a.updatedAt||a.finished||'')) || a.title.localeCompare(b.title,'tr-TR');
        const relevance = (record) => {
          const title = String(record.title||'').toLocaleLowerCase('tr-TR');
          if (title === query) return 1000;
          if (title.startsWith(query)) return 600;
          if (title.includes(query)) return 400;
          const person = [record.developer,record.director,record.creator,record.studio].filter(Boolean).join(' ').toLocaleLowerCase('tr-TR');
          if (person.includes(query)) return 150;
          if ((record.genres||[]).some((genre)=>String(genre).toLocaleLowerCase('tr-TR').includes(query))) return 100;
          return 0;
        };
        return relevance(b)-relevance(a) || a.title.localeCompare(b.title,'tr-TR');
      }
      if (sort === 'score-desc') return n(b,'score') - n(a,'score') || a.title.localeCompare(b.title,'tr-TR');
      if (sort === 'score-asc') return (n(a,'score')<0?999:n(a,'score')) - (n(b,'score')<0?999:n(b,'score')) || a.title.localeCompare(b.title,'tr-TR');
      if (sort === 'year-desc') return Number(b.year||0)-Number(a.year||0) || a.title.localeCompare(b.title,'tr-TR');
      if (sort === 'year-asc') return Number(a.year||9999)-Number(b.year||9999) || a.title.localeCompare(b.title,'tr-TR');
      if (sort === 'finished-desc') return String(b.finished||'').localeCompare(String(a.finished||'')) || a.title.localeCompare(b.title,'tr-TR');
      if (sort === 'title-asc') return a.title.localeCompare(b.title,'tr-TR');
      return 0;
    });
  }
  function render() {
    filtered = sortRecords(allRecords.filter(matchRecord));
    visibleCount = Math.min(Math.max(visibleCount,32), Math.max(filtered.length,32));
    const shown = filtered.slice(0, visibleCount);
    $('#searchResults').innerHTML = shown.map(resultCard).join('');
    $('#resultCount').textContent = `${filtered.length.toLocaleString('tr-TR')} sonuç`;
    $('#resultRange').textContent = filtered.length ? `${shown.length.toLocaleString('tr-TR')} / ${filtered.length.toLocaleString('tr-TR')} gösteriliyor` : '';
    $('#searchEmpty').hidden = filtered.length > 0;
    $('#loadMore').hidden = shown.length >= filtered.length;
    setURL();
  }
  async function load() {
    $('#resultCount').textContent = 'Arşiv yükleniyor…';
    const tasks = CATEGORIES.map(async (category) => {
      try {
        const config = window.CATS && window.CATS[category.key];
        const file = config?.file || category.file;
        const root = window.SITE_ROOT || new URL('../', location.href).href;
        const response = await fetch(new URL(file, root).href, {cache:'no-cache'});
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const records = await response.json();
        if (!Array.isArray(records)) throw new Error('JSON dizisi bekleniyordu');
        return records.filter((r)=>r&&typeof r.title==='string').map((r)=>({...r,_category:category.key,_label:category.label,_icon:category.icon,_href:category.href}));
      } catch (error) {
        failed.push(category.label);
        console.error(`Günlüğüm arama verisi yüklenemedi (${category.label}):`, error);
        return [];
      }
    });
    allRecords = (await Promise.all(tasks)).flat();
    fillGenres(); loadURL(); fillGenres(); render();
    if (failed.length) { $('#searchNotice').hidden = false; $('#searchNotice').textContent = `${failed.join(', ')} arşiv verisi yüklenemedi. Bu kategorilerde sonuçlar eksik görünebilir.`; }
  }
  fields.forEach((id) => {
    const el = $('#'+id);
    el.addEventListener(el.type === 'checkbox' || el.tagName === 'SELECT' ? 'change' : 'input', () => {visibleCount=32;render()});
  });
  $('#searchSubmit').addEventListener('click', () => { visibleCount=32; render(); });
  $('#searchQuery').addEventListener('keydown', (event) => {if(event.key==='Enter'){event.preventDefault();visibleCount=32;render()}});
  $('#clearFilters').addEventListener('click', () => {
    fields.forEach((id) => { const el=$('#'+id); if(el.type==='checkbox') el.checked=false; else if(id==='categoryFilter') el.value='all'; else if(id==='statusFilter') el.value='all'; else if(id==='sortFilter') el.value='relevance'; else el.value=''; });
    visibleCount=32;render();$('#searchQuery').focus();
  });
  $('#loadMore').addEventListener('click', () => {visibleCount+=32;render()});
  load().catch((error) => { console.error(error); $('#searchNotice').hidden=false;$('#searchNotice').textContent='Arşiv yüklenemedi. İnternet bağlantısını kontrol edip sayfayı yenile.'; });
})();
