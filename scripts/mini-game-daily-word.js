(() => {
  'use strict';
  const KEY = 'gunlugum:mini-games:daily-word:v1';
  const ANSWERS = [
    'KALEM','DENİZ','ÇİÇEK','EKMEK','ARABA','ŞEKER','ÇORAP','BALIK','ÇANTA','FİDAN',
    'KİRAZ','ELMAS','GÖLGE','DUVAR','MASAL','SEPET','YOLCU','FİLİZ','KAŞIK','ÇORBA',
    'ÇAMUR','SAHİL','BAHAR','ZAMAN','ORMAN','KUŞAK','TUZAK','YÜREK','EVREN','MERAK',
    'AKŞAM','SABAH','SONRA','ÖNLEM','ÇEVRE','KADIN','ADRES','SOKAK','TEKER','YEMEK',
    'TATLI','KUTUP','BADEM','SEVGİ','FIRÇA','ÇİZGİ','YÜZÜK','İNCİR','ARMUT','FENER',
    'KAŞAR','ÇAKIL','TAHTA','HALKA','SINIF','TEKNE','YAZAR','BAŞAK','ÇELİK','KADRO',
    'İŞLEM','TAKIM','KULAK','FAYDA','FİKİR','FİŞEK','FİZİK','GÖBEK','GÖREV','GÖRÜŞ',
    'GÜÇLÜ','GÜLÜŞ','GÜVEN','HABER','HAFİF','HAKEM','HAYAL','HAYAT','HESAP','HIZLI',
    'İDARE','İKRAM','İLGİN','İLHAM','İNANÇ','İSRAF','KABUK','KADAR','KADER','KALIN',
    'KALIP','KANAL','KARAR','KASAP','KAVUN','KAVGA','KAYIP','KAZAK','KEBAP','KEMAN',
    'KESİT','KİBAR','KİLİT','KİMYA','KİTLE','KONAK','KONUK','KORKU','KÖPEK','KÖPRÜ',
    'KURAL','KURAK','KURUM','KÜMES','LAZER','MACUN','MAKAS','MAKET','MANAV','MANTI',
    'MARUL','METAL','METİN','MİRAS','MİZAH','MOBİL','MODEL','MOTOR','MÜZİK','NAKİT',
    'NEFES','NESİL','NİSAN','NOKTA','NOTER','OLASI','OLGUN','ORGAN','OTLAK','OYMAK',
    'ÖLÇÜT','ÖRDEK','ÖRNEK','ÖRTÜK','ÖZLEM','PALET','PANEL','PAPAZ','PARÇA','PASTA',
    'PİLOT','PLAKA','RADAR','RADYO','RAKET','RANZA','REHİN','RESİM','ROBOT','SAÇAK',
    'SAKİN','SALON','SANAT','SARAY','SEANS','SEBEP','SEÇİM','SERİN','SİHİR','SİLAH',
    'SİNİR','SİYAH','SİZCE','SOFRA','SOLUK','SORUN','SUNUM','SÜREÇ','SÜRÜM','TAHIL',
    'TAKİP','TANIM','TARAF','TARİH','TAVAN','TEKİL','TEMEL','TEORİ','TERAS','TESİS',
    'TESTİ','TİPİK','TOHUM','TOKAT','TOPLU','TORBA','TÜMÖR','UĞRAŞ','ULAMA','UMMAN',
    'UMUMİ','UNSUR','UTANÇ','ÜCRET','ÜÇGEN','ÜNLEM','ÜREME','VAKİT','VAGON','VAKUM',
    'VAPUR','VARİL','VERGİ','VERİM','VİRAJ','VİRÜS','VİŞNE','VİTES','VİYOL','YABAN',
    'YAKIN','YALAN','YALIN','YANKI','YASAK','YATAK','YAYIN','YAZIM','YETKİ','YEŞİL',
    'YİRMİ','YÖNET','YORUM','YÖRÜK','YUMRU','YÜZDE','ZARAR','ZARİF','ZAYIF','ZEHİR',
    'ZEMİN','ZORLU'
  ];
  const EXTRA_GUESSES = [
    'ASLAN','AKORT','AKREP','ALARM','ALBÜM','ANLAM','ANTEN','ARŞİV','ATLAS','AYRAN',
    'BAKIR','BİBER','BİLET','BOYUN','BOZUK','BÜTÜN','CADDE','CAMİİ','CANLI','CEKET',
    'CEVAP','CİDDİ','ÇABUK','ÇADIR','ÇAKMA','ÇARŞI','ÇEKİÇ','ÇİNAR','ÇÖREK','ÇUKUR',
    'DAVUL','DEĞER','DELİK','DEMİR','DERİN','DEVİR','DİKEN','DİLİM','DOLAP','DÖKÜM',
    'DÖNEM','DÖNÜŞ','DURUM','DÜĞÜN','DÜZEN','EKRAN','GÜNEŞ','HACİM','İZLEK','KAPAK',
    'KEMER','KONUM','MAMUL','MAVNA','MEŞRU','MİLLİ','MİSAL','ODACI','ÖZELİ','POŞET',
    'POSTA','REZİL','SAHNE','SAKIZ','SIFIR','SİVRİ','SÜTUN','TAMAM','TANIK','TARLA',
    'TELİF','TEMİZ','TÜNEL','YUMAK'
  ];
  const ALPHABET = 'ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ'.split('');
  const KEY_ROWS = ['ERTYUIOPĞÜ'.split(''), 'ASDFGHJKLŞİ'.split(''), ['ENTER', ...'ZCVBNMÖÇ'.split(''), 'BACK']];
  const $ = id => document.getElementById(id);
  const normalize = value => String(value || '').normalize('NFC').toLocaleUpperCase('tr-TR');
  const letterCount = word => Array.from(normalize(word)).length;

  const externalWords = Array.isArray(window.GUNLUGUM_DAILY_WORD_DICTIONARY)
    ? window.GUNLUGUM_DAILY_WORD_DICTIONARY
    : [];
  const validWords = new Set(
    [...ANSWERS, ...EXTRA_GUESSES, ...externalWords]
      .map(normalize)
      .filter(word => /^[A-ZÇĞİÖŞÜ]{5}$/u.test(word))
  );

  function istanbulDate(date = new Date()) {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Istanbul', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
    const map = Object.fromEntries(parts.map(part => [part.type, part.value]));
    return `${map.year}-${map.month}-${map.day}`;
  }
  function yesterdayKey(key) {
    const [year, month, day] = key.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day - 1)).toISOString().slice(0, 10);
  }
  function dailyAnswer(key) {
    let hash = 2166136261;
    for (const char of key) { hash ^= char.charCodeAt(0); hash = Math.imul(hash, 16777619); }
    return ANSWERS[(hash >>> 0) % ANSWERS.length];
  }
  let today = istanbulDate();
  const freshStats = () => ({ played: 0, wins: 0, currentStreak: 0, bestStreak: 0, lastCompletedDate: null });
  function loadState() {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(KEY) || 'null'); }
    catch (error) { console.warn('Kelime oyunu kaydı okunamadı:', error); }
    const stats = { ...freshStats(), ...(saved?.stats || {}) };
    ['played', 'wins', 'currentStreak', 'bestStreak'].forEach(key => { stats[key] = Math.max(0, Number(stats[key]) || 0); });
    if (stats.lastCompletedDate && stats.lastCompletedDate !== today && stats.lastCompletedDate !== yesterdayKey(today)) stats.currentStreak = 0;
    if (saved?.date === today && Array.isArray(saved.guesses)) {
      const guesses = saved.guesses.map(normalize).filter(word => letterCount(word) === 5).slice(0, 6);
      const answer = dailyAnswer(today);
      const won = saved.won === true || guesses.includes(answer);
      return { date: today, answer, guesses, completed: saved.completed === true || won || guesses.length >= 6, won, stats };
    }
    return { date: today, answer: dailyAnswer(today), guesses: [], completed: false, won: false, stats };
  }
  let state = loadState();
  let currentGuess = '';
  let notice = '';
  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch (error) { console.warn('Kelime oyunu kaydı saklanamadı:', error); }
  }
  function getStatuses(guess, answer) {
    const letters = Array.from(guess), target = Array.from(answer), result = Array(5).fill('absent'), remaining = {};
    target.forEach((letter, index) => { if (letters[index] === letter) result[index] = 'correct'; else remaining[letter] = (remaining[letter] || 0) + 1; });
    letters.forEach((letter, index) => {
      if (result[index] === 'correct') return;
      if (remaining[letter] > 0) { result[index] = 'present'; remaining[letter] -= 1; }
    });
    return result;
  }
  function updateStats(won) {
    if (state.stats.lastCompletedDate === today) return;
    state.stats.played += 1;
    if (won) {
      state.stats.wins += 1;
      state.stats.currentStreak = state.stats.lastCompletedDate === yesterdayKey(today) ? state.stats.currentStreak + 1 : 1;
      state.stats.bestStreak = Math.max(state.stats.bestStreak, state.stats.currentStreak);
    } else state.stats.currentStreak = 0;
    state.stats.lastCompletedDate = today;
  }
  function renderStats() {
    const stats = state.stats, rate = stats.played ? Math.round(stats.wins / stats.played * 100) : 0;
    $('wordPlayed').textContent = stats.played.toLocaleString('tr-TR');
    $('wordWinRate').textContent = `${rate}%`;
    $('wordCurrentStreak').textContent = stats.currentStreak.toLocaleString('tr-TR');
    $('wordBestStreak').textContent = stats.bestStreak.toLocaleString('tr-TR');
  }
  function renderBoard() {
    const rows = [];
    for (let row = 0; row < 6; row++) {
      const submitted = state.guesses[row];
      const letters = submitted ? Array.from(submitted) : row === state.guesses.length && !state.completed ? Array.from(currentGuess) : [];
      const statuses = submitted ? getStatuses(submitted, state.answer) : [];
      rows.push(`<div class="word-row" role="row">${Array.from({ length: 5 }, (_, column) => {
        const letter = letters[column] || '', stateClass = submitted ? statuses[column] : letter ? 'filled' : '';
        return `<div class="word-cell ${stateClass}" role="gridcell" aria-label="${letter || 'Boş'}">${letter}</div>`;
      }).join('')}</div>`);
    }
    $('wordBoard').innerHTML = rows.join('');
  }
  function keyboardStates() {
    const states = {}, priority = { absent: 1, present: 2, correct: 3 };
    state.guesses.forEach(guess => {
      const statuses = getStatuses(guess, state.answer);
      Array.from(guess).forEach((letter, index) => {
        const next = statuses[index];
        if (!states[letter] || priority[next] > priority[states[letter]]) states[letter] = next;
      });
    });
    return states;
  }
  function renderKeyboard() {
    const statuses = keyboardStates();
    $('wordKeyboard').innerHTML = KEY_ROWS.map(row => `<div class="word-key-row">${row.map(key => {
      const wide = key === 'ENTER' || key === 'BACK', text = key === 'ENTER' ? 'GÖNDER' : key === 'BACK' ? '⌫' : key;
      return `<button class="word-key${wide ? ' wide' : ''}${statuses[key] ? ` ${statuses[key]}` : ''}" type="button" data-key="${key}" ${state.completed ? 'disabled' : ''}>${text}</button>`;
    }).join('')}</div>`).join('');
    $('wordKeyboard').querySelectorAll('button').forEach(button => button.addEventListener('click', () => pressKey(button.dataset.key)));
  }
  function render() {
    const date = new Intl.DateTimeFormat('tr-TR', { timeZone: 'Europe/Istanbul', weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
    $('wordDate').textContent = date.toLocaleUpperCase('tr-TR');
    renderBoard(); renderKeyboard(); renderStats();
    const result = $('wordResult');
    if (state.completed) {
      const count = state.guesses.length;
      result.hidden = false;
      result.textContent = state.won
        ? `Tebrikler! Bugünün kelimesini ${count} tahminde buldun. Yarın yeni bir kelime seni bekliyor.`
        : `Bugünün kelimesi ${state.answer} idi. Yarın yeni bir kelimeyle tekrar deneyebilirsin.`;
      $('wordStatus').textContent = state.won ? 'Bugünün kelimesini buldun!' : 'Bugünkü denemelerin sona erdi.';
    } else {
      result.hidden = true;
      $('wordStatus').textContent = notice || `${6 - state.guesses.length} tahmin hakkın kaldı.`;
    }
  }
  function pressKey(key) {
    if (state.completed) return;
    notice = '';
    if (key === 'BACK') currentGuess = Array.from(currentGuess).slice(0, -1).join('');
    else if (key === 'ENTER') { submitGuess(); return; }
    else if (ALPHABET.includes(key) && letterCount(currentGuess) < 5) currentGuess = normalize(currentGuess + key);
    render();
  }
  function submitGuess() {
    const guess = normalize(currentGuess);
    if (letterCount(guess) !== 5) { notice = 'Tahminin beş harfli olmalı.'; render(); return; }
    if (!validWords.has(guess)) {
      currentGuess = '';
      notice = 'Bu kelime sözlükte bulunmuyor. Yazdığın kelime silindi; tahmin hakkın eksilmedi.';
      render();
      return;
    }
    state.guesses.push(guess); currentGuess = '';
    if (guess === state.answer) { state.won = true; state.completed = true; updateStats(true); }
    else if (state.guesses.length >= 6) { state.completed = true; state.won = false; updateStats(false); }
    persist(); render();
  }
  function refreshDay() {
    const next = istanbulDate();
    if (next === today) return;
    today = next; currentGuess = ''; notice = 'Yeni gün başladı. Bugünün kelimesi hazır!';
    if (state.stats.lastCompletedDate && state.stats.lastCompletedDate !== today && state.stats.lastCompletedDate !== yesterdayKey(today)) state.stats.currentStreak = 0;
    state = { date: today, answer: dailyAnswer(today), guesses: [], completed: false, won: false, stats: state.stats };
    persist(); render();
  }
  document.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === 'Enter') { event.preventDefault(); pressKey('ENTER'); }
    else if (event.key === 'Backspace') { event.preventDefault(); pressKey('BACK'); }
    else if (event.key.length === 1) {
      const letter = normalize(event.key);
      if (ALPHABET.includes(letter)) pressKey(letter);
    }
  });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshDay(); });
  window.addEventListener('focus', refreshDay);
  persist(); render();
})();