/* Günlüğüm — masaüstü ve mobilde en üste / en alta hızlı gezinme */
(() => {
  'use strict';

  if (window.__gunlugumPageJumpReady) return;
  window.__gunlugumPageJumpReady = true;

  const mobileLayout = window.matchMedia
    ? window.matchMedia('(max-width: 760px), (pointer: coarse)')
    : { matches: false };

  const dock = document.createElement('div');
  dock.className = 'page-jump-dock';
  dock.setAttribute('role', 'group');
  dock.setAttribute('aria-label', 'Sayfa içinde hızlı gezinme');
  dock.hidden = true;
  document.body.appendChild(dock);

  const makeButton = (id, label, iconPath) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.id = id;
    button.className = 'page-jump-control';
    button.setAttribute('aria-label', label);
    button.title = label;
    button.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconPath}</svg>`;
    dock.appendChild(button);
    return button;
  };

  const upButton = makeButton(
    'pageJumpToTop',
    'Sayfanın en üstüne çık',
    '<path d="M12 19V5"/><path d="m5 12 7-7 7 7"/>'
  );
  const downButton = makeButton(
    'pageJumpToBottom',
    'Sayfanın en altına in',
    '<path d="M12 5v14"/><path d="m19 12-7 7-7-7"/>'
  );

  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const scrollBehavior = reduceMotion ? 'auto' : 'smooth';
  let frameQueued = false;

  function getScrollMetrics() {
    const doc = document.documentElement;
    const body = document.body;
    const viewport = Math.max(1, doc.clientHeight || window.innerHeight || 1);
    const height = Math.max(
      doc.scrollHeight || 0,
      body ? body.scrollHeight : 0,
      doc.offsetHeight || 0,
      body ? body.offsetHeight : 0
    );
    const position = Math.max(
      window.scrollY || 0,
      doc.scrollTop || 0,
      body ? body.scrollTop || 0 : 0
    );
    return { height, viewport, position, maxScroll: Math.max(0, height - viewport) };
  }

  function updateButtons() {
    frameQueued = false;
    if (!document.body) return;

    const { maxScroll, position } = getScrollMetrics();
    // Önceki 140 px eşiği telefondaki kısa sayfalarda düğmeleri tamamen gizleyebiliyordu.
    if (maxScroll <= 24) {
      dock.hidden = true;
      return;
    }

    dock.hidden = false;
    const isAtTop = position <= 24;
    const isAtBottom = maxScroll - position <= 24;

    if (mobileLayout.matches) {
      // Dokunmatik ekranda iki yön de sürekli görünür; sayfa sınırındaki yön pasifleşir.
      upButton.hidden = false;
      downButton.hidden = false;
      upButton.disabled = isAtTop;
      downButton.disabled = isAtBottom;
      upButton.setAttribute('aria-disabled', String(isAtTop));
      downButton.setAttribute('aria-disabled', String(isAtBottom));
    } else {
      // Masaüstünde başta alta in, kaydırıldıktan sonra üste çık düğmesi gösterilir.
      upButton.hidden = isAtTop;
      downButton.hidden = !isAtTop;
      upButton.disabled = false;
      downButton.disabled = false;
      upButton.removeAttribute('aria-disabled');
      downButton.removeAttribute('aria-disabled');
    }
  }

  function scheduleUpdate() {
    if (frameQueued) return;
    frameQueued = true;
    window.requestAnimationFrame(updateButtons);
  }

  upButton.addEventListener('click', () => {
    if (upButton.disabled) return;
    window.scrollTo({ top: 0, behavior: scrollBehavior });
  });

  downButton.addEventListener('click', () => {
    if (downButton.disabled) return;
    const { maxScroll } = getScrollMetrics();
    window.scrollTo({ top: maxScroll, behavior: scrollBehavior });
  });

  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', scheduleUpdate, { passive: true });
  window.addEventListener('orientationchange', scheduleUpdate, { passive: true });
  window.addEventListener('pageshow', scheduleUpdate, { passive: true });
  window.addEventListener('load', scheduleUpdate, { once: true });
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', scheduleUpdate, { passive: true });
    window.visualViewport.addEventListener('scroll', scheduleUpdate, { passive: true });
  }

  if (mobileLayout.addEventListener) {
    mobileLayout.addEventListener('change', scheduleUpdate);
  } else if (mobileLayout.addListener) {
    mobileLayout.addListener(scheduleUpdate);
  }

  // Dinamik olarak eklenen kartlar veya içerikler sayfa boyunu değiştirebilir.
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(scheduleUpdate);
    observer.observe(document.documentElement);
    observer.observe(document.body);
  } else if ('MutationObserver' in window) {
    const observer = new MutationObserver(scheduleUpdate);
    observer.observe(document.body, { childList: true, subtree: true });
  }

  scheduleUpdate();
})();
