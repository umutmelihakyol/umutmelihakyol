/* Anime detay penceresine özel kapak uyarlaması.
   Ortak app.js'e dokunmadan detay kapağının yönünü algılar ve aynı görseli bulanık arka plan yapar. */
(() => {
  'use strict';
  if (document.body?.dataset?.cat !== 'anime') return;

  const dialog = document.getElementById('dlg');
  if (!dialog) return;

  const orientationClasses = ['anime-detail', 'anime-cover-portrait', 'anime-cover-landscape', 'anime-cover-square', 'anime-cover-missing'];

  function reset() {
    orientationClasses.forEach(name => dialog.classList.remove(name));
    dialog.style.removeProperty('--anime-cover-image');
  }

  function update() {
    const cover = dialog.querySelector(':scope > .cover');
    if (!cover) {
      reset();
      return;
    }

    dialog.classList.add('anime-detail');
    const image = cover.querySelector(':scope > img');
    if (!image) {
      dialog.classList.add('anime-cover-missing');
      return;
    }

    const applyImage = () => {
      if (!dialog.contains(image)) return;
      const source = image.currentSrc || image.src;
      if (source) dialog.style.setProperty('--anime-cover-image', `url(${JSON.stringify(source)})`);

      orientationClasses.slice(1).forEach(name => dialog.classList.remove(name));
      let orientation = 'missing';
      if (!image.naturalWidth || !image.naturalHeight) {
        dialog.classList.add('anime-cover-missing');
      } else if (image.naturalHeight > image.naturalWidth * 1.12) {
        orientation = 'portrait';
        dialog.classList.add('anime-cover-portrait');
      } else if (image.naturalWidth > image.naturalHeight * 1.12) {
        orientation = 'landscape';
        dialog.classList.add('anime-cover-landscape');
      } else {
        orientation = 'square';
        dialog.classList.add('anime-cover-square');
      }

      // Başlık artık daima kapaktan ayrı, metin alanında kalır; poster yönü yalnızca görseli etkiler.
    };

    if (image.complete) applyImage();
    else {
      image.addEventListener('load', applyImage, { once: true });
      image.addEventListener('error', applyImage, { once: true });
    }
  }

  const observer = new MutationObserver(update);
  observer.observe(dialog, { childList: true, subtree: true });
  dialog.addEventListener('close', reset);
  update();
})();
