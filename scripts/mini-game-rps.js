(() => {
  'use strict';
  const KEY = 'gunlugum:mini-games:rps:v1';
  const MOVE = {
    rock: { label: 'Taş', icon: '✊' },
    paper: { label: 'Kâğıt', icon: '✋' },
    scissors: { label: 'Makas', icon: '✌️' }
  };
  const BEATS = { rock: 'scissors', paper: 'rock', scissors: 'paper' };
  const $ = id => document.getElementById(id);
  const choiceButtons = [...document.querySelectorAll('.rps-choice')];
  const resetButton = $('rpsReset');
  const duel = $('rpsDuel');
  const countdown = $('rpsCountdown');
  const defaults = () => ({ wins: 0, losses: 0, draws: 0, streak: 0, bestStreak: 0, history: [] });

  function readState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (!parsed || typeof parsed !== 'object') return defaults();
      const base = defaults();
      return {
        ...base, ...parsed,
        wins: Math.max(0, Number(parsed.wins) || 0),
        losses: Math.max(0, Number(parsed.losses) || 0),
        draws: Math.max(0, Number(parsed.draws) || 0),
        streak: Math.max(0, Number(parsed.streak) || 0),
        bestStreak: Math.max(0, Number(parsed.bestStreak) || 0),
        history: Array.isArray(parsed.history) ? parsed.history.slice(0, 8) : []
      };
    } catch (error) {
      console.warn('Taş, Kâğıt, Makas kayıtları okunamadı:', error);
      return defaults();
    }
  }

  let state = readState();
  let busy = false;
  const wait = ms => new Promise(resolve => window.setTimeout(resolve, ms));
  const persist = () => {
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch (error) { console.warn('Oyun kaydı saklanamadı:', error); }
  };

  function randomMove() {
    const values = Object.keys(MOVE);
    if (window.crypto?.getRandomValues) {
      const data = new Uint32Array(1);
      const limit = Math.floor(0x100000000 / values.length) * values.length;
      do { crypto.getRandomValues(data); } while (data[0] >= limit);
      return values[data[0] % values.length];
    }
    return values[Math.floor(Math.random() * values.length)];
  }

  function setControlsDisabled(disabled) {
    choiceButtons.forEach(button => { button.disabled = disabled; });
    resetButton.disabled = disabled;
  }

  function render() {
    $('rpsWins').textContent = state.wins.toLocaleString('tr-TR');
    $('rpsLosses').textContent = state.losses.toLocaleString('tr-TR');
    $('rpsDraws').textContent = state.draws.toLocaleString('tr-TR');
    $('rpsBestStreak').textContent = state.bestStreak.toLocaleString('tr-TR');
    const total = state.wins + state.losses + state.draws;
    $('rpsTotal').textContent = `${total.toLocaleString('tr-TR')} TUR`;
    $('rpsHistory').innerHTML = state.history.length ? state.history.map(item => {
      const resultLabel = item.result === 'win' ? 'Kazandın' : item.result === 'loss' ? 'Kaybettin' : 'Berabere';
      return `<div class="rps-history-row"><span>${MOVE[item.player].icon} ${MOVE[item.player].label} <b>·</b> ${MOVE[item.computer].icon} ${MOVE[item.computer].label}</span><strong class="${item.result}">${resultLabel}</strong></div>`;
    }).join('') : '<p class="mini-arcade-note">Henüz tur oynamadın.</p>';
  }

  function clearAnimationState() {
    duel.classList.remove('is-counting', 'is-revealed', 'result-win', 'result-loss', 'result-draw');
    countdown.classList.remove('is-counting', 'is-result', 'is-pop', 'result-win', 'result-loss', 'result-draw');
    countdown.textContent = 'VS';
  }

  async function play(player) {
    if (busy || !MOVE[player]) return;
    busy = true;
    setControlsDisabled(true);

    const computer = randomMove();
    let result = 'draw';
    if (player !== computer) result = BEATS[player] === computer ? 'win' : 'loss';

    try {
      clearAnimationState();
      duel.classList.add('is-counting');
      countdown.classList.add('is-counting');
      countdown.textContent = '3';

      $('rpsPlayerMove').textContent = '✊';
      $('rpsPlayerLabel').textContent = 'Hazırlan…';
      $('rpsComputerMove').textContent = '✊';
      $('rpsComputerLabel').textContent = 'Rakip hazırlanıyor…';

      const message = $('rpsMessage');
      message.className = 'mini-arcade-message';
      message.textContent = 'Taş, kâğıt, makas… Hazır ol!';

      const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      if (!reduceMotion) {
        for (const number of ['3', '2', '1']) {
          countdown.textContent = number;
          countdown.classList.remove('is-pop');
          void countdown.offsetWidth;
          countdown.classList.add('is-pop');
          await wait(340);
        }
      }

      $('rpsPlayerMove').textContent = MOVE[player].icon;
      $('rpsPlayerLabel').textContent = MOVE[player].label;
      $('rpsComputerMove').textContent = MOVE[computer].icon;
      $('rpsComputerLabel').textContent = MOVE[computer].label;

      duel.classList.remove('is-counting');
      duel.classList.add('is-revealed', `result-${result}`);
      countdown.classList.remove('is-counting', 'is-pop');
      countdown.classList.add('is-result', `result-${result}`);
      countdown.textContent = result === 'win' ? 'KAZANDIN!' : result === 'loss' ? 'KAYBETTİN' : 'BERABERE';

      await wait(reduceMotion ? 0 : 180);

      if (result === 'win') {
        state.wins += 1;
        state.streak += 1;
        state.bestStreak = Math.max(state.bestStreak, state.streak);
        message.className = 'mini-arcade-message is-good';
        message.textContent = `${MOVE[player].label}, ${MOVE[computer].label} hamlesini yendi. Bu tur senin!`;
      } else if (result === 'loss') {
        state.losses += 1;
        state.streak = 0;
        message.className = 'mini-arcade-message is-warn';
        message.textContent = `${MOVE[computer].label}, ${MOVE[player].label} hamleni yendi. Bu tur bilgisayarın.`;
      } else {
        state.draws += 1;
        message.className = 'mini-arcade-message';
        message.textContent = 'Aynı hamleyi seçtiniz. Tur berabere bitti.';
      }

      state.history.unshift({ player, computer, result });
      state.history = state.history.slice(0, 8);
      persist();
      render();

      await wait(reduceMotion ? 0 : 620);
    } finally {
      duel.classList.remove('is-counting');
      countdown.classList.remove('is-counting', 'is-pop', 'is-result', 'result-win', 'result-loss', 'result-draw');
      countdown.textContent = 'VS';
      busy = false;
      setControlsDisabled(false);
    }
  }

  choiceButtons.forEach(button => {
    button.addEventListener('click', () => play(button.dataset.move));
  });

  resetButton.addEventListener('click', () => {
    if (busy) return;
    if (!window.confirm('Taş, Kâğıt, Makas istatistiklerini sıfırlamak istiyor musun?')) return;
    state = defaults();
    persist();
    clearAnimationState();
    $('rpsPlayerMove').textContent = '?';
    $('rpsComputerMove').textContent = '?';
    $('rpsPlayerLabel').textContent = 'Hamleni bekliyorum';
    $('rpsComputerLabel').textContent = 'Rakibin hazır';
    $('rpsMessage').className = 'mini-arcade-message';
    $('rpsMessage').textContent = 'İstatistiklerin sıfırlandı. Yeni tur için hamleni seç.';
    render();
  });

  render();
})();