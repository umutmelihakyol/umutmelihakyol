// Kategori sayfalarının ortak kodu. Hangi kategori olduğunu <body data-cat="..."> belirler.
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeUrl=u=>/^https?:\/\//i.test(u||'')?esc(u):'';
const imageSrc=(u,w=500)=>safeUrl(typeof IMAGE_SRC==='function'?IMAGE_SRC(u,w):u);
const fmtDate=d=>d?new Date(d).toLocaleDateString('tr-TR',{year:'numeric',month:'long'}):'—';
const fmtHistoryDate=d=>{if(!d)return '—';const value=/^\d{4}-\d{2}-\d{2}$/.test(String(d))?`${d}T12:00:00`:d;const date=new Date(value);return Number.isNaN(date.getTime())?String(d):date.toLocaleDateString('tr-TR',{day:'numeric',month:'long',year:'numeric'});};
const num=v=>(+v).toLocaleString('tr',{maximumFractionDigits:1});
const has=v=>v!==null&&v!==undefined&&v!=='';
const CAT=document.body.dataset.cat,cfg=CATS[CAT],ST=cfg.st,CF=window.CONFIG||{};
const stOf=g=>g.status||'bitirdim';
const plats=g=>String(g.platform||'').split(',').map(x=>x.trim()).filter(Boolean);
let games=[],st='all',favOnly=false,vis=[],randomMode=false,view='card',lastId='';
try{view=localStorage.getItem('view')||'card'}catch{}

/* başlık, gezinme, sabit metinler */
document.title=cfg.title+' | '+(CF.siteTitle||'Günlüğüm');
$('#title').textContent=cfg.title;
$('#soonTitle').textContent=cfg.soon;
$('#dlg').setAttribute('aria-label',cfg.name+' ayrıntıları');
$('#q').placeholder=cfg.name+' ara…';
$('#rnd').title='Şu an listelenen '+cfg.plural.toLowerCase()+' arasından rastgele birini seçer';
$('#sort').innerHTML=`<option value="date">${cfg.dateSort}</option><option value="score">En yüksek puan</option><option value="dur">${cfg.dur.sort}</option><option value="name">A-Z</option>`;
$('#cats').innerHTML=`<a href="${SITE_ROOT}">${ICON('home')} Ana sayfa</a>`+Object.entries(CATS).map(([k,c])=>`<a href="${c.page}"${k===CAT?' aria-current="page"':''}>${ICON(k)} ${c.plural}</a>`).join('');
$('#cats').insertAdjacentHTML('beforeend', `<a href="${SITE_ROOT}istatistik/" title="Arşiv istatistikleri">📊 İstatistikler</a><a href="${SITE_ROOT}kisiler/" title="Kişi ve stüdyo profilleri">👥 Kişiler &amp; Stüdyolar</a>`);
if(CF.suggestUrl){const a=$('#suggest');a.href=CF.suggestUrl;a.hidden=false;if(!/^https?:/i.test(CF.suggestUrl))a.removeAttribute('target')}

