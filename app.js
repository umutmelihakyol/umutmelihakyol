// Kategori sayfalarının ortak kodu. Hangi kategori olduğunu <body data-cat="..."> belirler.
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeUrl=u=>/^https?:\/\//i.test(u||'')?esc(u):'';
const fmtDate=d=>d?new Date(d).toLocaleDateString('tr-TR',{year:'numeric',month:'long'}):'—';
const num=v=>(+v).toLocaleString('tr',{maximumFractionDigits:1});
const has=v=>v!==null&&v!==undefined&&v!=='';
const CAT=document.body.dataset.cat,cfg=CATS[CAT],ST=cfg.st,CF=window.CONFIG||{};
const stOf=g=>g.status||'bitirdim';
const plats=g=>String(g.platform||'').split(',').map(x=>x.trim()).filter(Boolean);
let games=[],st='all',favOnly=false,vis=[],randomMode=false,view='card',lastId='';
try{view=localStorage.getItem('view')||'card'}catch{}

/* başlık, gezinme, sabit metinler */
document.title=cfg.title+' - '+(CF.siteTitle||'Günlüğüm');
$('#title').textContent=cfg.title;
$('#soonTitle').textContent=cfg.soon;
$('#dlg').setAttribute('aria-label',cfg.name+' ayrıntıları');
$('#q').placeholder=cfg.name+' ara…';
$('#rnd').title='Şu an listelenen '+cfg.plural.toLowerCase()+' arasından rastgele birini seçer';
$('#sort').innerHTML=`<option value="date">${cfg.dateSort}</option><option value="score">En yüksek puan</option><option value="dur">${cfg.dur.sort}</option><option value="name">A-Z</option>`;
$('#cats').innerHTML=`<a href="index.html">${ICON('home')} Ana sayfa</a>`+Object.entries(CATS).map(([k,c])=>`<a href="${c.page}"${k===CAT?' aria-current="page"':''}>${ICON(k)} ${c.plural}</a>`).join('');
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
  G.querySelectorAll('.card').forEach(c=>{const n=c.querySelector('.note');if(n.scrollHeight>n.clientHeight+1)c.querySelector('.more').textContent='Devamını oku'});
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
const proscons=g=>{const p=(g.pros||[]).filter(Boolean),c=(g.cons||[]).filter(Boolean);if(!p.length&&!c.length)return '';
  const col=(t,cls,l)=>l.length?`<div class="pc ${cls}"><h4>${t}</h4><ul>${l.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>`:'';
  return `<div class="pcs">${col('Artılar','pro',p)}${col('Eksiler','con',c)}</div>`};
