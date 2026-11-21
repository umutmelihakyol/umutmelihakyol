(() => {
  'use strict';
  const KEY = 'gunlugum:mini-games:number-guess:v1';
  const LIMIT = 100;
  const MAX_TRIES = 7;
  const $ = id => document.getElementById(id);
  const form = $('numberGuessForm');
  const input = $('numberGuessInput');

  function randomNumber() {
    if (window.crypto?.getRandomValues) {
      const values = new Uint32Array(1);
      const ceiling = Math.floor(0x100000000 / LIMIT) * LIMIT;
      do { window.crypto.getRandomValues(values); } while (values[0] >= ceiling);
      return values[0] % LIMIT + 1;
    }
    return Math.floor(Math.random() * LIMIT) + 1;
  }
  const freshStats = () => ({ played: 0, wins: 0, streak: 0, bestFewest: null });
  const freshGame = () => ({ target: randomNumber(), guesses: [], low: 1, high: LIMIT, completed: false, won: false });

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
      const stats = { ...freshStats(), ...(saved?.stats || {}) };
      stats.played = Math.max(0, Number(stats.played) || 0);
      stats.wins = Math.max(0, Number(stats.wins) || 0);
      stats.streak = Math.max(0, Number(stats.streak) || 0);
      stats.bestFewest = Number.isInteger(stats.bestFewest) && stats.bestFewest > 0 ? stats.bestFewest : null;

      const old = saved?.game;
      if (old && Number.isInteger(old.target) && old.target >= 1 && old.target <= LIMIT &&
          Array.isArray(old.guesses) && old.guesses.length <= MAX_TRIES &&
          old.guesses.every(n => Number.isInteger(n) && n >= 1 && n <= LIMIT)) {
        const won = old.won === true || old.guesses.includes(old.target);
        return {
          stats,
          game: {
            target: old.target,
            guesses: old.guesses,
            low: Math.min(LIMIT, Math.max(1, Number(old.low) || 1)),
            high: Math.min(LIMIT, Math.max(1, Number(old.high) || LIMIT)),
            completed: old.completed === true || won || old.guesses.length >= MAX_TRIES,
            won
          }
        };
      }
      return { stats, game: freshGame() };
    } catch (error) {
      console.warn('Sayı tahmin oyunu kaydı okunamadı:', error);
      return { stats: freshStats(), game: freshGame() };
    }
  }

  let { stats, game } = load();
  let feedbackClass = '';

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify({ stats, game })); }
    catch (error) { console.warn('Sayı tahmin oyunu kaydı saklanamadı:', error); }
  }
  function renderStats() {
    $('numberPlayed').textContent = stats.played.toLocaleString('tr-TR');
    $('numberWinRate').textContent = `${stats.played ? Math.round(stats.wins / stats.played * 100) : 0}%`;
    $('numberStreak').textContent = stats.streak.toLocaleString('tr-TR');
    $('numberBest').textContent = stats.bestFewest ? `${stats.bestFewest}/7` : '—';
  }
  function renderRange() {
    $('numberRangeLabel').textContent = `${game.low} – ${game.high}`;
    $('numberRangeLow').textContent = game.low.toLocaleString('tr-TR');
    $('numberRangeHigh').textContent = game.high.toLocaleString('tr-TR');
    $('numberRangeFill').style.left = `${(game.low - 1) / LIMIT * 100}%`;
    $('numberRangeFill').style.width = `${(game.high - game.low + 1) / LIMIT * 100}%`;
  }
  function renderHistory() {
    $('numberHistoryCount').textContent = game.guesses.length ? `${game.guesses.length} tahmin` : 'Henüz tahmin yok';
    $('numberAttemptCount').innerHTML = `${game.guesses.length} <small>/ ${MAX_TRIES}</small>`;
    $('numberAttemptDots').innerHTML = Array.from({ length: MAX_TRIES }, (_, i) =>
      `<i class="${i < game.guesses.length ? 'is-used' : ''} ${i === game.guesses.length - 1 ? 'is-latest' : ''}"></i>`
    ).join('');
    if (!game.guesses.length) {
      $('numberHistory').innerHTML = '<span class="number-history-empty">Yaptığın tahminler burada görünecek.</span>';
      return;
    }
    $('numberHistory').innerHTML = game.guesses.map(value => {
      const kind = value === game.target ? 'correct' : value < game.target ? 'low' : 'high';
      const hint = kind === 'correct' ? '✓ Doğru' : kind === 'low' ? '↑ Daha yüksek' : '↓ Daha düşük';
      return `<span class="number-guess-chip ${kind}"><strong>${value}</strong><small>${hint}</small></span>`;
    }).join('');
  }
  function render() {
    const hero = $('numberHero');
    hero.classList.toggle('is-won', game.completed && game.won);
    hero.classList.toggle('is-lost', game.completed && !game.won);
    $('numberTarget').textContent = game.completed ? String(game.target) : '?';
    $('numberHeroKicker').textContent = game.completed ? (game.won ? 'DOĞRU TAHMİN!' : 'GİZLİ SAYI') : 'GİZLİ SAYI';
    $('numberHeroCaption').textContent = game.completed
      ? (game.won ? `${game.guesses.length} tahminde bildin. Tebrikler!` : 'Bu kez olmadı. Yeni turda tekrar dene.')
      : 'Hangi sayıyı tuttuğumu tahmin et.';
    input.disabled = game.completed;
    $('numberSubmit').disabled = game.completed;
    $('numberSubmit').innerHTML = game.completed ? 'TUR TAMAMLANDI' : 'TAHMİN ET <span aria-hidden="true">↗</span>';
    $('numberNewGame').textContent = game.completed ? '↻ Yeni oyun' : '↻ Baştan başla';
    renderRange();
    renderHistory();
    renderStats();

    const feedback = $('numberFeedback');
    if (game.completed) {
      feedback.className = `number-feedback ${game.won ? 'is-correct' : 'is-lost'}`;
      feedback.textContent = game.won
        ? `Bildin! ${game.target} doğru sayı. ${game.guesses.length} tahminde sonuca ulaştın.`
        : `Yedi hakkın doldu. Gizli sayı ${game.target} idi.`;
    } else if (feedbackClass) {
      feedback.className = `number-feedback ${feedbackClass}`;
    }
  }
  function celebrate() {
    const layer = $('numberCelebration');
    layer.innerHTML = '';
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    for (let i = 0; i < 28; i += 1) {
      const bit = document.createElement('span');
      bit.className = 'number-confetti';
      bit.style.setProperty('--x', `${Math.random() * 100}%`);
      bit.style.setProperty('--delay', `${Math.random() * 240}ms`);
      bit.style.setProperty('--spin', `${Math.random() * 540 - 270}deg`);
      layer.appendChild(bit);
    }
    window.setTimeout(() => { layer.innerHTML = ''; }, 1600);
  }
  function finish(won) {
    if (game.completed) return;
    game.completed = true;
    game.won = won;
    stats.played += 1;
    if (won) {
      stats.wins += 1;
      stats.streak += 1;
      stats.bestFewest = stats.bestFewest === null ? game.guesses.length : Math.min(stats.bestFewest, game.guesses.length);
    } else stats.streak = 0;
    save();
    render();
    if (won) celebrate();
  }
  function submit(event) {
    event.preventDefault();
    if (game.completed) return;
    const raw = input.value.trim();
    const value = Number(raw);
    feedbackClass = '';

    if (!raw || !Number.isInteger(value) || value < 1 || value > LIMIT) {
      $('numberFeedback').className = 'number-feedback is-warning';
      $('numberFeedback').textContent = '1 ile 100 arasında tam bir sayı girmelisin.';
      input.classList.remove('is-invalid');
      void input.offsetWidth;
      input.classList.add('is-invalid');
      input.focus();
      return;
    }
    if (game.guesses.includes(value)) {
      $('numberFeedback').className = 'number-feedback is-warning';
      $('numberFeedback').textContent = 'Bu sayıyı daha önce denedin. Farklı bir tahmin yap.';
      input.select();
      return;
    }
    if (value < game.low || value > game.high) {
      $('numberFeedback').className = 'number-feedback is-warning';
      $('numberFeedback').textContent = `Kalan aralığın dışına çıktın. ${game.low} ile ${game.high} arasında dene.`;
      input.select();
      return;
    }

    game.guesses.push(value);
    input.value = '';
    input.classList.remove('is-invalid');

    if (value === game.target) { finish(true); return; }
    if (value < game.target) {
      game.low = Math.max(game.low, value + 1);
      feedbackClass = 'is-higher';
      $('numberFeedback').textContent = 'Daha yüksek! Gizli sayı bundan büyük.';
    } else {
      game.high = Math.min(game.high, value - 1);
      feedbackClass = 'is-lower';
      $('numberFeedback').textContent = 'Daha düşük! Gizli sayı bundan küçük.';
    }
    if (game.guesses.length >= MAX_TRIES) { finish(false); return; }
    save();
    render();
    input.focus();
  }
  function newGame() {
    game = freshGame();
    feedbackClass = '';
    $('numberFeedback').className = 'number-feedback';
    $('numberFeedback').textContent = 'Yeni sayı hazır. İlk tahminini yap!';
    $('numberCelebration').innerHTML = '';
    save();
    render();
    input.value = '';
    input.focus();
  }

  form.addEventListener('submit', submit);
  $('numberNewGame').addEventListener('click', newGame);
  input.addEventListener('animationend', event => {
    if (event.animationName === 'number-input-shake') input.classList.remove('is-invalid');
  });

  $('numberFeedback').className = 'number-feedback';
  $('numberFeedback').textContent = game.completed
    ? 'Yeni bir oyun başlatarak tekrar deneyebilirsin.'
    : game.guesses.length
      ? 'Kaldığın yerden devam et. Olası sayı aralığın aşağıda.'
      : 'İlk tahminini gir. Sana daha yüksek veya daha düşük olduğunu söyleyeceğim.';
  save();
  render();
})();