function fillSel(id,label,vals){$(id).innerHTML=`<option value="">${label}</option>`+[...new Set(vals)].sort((a,b)=>a.localeCompare(b,'tr')).map(v=>`<option>${esc(v)}</option>`).join('')}
function render(){
  const q=$('#q').value.trim().toLocaleLowerCase('tr'),pf=$('#plat').value,gf=$('#genre').value,f=$('#flt').value,s=$('#sort').value;
  const l=games.filter(g=>g.title.toLocaleLowerCase('tr').includes(q)&&(st==='all'||stOf(g)===st)&&(!favOnly||g.favorite===true)&&(!pf||plats(g).includes(pf))&&(!gf||(g.genres||[]).includes(gf))
    &&(f==='all'||(f==='yes'&&g.recommended===true)||(f==='no'&&g.recommended===false)||(f==='rev'&&g.review)));
  const v=(g,k)=>has(g[k])?+g[k]:-1,dk=cfg.dur.key;
  l.sort((a,b)=>s==='score'?v(b,'score')-v(a,'score'):s==='dur'?v(b,dk)-v(a,dk):s==='name'?a.title.localeCompare(b.title,'tr'):(b.finished||'').localeCompare(a.finished||''));
  vis=l;
  const G=$('#grid');
  if(!l.length){G.className='grid';G.innerHTML='<p class="empty">Gösterilecek kayıt yok.</p>'}
  else if(view==='list'){G.className='listwrap';G.innerHTML=table(l)}
  else{G.className='grid';G.innerHTML=l.map(card).join('')}
  $('#pills').innerHTML=['all',...Object.keys(ST)].map(k=>`<button class="pill" data-k="${k}" aria-pressed="${st===k}">${k==='all'?'Hepsi':ST[k]} <span>${k==='all'?games.length:games.filter(g=>stOf(g)===k).length}</span></button>`).join('')+`<button class="pill fav" data-fav="1" aria-pressed="${favOnly}">${HEART} Favoriler <span>${games.filter(g=>g.favorite===true).length}</span></button>`;
  const fin=games.filter(g=>stOf(g)==='bitirdim'),sc=games.filter(g=>has(g.score));
  const tot=fin.reduce((t,g)=>t+(+g[cfg.tot.key]||0),0)/cfg.tot.div,avg=sc.length?sc.reduce((t,g)=>t+ +g.score,0)/sc.length:0;
  $('#stats').innerHTML=`<div><b>${fin.length}</b>${cfg.doneNoun}</div><div><b>${(Math.round(tot*10)/10).toLocaleString('tr')}</b>${cfg.tot.unit}</div><div><b>${avg.toFixed(1)}</b>ortalama puan</div><div><b>${games.filter(g=>g.recommended===true).length}</b>önerilen</div>`;
}
const recChip=g=>g.recommended===true?'<span class="recb yes">Öneriyorum</span>':g.recommended===false?'<span class="recb no">Önermiyorum</span>':'';
const revHtml=g=>{const r=safeUrl(g.review);return r?`<a href="${r}" target="_blank" rel="noopener">İncelemeyi oku</a>`:stOf(g)==='istek'?'':'<span class="none">İnceleme yok</span>'};
const durText=g=>[cfg.dur,cfg.dur2].filter(Boolean).filter(d=>has(g[d.key])).map(d=>`${esc(g[d.key])} ${d.unit}`).join(', ');
const facts=g=>{const p=[],dt=durText(g);if(dt)p.push(`<span>${cfg.dur.label?`<i>${cfg.dur.label}</i>`:''}${dt}</span>`);if(g.finished)p.push(`<span><i>${cfg.dateLabel}</i>${fmtDate(g.finished)}</span>`);return `<p class="facts">${p.join('')||`<span>${cfg.nof[stOf(g)]}</span>`}</p>`};
const HEART='<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.6-9.3C.9 8.3 2.7 4.5 6.3 4.5c2.1 0 3.6 1.1 4.5 2.6l1.2 1.8 1.2-1.8c.9-1.5 2.4-2.6 4.5-2.6 3.6 0 5.4 3.8 3.9 7.2C19.500 16.400 12 21 12 21z"/></svg>';
const profileUrl=(type,source,name)=>{const params=new URLSearchParams({tip:type,kaynak:source,ad:String(name||'').trim(),kategori:CAT});return `${SITE_ROOT}kisiler/?${params.toString()}`};
const entityLinks=(raw,type,source)=>{
  const names=(Array.isArray(raw)?raw:String(raw||'').split(',')).map(x=>String(x||'').trim()).filter(Boolean);
  return names.map(name=>`<a class="entity-inline-link" href="${esc(profileUrl(type,source,name))}" title="${esc(name)} profilini aç">${esc(name)}</a>`).join(', ');
};
const info=g=>{const p=[];if(has(g.year))p.push(`<span><i>${cfg.yearLabel}</i>${esc(g.year)}</span>`);const pv=g[cfg.person.key];if(pv){const org=CAT==='oyun'||CAT==='anime';p.push(`<span class="entity-fact"><i>${org?(CAT==='oyun'?'Geliştirici':'Stüdyo'):cfg.person.label}</i>${entityLinks(pv,org?'studio':'person',CAT==='oyun'?'rawg':CAT==='anime'?'jikan':'tmdb')}</span>`)}const companies=g.productionCompanies||g.studios;if(companies)p.push(`<span class="entity-fact"><i>Yapım şirketi</i>${entityLinks(companies,'studio',CAT==='anime'?'jikan':'tmdb')}</span>`);return p.length?`<p class="facts">${p.join('')}</p>`:''};
const repeatHistorySection=g=>{
  const entries=Array.isArray(g.repeatHistory)?g.repeatHistory.filter(x=>x&&x.date).slice().sort((a,b)=>String(b.date).localeCompare(String(a.date))):[];
  const unit=CAT==='oyun'?'saat':CAT==='film'?'dk':'bölüm';
  const title=CAT==='oyun'?'Tekrar oynama geçmişi':'Yeniden izleme geçmişi';
  const rows=entries.map((item,index)=>{
    const kind=item.kind==='replay-completion'||item.kind==='rewatch-completion'?'Yeniden tamamlandı':CAT==='oyun'?'Tekrar oynandı':'Yeniden izlendi';
    const detail=[item.platform||'',item.duration!==null&&item.duration!==undefined&&item.duration!==''?`${num(item.duration)} ${unit}`:'',item.score!==null&&item.score!==undefined&&item.score!==''?`Puan ${num(item.score)}/10`:''].filter(Boolean).map(esc).join(' · ');
    return `<article class="history-entry"><span class="history-entry-marker" aria-hidden="true"></span><div class="history-entry-main"><div class="history-entry-head"><strong>${kind}</strong><time datetime="${esc(item.date)}">${fmtHistoryDate(item.date)}</time></div>${detail?`<p class="history-entry-meta">${detail}</p>`:''}${item.note?`<p class="history-entry-note">${esc(item.note)}</p>`:''}</div></article>`;
  }).join('');
  return `<section class="detail-section history-section"><div class="detail-section-heading"><span class="detail-section-icon" aria-hidden="true">↻</span><div><p class="detail-eyebrow">ZAMAN İÇİNDE</p><h3>${title}</h3></div><span class="history-count">${entries.length} kayıt</span></div>${entries.length?`<div class="history-timeline">${rows}</div>`:`<p class="history-empty">Bu yapım için henüz tekrar kaydı eklenmemiş. Yönetim panelinde kaydı düzenleyerek tarih, süre/ilerleme ve kişisel not ekleyebilirsin.</p>`}</section>`;
};
const scoreHistorySection=g=>{
  const entries=Array.isArray(g.scoreHistory)?g.scoreHistory.filter(x=>x&&x.date).slice().sort((a,b)=>String(b.date).localeCompare(String(a.date))):[];
  if(!entries.length)return '';
  return `<section class="detail-section score-history-section"><div class="detail-section-heading"><span class="detail-section-icon" aria-hidden="true">↗</span><div><p class="detail-eyebrow">PUAN GEÇMİŞİ</p><h3>Değerlendirmelerim</h3></div><span class="history-count">${entries.length} kayıt</span></div><div class="history-timeline">${entries.map(item=>{const old=item.previousScore===null||item.previousScore===undefined?'—':`${num(item.previousScore)}/10`,next=item.score===null||item.score===undefined?'Puan kaldırıldı':`${num(item.score)}/10`;return `<article class="history-entry score-history-entry"><span class="history-entry-marker" aria-hidden="true"></span><div class="history-entry-main"><div class="history-entry-head"><strong>${esc(old)} <span aria-hidden="true">→</span> ${esc(next)}</strong><time datetime="${esc(item.date)}">${fmtHistoryDate(item.date)}</time></div>${item.reason?`<p class="history-entry-note">${esc(item.reason)}</p>`:''}</div></article>`}).join('')}</div></section>`;
};

