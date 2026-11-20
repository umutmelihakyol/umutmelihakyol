(() => {
  'use strict';
  const $ = (selector) => document.querySelector(selector);
  const STORAGE_KEY = 'gunlugum:dice-game:v1';
  const START_BALANCE = 100;
  const MIN_BALANCE = 100;
  const UNLOCK_THRESHOLD = 100000;
  const DAILY_BONUS = 5000;
  const MIN_BET = 100;
  const BET_STEP = 100;
  const AUTO_LIMIT = 25;
  const AUTO_DELAY = 1350;
  const fmt = (value) => new Intl.NumberFormat('tr-TR').format(Math.max(0, Math.trunc(Number(value) || 0)));

  const todayKey = () => {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Istanbul', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
    const part = Object.fromEntries(parts.map(item => [item.type, item.value]));
    return `${part.year}-${part.month}-${part.day}`;
  };
  const monthKey = () => todayKey().slice(0, 7);
  const newMonthStats = () => ({ plays: 0, net: 0, bestPayout: 0 });
  const defaultState = () => ({
    version: 1,
    balance: START_BALANCE,
    protectionDate: todayKey(),
    protectionUnlocked: false,
    lastPlayDate: null,
    lastBonusDate: null,
    playsByDay: {},
    totalPlays: 0,
    totalWins: 0,
    totalLosses: 0,
    bestPayout: 0,
    history: [],
    months: {}
  });

  const loadState = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();

      const parsed = JSON.parse(raw);
      const base = defaultState();
      const savedBalance = Number.isSafeInteger(parsed.balance)
        ? Math.max(0, parsed.balance)
        : START_BALANCE;
      const today = todayKey();
      const sameProtectionDay = parsed.protectionDate === today;
      // The daily risk protection renews every day. If the balance is already
      // above the threshold at the start of a new day, it is considered unlocked.
      const protectionUnlocked = sameProtectionDay
        ? parsed.protectionUnlocked === true
        : savedBalance > UNLOCK_THRESHOLD;

      return {
        ...base,
        ...parsed,
        balance: protectionUnlocked ? savedBalance : Math.max(MIN_BALANCE, savedBalance),
        protectionDate: today,
        protectionUnlocked,
        playsByDay: parsed.playsByDay && typeof parsed.playsByDay === 'object' ? parsed.playsByDay : {},
        months: parsed.months && typeof parsed.months === 'object' ? parsed.months : {},
        history: Array.isArray(parsed.history) ? parsed.history.slice(0, 60) : []
      };
    } catch (error) {
      console.warn('Zar oyunu kayıtları okunamadı:', error);
      return defaultState();
    }
  };

  let state = loadState();
  let autoTimer = null;
  let autoRemaining = 0;
  let busy = false;
  let storageAvailable = true;
  const persist = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      storageAvailable = true;
    } catch (error) {
      storageAvailable = false;
      console.warn('Zar oyunu tarayıcıya kaydedilemedi:', error);
    }
  };
  const safeText = (value) => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));

  const balanceEl = $('#diceBalance');
  const betInput = $('#diceBet');
  const rollButton = $('#diceRollButton');
  const dailyButton = $('#diceDailyBonus');
  const dailyStatus = $('#diceDailyStatus');
  const feedback = $('#diceFeedback');
  const visualStage = $('#diceVisualStage');
  const rollValueEl = $('#diceRollValue');
  const autoInput = $('#diceAuto');
  const historyList = $('#diceHistoryList');

  // Keep input minimum, step and initial bet compatible with the 100-credit start.
  betInput.min = String(MIN_BET);
  betInput.step = String(BET_STEP);
  const initialBet = Math.floor(Number(betInput.value) || MIN_BET);
  betInput.value = String(Math.max(MIN_BET, Math.min(initialBet, state.balance)));

  const currentMonthStat = () => state.months[monthKey()] || newMonthStats();
  const ensureMonth = () => {
    const key = monthKey();
    if (!state.months[key]) state.months[key] = newMonthStats();
    return state.months[key];
  };
  const moneyDelta = (value) => `${value > 0 ? '+' : value < 0 ? '−' : ''}${fmt(Math.abs(value))}`;

  function refreshDailyProtection() {
    const today = todayKey();
    if (state.protectionDate === today) return false;

    state.protectionDate = today;
    // Daily protection resets. A balance already above 100,000 remains unlocked.
    state.protectionUnlocked = state.balance > UNLOCK_THRESHOLD;
    if (!state.protectionUnlocked) {
      state.balance = Math.max(MIN_BALANCE, state.balance);
    }
    persist();
    return true;
  }

  function renderDailyBonus() {
    const today = todayKey();
    const playedToday = Number(state.playsByDay[today] || 0) > 0;
    const claimedToday = state.lastBonusDate === today;
    dailyButton.disabled = !playedToday || claimedToday;
    if (claimedToday) dailyStatus.textContent = 'Bugünkü +5.000 kredini aldın. Yarın yeniden görüşürüz.';
    else if (playedToday) dailyStatus.textContent = 'Günlük +5.000 kredin hazır. Bugün bir kez oynadığın için alabilirsin.';
    else dailyStatus.textContent = 'Günlük +5.000 kredi için bugün en az bir kez zar atmalısın.';
  }

  function renderMonthOptions() {
    const select = $('#diceMonthSelect');
    if (!select || select.options.length) return;
    const now = new Date();
    for (let offset = 0; offset < 6; offset++) {
      const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = new Intl.DateTimeFormat('tr-TR', { month: 'long', year: 'numeric', timeZone: 'Europe/Istanbul' }).format(d);
      const option = document.createElement('option');
      option.value = key;
      option.textContent = label.charAt(0).toLocaleUpperCase('tr-TR') + label.slice(1);
      select.append(option);
    }
  }

  function renderMonth() {
    const key = $('#diceMonthSelect')?.value || monthKey();
    const stat = state.months[key] || newMonthStats();
    const pretty = (() => {
      const [year, month] = key.split('-').map(Number);
      return new Intl.DateTimeFormat('tr-TR', { month: 'long', year: 'numeric', timeZone: 'Europe/Istanbul' }).format(new Date(year, month - 1, 1));
    })();
    $('#diceMonthLabel').textContent = `${pretty} performansın`;
    $('#diceMonthPlays').textContent = fmt(stat.plays);
    const net = $('#diceMonthNet');
    net.textContent = moneyDelta(stat.net);
    net.classList.toggle('is-positive', stat.net > 0);
    net.classList.toggle('is-negative', stat.net < 0);
    $('#diceMonthBest').textContent = fmt(stat.bestPayout);
  }

  function renderHistory() {
    $('#diceHistoryCount').textContent = `${fmt(state.totalPlays)} oyun`;
    const items = state.history.slice(0, 8);
    if (!items.length) {
      historyList.innerHTML = '<p class="dice-history-empty">Henüz zar atmadın. İlk turun seni bekliyor.</p>';
      return;
    }
    historyList.innerHTML = items.map(item => {
      const type = item.roll <= 54 ? 'loss' : item.roll >= 99 ? 'jackpot' : 'win';
      const resultText = type === 'loss' ? `−${fmt(item.stake)}` : `+${fmt(Math.max(0, item.payout - item.stake))}`;
      const dateText = `${safeText(item.date)} · Bahis ${fmt(item.stake)}`;
      return `<article class="dice-history-item"><span class="dice-history-number">${fmt(item.roll)}</span><span class="dice-history-copy"><strong>${type === 'loss' ? 'Bahis kaybedildi' : type === 'jackpot' ? '10 kat ödeme!' : '2 kat ödeme'}</strong><small>${dateText}</small></span><strong class="dice-history-result is-${type}">${resultText}</strong></article>`;
    }).join('');
  }

  function render() {
    refreshDailyProtection();
    balanceEl.textContent = fmt(state.balance);
    renderDailyBonus();
    renderMonth();
    renderHistory();
    if (!storageAvailable) $('#diceStorageNotice')?.removeAttribute('hidden');
  }

  function setFeedback(title, detail, type = '') {
    feedback.className = `dice-feedback${type ? ` is-${type}` : ''}`;
    feedback.innerHTML = `<strong>${safeText(title)}</strong><span>${safeText(detail)}</span>`;
  }

  function secureRandom101() {
    if (window.crypto?.getRandomValues) {
      const data = new Uint32Array(1);
      const range = 0x100000000;
      const limit = Math.floor(range / 101) * 101;
      do { crypto.getRandomValues(data); } while (data[0] >= limit);
      return data[0] % 101;
    }
    return Math.floor(Math.random() * 101);
  }

  function getBet() {
    const raw = Number(betInput.value);
    if (!Number.isFinite(raw)) return 0;
    return Math.floor(raw);
  }

  function stopAuto(message = 'Otomatik seri durduruldu.') {
    if (autoTimer) clearTimeout(autoTimer);
    autoTimer = null;
    autoRemaining = 0;
    if (message) setFeedback('Otomatik seri durdu', message);
    rollButton.textContent = '🎲 ZAR AT';
    busy = false;
  }

  function oneRoll() {
    refreshDailyProtection();

    const stake = getBet();
    if (!Number.isSafeInteger(stake) || stake < MIN_BET) {
      setFeedback('Geçersiz bahis', `En az ${fmt(MIN_BET)} kredi girmelisin.`, 'loss');
      return false;
    }
    if (stake > state.balance) {
      setFeedback('Yetersiz bakiye', 'Bahis miktarını bakiyene göre azalt veya günlük bonusunu al.', 'loss');
      return false;
    }

    const roll = secureRandom101();
    const payout = roll <= 54 ? 0 : roll <= 98 ? stake * 2 : stake * 10;
    const net = payout - stake;
    const nextBalance = state.balance - stake + payout;

    // Below the daily unlock threshold, balance is protected at 100.
    // Once balance exceeds 100,000, protection is disabled for the rest of that day.
    if (!state.protectionUnlocked && nextBalance > UNLOCK_THRESHOLD) {
      state.protectionUnlocked = true;
    }
    state.balance = state.protectionUnlocked
      ? Math.max(0, nextBalance)
      : Math.max(MIN_BALANCE, nextBalance);

    state.totalPlays += 1;
    state.playsByDay[todayKey()] = Number(state.playsByDay[todayKey()] || 0) + 1;
    state.lastPlayDate = todayKey();
    if (payout > stake) state.totalWins += 1;
    else state.totalLosses += 1;
    state.bestPayout = Math.max(state.bestPayout, payout);

    const month = ensureMonth();
    month.plays += 1;
    month.net += net;
    month.bestPayout = Math.max(month.bestPayout, payout);

    const record = {
      date: todayKey(),
      time: new Intl.DateTimeFormat('tr-TR', { timeZone: 'Europe/Istanbul', hour: '2-digit', minute: '2-digit' }).format(new Date()),
      stake, roll, payout, net
    };
    state.history.unshift(record);
    state.history = state.history.slice(0, 60);
    persist();

    rollValueEl.textContent = String(roll);
    visualStage.classList.remove('is-rolling');
    void visualStage.offsetWidth;
    visualStage.classList.add('is-rolling');
    visualStage.addEventListener('animationend', () => visualStage.classList.remove('is-rolling'), { once: true });

    if (roll <= 54) {
      const protectionText = state.protectionUnlocked
        ? `Yeni bakiyen ${fmt(state.balance)} kredi.`
        : `Günlük koruma sayesinde bakiyen ${fmt(state.balance)} kredinin altına düşmedi.`;
      setFeedback(`${roll} geldi · Bahsini kaybettin`, `${fmt(stake)} kredi kaybettin. ${protectionText}`, 'loss');
    } else if (roll <= 98) {
      setFeedback(`${roll} geldi · 2 kat ödeme!`, `${fmt(payout)} kredi geri aldın. Net kazancın ${fmt(net)} kredi.`, 'win');
    } else {
      setFeedback(`${roll} geldi · JACKPOT!`, `${fmt(payout)} kredi geri aldın. Net kazancın ${fmt(net)} kredi.`, 'jackpot');
    }

    render();
    return true;
  }

  function runAutoStep() {
    refreshDailyProtection();
    if (!autoInput.checked || autoRemaining <= 0) {
      stopAuto('Otomatik seri tamamlandı.');
      return;
    }
    if (getBet() > state.balance || state.balance < MIN_BET) {
      stopAuto('Bakiye bahis için yetersiz. Otomatik seri sonlandırıldı.');
      return;
    }
    if (!oneRoll()) {
      stopAuto('Otomatik seri sonlandırıldı.');
      return;
    }
    autoRemaining -= 1;
    if (autoRemaining > 0 && autoInput.checked) autoTimer = setTimeout(runAutoStep, AUTO_DELAY);
    else stopAuto('25 atışlık otomatik seri tamamlandı.');
  }

  function startRoll() {
    refreshDailyProtection();
    if (autoTimer) {
      stopAuto('Otomatik seri senin isteğinle durduruldu.');
      return;
    }
    if (busy) return;
    if (!oneRoll()) return;
    if (autoInput.checked) {
      autoRemaining = AUTO_LIMIT - 1;
      rollButton.textContent = 'Ⅱ SERİYİ DURDUR';
      autoTimer = setTimeout(runAutoStep, AUTO_DELAY);
    }
  }

  $('#diceRollButton').addEventListener('click', startRoll);
  $('#diceBetMinus').addEventListener('click', () => {
    betInput.value = String(Math.max(MIN_BET, getBet() - BET_STEP));
  });
  $('#diceBetPlus').addEventListener('click', () => {
    betInput.value = String(Math.min(Number.MAX_SAFE_INTEGER, getBet() + BET_STEP));
  });
  document.querySelectorAll('[data-bet]').forEach(button => button.addEventListener('click', () => {
    betInput.value = button.dataset.bet === 'max'
      ? String(state.balance)
      : String(Math.max(MIN_BET, Number(button.dataset.bet) || MIN_BET));
    betInput.focus();
  }));
  betInput.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
      event.preventDefault();
      startRoll();
    }
  });
  betInput.addEventListener('change', () => {
    const value = getBet();
    if (!Number.isFinite(value) || value < MIN_BET) betInput.value = String(MIN_BET);
    if (getBet() > state.balance) betInput.value = String(Math.max(MIN_BET, state.balance));
  });
  autoInput.addEventListener('change', () => {
    if (!autoInput.checked && autoTimer) stopAuto('Otomatik seri kapatıldı.');
  });
  $('#diceMonthSelect').addEventListener('change', renderMonth);

  dailyButton.addEventListener('click', () => {
    refreshDailyProtection();
    const today = todayKey();
    if (Number(state.playsByDay[today] || 0) < 1) {
      renderDailyBonus();
      return;
    }
    if (state.lastBonusDate === today) {
      renderDailyBonus();
      return;
    }
    state.balance += DAILY_BONUS;
    state.lastBonusDate = today;
    persist();
    render();
    setFeedback('Günlük +5.000 kredi eklendi!', `Yeni bakiyen ${fmt(state.balance)} kredi. Yarın günlük koruman yeniden değerlendirilecek.`, 'jackpot');
  });

  renderMonthOptions();
  render();
  if (state.history.length) {
    const last = state.history[0];
    rollValueEl.textContent = String(last.roll);
    if (!state.lastPlayDate || state.lastPlayDate !== todayKey()) {
      setFeedback('Tekrar hoş geldin!', 'Son turun hazır. Bahsini seçerek devam edebilirsin.');
    }
  }
  window.addEventListener('pagehide', () => {
    if (autoTimer) clearTimeout(autoTimer);
  });
})();
