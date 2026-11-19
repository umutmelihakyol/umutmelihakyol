/* Günlüğüm Arcade — arşiv verileriyle çalışan yerel mini oyunlar. */
(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const STORAGE_KEY = 'gunlugum:arcade:v1';
  const CATEGORY_LABELS = { oyun: 'Oyun', film: 'Film', dizi: 'Dizi', anime: 'Anime' };
  const CATEGORY_FILES = [
    ['oyun', '../data/games.json'],
    ['film', '../data/movies.json'],
    ['dizi', '../data/series.json'],
    ['anime', '../data/anime.json']
  ];
  const state = {
    all: [], filtered: [], category: 'all', stats: loadStats(),
    activeGame: null, guess: null, rating: null, quiz: null, memory: null,
    dailyItem: null, dailyMode: false
  };

  function loadStats() {
    const fallback = { xp: 0, played: 0, bestStreak: 0, currentStreak: 0, lastPlayDate: '', daily: {}, bestMemory: null, achievements: [] };
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return { ...fallback, ...saved, daily: saved.daily && typeof saved.daily === 'object' ? saved.daily : {}, achievements: Array.isArray(saved.achievements) ? saved.achievements : [] };
    } catch (_) { return fallback; }
  }

  function saveStats() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.stats)); } catch (_) { /* Depolama kapalıysa oyunlar yine çalışır. */ }
    renderStats();
  }

  function todayKey() {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Istanbul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  }

  function hashString(text) {
    let hash = 2166136261;
    for (let i = 0; i < text.length; i += 1) { hash ^= text.charCodeAt(i); hash = Math.imul(hash, 16777619); }
    return hash >>> 0;
  }

  function seededIndex(length, seed) { return length ? hashString(seed) % length : 0; }
  function shuffle(list) {
    const result = [...list];
    for (let i = result.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
  function sample(list, count) { return shuffle(list).slice(0, count); }
  function safeImage(value) {
    try { const url = new URL(String(value || ''), location.href); return ['https:', 'http:'].includes(url.protocol) ? url.href : ''; }
    catch (_) { return ''; }
  }
  function safeText(value) { return String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch])); }
  function normalize(value) {
    return String(value || '').toLocaleLowerCase('tr-TR').normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '').replace(/ı/g, 'i').replace(/[^a-z0-9]/g, '');
  }
  function detailUrl(item) {
    return `../icerik/?tip=${encodeURIComponent(item.category)}&id=${encodeURIComponent(item.id)}`;
  }
  function randomItem(list) { return list[Math.floor(Math.random() * list.length)]; }
  function archiveList(category = state.category) { return category === 'all' ? state.all : state.all.filter(item => item.category === category); }
  function titleAlternatives(item) {
    const values = [item.title, item.originalTitle, item.englishTitle, ...(Array.isArray(item.malAlternativeTitles) ? item.malAlternativeTitles : [])];
    return [...new Set(values.filter(Boolean).map(normalize))];
  }

  async function loadArchive() {
    const results = await Promise.allSettled(CATEGORY_FILES.map(async ([category, path]) => {
      const response = await fetch(path, { cache: 'no-store' });
      if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
      const rows = await response.json();
      if (!Array.isArray(rows)) throw new Error(`${path}: beklenen JSON listesi bulunamadı`);
      return rows.map(row => ({
        id: String(row.id ?? `${category}-${normalize(row.title)}`),
        category,
        title: String(row.title || row.name || '').trim(),
        image: safeImage(row.image || row.cover || row.poster),
        year: Number(row.year || row.releaseYear || row.startYear) || null,
        score: row.score === null || row.score === undefined || row.score === '' ? null : Number(row.score),
        genres: Array.isArray(row.genres) ? row.genres : [],
        status: row.status || '',
        note: row.note || '',
        review: row.review || '',
        developer: row.developer || '',
        director: row.director || '',
        studio: row.studio || ''
      })).filter(item => item.title);
    }));

    state.all = results.flatMap(result => result.status === 'fulfilled' ? result.value : []);
    state.filtered = state.all;
    if (!state.all.length) {
      $('#arcadeArchiveCount').textContent = '0';
      $('#arcadeGamesTitle').textContent = 'Arşiv verileri yüklenemedi';
      const warning = document.createElement('p');
      warning.className = 'arcade-load-warning';
      warning.textContent = 'Oyunlar, filmler, diziler ve anime JSON dosyalarına erişilemedi. İnternet bağlantısını veya sayfanın doğru GitHub Pages yolundan açıldığını kontrol et.';
      $('.arcade-library-section')?.append(warning);
      return;
    }
    $('#arcadeArchiveCount').textContent = String(state.all.length);
    renderDailyInfo();
    renderStats();
    renderMissions();
    renderAchievements();
  }

  function getDailyItem() {
    const eligible = state.all.filter(item => item.image);
    if (!eligible.length) return null;
    return eligible[seededIndex(eligible.length, `gunlugum-arcade-${todayKey()}`)];
  }

  function renderStats() {
    $('#arcadeXp').textContent = Number(state.stats.xp || 0).toLocaleString('tr-TR');
    $('#arcadePlayed').textContent = Number(state.stats.played || 0).toLocaleString('tr-TR');
    $('#arcadeBest').textContent = state.stats.bestStreak ? `${state.stats.bestStreak} doğru` : '—';
    $('#arcadeStreak').textContent = `${Number(state.stats.currentStreak || 0)} gün`;
  }

  function dailyRecord() {
    const key = todayKey();
    if (!state.stats.daily || state.stats.daily.date !== key) {
      state.stats.daily = { date: key, games: 0, correct: 0, challengeDone: false };
    }
    return state.stats.daily;
  }

  function renderDailyInfo() {
    const date = new Date(`${todayKey()}T12:00:00+03:00`);
    $('#arcadeDailyDate').textContent = new Intl.DateTimeFormat('tr-TR', { timeZone: 'Europe/Istanbul', day: 'numeric', month: 'long', year: 'numeric' }).format(date);
    $('#arcadeMissionDate').textContent = todayKey().split('-').reverse().join('.');
    const daily = dailyRecord();
    $('#arcadeDailyStatus').textContent = daily.challengeDone ? 'Bugünkü mücadele tamamlandı ✓' : (daily.challengePlayed ? 'Bugünkü mücadele sona erdi' : 'Bugünkü mücadele hazır');
    $('#arcadeDailyArt').classList.toggle('is-completed', daily.challengeDone);
    $('#arcadeDailyArt').querySelector('span').textContent = daily.challengeDone ? '✓' : (daily.challengePlayed ? '×' : '?');
    renderMissions();
    saveStats();
  }

  function renderMissions() {
    const daily = dailyRecord();
    const playCount = Math.min(1, daily.games || 0);
    const correctCount = Math.min(3, daily.correct || 0);
    const challengeCount = daily.challengeDone ? 1 : 0;
    const set = (id, value, total) => {
      const node = $(id); if (node) node.style.width = `${value / total * 100}%`;
    };
    set('#missionPlayProgress', playCount, 1);
    set('#missionCorrectProgress', correctCount, 3);
    set('#missionDailyProgress', challengeCount, 1);
    $('#missionPlayLabel').textContent = `${playCount}/1`;
    $('#missionCorrectLabel').textContent = `${correctCount}/3`;
    $('#missionDailyLabel').textContent = `${challengeCount}/1`;
  }

  const ACHIEVEMENTS = [
    { id: 'first', icon: '🎮', title: 'İlk oyun', desc: 'Arcade’de ilk turunu tamamla.', test: s => s.played >= 1 },
    { id: 'ten', icon: '✦', title: 'Isınıyorsun', desc: 'Toplam 10 tur oyna.', test: s => s.played >= 10 },
    { id: 'sharp', icon: '🎯', title: 'Keskin göz', desc: '10 doğru tahmine ulaş.', test: s => s.correctTotal >= 10 },
    { id: 'memory', icon: '🧠', title: 'Güçlü hafıza', desc: 'Hafıza oyununu 20 hamle veya altında bitir.', test: s => Number.isFinite(s.bestMemory) && s.bestMemory <= 20 },
    { id: 'daily', icon: '🌟', title: 'Her gün burada', desc: 'Üç günlük mücadeleyi tamamla.', test: s => s.dailyWins >= 3 }
  ];

  function renderAchievements() {
    const saved = new Set(state.stats.achievements || []);
    const newlyUnlocked = ACHIEVEMENTS.filter(item => item.test(state.stats) && !saved.has(item.id));
    newlyUnlocked.forEach(item => saved.add(item.id));
    state.stats.achievements = [...saved];
    $('#arcadeAchievementCount').textContent = `${saved.size} / ${ACHIEVEMENTS.length}`;
    $('#arcadeAchievementGrid').innerHTML = ACHIEVEMENTS.map(item => `<article class="arcade-achievement${saved.has(item.id) ? ' is-unlocked' : ''}"><span class="arcade-achievement-icon">${item.icon}</span><span><strong>${safeText(item.title)}</strong><small>${safeText(item.desc)}</small></span></article>`).join('');
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.stats)); } catch (_) {}
  }

  function recordRound({ xp = 0, correct = 0, bestStreak = 0, dailyWin = false, memoryMoves = null, incrementPlayed = true } = {}) {
    if (incrementPlayed) state.stats.played = Number(state.stats.played || 0) + 1;
    state.stats.xp = Number(state.stats.xp || 0) + xp;
    state.stats.correctTotal = Number(state.stats.correctTotal || 0) + correct;
    state.stats.bestStreak = Math.max(Number(state.stats.bestStreak || 0), bestStreak);
    const key = todayKey();
    const daily = dailyRecord();
    if (incrementPlayed) daily.games = Number(daily.games || 0) + 1;
    daily.correct = Number(daily.correct || 0) + correct;
    if (dailyWin && !daily.challengeDone) {
      daily.challengeDone = true;
      state.stats.dailyWins = Number(state.stats.dailyWins || 0) + 1;
      const previous = state.stats.lastPlayDate;
      if (previous) {
        const before = new Date(`${previous}T12:00:00+03:00`);
        const current = new Date(`${key}T12:00:00+03:00`);
        const diff = Math.round((current - before) / 86400000);
        state.stats.currentStreak = diff === 1 ? Number(state.stats.currentStreak || 0) + 1 : (diff === 0 ? Number(state.stats.currentStreak || 0) : 1);
      } else state.stats.currentStreak = 1;
      state.stats.lastPlayDate = key;
    }
    if (Number.isFinite(memoryMoves)) {
      state.stats.bestMemory = Number.isFinite(state.stats.bestMemory) ? Math.min(state.stats.bestMemory, memoryMoves) : memoryMoves;
    }
    saveStats();
    renderMissions();
    renderAchievements();
  }

  function setCategory(category) {
    state.category = category;
    $$('.arcade-filter-row button').forEach(button => {
      const active = button.dataset.category === category;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  }

  function openGame(game, panelId, label) {
    state.activeGame = game;
    $('#arcadePlayArea').hidden = false;
    $$('.arcade-game-panel').forEach(panel => { panel.hidden = panel.id !== panelId; });
    $('#arcadePlayingLabel').textContent = label.toLocaleUpperCase('tr-TR');
    $('#arcadeResultBanner').hidden = true;
    $('#arcadePlayArea').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function backToGames() {
    $('#arcadePlayArea').hidden = true;
    state.activeGame = null;
  }

  function renderGameCard(item, index, withScore = false) {
    const img = item.image ? `<img src="${safeText(item.image)}" alt="" loading="lazy">` : `<span class="arcade-fallback-cover">${CATEGORY_LABELS[item.category]}</span>`;
    return `<button class="arcade-duel-card" type="button" data-choice="${index}">${img}${withScore && Number.isFinite(item.score) ? `<span class="arcade-duel-score">★ ${item.score.toLocaleString('tr-TR')}</span>` : ''}<strong>${safeText(item.title)}</strong><small>${CATEGORY_LABELS[item.category]}${item.year ? ` · ${item.year}` : ''}</small></button>`;
  }

  // 01 — Guess the media from a blurred cover.
  function startGuess({ daily = false } = {}) {
    if (daily && dailyRecord().challengePlayed) return showNotice(dailyRecord().challengeDone ? 'Bugünün mücadelesini zaten tamamladın. Yarın yeni bir yapım seni bekliyor.' : 'Bugünün mücadelesini zaten oynadın. Yeni mücadele yarın açılacak.');
    const list = archiveList().filter(item => item.image);
    if (!list.length) return showNotice('Bu kategori için kapak görselli içerik bulunamadı. Başka bir kategori seç.');
    const item = daily ? (state.dailyItem || getDailyItem()) : randomItem(list);
    if (!item) return showNotice('Tahmin edilecek kayıt bulunamadı.');
    state.dailyMode = daily;
    state.guess = { item, attempts: 0, hints: 0, done: false, daily };
    openGame('guess', 'guessPanel', daily ? 'Günün mücadelesi' : 'Yapımı tahmin et');
    $('#guessImage').src = item.image;
    $('#guessImage').alt = 'Gizlenmiş yapım kapağı';
    $('#guessPoster').classList.remove('is-revealed');
    $('#guessCategory').textContent = daily ? 'GÜNLÜK GİZLİ YAPIM' : 'GİZLİ YAPIM';
    $('#guessAttempts').textContent = '0 / 5';
    $('#guessInput').value = '';
    $('#guessInput').disabled = false;
    $('#guessSubmit').disabled = false;
    $('#guessHintText').textContent = 'İlk ipucunu almak için butona bas.';
    $('#guessFeedback').textContent = '';
    $('#guessFeedback').className = 'arcade-feedback';
    $('#guessNext').hidden = true;
    $('#guessInput').focus({ preventScroll: true });
  }

  function finishGuess(correct) {
    if (!state.guess || state.guess.done) return;
    const game = state.guess;
    game.done = true;
    $('#guessPoster').classList.add('is-revealed');
    $('#guessInput').disabled = true;
    $('#guessSubmit').disabled = true;
    $('#guessNext').hidden = false;
    const feedback = $('#guessFeedback');
    if (correct) {
      const gained = Math.max(20, 70 - (game.attempts - 1) * 10 - game.hints * 8);
      feedback.textContent = `Doğru bildin! ${game.item.title} · +${gained} XP`;
      feedback.className = 'arcade-feedback is-correct';
      recordRound({ xp: gained, correct: 1, dailyWin: game.daily });
    } else {
      feedback.textContent = `Cevap: ${game.item.title}. Bir sonraki turda tekrar dene.`;
      feedback.className = 'arcade-feedback is-wrong';
      recordRound({ xp: 5, correct: 0, dailyWin: false });
      if (game.daily) {
        const daily = dailyRecord();
        daily.challengePlayed = true;
        $('#arcadeDailyStatus').textContent = 'Bugünkü mücadele sona erdi';
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.stats)); } catch (_) {}
        renderMissions();
      }
    }
    if (game.daily) {
      const daily = dailyRecord();
      daily.challengePlayed = true;
      $('#arcadeDailyStatus').textContent = correct ? 'Bugünkü mücadele tamamlandı ✓' : 'Bugünkü mücadele sona erdi';
      $('#arcadeDailyArt').classList.toggle('is-completed', correct);
      $('#arcadeDailyArt').querySelector('span').textContent = correct ? '✓' : '×';
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.stats)); } catch (_) {}
      renderMissions();
    }
  }

  function submitGuess() {
    const game = state.guess;
    if (!game || game.done) return;
    const answer = normalize($('#guessInput').value);
    if (!answer) { $('#guessFeedback').textContent = 'Önce bir tahmin yaz.'; return; }
    game.attempts += 1;
    $('#guessAttempts').textContent = `${game.attempts} / 5`;
    const exact = titleAlternatives(game.item).some(title => title === answer || (answer.length >= 5 && title.includes(answer)));
    if (exact) finishGuess(true);
    else if (game.attempts >= 5) finishGuess(false);
    else {
      $('#guessFeedback').textContent = 'Bu değil. Tekrar dene veya bir ipucu al.';
      $('#guessFeedback').className = 'arcade-feedback is-wrong';
      $('#guessInput').select();
    }
  }

  function getHint() {
    const game = state.guess;
    if (!game || game.done) return;
    game.hints += 1;
    const item = game.item;
    const hints = [
      `Kategori: ${CATEGORY_LABELS[item.category]}`,
      item.year ? `Yayın yılı: ${item.year}` : `Başlık şu harfle başlıyor: ${item.title[0].toLocaleUpperCase('tr-TR')}`,
      `Başlığın ilk harfi: ${item.title[0].toLocaleUpperCase('tr-TR')}`,
      item.genres.length ? `Türler: ${item.genres.slice(0, 3).join(', ')}` : 'Başlığın karakter sayısı: ' + item.title.length
    ];
    $('#guessHintText').textContent = hints[Math.min(game.hints - 1, hints.length - 1)];
  }

  // 02 — Guess which item has the higher personal rating.
  let ratingRound = 0;
  function startRating() {
    const list = archiveList().filter(item => Number.isFinite(item.score));
    if (list.length < 2) return showNotice('Puan düellosu için seçtiğin kategoride en az iki puanlı kayıt gerekiyor.');
    state.rating = { list, score: 0, streak: 0, done: false };
    ratingRound = 0;
    openGame('rating', 'ratingPanel', 'Puan düellosu');
    nextRatingDuel();
  }
  function nextRatingDuel() {
    const game = state.rating;
    if (!game) return;
    const pairs = game.list.filter(a => game.list.some(b => a.id !== b.id && a.score !== b.score));
    if (pairs.length < 2) return showNotice('Farklı kişisel puanlara sahip yeterli kayıt bulunamadı.');
    const first = randomItem(pairs);
    const options = game.list.filter(item => item.id !== first.id && item.score !== first.score);
    const second = randomItem(options);
    game.pair = [first, second];
    game.answered = false;
    ratingRound += 1;
    $('#ratingScore').textContent = `${game.score} doğru · Seri ${game.streak}`;
    $('#ratingFeedback').textContent = '';
    $('#ratingNext').disabled = true;
    $('#ratingDuelGrid').innerHTML = game.pair.map((item, index) => renderGameCard(item, index)).join('');
    $$('#ratingDuelGrid button').forEach(button => button.addEventListener('click', () => chooseRating(Number(button.dataset.choice))));
  }
  function chooseRating(index) {
    const game = state.rating;
    if (!game || game.answered) return;
    game.answered = true;
    const [a, b] = game.pair;
    const correctIndex = a.score > b.score ? 0 : 1;
    const correct = index === correctIndex;
    if (correct) { game.score += 1; game.streak += 1; }
    else game.streak = 0;
    $$('#ratingDuelGrid button').forEach((button, i) => {
      button.disabled = true;
      if (i === correctIndex) button.classList.add('is-correct');
      if (i === index && !correct) button.classList.add('is-wrong');
      const score = game.pair[i].score;
      const badge = document.createElement('span'); badge.className = 'arcade-duel-score'; badge.textContent = `★ ${score.toLocaleString('tr-TR')}`; button.append(badge);
    });
    $('#ratingFeedback').textContent = correct ? `Bildin! ${game.pair[correctIndex].title} daha yüksek puanlı. +15 XP` : `Doğru cevap ${game.pair[correctIndex].title} (${game.pair[correctIndex].score}/10).`;
    $('#ratingFeedback').className = `arcade-feedback ${correct ? 'is-correct' : 'is-wrong'}`;
    game.lastCorrect = correct;
    $('#ratingScore').textContent = `${game.score} doğru · Seri ${game.streak}`;
    $('#ratingNext').disabled = false;
    recordRound({ xp: correct ? 15 : 3, correct: correct ? 1 : 0, bestStreak: game.streak });
  }

  // 03 — Questions are generated only from information in the personal archive.
  function startQuiz() {
    const list = archiveList().filter(item => Number.isFinite(item.year));
    const distinctYearList = list.filter((item, index, array) => array.findIndex(other => other.year === item.year) === index);
    if (distinctYearList.length < 4) return showNotice('Bilgi yarışması için seçtiğin kategoride farklı yayın yıllarına sahip en az dört yapım gerekiyor.');
    const questions = [];
    for (let i = 0; i < 10; i += 1) {
      const pool = sample(distinctYearList, 4);
      const oldest = pool.reduce((best, item) => item.year < best.year ? item : best, pool[0]);
      questions.push({ title: 'Hangisi daha önce yayımlandı?', sub: 'Dört yapımdan en eski olanı seç.', options: shuffle(pool), answerId: oldest.id, explain: `${oldest.title}, ${oldest.year} yılında yayımlandı.` });
    }
    state.quiz = { questions, index: 0, score: 0, answered: false, streak: 0 };
    openGame('quiz', 'quizPanel', 'Arşiv bilgi yarışması');
    renderQuizQuestion();
  }
  function renderQuizQuestion() {
    const game = state.quiz;
    if (!game) return;
    const question = game.questions[game.index];
    $('#quizQuestionTitle').textContent = question.title;
    $('#quizQuestionSub').textContent = question.sub;
    $('#quizProgress').textContent = `${game.index + 1} / ${game.questions.length}`;
    $('#quizScore').textContent = `${game.score} doğru cevap`;
    $('#quizFeedback').textContent = '';
    $('#quizNext').hidden = true;
    $('#quizOptions').innerHTML = question.options.map(item => `<button type="button" class="arcade-quiz-option" data-id="${safeText(item.id)}">${safeText(item.title)}<small>${CATEGORY_LABELS[item.category]} · ${item.year}</small></button>`).join('');
    $$('#quizOptions button').forEach(button => button.addEventListener('click', () => chooseQuiz(button.dataset.id)));
    game.answered = false;
  }
  function chooseQuiz(id) {
    const game = state.quiz;
    if (!game || game.answered) return;
    game.answered = true;
    const question = game.questions[game.index];
    const correct = id === question.answerId;
    if (correct) { game.score += 1; game.streak += 1; } else game.streak = 0;
    $$('#quizOptions button').forEach(button => {
      button.disabled = true;
      if (button.dataset.id === question.answerId) button.classList.add('is-correct');
      if (button.dataset.id === id && !correct) button.classList.add('is-wrong');
    });
    $('#quizFeedback').textContent = `${correct ? 'Doğru! ' : 'Bu kez olmadı. '}${question.explain}`;
    $('#quizFeedback').className = `arcade-feedback ${correct ? 'is-correct' : 'is-wrong'}`;
    $('#quizScore').textContent = `${game.score} doğru cevap`;
    $('#quizNext').textContent = game.index === game.questions.length - 1 ? 'Sonuçları gör' : 'Sonraki soru →';
    $('#quizNext').hidden = false;
    recordRound({ xp: correct ? 12 : 2, correct: correct ? 1 : 0, bestStreak: game.streak, incrementPlayed: false });
  }
  function nextQuiz() {
    const game = state.quiz;
    if (!game || !game.answered) return;
    if (game.index < game.questions.length - 1) { game.index += 1; renderQuizQuestion(); return; }
    const xp = game.score * 5;
    $('#quizFeedback').textContent = `Tur tamamlandı: 10 soruda ${game.score} doğru cevap. Ek +${xp} XP kazandın.`;
    $('#quizFeedback').className = 'arcade-feedback is-correct';
    $('#quizNext').hidden = true;
    recordRound({ xp, correct: 0, incrementPlayed: true });
    showResult(`Bilgi yarışmasını tamamladın! ${game.score}/10 doğru cevap · ${xp} ek XP.`);
  }

  // 04 — 8 pairs / 16 cards memory game.
  function startMemory() {
    const list = archiveList().filter(item => item.image);
    if (list.length < 8) return showNotice('Hafıza oyunu için seçtiğin kategoride en az sekiz kapak görselli kayıt gerekiyor.');
    state.memory = { cards: [], open: [], matched: new Set(), moves: 0, locked: false, done: false };
    const picks = sample(list, 8);
    const cards = shuffle(picks.flatMap((item, index) => [
      { key: `${item.category}:${item.id}`, item, uid: `${index}-a` },
      { key: `${item.category}:${item.id}`, item, uid: `${index}-b` }
    ]));
    state.memory.cards = cards;
    openGame('memory', 'memoryPanel', 'Kapak hafızası');
    renderMemory();
  }
  function renderMemory() {
    const game = state.memory;
    if (!game) return;
    $('#memoryMoves').textContent = `${game.moves} hamle`;
    $('#memoryMatched').textContent = `${game.matched.size} / 8 çift`;
    $('#memoryFeedback').textContent = '';
    $('#memoryBoard').innerHTML = game.cards.map((card, index) => `<button type="button" class="arcade-memory-card" data-index="${index}" aria-label="Kapalı kart ${index + 1}"><img src="${safeText(card.item.image)}" alt="" loading="lazy"></button>`).join('');
    $$('#memoryBoard button').forEach(button => button.addEventListener('click', () => flipMemory(Number(button.dataset.index))));
  }
  function flipMemory(index) {
    const game = state.memory;
    if (!game || game.locked || game.done) return;
    const card = game.cards[index];
    if (!card || game.open.includes(index) || game.matched.has(card.key)) return;
    game.open.push(index);
    const button = $(`#memoryBoard button[data-index="${index}"]`);
    button.classList.add('is-open');
    if (game.open.length < 2) return;
    game.moves += 1;
    game.locked = true;
    const [firstIndex, secondIndex] = game.open;
    const first = game.cards[firstIndex];
    const second = game.cards[secondIndex];
    if (first.key === second.key) {
      game.matched.add(first.key);
      game.open = [];
      game.locked = false;
      $(`#memoryBoard button[data-index="${firstIndex}"]`)?.classList.add('is-matched');
      $(`#memoryBoard button[data-index="${secondIndex}"]`)?.classList.add('is-matched');
      $('#memoryMoves').textContent = `${game.moves} hamle`;
      $('#memoryMatched').textContent = `${game.matched.size} / 8 çift`;
      if (game.matched.size === 8) finishMemory();
    } else {
      $('#memoryMoves').textContent = `${game.moves} hamle`;
      window.setTimeout(() => {
        [firstIndex, secondIndex].forEach(cardIndex => $(`#memoryBoard button[data-index="${cardIndex}"]`)?.classList.remove('is-open'));
        game.open = [];
        game.locked = false;
      }, 760);
    }
  }
  function finishMemory() {
    const game = state.memory;
    if (!game || game.done) return;
    game.done = true;
    const xp = Math.max(20, 120 - Math.max(0, game.moves - 8) * 5);
    $('#memoryFeedback').textContent = `Harika! Sekiz çifti ${game.moves} hamlede buldun. +${xp} XP`;
    $('#memoryFeedback').className = 'arcade-feedback is-correct';
    recordRound({ xp, correct: 0, memoryMoves: game.moves });
    showResult(`Hafıza turu tamamlandı. En iyi hamle sayın: ${state.stats.bestMemory}.`);
  }

  function showNotice(message) {
    const banner = $('#arcadeResultBanner');
    banner.hidden = false;
    banner.textContent = message;
    banner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  function showResult(message) {
    const banner = $('#arcadeResultBanner');
    banner.hidden = false;
    banner.textContent = message;
  }

  function bindEvents() {
    $$('[data-launch]').forEach(button => button.addEventListener('click', () => {
      const game = button.dataset.launch;
      if (game === 'guess') startGuess();
      if (game === 'rating') startRating();
      if (game === 'quiz') startQuiz();
      if (game === 'memory') startMemory();
    }));
    $$('.arcade-filter-row button').forEach(button => button.addEventListener('click', () => setCategory(button.dataset.category)));
    $('#arcadeDailyStart').addEventListener('click', () => startGuess({ daily: true }));
    $('#arcadeBack').addEventListener('click', backToGames);
    $('#guessSubmit').addEventListener('click', submitGuess);
    $('#guessInput').addEventListener('keydown', event => { if (event.key === 'Enter') submitGuess(); });
    $('#guessHint').addEventListener('click', getHint);
    $('#guessSkip').addEventListener('click', () => finishGuess(false));
    $('#guessNext').addEventListener('click', () => state.dailyMode ? startGuess({ daily: false }) : startGuess());
    $('#ratingNext').addEventListener('click', nextRatingDuel);
    $('#quizNext').addEventListener('click', nextQuiz);
    $('#memoryRestart').addEventListener('click', startMemory);
  }

  async function init() {
    bindEvents();
    await loadArchive();
    if (!state.all.length) return;
    state.dailyItem = getDailyItem();
    renderDailyInfo();
    renderStats();
    renderAchievements();
  }

  init().catch(error => {
    console.error('[Günlüğüm Arcade]', error);
    const status = document.createElement('p');
    status.className = 'arcade-load-warning';
    status.textContent = 'Arcade başlatılamadı. Arşiv verileri yüklenirken bir sorun oluştu.';
    $('.arcade-main')?.prepend(status);
  });
})();
