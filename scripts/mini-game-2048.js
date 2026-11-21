(() => {
  'use strict';
  const KEY = 'gunlugum:mini-games:2048:v1';
  const SIZE = 4;
  const MOVE_DURATION = 155;
  const $ = id => document.getElementById(id);
  const emptyGrid = () => Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
  const safeScore = value => Number.isSafeInteger(value) && value >= 0 ? value : 0;
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
  const board = $('g2048Board');
  const tilesLayer = $('g2048Tiles');
  const scoreNode = $('g2048Score');
  const gainNode = $('g2048Gain');
  let animating = false;
  let animationTimer = 0;

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
    if (!empty.length) return null;
    const [r, c] = empty[randomIndex(empty.length)];
    const value = randomIndex(10) === 0 ? 4 : 2;
    grid[r][c] = value;
    return { r, c, value };
  }

  const initialGrid = () => {
    const grid = emptyGrid();
    addTile(grid); addTile(grid);
    return grid;
  };
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
    } catch (error) {
      console.warn('2048 kaydı okunamadı:', error);
      return freshState();
    }
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

  function lineCoordinates(direction, line) {
    if (direction === 'left') return Array.from({ length: SIZE }, (_, c) => ({ r: line, c }));
    if (direction === 'right') return Array.from({ length: SIZE }, (_, i) => ({ r: line, c: SIZE - 1 - i }));
    if (direction === 'up') return Array.from({ length: SIZE }, (_, r) => ({ r, c: line }));
    return Array.from({ length: SIZE }, (_, i) => ({ r: SIZE - 1 - i, c: line }));
  }

  function movedGrid(grid, direction) {
    const next = emptyGrid();
    const movements = [];
    let gained = 0;
    for (let line = 0; line < SIZE; line++) {
      const coords = lineCoordinates(direction, line);
      const entries = coords.map(pos => ({ ...pos, value: grid[pos.r][pos.c] })).filter(entry => entry.value > 0);
      let read = 0;
      let write = 0;
      while (read < entries.length) {
        const first = entries[read];
        const destination = coords[write];
        if (read + 1 < entries.length && first.value === entries[read + 1].value) {
          const second = entries[read + 1];
          const mergedValue = first.value * 2;
          next[destination.r][destination.c] = mergedValue;
          gained += mergedValue;
          movements.push({ from: { r: first.r, c: first.c }, to: destination, value: first.value, primary: true, merged: true });
          movements.push({ from: { r: second.r, c: second.c }, to: destination, value: second.value, mergeSource: true, merged: true });
          read += 2;
        } else {
          next[destination.r][destination.c] = first.value;
          movements.push({ from: { r: first.r, c: first.c }, to: destination, value: first.value, primary: true, merged: false });
          read += 1;
        }
        write += 1;
      }
    }
    return { grid: next, gained, movements };
  }

  function captureTiles() {
    const old = new Map();
    tilesLayer.querySelectorAll('.game2048-tile:not(.game2048-merge-ghost)').forEach(element => {
      old.set(`${element.dataset.row},${element.dataset.col}`, {
        value: Number(element.dataset.value), rect: element.getBoundingClientRect()
      });
    });
    return old;
  }

  function makeTile(value, r, c, extraClass = '') {
    const tile = document.createElement('div');
    tile.className = `game2048-tile v${Math.min(value, 4096)}${extraClass ? ` ${extraClass}` : ''}`;
    tile.dataset.row = String(r); tile.dataset.col = String(c); tile.dataset.value = String(value);
    tile.style.gridRow = String(r + 1); tile.style.gridColumn = String(c + 1);
    tile.setAttribute('role', 'gridcell'); tile.setAttribute('aria-label', String(value));
    const label = document.createElement('span'); label.textContent = String(value); tile.appendChild(label);
    return tile;
  }

  function animateTileMovement(tile, fromRect) {
    if (reducedMotion || !fromRect || typeof tile.animate !== 'function') return;
    const toRect = tile.getBoundingClientRect();
    const dx = fromRect.left - toRect.left;
    const dy = fromRect.top - toRect.top;
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
    tile.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'translate(0, 0)' }],
      { duration: MOVE_DURATION, easing: 'cubic-bezier(.18,.75,.25,1)', fill: 'both' });
  }

  function animateMergeSource(movement, oldTiles, destinationTile) {
    if (reducedMotion || typeof HTMLElement.prototype.animate !== 'function') return;
    const source = oldTiles.get(`${movement.from.r},${movement.from.c}`);
    if (!source || !destinationTile) return;
    const layerRect = tilesLayer.getBoundingClientRect();
    const targetRect = destinationTile.getBoundingClientRect();
    const ghost = makeTile(movement.value, movement.from.r, movement.from.c, 'game2048-merge-ghost');
    ghost.style.gridRow = 'auto'; ghost.style.gridColumn = 'auto';
    ghost.style.left = `${source.rect.left - layerRect.left}px`;
    ghost.style.top = `${source.rect.top - layerRect.top}px`;
    ghost.style.width = `${source.rect.width}px`; ghost.style.height = `${source.rect.height}px`;
    tilesLayer.appendChild(ghost);
    const dx = targetRect.left - source.rect.left;
    const dy = targetRect.top - source.rect.top;
    const animation = ghost.animate([
      { transform: 'translate(0, 0) scale(1)', opacity: 1 },
      { transform: `translate(${dx}px, ${dy}px) scale(.58)`, opacity: 0 }
    ], { duration: MOVE_DURATION, easing: 'cubic-bezier(.2,.7,.25,1)', fill: 'forwards' });
    animation.onfinish = () => ghost.remove();
  }

  function renderTiles(transition = null) {
    const oldTiles = transition ? captureTiles() : new Map();
    tilesLayer.innerHTML = '';
    const movementByDestination = new Map();
    const mergeSources = [];
    const mergedDestinations = new Set();
    if (transition?.movements) transition.movements.forEach(movement => {
      const key = `${movement.to.r},${movement.to.c}`;
      if (movement.mergeSource) { mergeSources.push(movement); mergedDestinations.add(key); }
      else { movementByDestination.set(key, movement); if (movement.merged) mergedDestinations.add(key); }
    });
    const destinationNodes = new Map();
    state.grid.forEach((row, r) => row.forEach((value, c) => {
      if (!value) return;
      const key = `${r},${c}`;
      const isSpawn = transition?.spawn && transition.spawn.r === r && transition.spawn.c === c;
      const isMerged = mergedDestinations.has(key);
      const tile = makeTile(value, r, c, isSpawn ? 'is-new' : isMerged ? 'is-merged' : '');
      tilesLayer.appendChild(tile); destinationNodes.set(key, tile);
      if (transition && !isSpawn) {
        const movement = movementByDestination.get(key);
        if (movement && (movement.from.r !== r || movement.from.c !== c)) {
          const oldTile = oldTiles.get(`${movement.from.r},${movement.from.c}`);
          animateTileMovement(tile, oldTile?.rect);
        }
      }
    }));
    mergeSources.forEach(movement => animateMergeSource(movement, oldTiles, destinationNodes.get(`${movement.to.r},${movement.to.c}`)));
  }

  function renderOverlay() {
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

  function render(transition = null) {
    scoreNode.textContent = state.score.toLocaleString('tr-TR');
    $('g2048Best').textContent = state.best.toLocaleString('tr-TR');
    renderTiles(transition);
    renderOverlay();
    if (transition?.gained > 0) {
      gainNode.textContent = `+${transition.gained.toLocaleString('tr-TR')}`;
      gainNode.classList.remove('is-visible'); scoreNode.classList.remove('is-bumping');
      void gainNode.offsetWidth;
      gainNode.classList.add('is-visible'); scoreNode.classList.add('is-bumping');
      window.setTimeout(() => { gainNode.classList.remove('is-visible'); scoreNode.classList.remove('is-bumping'); }, 720);
    } else {
      gainNode.textContent = ''; gainNode.classList.remove('is-visible'); scoreNode.classList.remove('is-bumping');
    }
  }

  function lockControls(locked) {
    document.querySelectorAll('.game2048-controls button').forEach(button => { button.disabled = locked; });
    $('g2048New').disabled = locked; $('g2048Continue').disabled = locked; $('g2048OverlayNew').disabled = locked;
  }

  function move(direction) {
    if (!['up', 'down', 'left', 'right'].includes(direction) || animating || state.over || (state.won && !state.keepPlaying)) return;
    const result = movedGrid(state.grid, direction);
    const changed = result.grid.some((row, r) => row.some((value, c) => value !== state.grid[r][c]));
    if (!changed) return;
    state.grid = result.grid;
    state.score += result.gained;
    state.best = Math.max(state.best, state.score);
    const spawn = addTile(state.grid);
    if (!state.won && has2048(state.grid)) { state.won = true; state.keepPlaying = false; }
    state.over = !canMove(state.grid);
    persist();
    render({ ...result, spawn });
    if (!reducedMotion) {
      animating = true; lockControls(true); window.clearTimeout(animationTimer);
      animationTimer = window.setTimeout(() => { animating = false; lockControls(false); }, MOVE_DURATION + 35);
    }
  }

  function newGame() {
    if (animating) return;
    state = { ...freshState(), best: state.best };
    persist(); render();
  }

  $('g2048New').addEventListener('click', newGame);
  $('g2048OverlayNew').addEventListener('click', newGame);
  $('g2048Continue').addEventListener('click', () => {
    if (animating) return;
    state.keepPlaying = true; state.over = !canMove(state.grid); persist(); render();
  });
  document.querySelectorAll('.game2048-controls button').forEach(button => button.addEventListener('click', () => move(button.dataset.dir)));
  document.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.target && /INPUT|TEXTAREA|SELECT|BUTTON/.test(event.target.tagName)) return;
    const keys = { ArrowUp:'up', w:'up', W:'up', ArrowDown:'down', s:'down', S:'down', ArrowLeft:'left', a:'left', A:'left', ArrowRight:'right', d:'right', D:'right' };
    const direction = keys[event.key];
    if (direction) { event.preventDefault(); move(direction); }
  });

  let pointerStart = null;
  const boardWrap = $('g2048BoardWrap');
  boardWrap.addEventListener('pointerdown', event => { pointerStart = { x: event.clientX, y: event.clientY }; });
  boardWrap.addEventListener('pointerup', event => {
    if (!pointerStart) return;
    const dx = event.clientX - pointerStart.x, dy = event.clientY - pointerStart.y;
    pointerStart = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? 'right' : 'left');
    else move(dy > 0 ? 'down' : 'up');
  });
  boardWrap.addEventListener('pointercancel', () => { pointerStart = null; });

  board.innerHTML = Array.from({ length: SIZE * SIZE }, () => '<div class="game2048-cell v-empty"></div>').join('');
  persist(); render();
})();
