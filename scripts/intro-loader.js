/* Sadece bu sekmedeki ilk açılışta kısa süre gösterilir. */
(() => {
  'use strict';

  const root = document.documentElement;
  if (!root.classList.contains('intro-loader-active')) return;

  const startedAt = Number(window.__gunlugumLoaderStart) || performance.now();
  const minimumVisibleMs = 420;
  let domReady = document.readyState !== 'loading';
  let contentReady = Boolean(window.__gunlugumContentReady);
  let finished = false;

  function finishIfReady() {
    if (finished || !domReady || !contentReady) return;

    const remaining = minimumVisibleMs - (performance.now() - startedAt);
    if (remaining > 0) {
      window.setTimeout(finishIfReady, remaining);
      return;
    }

    finished = true;
    if (window.__gunlugumLoaderFallback) {
      window.clearTimeout(window.__gunlugumLoaderFallback);
    }

    root.classList.add('intro-loader-fade');
    root.classList.remove('intro-loader-active');

    window.setTimeout(() => {
      document.getElementById('siteIntroLoader')?.remove();
      root.classList.remove('intro-loader-fade');
    }, 240);
  }

  function onDomReady() {
    domReady = true;
    const body = document.body;
    const needsDataSignal = Boolean(
      body && (
        body.classList.contains('home') ||
        body.dataset.cat ||
        body.dataset.techKind
      )
    );

    if (!needsDataSignal || window.__gunlugumContentReady) {
      contentReady = true;
    }
    finishIfReady();
  }

  if (domReady) onDomReady();
  else document.addEventListener('DOMContentLoaded', onDomReady, { once: true });

  window.addEventListener('gunlugum:content-ready', () => {
    contentReady = true;
    window.__gunlugumContentReady = true;
    finishIfReady();
  }, { once: true });

  // Güvenlik ağı: veri kaynağı yanıt vermese de ekran uzun süre kalmasın.
  window.setTimeout(() => {
    contentReady = true;
    finishIfReady();
  }, 1100);
})();
