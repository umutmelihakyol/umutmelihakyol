(() => {
  'use strict';
  const KEY = 'gunlugum:mini-games:reflex:v1';
  const $ = id => document.getElementById(id);
  const stage = $('reflexStage');
  const action = $('reflexAction');
  const clock = () => performance.now();
  const randomBetween = (min, max) => min + Math.random() * (max - min);
  const defaults = { attempts: 0, falseStarts: 0, results: [] };

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (!saved || typeof saved !== 'object') return { ...defaults };
      const results = Array.isArray(saved.results)
        ? saved.results.map(Number).filter(n => Number.isFinite(n) && n >= 0 && n <= 10000).slice(-50)
        : [];
      return {
        attempts: Math.max(results.length, Number(saved.attempts) || 0),
        falseStarts: Math.max(0, Number(saved.falseStarts) || 0),
        results
      };
    } catch (error) {
      console.warn('Refleks testi kaydı okunamadı:', error);
      return { ...defaults };
    }
  }

  let stats = load();
  let phase = 'idle';
  let timer = 0;
  let readyAt = 0;

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(stats)); }
    catch (error) { console.warn('Refleks testi kaydı saklanamadı:', error); }
  }
  const best = () => stats.results.length ? Math.min(...stats.results) : null;
  const average = () => stats.results.length
    ? Math.round(stats.results.reduce((sum, n) => sum + n, 0) / stats.results.length) : null;
  const ms = value => value === null ? '—' : `${value} ms`;

  function renderStats() {
    $('reflexBest').textContent = ms(best());
    $('reflexAverage').textContent = ms(average());
    $('reflexAttempts').textContent = stats.attempts.toLocaleString('tr-TR');
    $('reflexFalseStarts').textContent = stats.falseStarts.toLocaleString('tr-TR');
  }
  function setAction(icon, label, sub) {
    $('reflexActionIcon').textContent = icon;
    $('reflexActionText').textContent = label;
    $('reflexActionSub').textContent = sub;
  }
  function clearStage() {
    stage.classList.remove('is-waiting', 'is-ready', 'is-early', 'is-result');
  }

  function startRound() {
    window.clearTimeout(timer);
    clearStage();
    phase = 'waiting';
    stage.classList.add('is-waiting');
    $('reflexKicker').textContent = 'ODAKLAN';
    $('reflexStageHint').textContent = 'Yeşil ışık yanana kadar bekle.';
    $('reflexResultValue').textContent = '— ms';
    $('reflexResultLabel').textContent = 'Sinyal bekleniyor…';
    $('reflexMessage').className = 'mini-arcade-message';
    $('reflexMessage').textContent = 'Hazır ol… Yeşil ışık yanmadan sakın tıklama!';
    setAction('◌', 'BEKLE', 'Sinyal gelince tıkla');

    timer = window.setTimeout(() => {
      if (phase !== 'waiting') return;
      phase = 'ready';
      readyAt = clock();
      stage.classList.remove('is-waiting');
      stage.classList.add('is-ready');
      $('reflexKicker').textContent = 'ŞİMDİ!';
      $('reflexStageHint').textContent = 'Hemen tıkla!';
      $('reflexResultLabel').textContent = 'Sinyal geldi. Hemen bas!';
      $('reflexMessage').className = 'mini-arcade-message is-good';
      $('reflexMessage').textContent = 'ŞİMDİ! Olabildiğince hızlı tıkla.';
      setAction('⚡', 'TIKLA!', 'Şimdi bas!');
    }, randomBetween(1550, 4600));
  }

  function prematureClick() {
    window.clearTimeout(timer);
    phase = 'early';
    stats.falseStarts += 1;
    save();
    renderStats();
    stage.classList.remove('is-waiting');
    stage.classList.add('is-early');
    $('reflexKicker').textContent = 'ERKEN DAVRANDIN';
    $('reflexStageHint').textContent = 'Biraz daha sabırlı ol.';
    $('reflexResultValue').textContent = 'ERKEN!';
    $('reflexResultLabel').textContent = 'Bu tur geçersiz sayıldı.';
    $('reflexMessage').className = 'mini-arcade-message is-warn';
    $('reflexMessage').textContent = 'Sinyal yeşile dönmeden tıkladın. Tahmin süren kaydedilmedi; tekrar deneyebilirsin.';
    setAction('↻', 'TEKRAR DENE', 'Bu kez yeşili bekle');
  }

  function burst() {
    const layer = $('reflexParticles');
    layer.innerHTML = '';
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    for (let i = 0; i < 18; i += 1) {
      const bit = document.createElement('span');
      bit.className = 'reflex-particle';
      bit.style.setProperty('--angle', `${i * 20 + randomBetween(-7, 7)}deg`);
      bit.style.setProperty('--delay', `${randomBetween(0, 90)}ms`);
      layer.appendChild(bit);
      window.setTimeout(() => bit.remove(), 1000);
    }
  }

  function record() {
    const result = Math.max(0, Math.round(clock() - readyAt));
    phase = 'result';
    stats.attempts += 1;
    stats.results.push(result);
    stats.results = stats.results.slice(-50);
    save();
    renderStats();
    stage.classList.remove('is-ready');
    stage.classList.add('is-result');

    let label = 'Biraz daha çalışabilirsin.';
    if (result < 180) label = 'Işık hızında! İnanılmaz refleks.';
    else if (result < 230) label = 'Mükemmel! Çok hızlısın.';
    else if (result < 300) label = 'Harika refleks!';
    else if (result < 400) label = 'Gayet iyi bir süre.';
    else if (result < 500) label = 'Fena değil, biraz daha hızlanabilirsin.';

    $('reflexKicker').textContent = result < 230 ? 'ŞAHANE REFLEKS' : 'SONUÇ';
    $('reflexStageHint').textContent = 'Bir tur daha dene, rekorunu geliştir.';
    $('reflexResultValue').textContent = `${result} ms`;
    $('reflexResultLabel').textContent = label;
    $('reflexMessage').className = 'mini-arcade-message is-good';
    $('reflexMessage').textContent = `${result} milisaniyede tepki verdin. En iyi süren ${ms(best())}.`;
    setAction('⚡', 'TEKRAR OYNA', 'Yeni bir tur başlat');
    burst();
  }

  action.addEventListener('click', () => {
    if (phase === 'idle' || phase === 'early' || phase === 'result') startRound();
    else if (phase === 'waiting') prematureClick();
    else if (phase === 'ready') record();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && (phase === 'waiting' || phase === 'ready')) {
      window.clearTimeout(timer);
      phase = 'idle';
      clearStage();
      $('reflexKicker').textContent = 'YENİDEN HAZIRLAN';
      $('reflexStageHint').textContent = 'Sekmeye dönünce yeni tur başlat.';
      $('reflexMessage').className = 'mini-arcade-message';
      $('reflexMessage').textContent = 'Sekme arka plana geçtiği için tur iptal edildi.';
      setAction('⚡', 'BAŞLAT', 'Hazır olduğunda dokun');
    }
  });
  window.addEventListener('pagehide', () => window.clearTimeout(timer));
  renderStats();
})();