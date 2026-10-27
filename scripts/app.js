// Kategori sayfalarının ortak kodu. Hangi kategori olduğunu <body data-cat="..."> belirler.
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeUrl=u=>/^https?:\/\//i.test(u||'')?esc(u):'';
const imageSrc=(u,w=500)=>safeUrl(typeof IMAGE_SRC==='function'?IMAGE_SRC(u,w):u);
const fmtDate=d=>d?new Date(d).toLocaleDateString('tr-TR',{year:'numeric',month:'long'}):'—';
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
$('#cats').innerHTML=`<a href="${SITE_ROOT}index.html">${ICON('home')} Ana sayfa</a>`+Object.entries(CATS).map(([k,c])=>`<a href="${c.page}"${k===CAT?' aria-current="page"':''}>${ICON(k)} ${c.plural}</a>`).join('');
$('#cats').insertAdjacentHTML('beforeend', `<a href="${SITE_ROOT}istatistik/" title="Arşiv istatistikleri">📊 İstatistikler</a>`);
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
const info=g=>{const p=[];if(has(g.year))p.push(`<span><i>${cfg.yearLabel}</i>${esc(g.year)}</span>`);const pv=g[cfg.person.key];if(pv)p.push(`<span><i>${cfg.person.label}</i>${esc(pv)}</span>`);return p.length?`<p class="facts">${p.join('')}</p>`:''};

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
  return `<section class="purchase-detail" style="border:1px solid var(--line);border-radius:10px;background:var(--bg);padding:12px 14px;margin:4px 0"><h3 style="font-size:1rem;margin:0 0 10px">Satın alma ve kütüphane</h3>${rows.length?`<dl style="display:grid;grid-template-columns:minmax(105px,auto) 1fr;gap:5px 12px;margin:0;font-size:.92rem">${rows.map(([k,v])=>`<dt style="color:var(--mute)">${esc(k)}</dt><dd style="margin:0;overflow-wrap:anywhere;font-weight:600">${esc(v)}</dd>`).join('')}</dl>`:''}${g.purchaseNote?`<p class="meta" style="margin:10px 0 0;white-space:pre-wrap">${esc(g.purchaseNote)}</p>`:''}</section>`;
}

const proscons=g=>{const p=(g.pros||[]).filter(Boolean),c=(g.cons||[]).filter(Boolean);if(!p.length&&!c.length)return '';
  const col=(t,cls,l)=>l.length?`<div class="pc ${cls}"><h4>${t}</h4><ul>${l.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>`:'';
  return `<div class="pcs">${col('Artılar','pro',p)}${col('Eksiler','con',c)}</div>`};
