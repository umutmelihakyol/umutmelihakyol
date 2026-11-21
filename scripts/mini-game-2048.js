(() => {
  'use strict';
  const KEY = 'gunlugum:mini-games:2048:v1';
  const SIZE = 4;
  const $ = id => document.getElementById(id);
  const emptyGrid = () => Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
  const safeScore = value => Number.isSafeInteger(value) && value >= 0 ? value : 0;
  function randomIndex(max) {
    if (window.crypto?.getRandomValues) {
      const data = new Uint32Array(1);
      const limit = Math.floor(0x100000000 / max) * max;
      do { crypto.getRandomValues(data); } while (data[0] >= limit);
      return data[0] % max;
    }
    return Math.floor(Math.random() * max);
  }
  function addTile(grid) {
    const empty = [];
    grid.forEach((row, r) => row.forEach((value, c) => { if (!value) empty.push([r, c]); }));
    if (!empty.length) return false;
    const [r, c] = empty[randomIndex(empty.length)];
    grid[r][c] = randomIndex(10) === 0 ? 4 : 2;
    return true;
  }
  const initialGrid = () => { const grid = emptyGrid(); addTile(grid); addTile(grid); return grid; };
  const freshState = () => ({ grid: initialGrid(), score: 0, best: 0, won: false, keepPlaying: false, over: false });
  function readState() {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (!saved || !Array.isArray(saved.grid) || saved.grid.length !== SIZE ||
          saved.grid.some(row => !Array.isArray(row) || row.length !== SIZE || row.some(value => !Number.isSafeInteger(value) || value < 0))) return freshState();
      return {
        grid: saved.grid.map(row => row.slice()), score: safeScore(saved.score), best: safeScore(saved.best),
        won: saved.won === true, keepPlaying: saved.keepPlaying === true, over: saved.over === true
      };
    } catch (error) { console.warn('2048 kaydı okunamadı:', error); return freshState(); }
  }
  let state = readState();
  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch (error) { console.warn('2048 kaydı saklanamadı:', error); }
  }
  function has2048(grid) { return grid.some(row => row.some(value => value >= 2048)); }
  function canMove(grid) {
    for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) {
      if (!grid[r][c]) return true;
      if (c < SIZE - 1 && grid[r][c] === grid[r][c + 1]) return true;
      if (r < SIZE - 1 && grid[r][c] === grid[r + 1][c]) return true;
    }
    return false;
  }
  function slide(line) {
    const values = line.filter(Boolean);
    const result = [];
    let gained = 0;
    for (let i = 0; i < values.length; i++) {
      if (values[i] === values[i + 1]) {
        const merged = values[i] * 2;
        result.push(merged); gained += merged; i++;
      } else result.push(values[i]);
    }
    while (result.length < SIZE) result.push(0);
    return { line: result, gained };
  }
  function movedGrid(grid, direction) {
    const next = emptyGrid();
    let gained = 0;
    for (let i = 0; i < SIZE; i++) {
      let line = direction === 'left' || direction === 'right' ? grid[i].slice() : grid.map(row => row[i]);
      if (direction === 'right' || direction === 'down') line.reverse();
      const result = slide(line);
      if (direction === 'right' || direction === 'down') result.line.reverse();
      gained += result.gained;
      if (direction === 'left' || direction === 'right') next[i] = result.line;
      else result.line.forEach((value, row) => { next[row][i] = value; });
    }
    return { grid: next, gained };
  }
  function render() {
    $('g2048Score').textContent = state.score.toLocaleString('tr-TR');
    $('g2048Best').textContent = state.best.toLocaleString('tr-TR');
    $('g2048Board').innerHTML = state.grid.flat().map(value => {
      const className = value ? `v${Math.min(value, 4096)}` : 'v-empty';
      return `<div class="game2048-cell ${className}" role="gridcell" aria-label="${value || 'Boş'}">${value ? `<span>${value}</span>` : '<span></span>'}</div>`;
    }).join('');
    const overlay = $('g2048Overlay');
    if (state.won && !state.keepPlaying) {
      overlay.hidden = false;
      $('g2048OverlayTitle').textContent = '2048!';
      $('g2048OverlayText').textContent = 'Tebrikler, hedef kareyi oluşturdun. Devam ederek daha yüksek sayılara ulaşabilirsin.';
      $('g2048Continue').hidden = false;
      $('g2048Status').textContent = '2048 hedefine ulaştın!';
    } else if (state.over) {
      overlay.hidden = false;
      $('g2048OverlayTitle').textContent = 'Oyun bitti';
      $('g2048OverlayText').textContent = `Yapılabilecek hamle kalmadı. Skorun: ${state.score.toLocaleString('tr-TR')}.`;
      $('g2048Continue').hidden = true;
      $('g2048Status').textContent = 'Tahtada boş alan veya birleştirilebilecek kare kalmadı.';
    } else {
      overlay.hidden = true;
      $('g2048Status').textContent = state.won ? '2048 hedefine ulaştın. Daha yüksek sayılar için devam et!' : 'Aynı sayıları birleştirerek 2048’e ulaş.';
    }
  }
  function move(direction) {
    if (!['up', 'down', 'left', 'right'].includes(direction) || state.over || (state.won && !state.keepPlaying)) return;
    const result = movedGrid(state.grid, direction);
    const changed = result.grid.some((row, r) => row.some((value, c) => value !== state.grid[r][c]));
    if (!changed) return;
    state.grid = result.grid;
    state.score += result.gained;
    state.best = Math.max(state.best, state.score);
    addTile(state.grid);
    if (!state.won && has2048(state.grid)) { state.won = true; state.keepPlaying = false; }
    state.over = !canMove(state.grid);
    persist(); render();
  }
  function newGame() { state = { ...freshState(), best: state.best }; persist(); render(); }
  $('g2048New').addEventListener('click', newGame);
  $('g2048OverlayNew').addEventListener('click', newGame);
  $('g2048Continue').addEventListener('click', () => { state.keepPlaying = true; state.over = !canMove(state.grid); persist(); render(); });
  document.querySelectorAll('.game2048-controls button').forEach(button => button.addEventListener('click', () => move(button.dataset.dir)));
  document.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.target && /INPUT|TEXTAREA|SELECT/.test(event.target.tagName)) return;
    const keys = { ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down', ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right' };
    const direction = keys[event.key];
    if (direction) { event.preventDefault(); move(direction); }
  });
  let pointerStart = null;
  const board = $('g2048BoardWrap');
  board.addEventListener('pointerdown', event => { pointerStart = { x: event.clientX, y: event.clientY }; });
  board.addEventListener('pointerup', event => {
    if (!pointerStart) return;
    const dx = event.clientX - pointerStart.x, dy = event.clientY - pointerStart.y;
    pointerStart = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? 'right' : 'left'); else move(dy > 0 ? 'down' : 'up');
  });
  board.addEventListener('pointercancel', () => { pointerStart = null; });
  persist(); render();
})();
