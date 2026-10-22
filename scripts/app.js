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
document.title=cfg.title+' - '+(CF.siteTitle||'Günlüğüm');
$('#title').textContent=cfg.title;
$('#soonTitle').textContent=cfg.soon;
$('#dlg').setAttribute('aria-label',cfg.name+' ayrıntıları');
$('#q').placeholder=cfg.name+' ara…';
$('#rnd').title='Şu an listelenen '+cfg.plural.toLowerCase()+' arasından rastgele birini seçer';
$('#sort').innerHTML=`<option value="date">${cfg.dateSort}</option><option value="score">En yüksek puan</option><option value="dur">${cfg.dur.sort}</option><option value="name">A-Z</option>`;
$('#cats').innerHTML=`<a href="${SITE_ROOT}index.html">${ICON('home')} Ana sayfa</a>`+Object.entries(CATS).map(([k,c])=>`<a href="${c.page}"${k===CAT?' aria-current="page"':''}>${ICON(k)} ${c.plural}</a>`).join('');
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
const cover=g=>`<div class="cover">${imageSrc(g.image,500)?`<img src="${imageSrc(g.image,500)}" alt="${esc(g.title)} görseli" loading="lazy" decoding="async" fetchpriority="low" referrerpolicy="no-referrer" onerror="this.remove();this.parentElement.classList.add('image-missing')">`:''}${g.favorite===true?`<span class="fvb" title="Favorim">${HEART}</span>`:''}<span class="stb s-${stOf(g)}">${ST[stOf(g)]}</span>${has(g.score)?`<span class="score" title="Puanım">${num(g.score)}</span>`:''}${recChip(g)}</div>`;
function card(g){
  return `<article class="card" data-id="${esc(g.id)}">${cover(g)}
  <div class="body"><h3><a class="tl" href="#${esc(g.id)}" title="${esc(g.title)}">${esc(g.title)}</a></h3>
  <div class="sub"><span class="plat">${esc(g.platform)}</span><span class="tags">${chips(g)}</span></div>
  ${facts(g)}<p class="note${g.note?'':' none'}">${g.note?esc(g.note):'Henüz not eklenmemiş.'}</p>
  <div class="row"><a class="more" href="#${esc(g.id)}">Ayrıntılar</a>${revHtml(g)}</div></div></article>`;
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
fetch(new URL(cfg.file, SITE_ROOT).href, {cache:'no-cache'}).then(r=>r.ok?r.json():[]).catch(()=>[]).then(d=>{
  games=d;fillSel('#plat',cfg.plat.all,d.flatMap(plats));fillSel('#genre','Tüm türler',d.flatMap(g=>g.genres||[]));
  render();soon();foot();if(location.hash)openGame(location.hash.slice(1));
});