const ACQUISITION_LABELS={purchase:'Satın alındı',free:'Ücretsiz',subscription:'Abonelik',gift:'Hediye',bundle:'Paket / Bundle',key:'Kod / Anahtar',other:'Diğer'};
const OWNERSHIP_LABELS={owned:'Kalıcı kütüphanemde',subscription:'Abonelik erişimi',wishlist:'İstek listemde',removed:'Kütüphaneden kaldırıldı','not-owned':'Kütüphanemde değil'};
const validMoney=v=>v!==null&&v!==undefined&&v!==''&&Number.isFinite(Number(v));
function moneyLabel(value,currency='TRY'){
  const code=/^(TRY|USD|EUR|GBP|JPY|CAD|AUD)$/.test(String(currency||''))?String(currency):'TRY';
  try{return new Intl.NumberFormat('tr-TR',{style:'currency',currency:code,maximumFractionDigits:2}).format(Number(value))}
  catch{return `${Number(value).toLocaleString('tr-TR',{maximumFractionDigits:2})} ${code}`}
}
function purchaseMini(g){
  const parts=[];
  if(validMoney(g.purchasePrice))parts.push(`Ödenen: ${moneyLabel(g.purchasePrice,g.purchaseCurrency||'TRY')}`);
  else if(g.acquisitionType==='free')parts.push('Ücretsiz edinildi');
  else if(g.acquisitionType)parts.push(ACQUISITION_LABELS[g.acquisitionType]||g.acquisitionType);
  if(g.ownershipStatus==='subscription'&&!parts.some(x=>x==='Abonelik'))parts.push('Abonelik erişimi');
  return parts.length?`<p class="meta purchase-mini" style="margin:0;font-size:.86rem;overflow-wrap:anywhere">💰 ${parts.map(esc).join(' · ')}</p>`:'';
}
function purchaseDetails(g){
  const rows=[];
  if(g.acquisitionType)rows.push(['Edinme türü',ACQUISITION_LABELS[g.acquisitionType]||g.acquisitionType]);
  if(validMoney(g.purchasePrice))rows.push(['Ödenen fiyat',moneyLabel(g.purchasePrice,g.purchaseCurrency||'TRY')]);
  if(validMoney(g.listPrice))rows.push(['İndirimsiz fiyat',moneyLabel(g.listPrice,g.purchaseCurrency||'TRY')]);
  if(g.acquisitionType&&['purchase','bundle','key'].includes(g.acquisitionType)&&validMoney(g.purchasePrice)&&validMoney(g.listPrice)&&Number(g.listPrice)>Number(g.purchasePrice))
    rows.push(['Fiyat farkı',moneyLabel(Number(g.listPrice)-Number(g.purchasePrice),g.purchaseCurrency||'TRY')]);
  if(g.purchaseStore)rows.push(['Mağaza / kaynak',g.purchaseStore]);
  if(g.purchaseDate)rows.push(['Satın alma tarihi',fmtDate(g.purchaseDate)]);
  if(g.ownershipStatus)rows.push(['Kütüphane durumu',OWNERSHIP_LABELS[g.ownershipStatus]||g.ownershipStatus]);
  if(!rows.length&&!g.purchaseNote)return '';
  return `<section class="purchase-detail detail-section"><div class="detail-section-heading"><span class="detail-section-icon" aria-hidden="true">◈</span><div><p class="detail-eyebrow">OYUN KÜTÜPHANESİ</p><h3>Satın alma ve kütüphane</h3></div></div>${rows.length?`<dl class="purchase-detail-grid">${rows.map(([k,v])=>`<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>`:''}${g.purchaseNote?`<p class="purchase-note">${esc(g.purchaseNote)}</p>`:''}</section>`;
}

const proscons=g=>{const p=(g.pros||[]).filter(Boolean),c=(g.cons||[]).filter(Boolean);if(!p.length&&!c.length)return '';
  const col=(t,cls,l)=>l.length?`<div class="pc ${cls}"><h4>${t}</h4><ul>${l.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>`:'';
  return `<div class="pcs">${col('Artılar','pro',p)}${col('Eksiler','con',c)}</div>`};
const RATING_LABELS=[['story','Hikâye'],['gameplay','Oynanış'],['visuals','Görsellik'],['audio','Ses / Müzik'],['characters','Karakterler'],['originality','Özgünlük'],['pacing','Tempo / Kurgu']];
const ratingBreakdown=g=>{const raw=g.ratings&&typeof g.ratings==='object'?g.ratings:{};const rows=RATING_LABELS.filter(([key])=>CAT==='oyun'||key!=='gameplay').filter(([key])=>raw[key]!==null&&raw[key]!==undefined&&raw[key]!==''&&Number.isFinite(Number(raw[key]))&&Number(raw[key])>=0&&Number(raw[key])<=10);if(!rows.length)return '';const avg=rows.reduce((sum,[key])=>sum+Number(raw[key]),0)/rows.length;return `<section class="rating-breakdown-public"><div class="rating-breakdown-head"><h3>Alt puanlarım</h3><span>Ortalama <b>${num(avg)}/10</b></span></div><div class="rating-breakdown-bars">${rows.map(([key,label])=>`<div class="rating-breakdown-row"><span>${label}</span><div><i style="width:${Number(raw[key])*10}%"></i></div><b>${num(raw[key])}</b></div>`).join('')}</div></section>`};
const chips=g=>(g.genres||[]).map(t=>`<span>${esc(t)}</span>`).join('');
const cover=g=>{
  const image=imageSrc(g.image,700);
  const fallback=esc(String(g.title||'?').trim().charAt(0).toLocaleUpperCase('tr-TR'));
  return `<div class="cover detail-cover${image?'':' image-missing'}" data-ph="${fallback}">${image?`<img src="${image}" alt="${esc(g.title)} görseli" loading="eager" decoding="async" fetchpriority="high" referrerpolicy="no-referrer" onerror="this.remove();this.parentElement.classList.add('image-missing')">`:''}<span class="detail-cover-placeholder" aria-hidden="true">${fallback}</span><span class="detail-cover-label">${esc(cfg.name)} <span aria-hidden="true">/</span> KİŞİSEL ARŞİV</span><button class="detail-dismiss" type="button" aria-label="Ayrıntı penceresini kapat" title="Kapat">×</button></div>`;
};
const THUMB_UP='<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 11v9H4v-9zM7 11l4-8a2 2 0 0 1 2 2v4h6a2 2 0 0 1 2 2.3l-1.2 7A2 2 0 0 1 17.8 20H7"/></svg>';
const THUMB_DN='<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 13V4h3v9zM17 13l-4 8a2 2 0 0 1-2-2v-4H5a2 2 0 0 1-2-2.300l1.200-7A2 2 0 0 1 6.200 4H17"/></svg>';
const tier=v=>v>=8?'hi':v>=6?'mid':'lo';
function cardMedia(g){
  const s=stOf(g),img=imageSrc(g.image,CAT==='oyun'?500:342),sc=has(g.score)?Math.max(0,Math.min(10,+g.score)):null;
  const ph=esc(String(g.title||'?').trim().charAt(0).toLocaleUpperCase('tr-TR'));
  const recommended=CAT!=='oyun'&&g.recommended!==undefined&&g.recommended!==null&&g.recommended!==''
    ?`<span class="cx-ico ${g.recommended?'yes':'no'}" title="${g.recommended?'Öneriyorum':'Önermiyorum'}">${g.recommended?THUMB_UP:THUMB_DN}</span>`:'';
  return `<div class="cx-media${img?'':' image-missing'}" data-ph="${ph}">${img?`<img src="${img}" alt="${esc(g.title)} görseli" loading="lazy" decoding="async" fetchpriority="low" referrerpolicy="no-referrer" onerror="this.remove();this.parentElement.classList.add('image-missing')">`:''}
    <div class="cx-top"><div class="cx-l">${sc!==null?`<span class="cx-ring" data-t="${tier(sc)}" style="--p:${sc*10}" title="Puanım: ${num(sc)}/10"><b>${num(sc)}</b></span>`:''}${g.favorite===true?`<span class="cx-ico fav" title="Favorim">${HEART}</span>`:''}${recommended}</div>
    <span class="cx-st" data-s="${esc(s)}">${esc(ST[s]||s)}</span></div></div>`;
}
function cardFacts(g){
  // Kartta yalnızca tamamlayıcı, kısa bilgiler gösterilir. Yıl/platform üst satırda,
  // yönetmen/geliştirici ve uzun notlar Ayrıntılar penceresinde kalır.
  const p=[],dt=durText(g);
  if(dt)p.push(`<span title="${esc(dt)}">${dt}</span>`);
  if(g.finished){const date=fmtDate(g.finished);p.push(`<span title="${esc(cfg.dateLabel+': '+date)}">${esc(cfg.dateLabel)}: ${date}</span>`);}
  return p.length?`<p class="cx-facts">${p.slice(0,2).join('')}</p>`:'';
}
function card(g){
  const poster=CAT!=='oyun',id=esc(g.id);
  const pl=plats(g).filter(x=>x.toLocaleLowerCase('tr-TR')!==cfg.name.toLocaleLowerCase('tr-TR'));
  const meta=[has(g.year)?esc(g.year):'',...pl.slice(0,2).map(esc)].filter(Boolean).join(' · ');
  const gen=(g.genres||[]).filter(Boolean),chips=gen.slice(0,4).map(t=>`<span>${esc(t)}</span>`).join('');
  // Uzun notlar ve ayrıntılı öneri bilgisi kayıt penceresinde kalır; kart gövdesi kısa tutulur.
  const title=`<h3 class="cx-title"><a class="tl" href="#${id}" title="${esc(g.title)}">${esc(g.title)}</a></h3>`;
  const shareIcon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.7 10.7 6.6-4.4M8.7 13.3l6.6 4.4"/></svg>';
  return `<article class="card cx${poster?' poster':''}" data-id="${id}">${cardMedia(g)}
  <div class="cx-body"><div class="cx-heading">${title}</div>
  ${meta?`<p class="cx-meta">${meta}</p>`:''}${chips?`<div class="cx-chips">${chips}</div>`:''}${cardFacts(g)}
  <div class="cx-foot"><a class="more" href="#${id}">Ayrıntılar</a><button class="cx-share-btn" type="button" data-id="${id}" aria-label="${esc(g.title)} için paylaşılabilir inceleme kartı oluştur" title="İnceleme kartı oluştur">${shareIcon}<span>Paylaş</span></button></div></div></article>`;
}
const thumb=(g,c)=>imageSrc(g.image,185)?`<img class="${c}" src="${imageSrc(g.image,185)}" alt="" loading="lazy" decoding="async" fetchpriority="low" width="64" height="44" referrerpolicy="no-referrer" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'${c} ph','aria-hidden':'true'}))">`:`<span class="${c} ph" aria-hidden="true"></span>`;
function table(l){
  const row=g=>`<tr data-id="${esc(g.id)}"><td><div class="nm">${thumb(g,'th')}<a class="tl" href="#${esc(g.id)}">${g.favorite===true?`<span class="hrt">${HEART}</span>`:''}${esc(g.title)}</a></div></td>
  <td class="c-pl">${esc(g.platform)||'—'}</td><td><span class="s-${stOf(g)}">${ST[stOf(g)]}</span></td><td class="sc">${has(g.score)?num(g.score):'—'}</td>
  <td class="c-hr">${durText(g)||'—'}</td><td class="c-dt">${g.finished?fmtDate(g.finished):'—'}</td>
  <td class="c-rc">${g.recommended===true?'<span class="rec yes">Öneriyorum</span>':g.recommended===false?'<span class="rec no">Önermiyorum</span>':'—'}</td></tr>`;
  return `<table class="tbl"><thead><tr><th>${cfg.name}</th><th class="c-pl">${cfg.plat.label}</th><th>Durum</th><th>Puan</th><th class="c-hr">${cfg.dur.label||'Uzunluk'}</th><th class="c-dt">${cfg.dateLabel}</th><th class="c-rc">Öneri</th></tr></thead><tbody>${l.map(row).join('')}</tbody></table>`;
}
function soon(){
  const l=games.filter(g=>stOf(g)==='oynuyorum');$('#soon').hidden=!l.length;
  $('#soonList').innerHTML=l.map(g=>`<a class="soonc" href="#${esc(g.id)}">${thumb(g,'sth')}<span><b>${esc(g.title)}</b><small>${esc(g.platform)||ST.oynuyorum}</small></span></a>`).join('');
}
function foot(){
  const u=games.map(g=>g.updatedAt).filter(Boolean).sort().pop();
  $('#foot').innerHTML=(u?'Son güncelleme: '+new Date(u).toLocaleDateString('tr-TR',{day:'numeric',month:'long',year:'numeric'})+'<br>':'')+cfg.credit;
}
function openGame(id){
  const g=games.find(x=>x.id===id),d=$('#dlg');if(!g)return d.open&&d.close();
  const genreList=(g.genres||[]).filter(Boolean);
  const subtitle=[g.platform,has(g.year)?`${cfg.yearLabel} ${g.year}`:''].filter(Boolean).join(' · ')||cfg.name;
  const factsContent=`${facts(g)}${info(g)}`;
  const noteSection=g.note?`<section class="detail-section detail-note-section"><div class="detail-section-heading"><span class="detail-section-icon" aria-hidden="true">✎</span><div><p class="detail-eyebrow">KİŞİSEL NOTLAR</p><h3>Değerlendirmem</h3></div></div><p class="full">${esc(g.note)}</p></section>`:'';
  const pcContent=proscons(g);
  const pcSection=pcContent?`<section class="detail-section detail-proscons-section"><div class="detail-section-heading"><span class="detail-section-icon" aria-hidden="true">±</span><div><p class="detail-eyebrow">NOTLARIM</p><h3>Artılar ve eksiler</h3></div></div>${pcContent}</section>`:'';
  const review=revHtml(g);
  const reviewSection=review&&!review.includes('İnceleme yok')?`<section class="detail-section detail-review-section"><div class="detail-section-heading"><span class="detail-section-icon" aria-hidden="true">↗</span><div><p class="detail-eyebrow">BAĞLANTILI İÇERİK</p><h3>Yayımladığım inceleme</h3></div></div><div class="detail-review-link">${review}</div></section>`:'';
  const sideContent=`${CAT==='oyun'?purchaseDetails(g):''}${ratingBreakdown(g)}`;
  const statusLabel=ST[stOf(g)]||stOf(g);
  const recommendation=g.recommended===true?`<span class="detail-badge detail-recommendation is-yes">${THUMB_UP} Öneriyorum</span>`:g.recommended===false?`<span class="detail-badge detail-recommendation is-no">${THUMB_DN} Önermiyorum</span>`:'';
  const favorite=g.favorite===true?`<span class="detail-badge detail-favorite">${HEART} Favorim</span>`:'';
  const score=has(g.score)&&Number.isFinite(Number(g.score))?`<div class="detail-score-card"><span class="detail-score-number">${num(g.score)}</span><span class="detail-score-denom">/ 10</span><span class="detail-score-caption">Kişisel puanım</span></div>`:`<div class="detail-score-card is-empty"><span class="detail-score-number">—</span><span class="detail-score-caption">Henüz puanlamadım</span></div>`;
  d.classList.add('detail-redesign');
  d.setAttribute('aria-labelledby','detail-title');
  d.innerHTML=`${cover(g)}<div class="inner detail-content">
    <header class="detail-intro">
      <div class="detail-intro-copy"><p class="detail-eyebrow">${esc(cfg.name)} · GÜNLÜĞÜM ARŞİVİ</p><h2 class="detail-title" id="detail-title">${esc(g.title)}</h2><p class="detail-cover-subtitle">${esc(subtitle)}</p>
        <div class="detail-badge-row"><span class="detail-badge detail-status" data-status="${esc(stOf(g))}">${esc(statusLabel)}</span>${favorite}${recommendation}</div>
        ${genreList.length?`<div class="detail-genre-row" aria-label="Türler">${genreList.map(t=>`<span>${esc(t)}</span>`).join('')}</div>`:''}
      </div>${score}
    </header>
    <div class="detail-layout${sideContent?' has-sidebar':''}">
      <div class="detail-main-column">
        <section class="detail-section detail-facts-section"><div class="detail-section-heading"><span class="detail-section-icon" aria-hidden="true">⌘</span><div><p class="detail-eyebrow">ARŞİV KAYDI</p><h3>Kayıt bilgileri</h3></div></div><div class="detail-info-grid">${factsContent}</div></section>
        ${noteSection}${pcSection}${reviewSection}${repeatHistorySection(g)}${scoreHistorySection(g)}
      </div>
      ${sideContent?`<aside class="detail-side-column">${sideContent}</aside>`:''}
    </div>
    <div class="detail-actions">${randomMode?'<button class="btn again" type="button">Başka birini seç</button> ':''}<button class="btn pri card-gen-btn" type="button" data-id="${esc(g.id)}">▧ İnceleme kartı oluştur</button><button class="btn copy" type="button">Bağlantıyı kopyala</button><button class="btn detail-close" type="button">Kapat</button></div>
  </div>`;
  if(!d.open)d.showModal();
  if(lastId!==id){lastId=id;try{window.goatcounter&&goatcounter.count&&goatcounter.count({path:CAT+'/'+id,title:g.title,event:true})}catch{}}
}$('#dlg').addEventListener('close',()=>{lastId='';randomMode=false;history.replaceState(null,'',location.pathname+location.search)});
$('#dlg').addEventListener('click',e=>{
  if(e.target===e.currentTarget)return e.currentTarget.close();
  if(e.target.closest('.detail-dismiss, .detail-close'))return e.currentTarget.close();
  if(e.target.closest('.again'))return pickRandom();
  const cardBtn=e.target.closest('.card-gen-btn');
  if(cardBtn)return generateReviewCard(cardBtn.dataset.id,cardBtn);
  const b=e.target.closest('.copy');if(b){const url=location.href;if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(url).then(()=>b.textContent='Bağlantı kopyalandı').catch(()=>prompt('Bağlantıyı kopyala:',url));}else{prompt('Bağlantıyı kopyala:',url);}}
});