const chips=g=>(g.genres||[]).map(t=>`<span>${esc(t)}</span>`).join('');
const cover=g=>`<div class="cover">${g.image?`<img src="${safeUrl(g.image)}" alt="${esc(g.title)} görseli" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">`:''}${g.favorite===true?`<span class="fvb" title="Favorim">${HEART}</span>`:''}<span class="stb s-${stOf(g)}">${ST[stOf(g)]}</span>${has(g.score)?`<span class="score" title="Puanım">${num(g.score)}</span>`:''}${recChip(g)}</div>`;
function card(g){
  return `<article class="card" data-id="${esc(g.id)}">${cover(g)}
  <div class="body"><h3><a class="tl" href="#${esc(g.id)}" title="${esc(g.title)}">${esc(g.title)}</a></h3>
  <div class="sub"><span class="plat">${esc(g.platform)}</span><span class="tags">${chips(g)}</span></div>
  ${facts(g)}<p class="note${g.note?'':' none'}">${g.note?esc(g.note):'Henüz not eklenmemiş.'}</p>
  <div class="row"><a class="more" href="#${esc(g.id)}">Ayrıntılar</a>${revHtml(g)}</div></div></article>`;
}
const thumb=(g,c)=>g.image?`<img class="${c}" src="${safeUrl(g.image)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">`:`<span class="${c} ph"></span>`;
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
  d.innerHTML=`${cover(g)}<div class="inner"><h2>${esc(g.title)}</h2><p class="meta">${esc(g.platform)}</p>
  <p class="tags wrapt">${chips(g)}</p>${facts(g)}${info(g)}
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
  if(cardBtn)return generateReviewCard(cardBtn.dataset.id);
  const b=e.target.closest('.copy');if(b)navigator.clipboard.writeText(location.href).then(()=>b.textContent='Kopyalandı',()=>prompt('Bağlantı:',location.href));
});

/* İNCELEME KARTI (PNG) OLUŞTURUCU */
async function generateReviewCard(id){
  const g=games.find(x=>x.id===id);if(!g)return;
  const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1080;
  const ctx=canvas.getContext('2d');

  // Arka plan rengi / gradyan
  ctx.fillStyle='#0f141c';ctx.fillRect(0,0,1080,1080);

  // Kapak görseli (arkada hafif blur/koyulaştırılmış şekilde)
  if(g.image){
    try{
      const img=await new Promise((res,rej)=>{
        const im=new Image();im.crossOrigin='anonymous';im.onload=()=>res(im);im.onerror=rej;im.src=g.image;
      });
      ctx.save();ctx.globalAlpha=0.25;
      const r=img.width/img.height;
      let sw=1080,sh=1080/r,sx=0,sy=(1080-sh)/2;
      if(sh<1080){sh=1080;sw=1080*r;sx=(1080-sw)/2;sy=0}
      ctx.drawImage(img,sx,sy,sw,sh);
      ctx.restore();
    }catch{}
  }

  // Karartma katmanı
  const grad=ctx.createLinearGradient(0,0,0,1080);
  grad.addColorStop(0,'rgba(15,20,28,0.75)');grad.addColorStop(1,'rgba(15,20,28,0.95)');
  ctx.fillStyle=grad;ctx.fillRect(0,0,1080,1080);

  // Çerçeve / Kart Kutusu
  ctx.fillStyle='rgba(32,39,46,0.85)';ctx.strokeStyle='rgba(255,255,255,0.1)';ctx.lineWidth=2;
  ctx.beginPath();ctx.roundRect(60,60,960,960,24);ctx.fill();ctx.stroke();

  // Sol üst afiş resmi küçük kutu
  if(g.image){
    try{
      const img=await new Promise((res,rej)=>{
        const im=new Image();im.crossOrigin='anonymous';im.onload=()=>res(im);im.onerror=rej;im.src=g.image;
      });
      ctx.save();ctx.beginPath();ctx.roundRect(100,100,260,350,16);ctx.clip();
      ctx.drawImage(img,100,100,260,350);
      ctx.restore();
      ctx.strokeStyle='rgba(255,255,255,0.15);';ctx.lineWidth=2;ctx.strokeRect(100,100,260,350);
    }catch{}
  }

  // Başlık ve Platform
  ctx.fillStyle='#e3e8ec';ctx.font='bold 42px "Bricolage Grotesque", sans-serif';
  let title=g.title;if(title.length>32)title=title.slice(0,30)+'...';
  ctx.fillText(title,390,160);

  ctx.fillStyle='#93a0ab';ctx.font='24px "Nunito Sans", sans-serif';
  ctx.fillText(g.platform||cfg.name,390,210);
  ctx.fillText(`Kategori: ${cfg.plural} | Durum: ${ST[stOf(g)]||'Bitirildi'}`,390,250);

  // Puan Rozeti
  if(has(g.score)){
    ctx.fillStyle='#6fb3ba';ctx.beginPath();ctx.arc(320,410,48,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#12181c';ctx.font='bold 34px "Bricolage Grotesque", sans-serif';ctx.textAlign='center';
    ctx.fillText(`${num(g.score)}`,320,422);ctx.textAlign='left';
  }

  // Not / İnceleme Metni
  ctx.fillStyle='#e3e8ec';ctx.font='26px "Nunito Sans", sans-serif';
  const noteText=g.note?g.note:'Bu içerik için henüz not eklenmemiş.';
  const words=noteText.split(' ');let line='';const lines=[];
  for(let n=0;n<words.length;n++){
    const testLine=line+words[n]+' ';
    if(ctx.measureText(testLine).width>840&&n>0){lines.push(line);line=words[n]+' '}
    else {line=testLine}
  }
  lines.push(line);
  let curY=510;
  for(let i=0;i<Math.min(lines.length,5);i++){
    ctx.fillText(lines[i],100,curY);curY+=38;
  }

  // Artılar ve Eksiler
  const pros=(g.pros||[]).slice(0,3);const cons=(g.cons||[]).slice(0,3);
  if(pros.length||cons.length){
    curY+=20;
    ctx.fillStyle='#6cc19a';ctx.font='bold 22px "Bricolage Grotesque", sans-serif';ctx.fillText('(+) Artılar',100,curY);
    ctx.fillStyle='#d9917f';ctx.fillText('(-) Eksiler',560,curY);
    curY+=32;ctx.font='20px "Nunito Sans", sans-serif';
    const maxLen=Math.max(pros.length,cons.length);
    for(let i=0;i<maxLen;i++){
      if(pros[i]){ctx.fillStyle='#e3e8ec';ctx.fillText('• '+pros[i],100,curY)}
      if(cons[i]){ctx.fillStyle='#e3e8ec';ctx.fillText('• '+cons[i],560,curY)}
      curY+=30;
    }
  }

  // Alt Bilgi (Site Adı)
  ctx.fillStyle='#93a0ab';ctx.font='18px "Nunito Sans", sans-serif';
  ctx.fillText(window.CONFIG?.siteTitle||'Günlüğüm Arşivi',100,970);

  // İndirme Bağlantısı Oluştur
  const link=document.createElement('a');
  link.download=`inceleme-${g.title.toLowerCase().replace(/[^a-z0-9]/g,'-')}.png`;
  link.href=canvas.toDataURL('image/png');
  link.click();
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
fetch(cfg.file+'?'+Date.now()).then(r=>r.ok?r.json():[]).catch(()=>[]).then(d=>{
  games=d;fillSel('#plat',cfg.plat.all,d.flatMap(plats));fillSel('#genre','Tüm türler',d.flatMap(g=>g.genres||[]));
  render();soon();foot();if(location.hash)openGame(location.hash.slice(1));
});
