/* Günlüğüm: özel alan adında tek bir güvenli origin kullan.
   GitHub Pages HTTPS sertifikası etkinleştirildikten sonra HTTP ve www girişlerini ana domaine yönlendirir. */
(function(){
  'use strict';
  var canonicalHost = 'umutmelihakyol.com';
  var host = String(location.hostname || '').toLowerCase();
  if (host !== canonicalHost && host !== 'www.' + canonicalHost) return;
  var target = new URL(location.href);
  target.protocol = 'https:';
  target.hostname = canonicalHost;
  target.port = '';
  if (target.href !== location.href) location.replace(target.href);
})();

/* Tema tercihi: depolama kapalı olsa da sayfa ve yönetim paneli açılabilsin. */
(function(){
  var t = 'dark';
  try {
    var saved = localStorage.getItem('theme');
    t = saved || ((typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme:dark)').matches) ? 'dark' : 'light');
  } catch (_) {
    t = (typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme:dark)').matches) ? 'dark' : 'light';
  }
  document.documentElement.dataset.theme = t;
  window.toggleTheme = function(){
    t = t === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = t;
    try { localStorage.setItem('theme', t); } catch (_) {}
  };
})();

/* Sessiz beyaz sayfa olmasın: dosya yüklenemezse ya da kod hata verirse üstte uyarı çıkar */
(function(){var miss=[],bar=null,err='';
function paint(){var t='Sayfada bir sorun var. ';if(miss.length)t+='Yüklenemeyen dosyalar: '+miss.join(', ')+'. Bunları siteye yüklediğinden emin ol ve Ctrl+F5 ile yenile.';else t+=err;
if(!bar){bar=document.createElement('div');bar.setAttribute('role','alert');bar.style.cssText='position:fixed;left:0;right:0;top:0;z-index:99;background:#a85a4a;color:#fff;padding:10px 16px;font:14px/1.4 sans-serif';(document.body||document.documentElement).appendChild(bar)}bar.textContent=t}
addEventListener('error',function(e){var t=e.target;
if(t&&t!==window){if(t.tagName==='SCRIPT'&&t.src&&!/goatcounter|zgo\.at/.test(t.src)){var n=t.src.split('/').pop().split('?')[0];
if(n==='config.js'&&!document.getElementById('gate'))return;if(miss.indexOf(n)<0)miss.push(n);paint()}return}
if(e.message&&e.message!=='Script error.'&&!miss.length){err=e.message;paint()}},true)})();