function generateReviewCard(id,btnEl){
  const record=games.find(item=>String(item.id)===String(id));
  if(!record)return;
  if(window.GunlugumReviewCard){window.GunlugumReviewCard.openEditor(record,CAT);return;}
  if(btnEl)btnEl.disabled=false;
  alert('İnceleme kartı aracı yüklenemedi. Sayfayı yenileyip tekrar dene.');
}

$('#grid').addEventListener('click',e=>{
  const shareBtn=e.target.closest('.cx-share-btn');
  if(shareBtn){
    e.preventDefault();e.stopPropagation();
    const id=shareBtn.dataset.id||shareBtn.closest('[data-id]')?.dataset.id;
    generateReviewCard(id,shareBtn);
    return;
  }
  const c=e.target.closest('.card,tr[data-id]');if(!c||e.target.closest('a[target]')||e.target.closest('button'))return;
  e.preventDefault();location.hash=c.dataset.id;openGame(c.dataset.id);
});
addEventListener('hashchange',()=>openGame(location.hash.slice(1)));
$('#pills').addEventListener('click',e=>{const b=e.target.closest('.pill');if(!b)return;if(b.dataset.fav)favOnly=!favOnly;else st=b.dataset.k;render()});
function pickRandom(){
  const cur=location.hash.slice(1),pool=vis.length>1?vis.filter(g=>g.id!==cur):vis;
  if(!pool.length){const b=$('#rnd');b.lastChild.textContent=' Listede kayıt yok';setTimeout(()=>b.lastChild.textContent=' Rastgele seç',2000);return}
  const g=pool[Math.floor(Math.random()*pool.length)];randomMode=true;location.hash=g.id;openGame(g.id);
}
$('#rnd').addEventListener('click',pickRandom);
const segSync=()=>document.querySelectorAll('.seg button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.v===view));
$('.seg').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;view=b.dataset.v;try{localStorage.setItem('view',view)}catch{}segSync();render()});segSync();
['q','plat','genre','flt','sort'].forEach(i=>$('#'+i).addEventListener('input',render));
addEventListener('resize',()=>games.length&&render());
foot();
fetch(new URL(cfg.file, SITE_ROOT).href, {cache:'no-cache'}).then(response=>{
  if(!response.ok)throw new Error(`HTTP ${response.status}`);
  return response.json();
}).then(data=>{
  if(!Array.isArray(data))throw new Error('JSON veri biçimi geçersiz');
  games=data;
  fillSel('#plat',cfg.plat.all,data.flatMap(plats));
  fillSel('#genre','Tüm türler',data.flatMap(g=>Array.isArray(g.genres)?g.genres:[]));
  render();soon();foot();if(location.hash)openGame(location.hash.slice(1));
}).catch(error=>{
  console.error(`Günlüğüm ${cfg.file} yüklenemedi:`,error);
  games=[];
  fillSel('#plat',cfg.plat.all,[]);fillSel('#genre','Tüm türler',[]);
  render();soon();
  const notice=$('#dataError');
  if(notice){notice.hidden=false;notice.textContent=`${cfg.plural} yüklenemedi. İnternet bağlantısını kontrol edip sayfayı yenile. (${cfg.file})`;}
  else $('#grid').innerHTML=`<p class="empty">${esc(cfg.plural)} yüklenemedi. Lütfen bağlantını kontrol edip sayfayı yenile.</p>`;
}).finally(()=>{
  window.__gunlugumContentReady = true;
  window.dispatchEvent(new Event('gunlugum:content-ready'));
});


