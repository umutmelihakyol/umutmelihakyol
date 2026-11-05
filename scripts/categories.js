// Tüm kategorilerin ortak tanımı. Yeni bir kategori eklemek için buraya yeni bir blok ekle.
(function(){
const SITE_ROOT = new URL('../', document.currentScript.src).href;
const P={
  oyun:'<path d="M6 11h4"/><path d="M8 9v4"/><path d="M15 12h.01"/><path d="M18 10h.01"/><path d="M17.32 5H6.68a4 4 0 0 0-3.978 3.59l-.5 4.5a4 4 0 0 0 6.72 3.68l1.47-1.33a2.25 2.25 0 0 1 3.22 0l1.47 1.33a4 4 0 0 0 6.72-3.68l-.5-4.5A4 4 0 0 0 17.32 5Z"/>',
  film:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4"/>',
  dizi:'<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M8 21h8M12 18v3M9 3l3 3 3-3"/>',
  anime:'<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 17v4M17 19h4"/>',
  home:'<path d="M3 11l9-8 9 8"/><path d="M5 10v10h5v-6h4v6h5V10"/>'
};
window.ICON=k=>'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+P[k]+'</svg>';
const A=(u,t)=>`<a href="${u}" target="_blank" rel="noopener">${t}</a>`;
const watch=(done,doing,drop,want)=>({bitirdim:done,oynuyorum:doing,biraktim:drop,istek:want});
window.SITE_ROOT = SITE_ROOT;
// Bilinen görsel CDN'lerinde kart boyutuna uygun dosya varyantını kullanır.
// Diğer kaynakların adreslerine dokunmaz; kayıt JSON'undaki özgün URL korunur.
window.IMAGE_SRC = (raw, width=500) => {
  try {
    const url = new URL(String(raw || ''));
    if (!/^https?:$/.test(url.protocol)) return '';
    if (url.hostname === 'image.tmdb.org') {
      const size = width <= 220 ? 'w185' : 'w342';
      url.pathname = url.pathname.replace(/\/t\/p\/(?:w\d+|original)\//, `/t/p/${size}/`);
    } else if (/^s\d+\.anilist\.co$/.test(url.hostname) && width <= 500) {
      url.pathname = url.pathname.replace('/cover/large/', '/cover/medium/');
    }
    return url.href;
  } catch {
    return '';
  }
};
window.CATS={
  oyun:{page:SITE_ROOT+'oyun/',file:'data/games.json',name:'Oyun',noun:'oyun',plural:'Oyunlar',title:'Oyunlarım',
    desc:'Oynadığım oyunlar, puanlarım ve incelemelerim',
    st:{bitirdim:'Bitirdim',oynuyorum:'Oynuyorum',biraktim:'Yarım bıraktım',istek:'İstek listesi'},
    nof:{bitirdim:'Süre ve tarih girilmemiş',oynuyorum:'Şu an oynuyorum',biraktim:'Yarım bıraktım',istek:'Henüz oynamadım'},
    soon:'Yakında bitireceklerim',
    plat:{label:'Platform',all:'Tüm platformlar',ph:'PC, PS5, Switch…'},
    dur:{key:'hours',label:'Süre',unit:'saat',form:'Bitirme süresi (saat)',step:0.5,sort:'En uzun süre',req:true},
    tot:{key:'hours',div:1,unit:'saat'},person:{key:'developer',label:'Geliştirici'},
    yearLabel:'Çıkış yılı',dateLabel:'Bitiş',dateForm:'Bitirdiğim tarih',dateSort:'En son bitirilen',doneNoun:'bitirilen oyun',
    searchPh:'örn. Hades',credit:'Oyun verileri ve görselleri '+A('https://rawg.io','RAWG')+' kaynaklıdır.'},
  film:{page:SITE_ROOT+'film/',file:'data/movies.json',name:'Film',noun:'film',plural:'Filmler',title:'Filmlerim',
    desc:'İzlediğim filmler, puanlarım ve yorumlarım',
    st:watch('İzledim','İzliyorum','Yarım bıraktım','İzleme listesi'),
    nof:watch('Süre ve tarih girilmemiş','Şu an izliyorum','Yarım bıraktım','Henüz izlemedim'),
    soon:'Şu an izlediklerim',
    plat:{label:'İzleme yeri',all:'Tüm yerler',ph:'Netflix, Sinema…'},
    dur:{key:'minutes',label:'Süre',unit:'dk',form:'Süre (dakika)',step:1,sort:'En uzun film'},
    tot:{key:'minutes',div:60,unit:'saat'},person:{key:'director',label:'Yönetmen'},
    yearLabel:'Çıkış yılı',dateLabel:'İzleme',dateForm:'İzlediğim tarih',dateSort:'En son izlenen',doneNoun:'izlenen film',
    searchPh:'örn. Inception',credit:'Bu site '+A('https://www.themoviedb.org','TMDB')+' API\'sini kullanır ancak TMDB tarafından onaylanmamış ya da sertifikalandırılmamıştır.'},
  dizi:{page:SITE_ROOT+'dizi/',file:'data/series.json',name:'Dizi',noun:'dizi',plural:'Diziler',title:'Dizilerim',
    desc:'İzlediğim diziler, puanlarım ve yorumlarım',
    st:watch('Bitirdim','İzliyorum','Yarım bıraktım','İzleme listesi'),
    nof:watch('Bölüm ve tarih girilmemiş','Şu an izliyorum','Yarım bıraktım','Henüz izlemedim'),
    soon:'Şu an izlediklerim',
    plat:{label:'İzleme yeri',all:'Tüm yerler',ph:'Netflix, Disney+…'},
    dur:{key:'seasons',label:'',unit:'sezon',form:'Sezon sayısı',step:1,sort:'En çok sezon'},
    dur2:{key:'episodes',unit:'bölüm',form:'Bölüm sayısı'},
    tot:{key:'episodes',div:1,unit:'bölüm'},person:{key:'creator',label:'Yaratıcı'},
    yearLabel:'İlk yayın yılı',dateLabel:'Bitiş',dateForm:'Bitirdiğim tarih',dateSort:'En son bitirilen',doneNoun:'bitirilen dizi',
    searchPh:'örn. Breaking Bad',credit:'Bu site '+A('https://www.themoviedb.org','TMDB')+' API\'sini kullanır ancak TMDB tarafından onaylanmamış ya da sertifikalandırılmamıştır.'},
  anime:{page:SITE_ROOT+'anime/',file:'data/anime.json',name:'Anime',noun:'anime',plural:'Animeler',title:'Animelerim',
    desc:'İzlediğim animeler, puanlarım ve yorumlarım',
    st:watch('Bitirdim','İzliyorum','Yarım bıraktım','İzleme listesi'),
    nof:watch('Bölüm ve tarih girilmemiş','Şu an izliyorum','Yarım bıraktım','Henüz izlemedim'),
    soon:'Şu an izlediklerim',
    plat:{label:'İzleme yeri',all:'Tüm yerler',ph:'Crunchyroll, Netflix…'},
    dur:{key:'episodes',label:'',unit:'bölüm',form:'Bölüm sayısı',step:1,sort:'En çok bölüm'},
    tot:{key:'episodes',div:1,unit:'bölüm'},person:{key:'studio',label:'Stüdyo'},
    yearLabel:'Yayın yılı',dateLabel:'Bitiş',dateForm:'Bitirdiğim tarih',dateSort:'En son bitirilen',doneNoun:'bitirilen anime',
    searchPh:'örn. Frieren',credit:'Anime verileri '+A('https://jikan.moe','Jikan')+' (MyAnimeList) kaynaklıdır.'}
};
})();
