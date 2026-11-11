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
    ['/technopat/dizi-film-onerileri/', 'Technopat önerilerim', 'tech-recommendations'],
    ['/istatistik/', 'İstatistik', 'stats'],
    ['/kisiler/', 'Kişiler', 'people'],
    ['/oneriler/', 'Önerilerim', 'recommendations'],
    ['/cekilis/', 'Çekiliş', 'giveaway'],
    ['/ara/', 'Arama', 'search']
  ];
  const nav = document.createElement('nav');
  nav.className = 'folio-nav';
  nav.setAttribute('aria-label', 'Ana gezinme');
  nav.innerHTML = links.map(([href, label, id]) => {
    const isActive = id === 'home' ? path === '/' :
      id === 'technopat' ? (path.startsWith('/technopat/') && !path.startsWith('/technopat/dizi-film-onerileri')) :
      id === 'tech-recommendations' ? path.startsWith('/technopat/dizi-film-onerileri') :
      id === 'oyun' ? path === '/oyun' || path.startsWith('/oyun/') :
      path === href.replace(/\/$/, '');
    const searchAttrs = id === 'search' ? ' class="top-search-link" aria-label="Arama penceresini aç" title="Ara" aria-haspopup="dialog" aria-expanded="false"' : '';
    return `<a href="${href}"${searchAttrs}${isActive ? ' aria-current="page"' : ''}><span>${label}</span></a>`;
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