const chips=g=>(g.genres||[]).map(t=>`<span>${esc(t)}</span>`).join('');
const cover=g=>`<div class="cover">${imageSrc(g.image,500)?`<img src="${imageSrc(g.image,500)}" alt="${esc(g.title)} görseli" loading="lazy" decoding="async" fetchpriority="low" referrerpolicy="no-referrer" onerror="this.remove();this.parentElement.classList.add('image-missing')">`:''}${g.favorite===true?`<span class="fvb" title="Favorim">${HEART}</span>`:''}<span class="stb s-${stOf(g)}">${ST[stOf(g)]}</span>${has(g.score)?`<span class="score" title="Puanım">${num(g.score)}</span>`:''}${recChip(g)}</div>`;
const THUMB_UP='<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 11v9H4v-9zM7 11l4-8a2 2 0 0 1 2 2v4h6a2 2 0 0 1 2 2.3l-1.2 7A2 2 0 0 1 17.8 20H7"/></svg>';
const THUMB_DN='<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 13V4h3v9zM17 13l-4 8a2 2 0 0 1-2-2v-4H5a2 2 0 0 1-2-2.300l1.200-7A2 2 0 0 1 6.200 4H17"/></svg>';
const tier=v=>v>=8?'hi':v>=6?'mid':'lo';
function cardMedia(g){
  const s=stOf(g),img=imageSrc(g.image,500),sc=has(g.score)?Math.max(0,Math.min(10,+g.score)):null;
  const ph=esc(String(g.title||'?').trim().charAt(0).toUpperCase());
  return `<div class="cx-media${img?'':' image-missing'}" data-ph="${ph}">${img?`<img src="${img}" alt="${esc(g.title)} görseli" loading="lazy" decoding="async" fetchpriority="low" referrerpolicy="no-referrer" onerror="this.remove();this.parentElement.classList.add('image-missing')">`:''}
    <div class="cx-top"><div class="cx-l">${sc!==null?`<span class="cx-ring" data-t="${tier(sc)}" style="--p:${sc*10}" title="Puanım: ${num(sc)}/10"><b>${num(sc)}</b></span>`:''}${g.favorite===true?`<span class="cx-ico fav" title="Favorim">${HEART}</span>`:''}${CAT!=='oyun'&&g.recommended!==undefined&&g.recommended!==null&&g.recommended!==''?`<span class="cx-ico ${g.recommended?'yes':'no'}" title="${g.recommended?'Öneriyorum':'Önermiyorum'}">${g.recommended?THUMB_UP:THUMB_DN}</span>`:''}</div>
    <span class="cx-st" data-s="${esc(s)}">${esc(ST[s]||s)}</span></div></div>`;
}
function cardFacts(g){
  const s=stOf(g),p=[],dt=durText(g);
  if(dt)p.push(`<span>${dt}</span>`);
  if(g.finished)p.push(`<span>${cfg.dateLabel}: ${fmtDate(g.finished)}</span>`);
  const pv=g[cfg.person.key];if(pv)p.push(`<span>${esc(pv)}</span>`);
  return `<p class="cx-facts">${p.join('')||`<span>${esc(cfg.nof[s]||'')}</span>`}</p>`;
}
function card(g){
  const poster=CAT!=='oyun',id=esc(g.id);
  const pl=plats(g).filter(x=>x.toLowerCase()!==cfg.name.toLowerCase());
  const meta=[has(g.year)?esc(g.year):'',...pl.slice(0,2).map(esc)].filter(Boolean).join(' · ');
  const gen=(g.genres||[]).filter(Boolean),chips=gen.slice(0,5).map(t=>`<span>${esc(t)}</span>`).join('');
  const more=(g.note||'').length>(poster?90:80)?'Devamını oku':'Ayrıntılar';
  const rec=g.recommended===true?`<span class="cx-rec yes">${THUMB_UP} Öneriyorum</span>`:g.recommended===false?`<span class="cx-rec no">${THUMB_DN} Önermiyorum</span>`:'';
  const note=(poster&&!g.note)?'':`<p class="cx-note${g.note?'':' none'}">${g.note?esc(g.note):'Henüz not eklenmemiş.'}</p>`;
  const head=`<h3 class="cx-title"><a class="tl" href="#${id}" title="${esc(g.title)}">${esc(g.title)}</a></h3>${meta?`<p class="cx-meta">${meta}</p>`:''}${chips?`<div class="cx-chips">${chips}</div>`:''}`;
  if(poster)return `<article class="card cx poster" data-id="${id}">${cardMedia(g)}
  <div class="cx-body">${head}<div class="cx-more"><div>${cardFacts(g)}${note}<div class="cx-foot"><span class="l">${rec}</span><a class="more" href="#${id}">${more}</a></div></div></div></div></article>`;
  return `<article class="card cx" data-id="${id}">${cardMedia(g)}
  <div class="cx-body">${head}${cardFacts(g)}${purchaseMini(g).replace(/<p class="meta purchase-mini"[^>]*>/,'<p class="cx-pur">')}${note}
  <div class="cx-foot"><span class="l">${rec}${revHtml(g)}</span><a class="more" href="#${id}">${more}</a></div></div></article>`;
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
  d.classList.add('detail-redesign');
  d.innerHTML=`${cover(g)}<div class="inner"><h2>${esc(g.title)}</h2><p class="meta">${esc(g.platform)}</p>
  <p class="tags wrapt">${chips(g)}</p>${facts(g)}${info(g)}${CAT==='oyun'?purchaseDetails(g):''}
  ${g.note?`<p class="full">${esc(g.note)}</p>`:''}${proscons(g)}<div class="row">${revHtml(g)}</div>
  <p>${randomMode?'<button class="btn pri again">Başka birini seç</button> ':''}<button class="btn card-gen-btn" data-id="${esc(g.id)}">📷 İnceleme Kartı İndir</button> <button class="btn copy">Bağlantıyı kopyala</button> <button class="btn" onclick="this.closest('dialog').close()">Kapat</button></p></div>`;
  if(!d.open)d.showModal();
  if(lastId!==id){lastId=id;try{window.goatcounter&&goatcounter.count&&goatcounter.count({path:CAT+'/'+id,title:g.title,event:true})}catch{}}
}
$('#dlg').addEventListener('close',()=>{lastId='';randomMode=false;history.replaceState(null,'',location.pathname+location.search)});
$('#dlg').addEventListener('click',e=>{
  if(e.target===e.currentTarget)return e.currentTarget.close();
  if(e.target.closest('.again'))return pickRandom();
  const cardBtn=e.target.closest('.card-gen-btn');
  if(cardBtn)return generateReviewCard(cardBtn.dataset.id,cardBtn);
  const b=e.target.closest('.copy');if(b)navigator.clipboard.writeText(location.href).then(()=>b.textContent='Kopyalandı',()=>prompt('Bağlantı:',location.href));
});

