(() => {
  'use strict';
  const KEY = 'gunlugum:mini-games:sudoku:v1';
  const SIZE = 9, TOTAL = 81, FULL = 0x1FF;
  const $ = id => document.getElementById(id);
  const boardNode = $('sdkBoard');
  const difficultyNode = $('sdkDifficulty');
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
  const BLANKS = { easy: 35, medium: 45, hard: 51, expert: 55 };
  const DIFFICULTY_NAMES = { easy: 'Kolay', medium: 'Orta', hard: 'Zor', expert: 'Uzman' };
  let game;
  let clockHandle = 0;
  let notesMode = false;
  let showErrors = false;
  let stats = { games: 0, streak: 0, best: { easy: null, medium: null, hard: null, expert: null }, hints: 0 };

  function shuffle(items) {
    const array = items.slice();
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  function shuffledGroupOrder() {
    return shuffle([0, 1, 2]).flatMap(group => shuffle([0, 1, 2]).map(item => group * 3 + item));
  }

  function generateSolution() {
    const rows = shuffledGroupOrder();
    const cols = shuffledGroupOrder();
    const digits = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    return Array.from({ length: TOTAL }, (_, index) => {
      const row = Math.floor(index / SIZE), col = index % SIZE;
      const pattern = (rows[row] * 3 + Math.floor(rows[row] / 3) + cols[col]) % 9;
      return digits[pattern];
    });
  }

  function candidatesFor(grid, index) {
    const row = Math.floor(index / SIZE), col = index % SIZE;
    let used = 0;
    for (let i = 0; i < SIZE; i++) {
      const rowValue = grid[row * SIZE + i], colValue = grid[i * SIZE + col];
      if (rowValue) used |= 1 << (rowValue - 1);
      if (colValue) used |= 1 << (colValue - 1);
    }
    const startRow = Math.floor(row / 3) * 3, startCol = Math.floor(col / 3) * 3;
    for (let r = startRow; r < startRow + 3; r++) for (let c = startCol; c < startCol + 3; c++) {
      const value = grid[r * SIZE + c];
      if (value) used |= 1 << (value - 1);
    }
    return FULL & ~used;
  }

  function countSolutions(grid, limit = 2) {
    let count = 0;
    function visit() {
      let bestIndex = -1, bestMask = 0, bestCount = 10;
      for (let index = 0; index < TOTAL; index++) {
        if (grid[index]) continue;
        const mask = candidatesFor(grid, index);
        let amount = 0;
        for (let bits = mask; bits; bits &= bits - 1) amount++;
        if (!amount) return false;
        if (amount < bestCount) {
          bestIndex = index; bestMask = mask; bestCount = amount;
          if (amount === 1) break;
        }
      }
      if (bestIndex === -1) { count++; return count >= limit; }
      for (let digit = 1; digit <= 9; digit++) {
        const bit = 1 << (digit - 1);
        if (!(bestMask & bit)) continue;
        grid[bestIndex] = digit;
        const reachedLimit = visit();
        grid[bestIndex] = 0;
        if (reachedLimit) return true;
      }
      return false;
    }
    visit();
    return count;
  }

  function generatePuzzle(difficulty) {
    const solution = generateSolution();
    const puzzle = solution.slice();
    const positions = shuffle(Array.from({ length: TOTAL }, (_, i) => i));
    const target = BLANKS[difficulty] || BLANKS.easy;
    let removed = 0;
    for (const index of positions) {
      if (removed >= target) break;
      const old = puzzle[index];
      puzzle[index] = 0;
      if (countSolutions(puzzle.slice(), 2) === 1) removed++;
      else puzzle[index] = old;
    }
    return { solution, puzzle, removed };
  }

  function readStats() {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (!saved || typeof saved !== 'object') return;
      stats = {
        games: Number.isSafeInteger(saved.games) && saved.games >= 0 ? saved.games : 0,
        streak: Number.isSafeInteger(saved.streak) && saved.streak >= 0 ? saved.streak : 0,
        hints: Number.isSafeInteger(saved.hints) && saved.hints >= 0 ? saved.hints : 0,
        best: Object.fromEntries(Object.keys(BLANKS).map(key => [key,
          Number.isFinite(saved.best?.[key]) && saved.best[key] >= 0 ? saved.best[key] : null]))
      };
    } catch (error) { console.warn('Sudoku kayıtları okunamadı:', error); }
  }

  function saveStats() {
    try { localStorage.setItem(KEY, JSON.stringify(stats)); }
    catch (error) { console.warn('Sudoku kayıtları saklanamadı:', error); }
  }

  function formatTime(seconds) {
    const value = Math.max(0, Math.floor(seconds));
    return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
  }

  function currentSeconds() {
    return game.startedAt ? Math.floor((Date.now() - game.startedAt) / 1000) : game.elapsed;
  }

  function startClock() {
    if (game.startedAt || game.finished) return;
    game.startedAt = Date.now() - game.elapsed * 1000;
    clockHandle = window.setInterval(updateTimer, 250);
  }

  function stopClock() {
    if (clockHandle) window.clearInterval(clockHandle);
    clockHandle = 0;
    game.elapsed = currentSeconds();
    game.startedAt = 0;
    updateTimer();
  }

  function updateTimer() { $('sdkTimer').textContent = formatTime(currentSeconds()); }

  function setStatus(message, kind = '') {
    const node = $('sdkStatus');
    node.textContent = message;
    node.classList.toggle('is-good', kind === 'good');
    node.classList.toggle('is-warn', kind === 'warn');
  }

  function startGame(difficulty = difficultyNode.value) {
    if (game && !game.finished) {
      const hasProgress = game.elapsed > 0 || game.values.some((value, index) => value !== game.puzzle[index]) || game.notes.some(note => note.size > 0);
      if (hasProgress) { stats.streak = 0; saveStats(); }
    }
    if (!Object.hasOwn(BLANKS, difficulty)) difficulty = 'easy';
    if (clockHandle) window.clearInterval(clockHandle);
    const generated = generatePuzzle(difficulty);
    game = {
      difficulty, puzzle: generated.puzzle, solution: generated.solution,
      values: generated.puzzle.slice(), notes: Array.from({ length: TOTAL }, () => new Set()),
      selected: generated.puzzle.findIndex(value => value === 0), startedAt: 0, elapsed: 0,
      finished: false, hints: 0
    };
    notesMode = false; showErrors = false;
    difficultyNode.value = difficulty;
    $('sdkNotes').classList.remove('is-active');
    $('sdkNotes').setAttribute('aria-pressed', 'false');
    $('sdkNotes').textContent = '✎ Not modu: Kapalı';
    setStatus(`Yeni ${DIFFICULTY_NAMES[difficulty]} bulmaca hazır. Başarılar!`);
    render();
  }

  function filledCount() { return game.values.filter(Boolean).length; }
  function isFixed(index) { return game.puzzle[index] !== 0; }
  function sameBox(a, b) {
    return Math.floor(Math.floor(a / 9) / 3) === Math.floor(Math.floor(b / 9) / 3) &&
      Math.floor((a % 9) / 3) === Math.floor((b % 9) / 3);
  }
  function related(a, b) { return Math.floor(a / 9) === Math.floor(b / 9) || a % 9 === b % 9 || sameBox(a, b); }

  function errorSet() {
    if (!showErrors) return new Set();
    return new Set(game.values.map((value, index) => value && !isFixed(index) && value !== game.solution[index] ? index : -1).filter(index => index >= 0));
  }

  function notesMarkup(index) {
    const notes = game.notes[index];
    const wrap = document.createElement('span');
    wrap.className = 'sdk-notes-grid';
    for (let digit = 1; digit <= 9; digit++) {
      const item = document.createElement('i');
      if (notes.has(digit)) item.textContent = String(digit);
      wrap.appendChild(item);
    }
    return wrap;
  }

  function render() {
    const errors = errorSet();
    const selectedValue = game.values[game.selected];
    const fragment = document.createDocumentFragment();
    boardNode.innerHTML = '';
    for (let index = 0; index < TOTAL; index++) {
      const value = game.values[index];
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'sdk-cell';
      cell.dataset.index = String(index);
      cell.setAttribute('role', 'gridcell');
      cell.setAttribute('aria-selected', String(index === game.selected));
      cell.setAttribute('aria-label', `${Math.floor(index / 9) + 1}. satır ${index % 9 + 1}. sütun, ${value || 'boş'}${isFixed(index) ? ', sabit' : ''}`);
      if (isFixed(index)) cell.classList.add('is-fixed');
      if (index === game.selected) cell.classList.add('is-selected');
      else if (related(index, game.selected)) cell.classList.add('is-peer');
      if (value && selectedValue && value === selectedValue) cell.classList.add('is-same');
      if (errors.has(index)) cell.classList.add('is-error');
      if (Math.floor(index / 9) % 3 === 2 && Math.floor(index / 9) !== 8) cell.classList.add('box-bottom');
      if (index % 9 % 3 === 2 && index % 9 !== 8) cell.classList.add('box-right');
      cell.tabIndex = index === game.selected ? 0 : -1;
      if (value) {
        const span = document.createElement('span');
        span.className = 'sdk-value'; span.textContent = String(value); cell.appendChild(span);
      } else if (game.notes[index].size) cell.appendChild(notesMarkup(index));
      cell.disabled = game.finished;
      fragment.appendChild(cell);
    }
    boardNode.appendChild(fragment);
    const complete = filledCount();
    $('sdkProgressText').textContent = `${complete} / 81`;
    $('sdkProgressBar').style.width = `${complete / 81 * 100}%`;
    $('sdkHints').textContent = String(game.hints);
    $('sdkGames').textContent = String(stats.games);
    $('sdkStreak').textContent = String(stats.streak);
    const best = stats.best[game.difficulty];
    $('sdkBest').textContent = best === null ? '—' : formatTime(best);
    $('sdkNotes').disabled = game.finished;
    $('sdkErase').disabled = game.finished || isFixed(game.selected) || (!game.values[game.selected] && !game.notes[game.selected].size);
    $('sdkHint').disabled = game.finished || (complete === TOTAL && errorSet().size === 0);
    $('sdkCheck').disabled = game.finished;
    document.querySelectorAll('.sdk-numpad button').forEach(button => { button.disabled = game.finished; });
    updateTimer();
  }

  function removePeerNotes(index, digit) {
    for (let other = 0; other < TOTAL; other++) {
      if (other !== index && related(index, other)) game.notes[other].delete(digit);
    }
  }

  function completeIfSolved() {
    if (game.values.some((value, index) => value !== game.solution[index])) return false;
    game.finished = true;
    stopClock();
    stats.games++;
    stats.streak++;
    const previous = stats.best[game.difficulty];
    if (previous === null || game.elapsed < previous) stats.best[game.difficulty] = game.elapsed;
    saveStats();
    setStatus(`Mükemmel! ${DIFFICULTY_NAMES[game.difficulty]} Sudoku’yu ${formatTime(game.elapsed)} içinde tamamladın.`, 'good');
    render();
    boardNode.classList.remove('is-complete');
    void boardNode.offsetWidth;
    boardNode.classList.add('is-complete');
    return true;
  }

  function enterDigit(digit) {
    if (game.finished || isFixed(game.selected)) return;
    const index = game.selected;
    if (notesMode) {
      if (game.values[index]) return;
      if (game.notes[index].has(digit)) game.notes[index].delete(digit);
      else game.notes[index].add(digit);
      startClock();
      render();
      return;
    }
    game.values[index] = digit;
    game.notes[index].clear();
    removePeerNotes(index, digit);
    startClock();
    showErrors = true;
    if (game.values[index] !== game.solution[index]) setStatus('Bu rakam çözümle uyuşmuyor. Başka bir değer deneyebilirsin.', 'warn');
    else setStatus('Doğru rakam! Devam et.');
    if (!completeIfSolved()) render();
  }

  function eraseSelected() {
    if (game.finished || isFixed(game.selected)) return;
    game.values[game.selected] = 0;
    game.notes[game.selected].clear();
    showErrors = true;
    setStatus('Seçili hücre temizlendi.');
    render();
  }

  function giveHint() {
    if (game.finished) return;
    let index = game.selected;
    if (game.values[index] === game.solution[index]) {
      index = game.values.findIndex((value, i) => !isFixed(i) && (!value || value !== game.solution[i]));
    }
    if (index < 0) return;
    game.selected = index;
    const digit = game.solution[index];
    game.values[index] = digit;
    game.notes[index].clear();
    removePeerNotes(index, digit);
    game.hints++;
    stats.hints++;
    saveStats();
    startClock();
    setStatus(`İpucu: Seçili hücreye ${digit} yerleştirildi.`);
    if (!completeIfSolved()) render();
  }

  function moveSelection(key) {
    const row = Math.floor(game.selected / 9), col = game.selected % 9;
    let nextRow = row, nextCol = col;
    if (key === 'ArrowUp') nextRow = (row + 8) % 9;
    if (key === 'ArrowDown') nextRow = (row + 1) % 9;
    if (key === 'ArrowLeft') nextCol = (col + 8) % 9;
    if (key === 'ArrowRight') nextCol = (col + 1) % 9;
    game.selected = nextRow * 9 + nextCol;
    render();
    boardNode.querySelector(`[data-index="${game.selected}"]`)?.focus({ preventScroll: true });
  }

  boardNode.addEventListener('click', event => {
    const cell = event.target.closest('.sdk-cell');
    if (!cell) return;
    game.selected = Number(cell.dataset.index);
    render();
    boardNode.querySelector(`[data-index="${game.selected}"]`)?.focus({ preventScroll: true });
  });

  document.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (!document.body.classList.contains('sudoku-page')) return;
    if (event.target?.matches('select,input,textarea')) return;
    if (event.key.startsWith('Arrow')) { event.preventDefault(); moveSelection(event.key); return; }
    if (/^[1-9]$/.test(event.key)) { event.preventDefault(); enterDigit(Number(event.key)); return; }
    if (event.key === 'Backspace' || event.key === 'Delete' || event.key === '0') { event.preventDefault(); eraseSelected(); return; }
    if (event.key.toLowerCase() === 'n') { notesMode = !notesMode; syncNotesButton(); render(); }
  });

  function syncNotesButton() {
    $('sdkNotes').classList.toggle('is-active', notesMode);
    $('sdkNotes').setAttribute('aria-pressed', String(notesMode));
    $('sdkNotes').textContent = notesMode ? '✎ Not modu: Açık' : '✎ Not modu: Kapalı';
  }

  document.querySelectorAll('.sdk-numpad button').forEach(button => button.addEventListener('click', () => {
    const digit = Number(button.dataset.digit);
    if (digit === 0) eraseSelected(); else enterDigit(digit);
  }));
  $('sdkNotes').addEventListener('click', () => { notesMode = !notesMode; syncNotesButton(); render(); });
  $('sdkErase').addEventListener('click', eraseSelected);
  $('sdkHint').addEventListener('click', giveHint);
  $('sdkCheck').addEventListener('click', () => {
    showErrors = true;
    const mistakes = errorSet().size;
    setStatus(mistakes ? `${mistakes} hatalı rakam bulundu. İşaretli hücreleri düzelt.` : 'Şu ana kadarki tüm girişlerin doğru görünüyor.', mistakes ? 'warn' : 'good');
    render();
  });
  $('sdkReset').addEventListener('click', () => {
    if (game.finished) return;
    if (clockHandle) window.clearInterval(clockHandle);
    game.values = game.puzzle.slice();
    game.notes = Array.from({ length: TOTAL }, () => new Set());
    game.elapsed = 0; game.startedAt = 0; game.hints = 0;
    game.selected = game.puzzle.findIndex(value => value === 0);
    notesMode = false; syncNotesButton();
    showErrors = false;
    setStatus('Bulmaca başlangıç durumuna döndürüldü.');
    render();
  });
  $('sdkNew').addEventListener('click', () => startGame(difficultyNode.value));
  difficultyNode.addEventListener('change', () => startGame(difficultyNode.value));

  readStats();
  startGame('easy');
})();
