(function () {
  'use strict';
  if (document.getElementById('gunlugum-2b')) return;

  var config = window.GUNLUGUM_2B_CONFIG || {};
  var name = config.assistantName || '2B';
  var scriptUrl = document.currentScript && document.currentScript.src ? document.currentScript.src : location.href;
  var root = new URL('../', scriptUrl);
  var history = [];
  var busy = false;
  var archivePromise = null;

  var host = document.createElement('div');
  host.id = 'gunlugum-2b';
  host.className = 'g2b';
  host.innerHTML =
    '<button class="g2b-launcher" type="button" aria-label="2B asistanını aç" aria-expanded="false" aria-controls="g2b-panel">' +
      '<span class="g2b-launcher-mark" aria-hidden="true">2B</span><span class="g2b-launcher-copy"><strong>2B</strong><small>Asistan</small></span><span class="g2b-launcher-dot" aria-hidden="true"></span>' +
    '</button>' +
    '<section class="g2b-panel" id="g2b-panel" role="dialog" aria-modal="false" aria-label="2B Günlüğüm asistanı" hidden>' +
      '<header class="g2b-header"><div class="g2b-brand"><span class="g2b-brand-mark" aria-hidden="true">2B</span><span class="g2b-brand-copy"><strong>2B <em>·</em> Günlüğüm</strong><small>ARŞİV ASİSTANI</small></span></div>' +
        '<div class="g2b-head-actions"><button class="g2b-icon-btn g2b-clear" type="button" aria-label="Sohbeti temizle" title="Sohbeti temizle"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6m4-6v6M6 7l1 14h10l1-14M9 7V4h6v3"/></svg></button>' +
        '<button class="g2b-icon-btn g2b-close" type="button" aria-label="Asistanı kapat" title="Kapat"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button></div>' +
      '</header>' +
      '<div class="g2b-status"><span class="g2b-status-light"></span><span class="g2b-status-text">Hazır komutlar aktif</span></div>' +
      '<div class="g2b-intro"><span class="g2b-eyebrow">KİŞİSEL ARŞİVİN</span><h2>Nasıl yardımcı olabilirim?</h2><p>Arşivini keşfet, bir içerik seç veya aklına takılanı sor.</p></div>' +
      '<div class="g2b-quick-title">HAZIR KOMUTLAR</div>' +
      '<div class="g2b-quick"><button type="button" data-prompt="Arşivimi özetle">Arşivimi özetle</button><button type="button" data-prompt="Rastgele oyun seç">Rastgele oyun seç</button><button type="button" data-prompt="Bana oyun öner">Bana oyun öner</button><button type="button" data-prompt="Bu sayfayı açıkla">Bu sayfayı açıkla</button></div>' +
      '<div class="g2b-messages" role="log" aria-live="polite" aria-relevant="additions text"><div class="g2b-message g2b-message-assistant"><div class="g2b-message-label">2B</div><div class="g2b-bubble">Merhaba! Hazır komutlardan birini seçebilir veya aşağıya yazarak başlayabilirsin.</div></div></div>' +
      '<form class="g2b-compose"><label class="g2b-sr-only" for="g2b-input">2B’ye mesaj yaz</label><textarea id="g2b-input" rows="1" maxlength="4000" placeholder="2B’ye bir şey sor..." autocomplete="off"></textarea>' +
        '<button class="g2b-send" type="submit" aria-label="Mesajı gönder" title="Gönder"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12 20 4l-5 16-3-7-8-1Z"/><path d="m12 13 8-9"/></svg></button></form>' +
      '<footer class="g2b-footer"><span class="g2b-footer-mark">2B</span><span>Hazır komutlar yerel çalışır. Yapay zekâ sohbeti güvenli bağlantı kurulduğunda açılır.</span></footer>' +
    '</section>';
  document.body.appendChild(host);

  var launcher = host.querySelector('.g2b-launcher');
  var panel = host.querySelector('.g2b-panel');
  var input = host.querySelector('#g2b-input');
  var form = host.querySelector('.g2b-compose');
  var messages = host.querySelector('.g2b-messages');
  var sendButton = host.querySelector('.g2b-send');
  var statusText = host.querySelector('.g2b-status-text');

  function status(text, working) {
    statusText.textContent = text;
    host.classList.toggle('is-busy', !!working);
  }
  function open(value) {
    panel.hidden = !value;
    launcher.setAttribute('aria-expanded', value ? 'true' : 'false');
    if (value) window.setTimeout(function () { input.focus(); }, 50);
  }
  function addMessage(role, text, links) {
    var wrapper = document.createElement('div');
    wrapper.className = 'g2b-message ' + (role === 'user' ? 'g2b-message-user' : 'g2b-message-assistant');
    if (role !== 'user') {
      var label = document.createElement('div');
      label.className = 'g2b-message-label';
      label.textContent = name;
      wrapper.appendChild(label);
    }
    var bubble = document.createElement('div');
    bubble.className = 'g2b-bubble';
    bubble.textContent = String(text || '');
    wrapper.appendChild(bubble);
    if (Array.isArray(links) && links.length) {
      var group = document.createElement('div');
      group.className = 'g2b-result-links';
      links.forEach(function (item) {
        try {
          var url = new URL(item.href, root);
          if (url.origin !== root.origin) return;
          var a = document.createElement('a');
          a.href = url.href;
          a.textContent = item.label || 'İçeriği aç';
          group.appendChild(a);
        } catch (_) {}
      });
      if (group.childNodes.length) wrapper.appendChild(group);
    }
    messages.appendChild(wrapper);
    messages.scrollTop = messages.scrollHeight;
  }
  function typing() {
    var node = document.createElement('div');
    node.className = 'g2b-message g2b-message-assistant g2b-typing';
    node.innerHTML = '<div class="g2b-message-label">' + name + '</div><div class="g2b-bubble"><span></span><span></span><span></span></div>';
    messages.appendChild(node);
    messages.scrollTop = messages.scrollHeight;
    return node;
  }
  function getArchive() {
    if (archivePromise) return archivePromise;
    var cats = [
      { key:'oyun', label:'Oyun', file:'data/games.json', page:'oyun/' },
      { key:'film', label:'Film', file:'data/movies.json', page:'film/' },
      { key:'dizi', label:'Dizi', file:'data/series.json', page:'dizi/' },
      { key:'anime', label:'Anime', file:'data/anime.json', page:'anime/' }
    ];
    archivePromise = Promise.all(cats.map(function (cat) {
      return fetch(new URL(cat.file, root).href, { cache:'no-cache' })
        .then(function (res) { if (!res.ok) throw new Error('Veri dosyası yüklenemedi'); return res.json(); })
        .then(function (items) { cat.items = Array.isArray(items) ? items : []; return cat; })
        .catch(function () { cat.items = []; return cat; });
    }));
    return archivePromise;
  }
  function summary() {
    return getArchive().then(function (cats) {
      var total = 0;
      var lines = ['Günlüğüm arşivinin güncel özeti:'];
      cats.forEach(function (cat) {
        var list = cat.items;
        total += list.length;
        var done = list.filter(function (x) { return x.status === 'bitirdim'; }).length;
        var wish = list.filter(function (x) { return x.status === 'istek'; }).length;
        var fav = list.filter(function (x) { return x.favorite === true; }).length;
        lines.push(cat.label + ': ' + list.length + ' kayıt · ' + done + ' tamamlandı · ' + wish + ' istek listesinde · ' + fav + ' favori');
      });
      lines.push('Toplam: ' + total + ' kayıt.');
      return { text:lines.join('\n') };
    });
  }
  function pickGame(recommended) {
    return getArchive().then(function (cats) {
      var list = (cats.find(function (x) { return x.key === 'oyun'; }) || { items:[] }).items;
      var picks = recommended
        ? list.filter(function (x) { return x.recommended === true && x.status !== 'bitirdim'; })
        : list.filter(function (x) { return x.status !== 'bitirdim'; });
      if (!picks.length && recommended) picks = list.filter(function (x) { return x.status === 'istek' || x.status === 'oynuyorum'; });
      if (!picks.length) return { text:'Şu anda seçim yapabileceğim uygun bir oyun kaydı bulamadım.' };
      var game = picks[Math.floor(Math.random() * picks.length)];
      var details = [];
      if (game.platform) details.push(game.platform);
      if (game.year) details.push(String(game.year));
      if (game.score !== null && game.score !== undefined && game.score !== '') details.push('Puanın: ' + game.score + '/10');
      return {
        text:(recommended ? 'Listendeki önerilen oyunlardan biri:' : 'Bugün için rastgele seçtiğim oyun:') + '\n' + game.title + (details.length ? '\n' + details.join(' · ') : ''),
        links:[{ label:'Oyun kaydını aç', href:'oyun/#' + encodeURIComponent(game.id) }]
      };
    });
  }
  function searchArchive(term) {
    return getArchive().then(function (cats) {
      var q = String(term || '').trim().toLocaleLowerCase('tr-TR');
      if (!q) return { text:'Aramak istediğin içerik adını da yaz. Örnek: ara NieR Automata' };
      var found = [];
      cats.forEach(function (cat) {
        cat.items.forEach(function (item) {
          var searchable = [item.title, item.platform, item.developer, item.director, item.creator, (item.genres || []).join(' ')].join(' ').toLocaleLowerCase('tr-TR');
          if (searchable.indexOf(q) !== -1) found.push({ title:item.title, category:cat.label, href:cat.page + '#' + encodeURIComponent(item.id || '') });
        });
      });
      if (!found.length) return { text:'Arşivinde "' + term + '" için eşleşen bir kayıt bulamadım.' };
      found = found.slice(0, 6);
      return { text:'Arşivinde ' + found.length + ' eşleşme buldum:', links:found.map(function (x) { return { label:x.title + ' · ' + x.category, href:x.href }; }) };
    });
  }
  function localCommand(text) {
    var q = String(text || '').trim();
    var lower = q.toLocaleLowerCase('tr-TR');
    if (lower === 'arşivimi özetle' || lower === 'arşiv özeti' || lower === 'istatistiklerimi göster') return summary();
    if (lower.indexOf('rastgele oyun') !== -1 || lower.indexOf('oyun seç') !== -1) return pickGame(false);
    if (lower.indexOf('bana oyun öner') !== -1 || lower === 'oyun öner') return pickGame(true);
    if (lower === 'bu sayfayı açıkla' || lower === 'hangi sayfadayım') {
      return Promise.resolve({ text:'Şu anda "' + (document.title || 'Günlüğüm') + '" sayfasındasın.\nAdres: ' + location.pathname + location.search + location.hash + '\n\nArşivinde arama yapmak için "ara [içerik adı]" yazabilirsin.' });
    }
    if (lower === 'arama sayfasını aç' || lower === 'aramayı aç') {
      location.href = new URL('ara/', root).href;
      return Promise.resolve({ text:'Arama sayfasını açıyorum.' });
    }
    if (lower === 'yardım' || lower === 'komutlar' || lower === 'neler yapabilirsin') {
      return Promise.resolve({ text:'Kullanabileceğin komutlar:\n• Arşivimi özetle\n• Rastgele oyun seç\n• Bana oyun öner\n• Bu sayfayı açıkla\n• ara [içerik adı]\n\nSerbest sohbet, güvenli yapay zekâ bağlantısı yapılandırıldığında etkinleşir.' });
    }
    var match = lower.match(/^(ara|bul|arama)\s+(.+)$/);
    if (match) return searchArchive(q.slice(q.search(/\s/) + 1));
    return null;
  }
  function sendToAI() {
    var endpoint = String(config.apiUrl || '').trim();
    if (!endpoint) {
      addMessage('assistant', 'Bu soru için çevrim içi yapay zekâ bağlantısı gerekiyor. Şu anda hazır komutlarım çalışıyor. Güvenli sunucu bağlantısı yapılandırıldığında serbest sohbet de açılacak.');
      status('Hazır komutlar aktif · Yapay zekâ bağlantısı bekleniyor', false);
      return Promise.resolve();
    }
    if (!/^https:\/\//i.test(endpoint)) {
      addMessage('assistant', 'Yapay zekâ servis adresi HTTPS olmalı. Bağlantı ayarını kontrol et.');
      return Promise.resolve();
    }
    return fetch(endpoint, {
      method:'POST',
      headers:{ 'Content-Type':'application/json' },
      body:JSON.stringify({
        messages:history.slice(-12),
        page:{ title:document.title || 'Günlüğüm', path:location.pathname + location.search }
      })
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        if (!res.ok) throw new Error(data.error || 'Sunucu yanıt vermedi (' + res.status + ').');
        return data;
      });
    }).then(function (data) {
      var answer = typeof data.answer === 'string' ? data.answer.trim() : '';
      if (!answer) throw new Error('Yapay zekâ boş yanıt döndürdü.');
      history.push({ role:'assistant', content:answer });
      addMessage('assistant', answer);
      status('Yapay zekâ bağlantısı hazır', false);
    }).catch(function (error) {
      addMessage('assistant', 'Yapay zekâ bağlantısında sorun oluştu. Hazır komutları kullanmaya devam edebilirsin.\n\nAyrıntı: ' + (error.message || 'Bilinmeyen bağlantı hatası'));
      status('Yapay zekâ bağlantısı kontrol edilmeli', false);
    });
  }
  function send(text) {
    var value = String(text || '').trim();
    if (!value || busy) return;
    if (value.length > 4000) value = value.slice(0, 4000);
    addMessage('user', value);
    history.push({ role:'user', content:value });
    input.value = '';
    input.style.height = 'auto';
    busy = true;
    sendButton.disabled = true;
    status('Yanıt hazırlanıyor…', true);
    var loader = typing();
    var task;
    try { task = localCommand(value); } catch (_) { task = null; }
    Promise.resolve(task).then(function (result) {
      if (result) {
        loader.remove();
        addMessage('assistant', result.text, result.links);
        history.push({ role:'assistant', content:result.text });
        status('Hazır komutlar aktif', false);
        return;
      }
      return sendToAI().then(function () { loader.remove(); });
    }).catch(function (error) {
      loader.remove();
      addMessage('assistant', 'Komutu çalıştırırken bir sorun oluştu: ' + (error.message || 'Bilinmeyen hata'));
      status('Hazır komutlar aktif', false);
    }).finally(function () {
      busy = false;
      sendButton.disabled = false;
      input.focus();
    });
  }

  launcher.addEventListener('click', function () { open(panel.hidden); });
  host.querySelector('.g2b-close').addEventListener('click', function () { open(false); });
  host.querySelector('.g2b-clear').addEventListener('click', function () {
    history = [];
    messages.innerHTML = '';
    addMessage('assistant', 'Sohbet temizlendi. Yeni bir komut seçebilir veya mesaj yazabilirsin.');
    status('Hazır komutlar aktif', false);
  });
  form.addEventListener('submit', function (event) { event.preventDefault(); send(input.value); });
  input.addEventListener('input', function () {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 120) + 'px';
  });
  input.addEventListener('keydown', function (event) {
    if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); send(input.value); }
  });
  host.querySelector('.g2b-quick').addEventListener('click', function (event) {
    var button = event.target.closest('[data-prompt]');
    if (button) send(button.getAttribute('data-prompt'));
  });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && !panel.hidden) open(false);
  });
  if (config.apiUrl) status('Yapay zekâ bağlantısı tanımlandı', false);
})();