// Etiket gruplarını fareyle sürükleyerek kaydır; yazı seçimini ve kart açılmasını engelle.
let tagDragState = null;
document.addEventListener('pointerdown', (event) => {
  if (event.pointerType !== 'mouse' || event.button !== 0) return;
  const scroller = event.target.closest('.tags');
  if (!scroller || scroller.scrollWidth <= scroller.clientWidth + 1) return;
  tagDragState = {
    element: scroller,
    pointerId: event.pointerId,
    startX: event.clientX,
    startScrollLeft: scroller.scrollLeft,
    moved: false
  };
  scroller.classList.add('is-dragging');
  try { scroller.setPointerCapture(event.pointerId); } catch (_) {}
}, true);

document.addEventListener('pointermove', (event) => {
  if (!tagDragState || event.pointerId !== tagDragState.pointerId) return;
  const deltaX = event.clientX - tagDragState.startX;
  if (Math.abs(deltaX) > 4) tagDragState.moved = true;
  if (!tagDragState.moved) return;
  event.preventDefault();
  tagDragState.element.scrollLeft = tagDragState.startScrollLeft - deltaX;
}, { capture: true, passive: false });

function finishTagDrag(event) {
  if (!tagDragState || (event.pointerId !== undefined && event.pointerId !== tagDragState.pointerId)) return;
  const state = tagDragState;
  state.element.classList.remove('is-dragging');
  if (state.moved) state.element.dataset.suppressTagClick = 'true';
  tagDragState = null;
}
document.addEventListener('pointerup', finishTagDrag, true);
document.addEventListener('pointercancel', finishTagDrag, true);
document.addEventListener('click', (event) => {
  const scroller = event.target.closest('.tags');
  if (!scroller || scroller.dataset.suppressTagClick !== 'true') return;
  delete scroller.dataset.suppressTagClick;
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
}, true);


