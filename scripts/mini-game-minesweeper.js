(() => {
  'use strict';
  const KEY = 'gunlugum:mini-games:minesweeper:v1';
  const DIFFICULTIES = {
    easy: { rows: 9, cols: 9, mines: 10 },
    medium: { rows: 16, cols: 16, mines: 40 },
    hard: { rows: 16, cols: 30, mines: 99 }
  };
  const $ = id => document.getElementById(id);
  const board = $('msBoard');
  const configSelect = $('msDifficulty');
  let state;
  let timerHandle = 0;
  let flagMode = false;
  let storage = { games: 0, wins: 0, best: { easy: null, medium: null, hard: null } };

  function readStorage() {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (saved && typeof saved === 'object') {
        storage = {
          games: Number.isSafeInteger(saved.games) && saved.games >= 0 ? saved.games : 0,
          wins: Number.isSafeInteger(saved.wins) && saved.wins >= 0 ? saved.wins : 0,
          best: Object.fromEntries(Object.keys(DIFFICULTIES).map(key => [key,
            Number.isFinite(saved.best?.[key]) && saved.best[key] >= 0 ? saved.best[key] : null]))
        };
      }
    } catch (error) { console.warn('Mayın Tarlası kayıtları okunamadı:', error); }
  }

  function persistStorage() {
    try { localStorage.setItem(KEY, JSON.stringify(storage)); }
    catch (error) { console.warn('Mayın Tarlası kayıtları saklanamadı:', error); }
  }

  function randomInt(max) {
    if (window.crypto?.getRandomValues) {
      const data = new Uint32Array(1);
      const limit = Math.floor(0x100000000 / max) * max;
      do { crypto.getRandomValues(data); } while (data[0] >= limit);
      return data[0] % max;
    }
    return Math.floor(Math.random() * max);
  }

  function neighbours(index, rows, cols) {
    const row = Math.floor(index / cols), col = index % cols;
    const result = [];
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const nr = row + dr, nc = col + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) result.push(nr * cols + nc);
    }
    return result;
  }

  function createState(difficulty) {
    const cfg = DIFFICULTIES[difficulty];
    return {
      difficulty, rows: cfg.rows, cols: cfg.cols, mineCount: cfg.mines,
      mines: new Set(), counts: Array(cfg.rows * cfg.cols).fill(0),
      revealed: new Set(), flags: new Set(), exploded: -1,
      startedAt: 0, elapsed: 0, over: false, won: false, firstMove: true
    };
  }

  function placeMines(safeIndex) {
    const safe = new Set([safeIndex, ...neighbours(safeIndex, state.rows, state.cols)]);
    let candidates = Array.from({ length: state.rows * state.cols }, (_, i) => i).filter(i => !safe.has(i));
    if (candidates.length < state.mineCount) candidates = Array.from({ length: state.rows * state.cols }, (_, i) => i).filter(i => i !== safeIndex);
    for (let i = candidates.length - 1; i > 0; i--) {
      const j = randomInt(i + 1); [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }
    state.mines = new Set(candidates.slice(0, state.mineCount));
    state.mines.forEach(index => neighbours(index, state.rows, state.cols).forEach(n => { state.counts[n]++; }));
  }

  function elapsedSeconds() {
    return state.startedAt ? Math.floor((Date.now() - state.startedAt) / 1000) : state.elapsed;
  }

  function formatTime(seconds) {
    const value = Math.max(0, Math.floor(seconds));
    return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
  }

  function updateTimer() {
    $('msTimer').textContent = String(Math.min(999, elapsedSeconds())).padStart(3, '0');
  }

  function startTimer() {
    if (state.startedAt || state.over) return;
    state.startedAt = Date.now() - state.elapsed * 1000;
    timerHandle = window.setInterval(updateTimer, 250);
  }

  function stopTimer() {
    if (timerHandle) window.clearInterval(timerHandle);
    timerHandle = 0;
    state.elapsed = elapsedSeconds();
    state.startedAt = 0;
    updateTimer();
  }

  function setStatus(message, kind = '') {
    const node = $('msStatus');
    node.textContent = message;
    node.classList.toggle('is-good', kind === 'good');
    node.classList.toggle('is-warn', kind === 'warn');
  }

  function renderStats() {
    $('msGames').textContent = storage.games.toLocaleString('tr-TR');
    $('msWins').textContent = storage.wins.toLocaleString('tr-TR');
    $('msWinRate').textContent = storage.games ? `${Math.round(storage.wins / storage.games * 100)}%` : '—';
    const best = storage.best[state.difficulty];
    $('msBest').textContent = best === null ? '—' : formatTime(best);
  }

  function cellLabel(index) {
    const row = Math.floor(index / state.cols) + 1, col = index % state.cols + 1;
    if (state.flags.has(index)) return `${row}. satır ${col}. sütun, bayraklı`;
    if (state.revealed.has(index)) {
      if (state.mines.has(index)) return `${row}. satır ${col}. sütun, mayın`;
      return `${row}. satır ${col}. sütun, ${state.counts[index] ? `${state.counts[index]} mayın komşuluğu` : 'boş'}`;
    }
    return `${row}. satır ${col}. sütun, kapalı`;
  }

  function render() {
    const total = state.rows * state.cols;
    board.style.setProperty('--ms-cols', state.cols);
    board.dataset.difficulty = state.difficulty;
    board.classList.toggle('is-over', state.over);
    board.innerHTML = '';
    const fragment = document.createDocumentFragment();
    for (let index = 0; index < total; index++) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'ms-cell';
      button.dataset.index = String(index);
      button.setAttribute('role', 'gridcell');
      const isMine = state.mines.has(index);
      const revealed = state.revealed.has(index);
      const flagged = state.flags.has(index);
      if (revealed) {
        button.classList.add('is-revealed');
        if (isMine) {
          button.classList.add('is-mine');
          button.textContent = '✹';
          if (index === state.exploded) button.classList.add('is-exploded');
        } else if (state.counts[index] > 0) {
          button.textContent = String(state.counts[index]);
          button.classList.add(`number-${state.counts[index]}`);
        }
      } else if (flagged) {
        button.classList.add('is-flagged');
        button.textContent = '⚑';
      } else if (state.over && isMine && !state.won) {
        button.classList.add('is-mine-revealed');
        button.textContent = '✹';
      }
      if (state.over && flagged && !isMine) {
        button.classList.add('is-wrong-flag');
        button.textContent = '×';
      }
      button.disabled = state.over || revealed;
      button.setAttribute('aria-label', cellLabel(index));
      fragment.appendChild(button);
    }
    board.appendChild(fragment);
    $('msMinesLeft').textContent = String(state.mineCount - state.flags.size).padStart(3, '0');
    $('msFlags').textContent = String(state.flags.size).padStart(3, '0');
    $('msMode').classList.toggle('is-active', flagMode);
    $('msMode').setAttribute('aria-pressed', String(flagMode));
    $('msMode').textContent = flagMode ? '⚑ Bayrak modu: Açık' : '⚑ Bayrak modu: Kapalı';
    $('msModeHint').textContent = flagMode ? 'Bayrak modu açık · Kareye dokunarak işaretle' : 'Sol tık: kareyi aç · Sağ tık: bayrak koy';
    renderStats();
    updateTimer();
  }

  function revealArea(startIndex) {
    const queue = [startIndex];
    const queued = new Set(queue);
    let cursor = 0;
    while (cursor < queue.length) {
      const index = queue[cursor++];
      if (state.revealed.has(index) || state.flags.has(index) || state.mines.has(index)) continue;
      state.revealed.add(index);
      if (state.counts[index] === 0) {
        neighbours(index, state.rows, state.cols).forEach(next => {
          if (!queued.has(next) && !state.revealed.has(next) && !state.flags.has(next) && !state.mines.has(next)) {
            queued.add(next); queue.push(next);
          }
        });
      }
    }
  }

  function finish(won) {
    if (state.over) return;
    state.over = true;
    state.won = won;
    if (won) state.mines.forEach(mine => state.flags.add(mine));
    stopTimer();
    storage.games++;
    if (won) {
      storage.wins++;
      const previous = storage.best[state.difficulty];
      if (previous === null || state.elapsed < previous) storage.best[state.difficulty] = state.elapsed;
    }
    persistStorage();
    $('msOverlay').hidden = false;
    $('msOverlayIcon').textContent = won ? '🏆' : '💥';
    $('msOverlayTitle').textContent = won ? 'Tebrikler, kazandın!' : 'Mayına bastın!';
    $('msOverlayText').textContent = won
      ? `Tüm güvenli kareleri açtın. Süren: ${formatTime(state.elapsed)}.`
      : `Mayınların yerleri açığa çıktı. ${formatTime(state.elapsed)} içinde ${Array.from(state.revealed).filter(index => !state.mines.has(index)).length.toLocaleString('tr-TR')} güvenli kare açtın.`;
    $('msOverlay').classList.toggle('is-win', won);
    setStatus(won ? 'Harika! Tüm güvenli kareleri açtın.' : 'Oyun sona erdi. Yeni bir turla tekrar deneyebilirsin.', won ? 'good' : 'warn');
    render();
  }

  function checkWin() {
    if (state.revealed.size === state.rows * state.cols - state.mineCount) finish(true);
  }

  function reveal(index) {
    if (state.over || state.revealed.has(index) || state.flags.has(index)) return;
    if (state.firstMove) {
      placeMines(index);
      state.firstMove = false;
      startTimer();
    }
    if (state.mines.has(index)) {
      state.exploded = index;
      state.mines.forEach(mine => state.revealed.add(mine));
      finish(false);
      return;
    }
    revealArea(index);
    checkWin();
    if (!state.over) {
      const number = state.counts[index];
      setStatus(number ? `Bu karenin çevresinde ${number} mayın var. İpuçlarını takip et.` : 'Geniş bir güvenli alan açıldı. Güzel gidiyorsun!');
      render();
    }
  }

  function toggleFlag(index) {
    if (state.over || state.revealed.has(index)) return;
    if (state.flags.has(index)) state.flags.delete(index);
    else if (state.flags.size < state.mineCount) state.flags.add(index);
    else { setStatus('Mayın sayısı kadar bayrak yerleştirebilirsin.', 'warn'); return; }
    render();
  }

  function startGame(difficulty = configSelect.value) {
    if (!DIFFICULTIES[difficulty]) difficulty = 'easy';
    if (timerHandle) window.clearInterval(timerHandle);
    configSelect.value = difficulty;
    state = createState(difficulty);
    flagMode = false;
    $('msOverlay').hidden = true;
    $('msOverlay').classList.remove('is-win');
    setStatus('Başlamak için bir kare aç. İlk hamlen güvenli olacak.');
    render();
  }

  board.addEventListener('click', event => {
    const cell = event.target.closest('.ms-cell');
    if (!cell || !board.contains(cell)) return;
    const index = Number(cell.dataset.index);
    if (flagMode) toggleFlag(index);
    else reveal(index);
  });
  board.addEventListener('contextmenu', event => {
    const cell = event.target.closest('.ms-cell');
    if (!cell || !board.contains(cell)) return;
    event.preventDefault();
    toggleFlag(Number(cell.dataset.index));
  });
  $('msMode').addEventListener('click', () => { flagMode = !flagMode; render(); });
  $('msNew').addEventListener('click', () => startGame());
  $('msOverlayNew').addEventListener('click', () => startGame());
  configSelect.addEventListener('change', () => startGame(configSelect.value));

  readStorage();
  startGame('easy');
})();
