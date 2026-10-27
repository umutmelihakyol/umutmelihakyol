(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const C = window.CONFIG || {};
  const ROOT = window.SITE_ROOT || new URL('../', location.href).href;
  const categories = window.CATS || {};
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[char]));
  const safeUrl = value => { try { const u = new URL(String(value || ''), location.href); return u.protocol === 'https:' ? u.href : ''; } catch { return ''; } };
  const norm = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('tr-TR').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
  const displayDate = value => { if(!value)return ''; const d=new Date(value);return Number.isNaN(d.getTime())?String(value):d.toLocaleDateString('tr-TR',{year:'numeric',month:'long',day:'numeric'}); };
  const stripHtml = value => { const holder=document.createElement('div');holder.innerHTML=String(value||'');return (holder.textContent||holder.innerText||'').replace(/\s+/g,' ').trim(); };
  const imageTmdb = path => path ? `https://image.tmdb.org/t/p/w500${path}` : '';
  const imageSmallTmdb = path => path ? `https://image.tmdb.org/t/p/w342${path}` : '';
  const cacheKey = (type,source,name) => `gunlugum:entity-profile:v1:${type}:${source}:${norm(name)}`;
  const sourceNames = {tmdb:'TMDB',rawg:'RAWG',jikan:'Jikan / MyAnimeList'};
  let archiveRecords=[];
  let directory=[];

  function paramUrl(type,source,name,category='') {
    const params=new URLSearchParams({tip:type,kaynak:source,ad:name});
    if(category)params.set('kategori',category);
    return `${ROOT}kisiler/?${params.toString()}`;
  }
  function sourceFor(category,type) {
    if(category==='oyun')return 'rawg';
    if(category==='anime')return 'jikan';
    return 'tmdb';
  }
  function setSourceOptions(preserve=true) {
    const type=$('#entityType').value;
    const current=preserve?$('#entitySource').value:'';
    const options=type==='person' ? [['tmdb','TMDB · Film ve dizi kişileri'],['jikan','Jikan · Anime ve manga kişileri']] : [['rawg','RAWG · Oyun geliştiricileri'],['tmdb','TMDB · Film ve dizi şirketleri'],['jikan','Jikan · Anime stüdyoları / yapımcıları']];
    $('#entitySource').innerHTML=options.map(([value,label])=>`<option value="${value}">${label}</option>`).join('');
    $('#entitySource').value=options.some(([value])=>value===current)?current:(options[0]?.[0]||'tmdb');
  }
  async function getJson(url) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 14000);
    try {
      const response = await fetch(url,{signal:controller.signal,headers:{Accept:'application/json'}});
      if(!response.ok)throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } finally { clearTimeout(timer); }
  }
  async function tmdb(path, params={}) {
    if(!C.tmdbKey)throw new Error('TMDB API anahtarı yapılandırılmamış.');
    const query=new URLSearchParams({api_key:C.tmdbKey,language:'tr-TR',...params});
    return getJson(`https://api.themoviedb.org/3${path}?${query.toString()}`);
  }
  async function rawg(path, params={}) {
    if(!C.rawgKey)throw new Error('RAWG API anahtarı yapılandırılmamış.');
    const query=new URLSearchParams({key:C.rawgKey,...params});
    return getJson(`https://api.rawg.io/api${path}?${query.toString()}`);
  }
  async function jikan(path, params={}) {
    const query=new URLSearchParams(params);
    const suffix=query.toString()?`?${query}`:'';
    return getJson(`https://api.jikan.moe/v4${path}${suffix}`);
  }
  const exactOrFirst=(items,name,getName=item=>item.name)=>{
    const list=Array.isArray(items)?items:[];
    const wanted=norm(name);
    return list.find(item=>norm(getName(item))===wanted)||list.find(item=>norm(getName(item)).startsWith(wanted)||wanted.startsWith(norm(getName(item))))||list[0]||null;
  };
  const workTitle=item=>String(item.title?.name||item.title?.english||item.title?.romaji||item.title?.userPreferred||item.title||item.name||item.original_name||item.original_title||'İsimsiz yapım');

  async function fetchTmdbProfile(type,name) {
    if(type==='person') {
      const search=await tmdb('/search/person',{query:name,include_adult:'false'});
      const match=exactOrFirst(search.results,name,item=>item.name);
      if(!match)throw new Error('TMDB bu kişi için eşleşme bulamadı.');
      const detail=await tmdb(`/person/${match.id}`,{append_to_response:'combined_credits,external_ids,images'});
      const credits=detail.combined_credits||{};
      const works=[...(credits.cast||[]).map(x=>({...x,creditType:'Oyunculuk'})),...(credits.crew||[]).map(x=>({...x,creditType:x.job||'Ekip'}))]
        .filter((item,index,list)=>list.findIndex(other=>other.id===item.id&&other.media_type===item.media_type)===index)
        .sort((a,b)=>(b.popularity||0)-(a.popularity||0)).slice(0,16).map(item=>({title:workTitle(item),year:String(item.release_date||item.first_air_date||'').slice(0,4),image:imageSmallTmdb(item.poster_path),href:`https://www.themoviedb.org/${item.media_type==='tv'?'tv':'movie'}/${item.id}`,kind:item.media_type==='tv'?'Dizi':'Film',meta:item.creditType}));
      let biography=stripHtml(detail.biography||'');
      if(!biography){try{const en=await tmdb(`/person/${match.id}`,{language:'en-US'});biography=stripHtml(en.biography||'')}catch{}}
      return {name:detail.name||match.name,image:imageTmdb(detail.profile_path||match.profile_path),subtitle:detail.known_for_department||'Kişi profili',description:biography,meta:[detail.birthday?`Doğum: ${displayDate(detail.birthday)}`:'',detail.place_of_birth?`Doğum yeri: ${detail.place_of_birth}`:'',detail.also_known_as?.length?`Diğer adlar: ${detail.also_known_as.slice(0,3).join(', ')}`:''].filter(Boolean),externalUrl:detail.homepage|| (detail.external_ids?.imdb_id?`https://www.imdb.com/name/${detail.external_ids.imdb_id}/`:`https://www.themoviedb.org/person/${detail.id}`),sourceUrl:`https://www.themoviedb.org/person/${detail.id}`,works};
    }
    const search=await tmdb('/search/company',{query:name});
    const match=exactOrFirst(search.results,name,item=>item.name);
    if(!match)throw new Error('TMDB bu şirket için eşleşme bulamadı.');
    const detail=await tmdb(`/company/${match.id}`);
    // TMDB company details do not include a full filmography, so discover titles
    // associated with this company separately. One failed media type must not
    // prevent the studio profile from opening.
    const creditResults=await Promise.allSettled([
      tmdb('/discover/movie',{with_companies:String(match.id),sort_by:'popularity.desc',include_adult:'false'}),
      tmdb('/discover/tv',{with_companies:String(match.id),sort_by:'popularity.desc'})
    ]);
    const works=[];
    for(const [index,result] of creditResults.entries()){
      if(result.status!=='fulfilled')continue;
      const isTv=index===1;
      const media=Array.isArray(result.value.results)?result.value.results:[];
      for(const item of media){
        const tv=isTv;
        works.push({title:workTitle(item),year:String(item.release_date||item.first_air_date||'').slice(0,4),image:imageSmallTmdb(item.poster_path),href:`https://www.themoviedb.org/${tv?'tv':'movie'}/${item.id}`,kind:tv?'Dizi':'Film',meta:item.vote_average?`TMDB ${Number(item.vote_average).toFixed(1)}/10`:''});
      }
    }
    const uniqueWorks=works.filter((item,index,list)=>list.findIndex(other=>other.href===item.href)===index).slice(0,16);
    return {name:detail.name||match.name,image:imageTmdb(detail.logo_path||match.logo_path),subtitle:'Yapım şirketi',description:stripHtml(detail.description||''),meta:[detail.headquarters?`Merkez: ${detail.headquarters}`:'',detail.origin_country?`Ülke: ${detail.origin_country}`:'',detail.parent_company?.name?`Ana şirket: ${detail.parent_company.name}`:''].filter(Boolean),externalUrl:detail.homepage||`https://www.themoviedb.org/company/${detail.id}`,sourceUrl:`https://www.themoviedb.org/company/${detail.id}`,works:uniqueWorks};
  }
  async function fetchRawgProfile(name) {
    const search=await rawg('/developers',{search:name,page_size:6});
    const match=exactOrFirst(search.results,name,item=>item.name);
    if(!match)throw new Error('RAWG bu geliştirici için eşleşme bulamadı.');
    let detail=match;
    try{detail=await rawg(`/developers/${match.id}`)}catch{}
    let works=[];
    try{
      const games=await rawg('/games',{developers:String(match.id),page_size:16,ordering:'-added'});
      works=(games.results||[]).map(item=>({title:item.name,year:String(item.released||'').slice(0,4),image:item.background_image||'',href:item.slug?`https://rawg.io/games/${item.slug}`:'https://rawg.io/',kind:'Oyun',meta:item.added?`${Number(item.added).toLocaleString('tr-TR')} listede`:''}));
    }catch{}
    return {name:detail.name||match.name,image:detail.image_background||match.image_background||'',subtitle:'Oyun geliştiricisi',description:stripHtml(detail.description||''),meta:[detail.games_count!=null?`${Number(detail.games_count).toLocaleString('tr-TR')} oyun kaydı`:'',detail.slug?`RAWG kimliği: ${detail.slug}`:''].filter(Boolean),externalUrl:detail.slug?`https://rawg.io/developers/${detail.slug}`:'https://rawg.io/',sourceUrl:detail.slug?`https://rawg.io/developers/${detail.slug}`:'https://rawg.io/',works};
  }
  async function fetchJikanProfile(type,name) {
    if(type==='person') {
      const search=await jikan('/people',{q:name,limit:6});
      const match=exactOrFirst(search.data,name,item=>item.name);
      if(!match)throw new Error('Jikan bu kişi için eşleşme bulamadı.');
      let full;
      try{full=await jikan(`/people/${match.mal_id}/full`)}catch{full={data:match}}
      const data=full.data||match;
      let anime=Array.isArray(data.anime)?data.anime:[];
      if(!anime.length){try{const a=await jikan(`/people/${match.mal_id}/anime`,{limit:12});anime=a.data||[]}catch{}}
      const works=anime.slice(0,16).map(entry=>{const item=entry.anime||entry;return {title:item.title||item.title_english||'İsimsiz anime',year:String(item.start_year||'').slice(0,4),image:item.images?.jpg?.image_url||'',href:item.url||`https://myanimelist.net/anime/${item.mal_id}`,kind:'Anime',meta:entry.position||''}});
      return {name:data.name||match.name,image:data.images?.jpg?.image_url||match.images?.jpg?.image_url||'',subtitle:(data.mal_id?'Anime / manga kişisi':'Kişi profili'),description:stripHtml(data.about||''),meta:[data.birthday?`Doğum: ${displayDate(data.birthday)}`:'',data.given_name?`Adı: ${data.given_name}`:'',data.family_name?`Soyadı: ${data.family_name}`:'',data.favorites!=null?`${Number(data.favorites).toLocaleString('tr-TR')} favori`:''].filter(Boolean),externalUrl:data.url||match.url,sourceUrl:data.url||match.url,works};
    }
    const search=await jikan('/producers',{q:name,limit:6});
    const match=exactOrFirst(search.data,name,item=>item.titles?.[0]?.title||item.name);
    if(!match)throw new Error('Jikan bu stüdyo/yapımcı için eşleşme bulamadı.');
    let full;
    try{full=await jikan(`/producers/${match.mal_id}/full`)}catch{full={data:match}}
    const data=full.data||match;
    const titles=Array.isArray(data.titles)?data.titles:[];
    const works=titles.slice(0,16).map(item=>{const title=typeof item==='string'?item:(item.title||item.name||'İsimsiz yapım');return {title,year:String(item.start_year||'').slice(0,4),image:item.images?.jpg?.image_url||'',href:item.url||match.url,kind:'Anime',meta:item.type||''}});
    return {name:data.titles?.[0]?.title||data.name||match.titles?.[0]?.title||name,image:data.images?.jpg?.image_url||match.images?.jpg?.image_url||'',subtitle:'Anime stüdyosu / yapımcısı',description:stripHtml(data.about||data.established||''),meta:[data.count!=null?`${Number(data.count).toLocaleString('tr-TR')} yapım`:'',data.favorites!=null?`${Number(data.favorites).toLocaleString('tr-TR')} favori`:''].filter(Boolean),externalUrl:data.url||match.url,sourceUrl:data.url||match.url,works};
  }
  async function fetchRemote(type,source,name) {
    if(source==='tmdb')return fetchTmdbProfile(type,name);
    if(source==='rawg'){
      if(type!=='studio')throw new Error('RAWG kişi profillerini desteklemez. Oyun geliştiricileri için Stüdyo türünü seç.');
      return fetchRawgProfile(name);
    }
    if(source==='jikan')return fetchJikanProfile(type,name);
    throw new Error('Bilinmeyen profil kaynağı.');
  }
  async function cachedRemote(type,source,name) {
    const key=cacheKey(type,source,name);
    try{const raw=localStorage.getItem(key);if(raw){const box=JSON.parse(raw);if(Date.now()-box.savedAt<12*60*60*1000)return box.data;}}catch{}
    const data=await fetchRemote(type,source,name);
    try{localStorage.setItem(key,JSON.stringify({savedAt:Date.now(),data}))}catch{}
    return data;
  }
  async function loadArchive() {
    const entries=Object.entries(categories).filter(([key])=>['oyun','film','dizi','anime'].includes(key));
    const lists=await Promise.all(entries.map(async([key,cfg])=>{
      try{const response=await fetch(new URL(cfg.file,ROOT).href,{cache:'no-cache'});if(!response.ok)throw new Error('');const list=await response.json();return Array.isArray(list)?list.map(record=>({category:key,record})):[]}catch{return []}
    }));
    archiveRecords=lists.flat();
    buildDirectory();
  }
  function namesForRecord(category,record,type) {
    const names=[];
    if(type==='person'){
      if(category==='film'&&record.director)names.push(...String(record.director).split(','));
      if(category==='dizi'&&record.creator)names.push(...String(record.creator).split(','));
      if(Array.isArray(record.people))names.push(...record.people);
    }else{
      if(category==='oyun'&&record.developer)names.push(...String(record.developer).split(','));
      if(category==='anime'&&record.studio)names.push(...String(record.studio).split(','));
      for(const key of ['productionCompanies','studios'])if(record[key])names.push(...(Array.isArray(record[key])?record[key]:String(record[key]).split(',')));
    }
    return names.map(name=>String(name||'').trim()).filter(Boolean);
  }
  function sourceForRecord(category,type){return sourceFor(category,type)}
  function buildDirectory() {
    const map=new Map();
    for(const {category,record} of archiveRecords){
      for(const type of ['person','studio']){
        const source=sourceForRecord(category,type);
        for(const name of namesForRecord(category,record,type)){
          const key=[type,source,norm(name)].join('|');if(!norm(name))continue;
          const item=map.get(key)||{type,source,name,categories:new Set(),works:new Map(),count:0};
          item.categories.add(category);item.works.set(`${category}:${record.id}`,{category,record});item.count++;
          map.set(key,item);
        }
      }
    }
    directory=[...map.values()].map(item=>({...item,categories:[...item.categories],works:[...item.works.values()]})).sort((a,b)=>b.works.length-a.works.length||a.name.localeCompare(b.name,'tr'));
    renderDirectory();
  }
  function renderDirectory() {
    const host=$('#directoryGrid'),query=norm($('#directoryFilter').value);
    const filtered=directory.filter(item=>!query||norm(item.name).includes(query));
    $('#directoryCount').textContent=`${filtered.length} profil`;
    if(!filtered.length){host.innerHTML='<p class="profile-empty">Bu aramayla eşleşen kişi veya stüdyo bulunamadı.</p>';return}
    host.innerHTML=filtered.slice(0,120).map(item=>`<a class="entity-directory-card" href="${esc(paramUrl(item.type,item.source,item.name,item.categories[0]))}"><span class="entity-directory-icon" aria-hidden="true">${item.type==='person'?'♙':'▦'}</span><span class="entity-directory-copy"><strong>${esc(item.name)}</strong><small>${item.type==='person'?'Kişi':'Stüdyo / şirket'} · ${item.categories.map(k=>categories[k]?.name||k).join(', ')}</small></span><span class="entity-directory-count">${item.works.length}</span></a>`).join('');
  }
  function localMatches(type,name) {
    const wanted=norm(name);
    return archiveRecords.filter(({category,record})=>namesForRecord(category,record,type).some(candidate=>norm(candidate)===wanted)).slice(0,80);
  }
  function imageOrFallback(image,name,className='profile-avatar') {
    const url=safeUrl(image);
    const initial=esc(String(name||'?').trim().charAt(0).toLocaleUpperCase('tr-TR'));
    return `<div class="${className}">${url?`<img src="${esc(url)}" alt="${esc(name)}" loading="eager" referrerpolicy="no-referrer" onerror="this.remove();this.parentElement.classList.add('image-missing')">`:''}<span class="profile-avatar-fallback" aria-hidden="true">${initial}</span></div>`;
  }
  function renderLocalWorks(type,name) {
    const matches=localMatches(type,name);
    if(!matches.length)return '<p class="profile-empty">Bu kişi veya şirket için mevcut arşivde eşleşen bir yapım kaydı yok.</p>';
    return `<div class="profile-archive-links">${matches.map(({category,record})=>`<a class="profile-archive-pill" href="${esc(`${ROOT}${category}/#${record.id}`)}">${safeUrl(record.image)?`<img src="${esc(record.image)}" alt="" loading="lazy" referrerpolicy="no-referrer">`:''}<span><strong>${esc(record.title)}</strong><small>${esc(categories[category]?.name||category)}${record.year?' · '+esc(record.year):''}${record.score!==null&&record.score!==undefined&&record.score!==''?' · '+esc(record.score)+'/10':''}</small></span></a>`).join('')}</div>`;
  }
  function renderRemoteWorks(works) {
    const items=(Array.isArray(works)?works:[]).filter(item=>item&&item.title&&safeUrl(item.href)).slice(0,16);
    if(!items.length)return '<p class="profile-empty">Kaynak profilinde listelenecek yapım bulunamadı.</p>';
    return `<div class="profile-work-grid">${items.map(item=>`<a class="profile-work-card" href="${esc(safeUrl(item.href))}" target="_blank" rel="noopener noreferrer"><span class="profile-work-poster">${safeUrl(item.image)?`<img src="${esc(item.image)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">`:'<span class="profile-work-placeholder" aria-hidden="true">▧</span>'}</span><span class="profile-work-text"><strong>${esc(item.title)}</strong><small>${esc([item.year,item.kind,item.meta].filter(Boolean).join(' · ')||'Kaynak kaydı')}</small></span></a>`).join('')}</div>`;
  }
  function renderProfile(type,source,name,remote,remoteError='') {
    const profileName=remote?.name||name;
    const categoryLabel=type==='person'?'Kişi profili':'Stüdyo / şirket profili';
    const meta=(remote?.meta||[]).filter(Boolean);
    const description=String(remote?.description||'').trim();
    const external=safeUrl(remote?.externalUrl||remote?.sourceUrl);
    const sourceUrl=safeUrl(remote?.sourceUrl);
    const localCount=localMatches(type,name).length;
    $('#profileResult').hidden=false;
    $('#profileResult').innerHTML=`
      <section class="profile-hero-card">
        ${imageOrFallback(remote?.image,profileName)}
        <div class="profile-copy"><span class="profile-type-badge">${type==='person'?'♙':'▦'} ${categoryLabel}</span><h2>${esc(profileName)}</h2>${remote?.subtitle?`<p class="profile-original-name">${esc(remote.subtitle)}</p>`:''}
          <div class="profile-meta-row">${meta.map(item=>`<span class="profile-meta-chip">${esc(item)}</span>`).join('')}<span class="profile-meta-chip">Arşivimde ${localCount} yapım</span></div>
          <div class="profile-description">${description?`<p>${esc(description).replace(/\n{2,}/g,'</p><p>').replace(/\n/g,'<br>')}</p>`:`<p class="profile-empty">${remoteError?'Dış kaynak şu anda yanıt vermedi; profil arşivindeki bilgilerle gösteriliyor.':'Bu kaynak için açıklama bulunmuyor.'}</p>`}</div>
          <div class="profile-external-links">${external?`<a href="${esc(external)}" target="_blank" rel="noopener noreferrer">Kaynak profili ↗</a>`:''}${sourceUrl&&sourceUrl!==external?`<a href="${esc(sourceUrl)}" target="_blank" rel="noopener noreferrer">${esc(sourceNames[source])} üzerinde aç ↗</a>`:''}<a href="${esc(paramUrl(type,source,name))}">Profili paylaş ↗</a></div>
        </div>
      </section>
      ${remoteError?`<p class="people-status">Otomatik bilgi alınamadı: ${esc(remoteError)} Arşiv eşleşmeleri aşağıda gösterilmeye devam ediyor.</p>`:''}
      <section class="profile-section"><div class="profile-section-head"><div><h3>Günlüğüm arşivindeki yapımlar</h3><p>Bu isimle mevcut kayıtların eşleşmeleri</p></div><small>${localCount} kayıt</small></div>${renderLocalWorks(type,name)}</section>
      <section class="profile-section"><div class="profile-section-head"><div><h3>${type==='person'?'Filmografi / bilinen yapımlar':'İlişkili yapımlar'}</h3><p>${esc(sourceNames[source]||source)} kaynağından getirildi</p></div><small>${Array.isArray(remote?.works)?remote.works.length:0} sonuç</small></div>${renderRemoteWorks(remote?.works||[])}</section>`;
    document.title=`${profileName} | Günlüğüm`;
    $('#directorySection').hidden=true;
    $('#peopleStatus').hidden=true;
  }
  async function openProfile(type,source,name,category='') {
    const cleanName=String(name||'').trim();if(!cleanName)return;
    $('#entityType').value=type==='person'?'person':'studio';setSourceOptions(false);$('#entitySource').value=source;$('#entityName').value=cleanName;
    $('#directorySection').hidden=true;$('#profileResult').hidden=true;$('#peopleStatus').hidden=false;$('#peopleStatus').textContent=`${cleanName} profili ${sourceNames[source]||source} üzerinden yükleniyor…`;
    history.replaceState(history.state,'',paramUrl(type,source,cleanName,category));
    let remote=null,error='';
    try{remote=await cachedRemote(type,source,cleanName)}catch(exception){error=exception?.name==='AbortError'?'İstek zaman aşımına uğradı.':String(exception?.message||'Veri kaynağına bağlanılamadı.');}
    renderProfile(type,source,cleanName,remote,error);
  }
  $('#entityType').addEventListener('change',()=>setSourceOptions(true));
  $('#entitySearchForm').addEventListener('submit',event=>{
    event.preventDefault();const name=$('#entityName').value.trim();if(!name)return;
    openProfile($('#entityType').value,$('#entitySource').value,name);
  });
  $('#directoryFilter').addEventListener('input',renderDirectory);

  setSourceOptions(false);
  const params=new URLSearchParams(location.search);
  const initialName=params.get('ad')||'';
  const initialType=params.get('tip')==='person'?'person':'studio';
  const initialSource=params.get('kaynak')||sourceFor(params.get('kategori')||'',initialType);
  if(initialName){$('#entityType').value=initialType;setSourceOptions(false);if([...$('#entitySource').options].some(option=>option.value===initialSource))$('#entitySource').value=initialSource;}
  loadArchive().then(()=>{
    if(initialName)openProfile(initialType,initialSource,initialName,params.get('kategori')||'');
  }).catch(error=>console.warn('Günlüğüm kişi/stüdyo dizini yüklenemedi:',error));
})();
