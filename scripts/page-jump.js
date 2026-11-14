/* Günlüğüm — her sayfada en üste / en alta hızlı gezinme */
(() => {
  'use strict';

  if (window.__gunlugumPageJumpReady) return;
  window.__gunlugumPageJumpReady = true;

  const makeButton = (id, label, iconPath) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.id = id;
    button.className = 'page-jump-control';
    button.setAttribute('aria-label', label);
    button.title = label;
    button.hidden = true;
    button.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconPath}</svg>`;
    document.body.appendChild(button);
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

  function pageHasScroll() {
    const doc = document.documentElement;
    const body = document.body;
    const height = Math.max(doc ? doc.scrollHeight : 0, body ? body.scrollHeight : 0);
    return height > window.innerHeight + 140;
  }

  function updateButtons() {
    frameQueued = false;
    if (!document.body) return;

    if (!pageHasScroll()) {
      upButton.hidden = true;
      downButton.hidden = true;
      return;
    }

    const position = window.scrollY || document.documentElement.scrollTop || 0;
    const isAtTop = position <= 90;

    // Sayfanın başındayken aşağı inme, kaydırıldıktan sonra yukarı çıkma düğmesi gösterilir.
    downButton.hidden = !isAtTop;
    upButton.hidden = isAtTop;
  }

  function scheduleUpdate() {
    if (frameQueued) return;
    frameQueued = true;
    window.requestAnimationFrame(updateButtons);
  }

  upButton.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: scrollBehavior });
  });

  downButton.addEventListener('click', () => {
    const doc = document.documentElement;
    const body = document.body;
    const bottom = Math.max(doc.scrollHeight, body ? body.scrollHeight : 0);
    window.scrollTo({ top: bottom, behavior: scrollBehavior });
  });

  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', scheduleUpdate, { passive: true });
  window.addEventListener('load', scheduleUpdate, { once: true });

  // Dinamik olarak eklenen kartlar veya içerikler sayfa boyunu değiştirebilir.
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(scheduleUpdate);
    observer.observe(document.documentElement);
    if (document.body) observer.observe(document.body);
  } else if ('MutationObserver' in window && document.body) {
    const observer = new MutationObserver(scheduleUpdate);
    observer.observe(document.body, { childList: true, subtree: true });
  }

  scheduleUpdate();
})();