/* Şu an izlediklerim şeridi: kartları fareyle tutup sürükleyerek kaydır. */
(() => {
  if (window.__soonCardDragReady) return;
  window.__soonCardDragReady = true;

  let drag = null;
  const getStrip = (target) => {
    if (!(target instanceof Element)) return null;
    return target.closest('#soonList, .soonwrap .soon');
  };

  document.addEventListener('mousedown', (event) => {
    if (event.button !== 0) return;
    const strip = getStrip(event.target);
    if (!strip || strip.scrollWidth <= strip.clientWidth + 2) return;

    drag = {
      strip,
      startX: event.clientX,
      startScrollLeft: strip.scrollLeft,
      moved: false
    };
    strip.classList.add('is-mouse-dragging');
  }, true);

  document.addEventListener('mousemove', (event) => {
    if (!drag) return;
    const deltaX = event.clientX - drag.startX;
    if (Math.abs(deltaX) > 4) drag.moved = true;
    if (!drag.moved) return;

    // Metin seçimini önle ve şeridi fareyle hareket ettir.
    event.preventDefault();
    drag.strip.scrollLeft = drag.startScrollLeft - deltaX;
  }, { capture: true, passive: false });

  document.addEventListener('mouseup', () => {
    if (!drag) return;
    const finished = drag;
    drag = null;
    finished.strip.classList.remove('is-mouse-dragging');

    // Sürükleme sonunda bağlantının tıklanmasını engelle.
    if (finished.moved) {
      finished.strip.dataset.dragMoved = 'true';
      window.setTimeout(() => {
        if (finished.strip.dataset.dragMoved === 'true') {
          delete finished.strip.dataset.dragMoved;
        }
      }, 500);
    }
  }, true);

  document.addEventListener('click', (event) => {
    const strip = getStrip(event.target);
    if (!strip || strip.dataset.dragMoved !== 'true') return;
    delete strip.dataset.dragMoved;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
  }, true);

  // Kart kapakları tarayıcı tarafından ayrı bir resim gibi sürüklenmesin.
  document.addEventListener('dragstart', (event) => {
    if (getStrip(event.target)) event.preventDefault();
  }, true);
})();
