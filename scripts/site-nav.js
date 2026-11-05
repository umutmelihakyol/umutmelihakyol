/* Günlüğüm — ortak yayın navigasyonu */
(() => {
  const body = document.body;
  if (!body || body.dataset.navBuilt === '1') return;
  const path = location.pathname.replace(/index\.html$/i, '').replace(/\/$/, '') || '/';
  const links = [
    ['/', 'Ana sayfa', 'home'],
    ['/oyun/', 'Oyunlar', 'oyun'],
    ['/film/', 'Filmler', 'film'],
    ['/dizi/', 'Diziler', 'dizi'],
    ['/anime/', 'Anime', 'anime'],
    ['/technopat/incelemeler/', 'Yazılarım', 'technopat'],
    ['/istatistik/', 'İstatistik', 'stats'],
    ['/kisiler/', 'Kişiler', 'people'],
    ['/cekilis/', 'Çekiliş', 'giveaway'],
    ['/ara/', 'Arama', 'search']
  ];
  const nav = document.createElement('nav');
  nav.className = 'folio-nav';
  nav.setAttribute('aria-label', 'Ana gezinme');
  nav.innerHTML = links.map(([href, label, id]) => {
    const isActive = id === 'home' ? path === '/' :
      id === 'technopat' ? path.startsWith('/technopat/') :
      id === 'oyun' ? path === '/oyun' || path.startsWith('/oyun/') :
      path === href.replace(/\/$/, '');
    return `<a href="${href}"${isActive ? ' aria-current="page"' : ''}><span>${label}</span></a>`;
  }).join('');

  const header = document.querySelector('.top, .tech-page-top, .gw-topbar');
  if (header) {
    header.insertAdjacentElement('afterend', nav);
  } else {
    const host = document.querySelector('.wrap, .people-wrap, .gw-wrap, main');
    if (host) host.prepend(nav);
  }
  body.dataset.navBuilt = '1';
})();
