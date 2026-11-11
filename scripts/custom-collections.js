/* Kullanıcı tarafından oluşturulan özel koleksiyon sayfaları. */
(() => {
  const $ = selector => document.querySelector(selector);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[char]));
  const root = window.GUNLUGUM_ROOT || new URL('../', document.currentScript.src);
  const params = new URLSearchParams(location.search);
  const slug = params.get('kategori') || '';
  const typeNames = { oyun:'Oyun', film:'Film', dizi:'Dizi', anime:'Anime' };
  async function start() {
    const settings = window.SITE_SETTINGS_PROMISE ? await window.SITE_SETTINGS_PROMISE : {};
    const collection = (settings.customCategories || []).find(item => item.slug === slug);
    if (!collection) {
      $('#collectionTitle').textContent = 'Koleksiyon bulunamadı';
      $('#collectionDescription').textContent = 'Bu kategori silinmiş veya bağlantısı değişmiş olabilir.';
      $('#collectionStatus').textContent = '';
      $('#collectionGrid').innerHTML = '<p class="custom-collection-empty">Bu koleksiyon artık mevcut değil. Ana sayfaya dönerek diğer kategorilere göz atabilirsin.</p>';
      document.title = 'Koleksiyon bulunamadı | Günlüğüm';
      return;
    }
    $('#collectionTitle').textContent = collection.title;
    $('#collectionDescription').textContent = collection.description || 'Bu koleksiyonda seçtiğim içerikler.';
    $('#collectionCount').textContent = `${(collection.items || []).length} içerik`;
    document.title = `${collection.title} | ${settings.site?.title || 'Günlüğüm'}`;
    const buckets = await Promise.all(Object.keys(typeNames).map(async type => {
      try { const response = await fetch(new URL(`data/${({oyun:'games',film:'movies',dizi:'series',anime:'anime'})[type]}.json`, root).href, { cache:'no-cache' }); return [type, response.ok ? await response.json() : []]; }
      catch (_) { return [type, []]; }
    }));
    const archive = Object.fromEntries(buckets);
    const cards = (collection.items || []).map(entry => {
      const record = (archive[entry.category] || []).find(item => String(item.id) === String(entry.id));
      if (!record) return '';
      const cfg = window.CATS && window.CATS[entry.category];
      const image = record.image ? (window.IMAGE_SRC ? window.IMAGE_SRC(record.image, 500) : record.image) : '';
      const cover = image ? `<span class="custom-collection-cover"><img src="${esc(image)}" alt="" loading="lazy" decoding="async"></span>` : '<span class="custom-collection-cover"></span>';
      const meta = [record.year || '', record.score !== null && record.score !== undefined && record.score !== '' ? `★ ${esc(record.score)}/10` : ''].filter(Boolean).join(' · ');
      return `<a class="custom-collection-card" href="${esc(cfg?.page || '#')}#${encodeURIComponent(record.id)}">${cover}<span class="custom-collection-copy"><span class="custom-collection-type">${esc(typeNames[entry.category] || 'Arşiv')}</span><strong>${esc(record.title || 'Başlıksız içerik')}</strong>${meta ? `<span class="custom-collection-meta">${meta}</span>` : ''}</span></a>`;
    }).filter(Boolean);
    $('#collectionGrid').innerHTML = cards.length ? cards.join('') : '<p class="custom-collection-empty">Bu koleksiyonda henüz görüntülenebilecek içerik yok. Admin panelinden içerik ekleyebilirsin.</p>';
    $('#collectionStatus').textContent = `${cards.length} kayıt gösteriliyor`;
  }
  start().catch(error => { $('#collectionGrid').innerHTML = `<p class="custom-collection-empty">Koleksiyon yüklenemedi: ${esc(error.message)}</p>`; });
})();
