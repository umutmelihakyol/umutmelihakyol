(function () {
  'use strict';
  const Core = window.GiveawayCore;
  const $ = id => document.getElementById(id);
  const state = { draws: [], currentId: null, resolved: new Map(), spinning: new Set(), resolving: new Set(), failed: new Set(), rotation: 0, raf: 0, waitRaf: 0, search: '' };
  const canvas = $('gwWheel');
  let ctx = null, canvasScale = 1, liveLoopDrawId = null;
  const palette = ['#5db7bd','#6f8ee8','#a78bdf','#e4b867','#4db994','#e58d71','#5c9ad7','#cd83af','#9fbd76','#d6a06a'];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmtDate = value => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 'Tarih belirtilmedi' : new Intl.DateTimeFormat('tr-TR', { dateStyle: 'long', timeStyle: 'short' }).format(date);
  };
  const fmtDateShort = value => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
  };
  const fmtDuration = seconds => {
    const n = Math.max(0, Math.floor(Number(seconds) || 0));
    if (n < 60) return `${n} saniye`;
    const m = Math.floor(n / 60), s = n % 60;
    return s ? `${m} dk ${s} sn` : `${m} dakika`;
  };
  function canvasSize() {
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const logical = 760;
    canvas.width = logical * dpr; canvas.height = logical * dpr;
    canvasScale = dpr;
    ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawWheel(currentDraw()?.participants || [], state.rotation);
  }
  function currentDraw() { return state.draws.find(d => d.id === state.currentId) || null; }
  function drawWheel(rawParticipants, rotation = 0) {
    if (!ctx) return;
    const size = 760, cx = size / 2, cy = size / 2, r = 354;
    const participants = Core.cleanParticipants({ participants: rawParticipants });
    ctx.clearRect(0, 0, size, size);
    ctx.save();
    ctx.translate(cx, cy);
    // Subtle outer ring
    ctx.beginPath(); ctx.arc(0, 0, r + 8, 0, Math.PI * 2); ctx.fillStyle = getComputedStyle(document.documentElement).dataset?.theme === 'light' ? '#e5e8e9' : '#263139'; ctx.fill();
    if (!participants.length) {
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fillStyle = getComputedStyle(document.documentElement).dataset.theme === 'dark' ? '#232d35' : '#e9eff0'; ctx.fill();
      ctx.strokeStyle = 'rgba(111,179,186,.48)'; ctx.lineWidth = 3; ctx.setLineDash([8, 10]); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = getComputedStyle(document.documentElement).dataset.theme === 'dark' ? '#e3e8ec' : '#27313a'; ctx.textAlign = 'center'; ctx.font = '800 24px "Plus Jakarta Sans", sans-serif'; ctx.fillText('Katılımcılar bekleniyor', 0, 5);
      ctx.restore(); return;
    }
    const arc = Math.PI * 2 / participants.length;
    const dark = document.documentElement.dataset.theme === 'dark';
    for (let i = 0; i < participants.length; i++) {
      const start = rotation - Math.PI / 2 + i * arc, end = start + arc;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, r, start, end); ctx.closePath();
      const base = palette[i % palette.length];
      ctx.fillStyle = base; ctx.fill();
      ctx.strokeStyle = dark ? 'rgba(18,24,29,.7)' : 'rgba(255,255,255,.88)'; ctx.lineWidth = participants.length > 120 ? .5 : 2; ctx.stroke();
      // Each entry is drawn on its slice. Large lists are still unrestricted; labels scale down as needed.
      const middle = start + arc / 2;
      const textRadius = participants.length < 22 ? r * .62 : participants.length < 70 ? r * .7 : r * .76;
      ctx.save(); ctx.rotate(middle); ctx.translate(textRadius, 0);
      if (Math.cos(middle) < 0) ctx.rotate(Math.PI);
      const font = Math.max(5.5, Math.min(14, 250 / Math.max(1, participants.length)));
      ctx.font = `800 ${font}px "Plus Jakarta Sans", sans-serif`;
      ctx.fillStyle = '#10191e'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const maxText = Math.max(9, r * arc * (participants.length < 50 ? .82 : .9));
      let label = participants[i].name;
      if (label.length > 46) label = label.slice(0, 43) + '…';
      ctx.fillText(label, 0, 0, maxText);
      ctx.restore();
    }
    // Outer ring, center hub is positioned in HTML so it remains crisp on all DPRs.
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.strokeStyle = '#e7c16b'; ctx.lineWidth = 8; ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, r + 2, 0, Math.PI * 2); ctx.strokeStyle = dark ? 'rgba(255,255,255,.2)' : 'rgba(30,50,55,.13)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.restore();
  }
  function setSpinNote(message, type = '') {
    const el = $('gwSpinNote'); if (!el) return;
    el.textContent = message; el.className = `gw-spin-note${type ? ` ${type}` : ''}`;
  }
  function countdown(target) {
    const diff = Math.max(0, Math.floor((target - Date.now()) / 1000));
    $('gwDays').textContent = String(Math.floor(diff / 86400)).padStart(2, '0');
    $('gwHours').textContent = String(Math.floor((diff % 86400) / 3600)).padStart(2, '0');
    $('gwMinutes').textContent = String(Math.floor((diff % 3600) / 60)).padStart(2, '0');
    $('gwSeconds').textContent = String(diff % 60).padStart(2, '0');
  }
  function setBadge(label, phase = '') {
    const el = $('gwPhaseBadge'); el.textContent = label; el.className = `gw-phase${phase ? ` is-${phase}` : ''}`;
  }
  function participantList(draw) {
    const host = $('gwParticipantList');
    const people = Core.cleanParticipants(draw).filter(p => p.name.toLocaleLowerCase('tr-TR').includes(state.search.toLocaleLowerCase('tr-TR')));
    if (!people.length) { host.innerHTML = `<p class="gw-muted">${state.search ? 'Aramayla eşleşen katılımcı bulunamadı.' : 'Bu çekilişte katılımcı bulunmuyor.'}</p>`; return; }
    host.innerHTML = people.map(p => `<div class="gw-person-chip" title="${esc(p.name)}"><span class="gw-person-num">${Core.cleanParticipants(draw).findIndex(x => x.id === p.id) + 1}</span><span class="gw-person-name">${esc(p.name)}</span></div>`).join('');
  }
  function setDrawFacts(draw) {
    $('gwDrawTitle').textContent = draw.title || 'Günlüğüm Çekilişi';
    $('gwDrawDescription').textContent = draw.description || 'Çarkta yer alan katılımcılar, belirlenen saatte rastgele seçilecek.';
    const n = Core.cleanParticipants(draw).length;
    $('gwWheelPeople').textContent = `${n} katılımcı`;
    $('gwWheelWinners').textContent = `${draw.winnerCount} kazanan`;
    $('gwParticipantCount').textContent = n.toLocaleString('tr-TR');
    $('gwWinnerCount').textContent = Number(draw.winnerCount).toLocaleString('tr-TR');
    $('gwDuration').textContent = fmtDuration(draw.spinDurationSeconds);
    $('gwParticipantPill').textContent = n.toLocaleString('tr-TR');
    $('gwScheduleLine').textContent = `Başlangıç: ${fmtDate(draw.scheduledAt)}`;
    participantList(draw);
  }
  function winnerMarkup(draw, winners, beaconRound, saved = false) {
    const entries = winners.map((p, i) => `<div class="gw-winner-item"><span class="gw-winner-cup">${i === 0 ? '🏆' : '🎁'}</span><strong>${esc(p.name)}</strong></div>`).join('');
    const link = Core.relayUrl(beaconRound);
    return `<div class="gw-result-kicker">${saved ? 'ÇEKİLİŞ TAMAMLANDI' : 'KAZANANLAR BELİRLENDİ'}</div><h3>${esc(draw.title || 'Günlüğüm Çekilişi')} · ${winners.length} kazanan</h3><div class="gw-winner-list">${entries}</div><div class="gw-proof"><span>drand rastgelelik turu · #${beaconRound}</span><a href="${link}" target="_blank" rel="noopener noreferrer">Kaynak turunu görüntüle ↗</a></div>`;
  }
  function showWinners(draw, winners, beacon, saved = false) {
    const host = $('gwWinnerResult'); const wasHidden = host.hidden; host.hidden = false; host.innerHTML = winnerMarkup(draw, winners, beacon.round, saved);
    setBadge('Tamamlandı', 'done');
    $('gwCountdownLabel').textContent = 'ÇEKİLİŞ SONUÇLANDI';
    countdown(Date.now());
    setSpinNote(saved ? 'Kazananlar arşive kaydedildi. Bu çekiliş artık değiştirilemez.' : 'Kazananlar, çekiliş süresinden sonra yayımlanan drand turuna göre belirlendi.', '');
    if (wasHidden) host.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' });
  }
  function showError(draw, error) {
    setBadge('Doğrulama bekleniyor', 'error');
    setSpinNote(error?.message || 'Rastgelelik kaynağına şu anda erişilemiyor. Otomatik olarak yeniden denenecek.', 'is-error');
    $('gwCountdownLabel').textContent = 'SONUÇ DOĞRULAMASI';
  }
  async function savedResult(draw) {
    if (!Array.isArray(draw.winners) || !draw.winners.length || !draw.beaconRound || !draw.beaconRandomness || !draw.beaconSignature) return null;
    if (!(await Core.verifyCommitment(draw))) throw new Error('Katılımcı listesi taahhüdü uyuşmuyor. Kayıt güvenlik için gösterilmiyor.');
    const beacon = { round: Number(draw.beaconRound), randomness: draw.beaconRandomness, signature: draw.beaconSignature };
    const expected = await Core.winnersFor(draw, beacon);
    const stored = draw.winners.map(p => ({ id: String(p.id || ''), name: String(p.name || '') }));
    if (JSON.stringify(expected.map(p => `${p.id}|${p.name}`)) !== JSON.stringify(stored.map(p => `${p.id}|${p.name}`))) throw new Error('Kayıtlı kazanan listesi doğrulanamadı.');
    return { winners: expected, beacon };
  }
  function animateToParticipant(draw, winner, durationMs = 1600) {
    const people = Core.cleanParticipants(draw);
    const idx = people.findIndex(p => p.id === winner.id);
    if (idx < 0 || !people.length) return Promise.resolve();
    cancelAnimationFrame(state.raf); cancelAnimationFrame(state.waitRaf);
    const arc = Math.PI * 2 / people.length;
    const current = state.rotation;
    const base = ((-(idx + .5) * arc) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
    const target = base + Math.ceil((current + Math.PI * 10 - base) / (Math.PI * 2)) * Math.PI * 2;
    const start = performance.now(), total = Math.max(500, durationMs);
    return new Promise(resolve => {
      const frame = now => {
        const t = Math.min(1, (now - start) / total); const ease = 1 - Math.pow(1 - t, 4);
        state.rotation = current + (target - current) * ease; drawWheel(draw.participants, state.rotation);
        if (t < 1) state.raf = requestAnimationFrame(frame); else { state.rotation = target; drawWheel(draw.participants, state.rotation); resolve(); }
      };
      state.raf = requestAnimationFrame(frame);
    });
  }
  function startWaitRotation(draw) {
    cancelAnimationFrame(state.waitRaf);
    const frame = () => { state.rotation += .006; drawWheel(draw.participants, state.rotation); state.waitRaf = requestAnimationFrame(frame); };
    state.waitRaf = requestAnimationFrame(frame);
  }
  async function resolveLiveDraw(draw, animate = true) {
    if (state.resolving.has(draw.id) || state.resolved.has(draw.id)) return;
    state.resolving.add(draw.id);
    const deadline = Core.deadlineMs(draw);
    try {
      if (animate) startWaitRotation(draw);
      setSpinNote('Zaman kilidi tamamlandı. İki ayrı drand uç noktasından aynı rastgelelik verisinin gelmesi bekleniyor…', 'is-live');
      setBadge('Sonuç doğrulanıyor', 'spinning');
      $('gwCountdownLabel').textContent = 'SONUÇ DOĞRULAMASI';
      let beacon, winners;
      while (!beacon) {
        try {
          const round = Core.beaconRound(draw);
          beacon = await Core.fetchBeacon(round);
          winners = await Core.winnersFor(draw, beacon);
        } catch (error) {
          if (/taahhüdü|imzası doğrulanamadı|turu bu çekilişin/i.test(error.message || '')) { cancelAnimationFrame(state.waitRaf); state.failed.add(draw.id); showError(draw, error); return; }
          if (Date.now() < deadline + 120000) {
            showError(draw, error);
            await new Promise(resolve => setTimeout(resolve, 4500));
          } else {
            showError(draw, error); await new Promise(resolve => setTimeout(resolve, 12000));
          }
        }
      }
      cancelAnimationFrame(state.waitRaf);
      if (animate) await animateToParticipant(draw, winners[0], Date.now() < deadline ? Math.min(2600, deadline - Date.now() + 1000) : 1800);
      state.resolved.set(draw.id, { winners, beacon });
      showWinners(draw, winners, beacon, false);
      renderHistory();
    } catch (error) { showError(draw, error); }
    finally { state.resolving.delete(draw.id); }
  }
  function startSpin(draw) {
    if (state.spinning.has(draw.id) || state.resolved.has(draw.id)) return;
    state.spinning.add(draw.id); liveLoopDrawId = draw.id;
    const start = Date.parse(draw.scheduledAt), deadline = Core.deadlineMs(draw), originalRotation = state.rotation;
    setBadge('Çark dönüyor', 'spinning'); $('gwCountdownLabel').textContent = 'ÇEKİLİŞ DEVAM EDİYOR';
    setSpinNote('Çekiliş zamanı geldi. Çark dönüyor; kazananlar süre tamamlandıktan sonra belirlenir.', 'is-live');
    const frame = now => {
      const currentTime = Date.now();
      const elapsed = Math.max(0, currentTime - start), duration = Math.max(1, deadline - start);
      const p = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      state.rotation = originalRotation + Math.PI * 2 * (6 * eased);
      drawWheel(draw.participants, state.rotation);
      if (currentTime < deadline) {
        countdown(deadline); // kalan süreyi çark sonuna göre göster
        state.raf = requestAnimationFrame(frame);
      } else {
        state.spinning.delete(draw.id);
        resolveLiveDraw(draw, true);
      }
    };
    state.raf = requestAnimationFrame(frame);
  }
  function refreshPhase(draw) {
    const now = Date.now(), phase = Core.effectivePhase(draw, now), start = Date.parse(draw.scheduledAt), end = Core.deadlineMs(draw);
    if (phase === 'scheduled') {
      setBadge('Planlandı', 'scheduled'); $('gwCountdownLabel').textContent = 'ÇEKİLİŞE KALAN SÜRE'; countdown(start);
      setSpinNote('Çark, belirlenen başlangıç saatinde otomatik olarak dönmeye başlayacak.');
    } else if (phase === 'spinning') {
      countdown(end); if (!state.spinning.has(draw.id) && !state.resolved.has(draw.id)) startSpin(draw);
    } else if (phase === 'awaiting-result') {
      countdown(now); $('gwCountdownLabel').textContent = 'SONUÇ DOĞRULAMASI';
      if (!state.resolved.has(draw.id) && !state.resolving.has(draw.id) && !state.failed.has(draw.id)) resolveLiveDraw(draw, true);
    } else if (phase === 'finalized') {
      countdown(now);
      if (state.resolved.has(draw.id)) showWinners(draw, state.resolved.get(draw.id).winners, state.resolved.get(draw.id).beacon, true);
      else if (!draw.__savedChecking) {
        draw.__savedChecking = true;
        savedResult(draw).then(result => {
          if (!result) { draw.__savedChecking = true; if (!state.resolved.has(draw.id)) showError(draw, new Error('Kayıtlı sonuç verisi eksik. Yönetim panelinden çekilişi kontrol et.')); return; }
          state.resolved.set(draw.id, result); showWinners(draw, result.winners, result.beacon, true); renderHistory();
        }).catch(error => { draw.__savedChecking = true; showError(draw, error); });
      }
    }
  }
  function renderHistory() {
    const now = Date.now();
    const history = state.draws.filter(d => {
      const phase = Core.effectivePhase(d, now);
      return phase === 'finalized' || phase === 'cancelled' || phase === 'awaiting-result' || state.resolved.has(d.id);
    }).sort((a, b) => Date.parse(b.scheduledAt) - Date.parse(a.scheduledAt));
    $('gwHistoryCount').textContent = history.length.toLocaleString('tr-TR');
    $('gwHistorySection').hidden = history.length === 0;
    $('gwHistory').innerHTML = history.map(draw => {
      const phase = Core.effectivePhase(draw, now), result = state.resolved.get(draw.id);
      const cancelled = phase === 'cancelled';
      const savedWinners = Array.isArray(draw.winners) ? draw.winners : [];
      const winners = result?.winners || savedWinners;
      const round = result?.beacon?.round || draw.beaconRound;
      const status = cancelled ? 'İptal edildi' : phase === 'finalized' ? 'Arşivlendi' : winners.length ? 'Sonuçlandı' : 'Sonuç bekliyor';
      const names = winners.length ? winners.map((p, i) => `<span class="gw-history-winner">${i === 0 ? '🏆 ' : '🎁 '}${esc(p.name)}</span>`).join('') : `<span class="gw-muted">${cancelled ? 'Bu çekiliş iptal edildi.' : 'Rastgelelik verisi doğrulanınca kazananlar burada görünecek.'}</span>`;
      const meta = `${Core.cleanParticipants(draw).length} katılımcı · ${Number(draw.winnerCount) || 0} kazanan · ${fmtDuration(draw.spinDurationSeconds)}`;
      return `<article class="gw-history-card"><div class="gw-history-top"><div><h3>${esc(draw.title || 'Günlüğüm Çekilişi')}</h3><div class="gw-history-date">${fmtDateShort(draw.scheduledAt)}</div></div><span class="gw-history-state">${status}</span></div><div class="gw-history-winners">${names}</div><div class="gw-history-meta"><span>${esc(meta)}</span>${round ? `<span>Rastgelelik turu #${round}</span>` : ''}</div>${round && !cancelled ? `<a class="gw-history-proof" href="${Core.relayUrl(round)}" target="_blank" rel="noopener noreferrer">Sonucu doğrula ↗</a>` : ''}</article>`;
    }).join('');
  }
  function chooseFeatured() {
    const now = Date.now();
    const live = state.draws.filter(d => ['spinning', 'awaiting-result'].includes(Core.effectivePhase(d, now)) && !state.resolved.has(d.id)).sort((a,b)=>Date.parse(a.scheduledAt)-Date.parse(b.scheduledAt));
    if (live.length) return live[0];
    const upcoming = state.draws.filter(d => Core.effectivePhase(d, now) === 'scheduled').sort((a,b)=>Date.parse(a.scheduledAt)-Date.parse(b.scheduledAt));
    if (upcoming.length) return upcoming[0];
    const done = state.draws.filter(d => Core.effectivePhase(d, now) === 'finalized' || state.resolved.has(d.id)).sort((a,b)=>Date.parse(b.scheduledAt)-Date.parse(a.scheduledAt));
    return done[0] || null;
  }
  function renderFeatured(draw) {
    state.currentId = draw?.id || null;
    $('gwGlobalStatus').hidden = true;
    $('gwMain').hidden = !draw; $('gwEmpty').hidden = !!draw;
    if (!draw) { renderHistory(); return; }
    state.rotation = 0; cancelAnimationFrame(state.raf); cancelAnimationFrame(state.waitRaf);
    $('gwWinnerResult').hidden = true; $('gwWinnerResult').innerHTML = '';
    setDrawFacts(draw); drawWheel(draw.participants, state.rotation);
    const phase = Core.effectivePhase(draw, Date.now());
    if (phase === 'finalized') refreshPhase(draw);
    else if (state.resolved.has(draw.id)) showWinners(draw, state.resolved.get(draw.id).winners, state.resolved.get(draw.id).beacon, false);
    else refreshPhase(draw);
    renderHistory();
  }
  async function init() {
    try {
      const url = new URL('../data/cekilis.json', location.href); url.searchParams.set('t', Date.now());
      const response = await fetch(url.href, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Çekiliş verisi yüklenemedi (HTTP ${response.status}).`);
      const data = await response.json();
      if (!data || !Array.isArray(data.draws)) throw new Error('Çekiliş dosyasının biçimi geçersiz.');
      state.draws = data.draws.filter(d => d && d.id && Array.isArray(d.participants) && d.scheduledAt && d.spinDurationSeconds);
      const selected = chooseFeatured();
      if (selected) renderFeatured(selected);
      else { $('gwGlobalStatus').hidden = true; $('gwMain').hidden = true; $('gwEmpty').hidden = false; renderHistory(); }
      setInterval(() => {
        const selectedNow = chooseFeatured();
        if (selectedNow && selectedNow.id !== state.currentId) renderFeatured(selectedNow);
        else if (selectedNow) refreshPhase(selectedNow);
        renderHistory();
      }, 1000);
    } catch (error) {
      $('gwGlobalStatus').textContent = error.message || 'Çekilişler yüklenemedi.';
      $('gwGlobalStatus').classList.add('is-error'); $('gwMain').hidden = true; $('gwEmpty').hidden = true;
    }
  }
  $('gwParticipantSearch').addEventListener('input', event => { state.search = event.target.value || ''; const draw = currentDraw(); if (draw) participantList(draw); });
  document.getElementById('themeBtn')?.addEventListener('click', () => setTimeout(() => { const draw = currentDraw(); if (draw) drawWheel(draw.participants, state.rotation); }, 0));
  if ('ResizeObserver' in window) new ResizeObserver(() => canvasSize()).observe(document.querySelector('.gw-wheel-stage'));
  else window.addEventListener('resize', canvasSize);
  canvasSize();
  init();
})();