function loadCorsImage(url){
  return new Promise(res=>{
    if(!url)return res(null);
    const tries=[
      `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=1080&output=webp`,
      `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
      url
    ];
    let idx=0;
    const next=()=>{
      if(idx>=tries.length)return res(null);
      const im=new Image();
      im.crossOrigin='anonymous';
      im.onload=()=>res(im);
      im.onerror=()=>{idx++;next()};
      im.src=tries[idx];
    };
    next();
  });
}

function drawImageCover(ctx,img,x,y,w,h){
  const ir=img.width/img.height,tr=w/h;
  let sw=img.width,sh=img.height,sx=0,sy=0;
  if(ir>tr){sw=img.height*tr;sx=(img.width-sw)/2}
  else{sh=img.width/tr;sy=(img.height-sh)/2}
  ctx.drawImage(img,sx,sy,sw,sh,x,y,w,h);
}

function wrapLines(ctx,text,maxW){
  const paragraphs=String(text||'').split('\n');
  const out=[];
  paragraphs.forEach(p=>{
    const words=p.split(/\s+/).filter(Boolean);
    if(!words.length){out.push('');return}
    let line=words[0];
    for(let i=1;i<words.length;i++){
      const test=line+' '+words[i];
      if(ctx.measureText(test).width>maxW){out.push(line);line=words[i]}
      else line=test;
    }
    out.push(line);
  });
  return out;
}

/* HİZALAMALARI VE BOŞLUKLARI DÜZELTİLMİŞ TAM KART OLUŞTURUCU */
async function generateReviewCard(id,btnEl){
  const g=games.find(x=>x.id===id);if(!g)return;
  const origTxt=btnEl?btnEl.textContent:'';
  if(btnEl){btnEl.disabled=true;btnEl.textContent='Hazırlanıyor…'}

  try{
    const canvas=document.createElement('canvas');
    const ctx=canvas.getContext('2d');
    const stKey=stOf(g),W=1080,pad=48,cardW=W-pad*2,coverH=500,innerX=pad+48,innerW=cardW-96;

    ctx.font='700 44px "Bricolage Grotesque", sans-serif';
    const titleLines=wrapLines(ctx,g.title,innerW);

    ctx.font='400 26px "Nunito Sans", sans-serif';
    const noteText=g.note?g.note:'Bu içerik için henüz inceleme notu eklenmemiş.';
    const noteLines=wrapLines(ctx,noteText,innerW);

    const pros=(g.pros||[]).filter(Boolean),cons=(g.cons||[]).filter(Boolean);
    ctx.font='400 22px "Nunito Sans", sans-serif';
    const proWrapped=pros.map(p=>wrapLines(ctx,p,innerW/2-55));
    const conWrapped=cons.map(c=>wrapLines(ctx,c,innerW/2-55));
    const proH=proWrapped.reduce((t,l)=>t+l.length*32+10,0);
    const conH=conWrapped.reduce((t,l)=>t+l.length*32+10,0);
    const pcBoxH=(pros.length||cons.length)?Math.max(proH,conH)+80:0;

    const factsList=[];
    const dt=durText(g);
    if(dt)factsList.push([cfg.dur.label||'Süre',dt]);
    if(g.finished)factsList.push([cfg.dateLabel,fmtDate(g.finished)]);
    if(has(g.year))factsList.push([cfg.yearLabel,String(g.year)]);
    if(g[cfg.person.key])factsList.push([cfg.person.label,g[cfg.person.key]]);

    let simY = pad + coverH + 88;
    simY += titleLines.length * 52 + 16;
    simY += 46;
    if(factsList.length) simY += 64 + 34;
    simY += noteLines.length * 42 + 32;
    if(pcBoxH) simY += pcBoxH + 32;
    const footerH = 74;
    const cardH = (simY - pad) + footerH;
    const totalCanvasH = cardH + pad * 2;

    canvas.width=W;
    canvas.height=totalCanvasH;

    const img=await loadCorsImage(g.image);

    ctx.fillStyle='#12161b';
    ctx.fillRect(0,0,W,canvas.height);
    if(img){
      ctx.save();
      ctx.globalAlpha=0.25;
      ctx.filter='blur(30px)';
      drawImageCover(ctx,img,-40,-40,W+80,canvas.height+80);
      ctx.restore();
    }

    const cardX=pad,cardY=pad;
    ctx.save();
    ctx.fillStyle='#20272e';
    ctx.strokeStyle='#2f3841';
    ctx.lineWidth=3;
    ctx.beginPath();
    ctx.roundRect(cardX,cardY,cardW,cardH,28);
    ctx.fill();
    ctx.stroke();
    ctx.clip();

    ctx.fillStyle='#171c21';
    ctx.fillRect(cardX,cardY,cardW,coverH);
    if(img){
      drawImageCover(ctx,img,cardX,cardY,cardW,coverH);
      const cg=ctx.createLinearGradient(0,cardY+coverH-170,0,cardY+coverH);
      cg.addColorStop(0,'rgba(32,39,46,0)');
      cg.addColorStop(1,'rgba(32,39,46,0.96)');
      ctx.fillStyle=cg;
      ctx.fillRect(cardX,cardY,cardW,coverH);
    }

    if(g.favorite===true){
      ctx.fillStyle='rgba(32,39,46,0.9)';ctx.strokeStyle='#2f3841';ctx.lineWidth=2;
      ctx.beginPath();ctx.arc(cardX+48,cardY+48,28,0,Math.PI*2);ctx.fill();ctx.stroke();
      ctx.fillStyle='#d9917f';ctx.font='28px sans-serif';ctx.textAlign='center';
      ctx.fillText('♥',cardX+48,cardY+58);ctx.textAlign='left';
    }

    const stTxt=ST[stKey]||stKey;
    ctx.font='700 22px "Nunito Sans", sans-serif';
    const stW=ctx.measureText(stTxt).width+38;
    ctx.fillStyle='rgba(32,39,46,0.9)';ctx.strokeStyle='#2f3841';ctx.lineWidth=2;
    ctx.beginPath();ctx.roundRect(cardX+cardW-stW-28,cardY+28,stW,44,999);ctx.fill();ctx.stroke();
    ctx.fillStyle=stKey==='oynuyorum'?'#6fb3ba':stKey==='biraktim'?'#d9917f':'#e3e8ec';
    ctx.fillText(stTxt,cardX+cardW-stW-9,cardY+57);

    const coverBottom=cardY+coverH;

    if(has(g.score)){
      const r=44,cx=innerX+r,cy=coverBottom-6;
      ctx.fillStyle='#6fb3ba';ctx.strokeStyle='#20272e';ctx.lineWidth=8;
      ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fill();ctx.stroke();
      ctx.fillStyle='#12181c';ctx.font='700 32px "Bricolage Grotesque", sans-serif';
      ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillText(num(g.score),cx,cy+2);
      ctx.textAlign='left';ctx.textBaseline='alphabetic';
    }

    if(g.recommended===true||g.recommended===false){
      const rTxt=g.recommended?'Öneriyorum':'Önermiyorum';
      ctx.font='700 22px "Nunito Sans", sans-serif';
      const rW=ctx.measureText(rTxt).width+44;
      const rx=cardX+cardW-rW-44,ry=coverBottom-28;
      ctx.fillStyle='#20272e';ctx.strokeStyle='#2f3841';ctx.lineWidth=3;
      ctx.beginPath();ctx.roundRect(rx,ry,rW,46,999);ctx.fill();ctx.stroke();
      ctx.fillStyle=g.recommended?'#6cc19a':'#d9917f';
      ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillText(rTxt,rx+rW/2,ry+24);
      ctx.textAlign='left';ctx.textBaseline='alphabetic';
    }

    let y = coverBottom + 88;

    ctx.fillStyle='#e3e8ec';
    ctx.font='700 44px "Bricolage Grotesque", sans-serif';
    titleLines.forEach(l=>{ctx.fillText(l,innerX,y);y+=52});
    y+=16;

    let tagX=innerX;
    if(g.platform){
      ctx.fillStyle='#93a0ab';ctx.font='700 23px "Nunito Sans", sans-serif';
      ctx.fillText(g.platform,tagX,y);
      tagX+=ctx.measureText(g.platform).width+20;
    }
    ctx.font='600 20px "Nunito Sans", sans-serif';
    (g.genres||[]).forEach(gn=>{
      const gw=ctx.measureText(gn).width+26;
      if(tagX+gw<=innerX+innerW){
        ctx.fillStyle='#171c21';ctx.strokeStyle='#2f3841';ctx.lineWidth=1.5;
        ctx.beginPath();ctx.roundRect(tagX,y-25,gw,34,8);ctx.fill();ctx.stroke();
        ctx.fillStyle='#93a0ab';
        ctx.textAlign='center';ctx.fillText(gn,tagX+gw/2,y-1);ctx.textAlign='left';
        tagX+=gw+10;
      }
    });
    y+=46;

    if(factsList.length){
      ctx.fillStyle='#171c21';ctx.strokeStyle='#2f3841';ctx.lineWidth=1.5;
      ctx.beginPath();ctx.roundRect(innerX,y,innerW,64,14);ctx.fill();ctx.stroke();
      let fx=innerX+24;
      ctx.font='600 21px "Nunito Sans", sans-serif';
      ctx.textBaseline='middle';
      const midY=y+33;
      factsList.forEach(([lbl,val])=>{
        const segW=ctx.measureText(lbl+': '+val).width;
        if(fx+segW>innerX+innerW-16)return;
        ctx.fillStyle='#93a0ab';ctx.fillText(lbl+': ',fx,midY);
        fx+=ctx.measureText(lbl+': ').width;
        ctx.fillStyle='#e3e8ec';ctx.fillText(val,fx,midY);
        fx+=ctx.measureText(val).width+32;
      });
      ctx.textBaseline='alphabetic';
      y+=64+48;
    }else{
      y+=16;
    }

    ctx.fillStyle=g.note?'#e3e8ec':'#93a0ab';
    ctx.font=(g.note?'400 ':'italic 400 ')+'26px "Nunito Sans", sans-serif';
    noteLines.forEach(l=>{ctx.fillText(l,innerX,y);y+=42});
    y+=16;

    if(pros.length||cons.length){
      const colW=(innerW-24)/2;
      if(pros.length){
        ctx.fillStyle='#171c21';ctx.strokeStyle='#2f3841';ctx.lineWidth=2;
        ctx.beginPath();ctx.roundRect(innerX,y,cons.length?colW:innerW,pcBoxH,16);ctx.fill();ctx.stroke();
        ctx.fillStyle='#6cc19a';ctx.font='700 24px "Bricolage Grotesque", sans-serif';
        ctx.fillText('Artılar',innerX+24,y+40);
        let py=y+76;ctx.font='400 22px "Nunito Sans", sans-serif';
        proWrapped.forEach(lines=>{
          ctx.fillStyle='#6cc19a';ctx.fillText('+',innerX+24,py);
          ctx.fillStyle='#e3e8ec';
          lines.forEach(ln=>{ctx.fillText(ln,innerX+48,py);py+=32});
          py+=10;
        });
      }
      if(cons.length){
        const cx=pros.length?innerX+colW+24:innerX;
        const cw=pros.length?colW:innerW;
        ctx.fillStyle='#171c21';ctx.strokeStyle='#2f3841';ctx.lineWidth=2;
        ctx.beginPath();ctx.roundRect(cx,y,cw,pcBoxH,16);ctx.fill();ctx.stroke();
        ctx.fillStyle='#d9917f';ctx.font='700 24px "Bricolage Grotesque", sans-serif';
        ctx.fillText('Eksiler',cx+24,y+40);
        let cy=y+76;ctx.font='400 22px "Nunito Sans", sans-serif';
        conWrapped.forEach(lines=>{
          ctx.fillStyle='#d9917f';ctx.fillText('–',cx+24,cy);
          ctx.fillStyle='#e3e8ec';
          lines.forEach(ln=>{ctx.fillText(ln,cx+48,cy);cy+=32});
          cy+=10;
        });
      }
      y+=pcBoxH+24;
    }

    const footLineY=cardY+cardH-footerH;
    ctx.strokeStyle='#2f3841';ctx.lineWidth=1.5;
    ctx.beginPath();ctx.moveTo(innerX,footLineY);ctx.lineTo(innerX+innerW,footLineY);ctx.stroke();
    ctx.fillStyle='#93a0ab';ctx.font='600 20px "Nunito Sans", sans-serif';
    ctx.textBaseline='middle';
    ctx.fillText((CF.siteTitle||'Günlüğüm')+' • '+cfg.plural,innerX,footLineY+footerH/2);
    if(g.finished){
      ctx.textAlign='right';
      ctx.fillText(fmtDate(g.finished),innerX+innerW,footLineY+footerH/2);
      ctx.textAlign='left';
    }
    ctx.textBaseline='alphabetic';
    ctx.restore();

    const link=document.createElement('a');
    link.download=`inceleme-${g.title.toLowerCase().replace(/[^a-z0-9ğüşıöç]/g,'-')}.png`;
    link.href=canvas.toDataURL('image/png');
    link.click();
  }finally{
    if(btnEl){btnEl.disabled=false;btnEl.textContent=origTxt}
  }
}

$('#grid').addEventListener('click',e=>{
  const c=e.target.closest('.card,tr[data-id]');if(!c||e.target.closest('a[target]'))return;
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
