(function () {
  'use strict';
  const Core = window.GiveawayCore;
  const root = document.getElementById('tab-giveaways');
  if (!root || !Core) return;
  const $ = selector => document.querySelector(selector);
  const PATH = 'data/cekilis.json';
  let data = { schemaVersion: 1, draws: [] }, baseline = [], fileSha = null, loaded = false, editingId = null, busy = false;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const clone = value => JSON.parse(JSON.stringify(value));
  const statusEl = $('#gwaStatus');
  const say = (message, state = 'info') => { if (statusEl) { statusEl.textContent = message; statusEl.dataset.state = state; } };
  const fmtDate = value => { const d = new Date(value); return Number.isNaN(d.getTime()) ? '—' : new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium', timeStyle: 'short' }).format(d); };
  const fmtDuration = seconds => Number(seconds) < 60 ? `${Number(seconds)} saniye` : `${Math.floor(Number(seconds) / 60)} dk ${Number(seconds) % 60 ? `${Number(seconds) % 60} sn` : ''}`.trim();
  const isLocked = draw => draw.status === 'finalized' || draw.status === 'cancelled' || Date.now() >= Date.parse(draw.scheduledAt);
  const phaseName = draw => {
    const phase = Core.effectivePhase(draw, Date.now());
    return ({ scheduled: 'Planlandı', spinning: 'Çark dönüyor', 'awaiting-result': 'Sonuç doğrulaması', finalized: 'Geçmiş çekiliş', cancelled: 'İptal edildi', invalid: 'Tarih hatalı' })[phase] || 'Hazırlanıyor';
  };
  function randomId(prefix = 'draw') {
    if (crypto.randomUUID) return `${prefix}-${crypto.randomUUID()}`;
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
  }
  function participantsFromText(value) {
    const lines = String(value || '').split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    const seen = new Set(), participants = [];
    for (const name of lines) {
      const key = name.toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ');
      if (seen.has(key)) continue;
      seen.add(key); participants.push({ id: randomId('person'), name: name.replace(/\s+/g, ' ') });
    }
    return participants;
  }
  function toLocalInput(iso) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
  }
  function fillDefaultTime() {
    const input = $('#gwaScheduledAt');
    if (!input.value) input.value = toLocalInput(new Date(Date.now() + 15 * 60000).toISOString());
  }
  function clearForm() {
    editingId = null;
    $('#gwaForm').reset();
    $('#gwaFormTitle').textContent = 'Yeni çekiliş oluştur';
    $('#gwaSaveBtn').textContent = 'Çekilişi oluştur ve kaydet';
    $('#gwaCancelEditBtn').hidden = true;
    $('#gwaId').value = '';
    $('#gwaDuration').value = '12';
    $('#gwaWinnerCountInput').value = '1';
    $('#gwaParticipants').value = '';
    fillDefaultTime(); updateParticipantCount();
  }
  function editDraw(id) {
    const draw = data.draws.find(item => item.id === id);
    if (!draw || isLocked(draw)) return say('Başlamış veya tamamlanmış çekiliş değiştirilemez.', 'error');
    editingId = id;
    $('#gwaId').value = id; $('#gwaTitle').value = draw.title || ''; $('#gwaDescription').value = draw.description || '';
    $('#gwaScheduledAt').value = toLocalInput(draw.scheduledAt); $('#gwaDuration').value = String(draw.spinDurationSeconds || 12);
    $('#gwaWinnerCountInput').value = String(draw.winnerCount || 1);
    $('#gwaParticipants').value = Core.cleanParticipants(draw).map(p => p.name).join('\n');
    $('#gwaFormTitle').textContent = 'Planlanmış çekilişi düzenle'; $('#gwaSaveBtn').textContent = 'Değişiklikleri kaydet'; $('#gwaCancelEditBtn').hidden = false;
    $('#gwaForm').scrollIntoView({ behavior: 'smooth', block: 'start' }); $('#gwaTitle').focus();
    updateParticipantCount(); say(`“${draw.title}” düzenleme formuna yüklendi. Başlangıç zamanından önce kaydedebilirsin.`, 'info');
  }
  function updateParticipantCount() {
    const people = participantsFromText($('#gwaParticipants')?.value || '');
    const count = $('#gwaParticipantCountInput'); if (count) count.textContent = `${people.length.toLocaleString('tr-TR')} benzersiz katılımcı`;
    const winners = $('#gwaWinnerCountInput'); if (winners && Number(winners.value) > people.length && people.length) winners.setCustomValidity('Kazanan sayısı katılımcı sayısından fazla olamaz.'); else if (winners) winners.setCustomValidity('');
  }
  function renderList() {
    const host = $('#gwaList');
    const counter = $('#gwaDrawCount'); if (counter) counter.textContent = data.draws.length.toLocaleString('tr-TR');
    if (!data.draws.length) { host.innerHTML = '<div class="gwa-empty-row"><b>Henüz çekiliş oluşturulmadı.</b><span>Soldaki formdan istediğin kadar katılımcıyla ilk çekilişini planlayabilirsin.</span></div>'; return; }
    const sorted = data.draws.slice().sort((a,b) => Date.parse(b.scheduledAt) - Date.parse(a.scheduledAt));
    host.innerHTML = sorted.map(draw => {
      const phase = Core.effectivePhase(draw, Date.now()), locked = isLocked(draw);
      const status = phaseName(draw), participants = Core.cleanParticipants(draw), winners = Array.isArray(draw.winners) ? draw.winners : [];
      return `<article class="gwa-draw-row"><div class="gwa-draw-main"><div class="gwa-draw-title"><h3>${esc(draw.title || 'Başlıksız çekiliş')}</h3><span class="gwa-status-pill" data-phase="${esc(phase)}">${esc(status)}</span></div><p>${esc(draw.description || 'Açıklama eklenmedi.')}</p><div class="gwa-draw-meta"><span>◷ ${esc(fmtDate(draw.scheduledAt))}</span><span>♙ ${participants.length.toLocaleString('tr-TR')} kişi</span><span>🏆 ${Number(draw.winnerCount) || 0} kazanan</span><span>⏱ ${esc(fmtDuration(draw.spinDurationSeconds))}</span></div>${winners.length ? `<div class="gwa-winners-preview">Kazananlar: ${winners.map(p => `<b>${esc(p.name)}</b>`).join(' · ')}</div>` : ''}${draw.beaconRound ? `<a class="gwa-proof-link" href="${Core.relayUrl(draw.beaconRound)}" target="_blank" rel="noopener noreferrer">Rastgelelik turu #${draw.beaconRound} ↗</a>` : ''}</div><div class="gwa-row-actions">${!locked ? `<button class="btn" type="button" data-gwa-edit="${esc(draw.id)}">Düzenle</button><button class="btn gwa-danger" type="button" data-gwa-cancel="${esc(draw.id)}">İptal et</button>` : `<span class="gwa-lock-note">${phase === 'cancelled' ? 'Kilitli kayıt' : phase === 'finalized' ? 'Sonuç kilitlendi' : 'Düzenleme kilitli'}</span>`}</div></article>`;
    }).join('');
  }
  function protectLocked(proposed) {
    const map = new Map((Array.isArray(proposed) ? proposed : []).map(draw => [draw.id, draw]));
    for (const original of baseline) {
      if (!isLocked(original)) continue;
      const candidate = map.get(original.id);
      // The only allowed post-deadline mutation is the generated finalization whose locked inputs and beacon round match.
      const validFinalize = original.status === 'scheduled' && Date.now() >= Core.deadlineMs(original) && candidate?.status === 'finalized' && candidate.commitment === original.commitment && Number(candidate.beaconRound) === Core.beaconRound(original) && Array.isArray(candidate.winners) && candidate.beaconRandomness && candidate.beaconSignature;
      map.set(original.id, validFinalize ? candidate : clone(original));
    }
    return [...map.values()];
  }
  async function saveData(message = 'Çekiliş kayıtları yönetim panelinden güncellendi') {
    if (busy) throw new Error('Başka bir kayıt işlemi devam ediyor.');
    if (!tok()) throw new Error('Oturum açık değil. Yönetim paneline tekrar giriş yap.');
    if (!loaded) throw new Error('Önce GitHub’dan çekilişleri yükle.');
    busy = true; $('#gwaSaveBtn').disabled = true; $('#gwaReloadBtn').disabled = true;
    try {
      data.draws = protectLocked(data.draws);
      const newSha = await putRepoFile(PATH, JSON.stringify(data, null, 2), message, fileSha);
      if (!newSha) throw new Error('GitHub dosya SHA değeri döndürmedi.');
      fileSha = newSha; baseline = clone(data.draws); renderList();
      return true;
    } finally { busy = false; $('#gwaSaveBtn').disabled = false; $('#gwaReloadBtn').disabled = false; }
  }
  async function finalizeExpiredDraws() {
    let changed = false, failures = [];
    for (const draw of data.draws) {
      if (draw.status !== 'scheduled' || Date.now() < Core.deadlineMs(draw)) continue;
      // Start time passed => edits are locked even if the beacon relay is temporarily unavailable.
      try {
        if (!(await Core.verifyCommitment(draw))) throw new Error('Katılımcı taahhüdü uyuşmuyor; otomatik sonuçlandırma durduruldu.');
        const round = Core.beaconRound(draw), beacon = await Core.fetchBeacon(round), winners = await Core.winnersFor(draw, beacon);
        draw.status = 'finalized'; draw.winners = winners.map(p => ({ id: p.id, name: p.name }));
        draw.beaconRound = beacon.round; draw.beaconRandomness = beacon.randomness; draw.beaconSignature = beacon.signature;
        draw.finalizedAt = new Date(Core.deadlineMs(draw)).toISOString(); draw.resultMethod = 'drand-quicknet';
        changed = true;
      } catch (error) { failures.push(`${draw.title || 'Çekiliş'}: ${error.message}`); }
    }
    if (changed) {
      try { await saveData('Çekiliş sonuçları otomatik olarak sabitlendi ve geçmişe taşındı'); }
      catch (error) { data.draws = baseline.map(item => clone(item)); failures.push(`Sonuçlar GitHub'a kaydedilemedi: ${error.message}`); }
    }
    return failures;
  }
  async function loadData(force = false) {
    if (busy) return;
    if (!tok()) { say('Çekilişleri yönetmek için önce yönetim paneline giriş yap.', 'error'); return; }
    if (loaded && !force) {
      const failures = await finalizeExpiredDraws(); renderList();
      if (failures.length) say(`Bazı sonuçlar doğrulanamadı ve kilitli kaldı. ${failures.slice(0,2).join(' ')}`, 'error');
      return;
    }
    $('#gwaReloadBtn').disabled = true; say('GitHub’dan çekiliş listesi yükleniyor…', 'info');
    try {
      const result = await getRepoFile(PATH);
      if (!result) { data = { schemaVersion: 1, draws: [] }; fileSha = null; }
      else { fileSha = result.sha; data = JSON.parse(b64ToStr(result.content)); }
      if (!data || !Array.isArray(data.draws)) throw new Error('data/cekilis.json biçimi hatalı.');
      data.schemaVersion = 1; loaded = true; baseline = clone(data.draws);
      const errors = await finalizeExpiredDraws();
      renderList();
      if (errors.length) say(`Çekilişler yüklendi; bazı sonuçlar doğrulanamadı ve kilitli kaldı. ${errors.slice(0,2).join(' ')}`, 'error');
      else say(`GitHub’dan ${data.draws.length} çekiliş yüklendi. Başlamış ve bitmiş çekilişler değiştirilemez.`, 'success');
    } catch (error) { say(`Çekilişler yüklenemedi: ${error.message}`, 'error'); }
    finally { $('#gwaReloadBtn').disabled = false; }
  }
  function drawOverlaps(candidate, exceptId) {
    const start = Date.parse(candidate.scheduledAt), end = Core.deadlineMs(candidate);
    return data.draws.find(old => old.id !== exceptId && old.status !== 'cancelled' && old.status !== 'finalized' && start < Core.deadlineMs(old) && end > Date.parse(old.scheduledAt));
  }
  async function saveForm(event) {
    event.preventDefault(); if (busy) return;
    if (!tok()) return say('Kaydetmek için yönetim paneline giriş yap.', 'error');
    const title = $('#gwaTitle').value.trim(), description = $('#gwaDescription').value.trim(), scheduledText = $('#gwaScheduledAt').value;
    const scheduledDate = new Date(scheduledText), duration = Math.floor(Number($('#gwaDuration').value)), winnerCount = Math.floor(Number($('#gwaWinnerCountInput').value));
    const participants = participantsFromText($('#gwaParticipants').value);
    if (title.length < 2) return say('Çekilişe en az 2 karakterli bir ad ver.', 'error');
    if (!scheduledText || Number.isNaN(scheduledDate.getTime())) return say('Geçerli bir çekiliş başlangıç tarihi seç.', 'error');
    if (scheduledDate.getTime() < Date.now() + 5 * 60 * 1000) return say('GitHub Pages yayını için çekilişi en az 5 dakika sonrasına planla.', 'error');
    if (!Number.isFinite(duration) || duration < 5 || duration > 3600) return say('Çark süresi 5–3600 saniye arasında olmalı.', 'error');
    if (!participants.length) return say('En az bir katılımcı ekle. Her ismi ayrı satıra yazabilirsin.', 'error');
    if (!Number.isFinite(winnerCount) || winnerCount < 1 || winnerCount > participants.length) return say('Kazanan sayısı 1 ile katılımcı sayısı arasında olmalı.', 'error');
    if (editingId) {
      const existing = data.draws.find(d => d.id === editingId);
      if (!existing || isLocked(existing)) { clearForm(); renderList(); return say('Bu çekilişin başlangıcı geldiği için artık düzenlenemez.', 'error'); }
    }
    const draw = {
      id: editingId || randomId(), title, description,
      scheduledAt: scheduledDate.toISOString(), spinDurationSeconds: duration, winnerCount,
      participants: participants.map((p, i) => ({ id: editingId ? (data.draws.find(d => d.id === editingId)?.participants?.[i]?.id || p.id) : p.id, name: p.name })),
      status: 'scheduled', createdAt: editingId ? (data.draws.find(d => d.id === editingId)?.createdAt || new Date().toISOString()) : new Date().toISOString()
    };
    const overlap = drawOverlaps(draw, editingId);
    if (overlap) return say(`Bu zaman aralığı “${overlap.title}” çekilişiyle çakışıyor. Başka bir başlangıç zamanı seç.`, 'error');
    const previousDraws = clone(data.draws);
    try {
      say('Katılımcı listesi taahhütleniyor ve çekiliş GitHub’a kaydediliyor…', 'info');
      draw.commitment = await Core.makeCommitment(draw);
      if (editingId) {
        const index = data.draws.findIndex(d => d.id === editingId); data.draws[index] = draw;
      } else data.draws.push(draw);
      await saveData(editingId ? 'Planlanmış çekiliş güncellendi' : 'Yeni çekiliş planlandı');
      clearForm(); say('Çekiliş kaydedildi. Katılımcı listesi ve ayarlar başlangıç zamanına kadar düzenlenebilir; başladıktan sonra kilitlenir.', 'success');
    } catch (error) { data.draws = previousDraws; say(`Çekiliş kaydedilemedi: ${error.message}`, 'error'); renderList(); }
  }
  async function cancelDraw(id) {
    const draw = data.draws.find(d => d.id === id);
    if (!draw || isLocked(draw)) return say('Başlamış veya bitmiş çekiliş iptal edilemez.', 'error');
    if (!confirm(`“${draw.title}” çekilişi iptal edilsin mi? Bu kayıt geçmişte iptal edilmiş olarak kalacak.`)) return;
    const previousDraws = clone(data.draws);
    draw.status = 'cancelled'; draw.cancelledAt = new Date().toISOString();
    try { await saveData('Planlanmış çekiliş iptal edildi'); say('Çekiliş iptal edildi ve kaydedildi.', 'success'); }
    catch (error) { data.draws = previousDraws; renderList(); say(`İptal kaydedilemedi: ${error.message}`, 'error'); }
  }
  $('#gwaForm').addEventListener('submit', saveForm);
  $('#gwaParticipants').addEventListener('input', updateParticipantCount);
  $('#gwaWinnerCountInput').addEventListener('input', updateParticipantCount);
  $('#gwaReloadBtn').addEventListener('click', () => { loaded = false; loadData(true); });
  $('#gwaCancelEditBtn').addEventListener('click', clearForm);
  $('#gwaList').addEventListener('click', event => {
    const edit = event.target.closest('[data-gwa-edit]'); if (edit) return editDraw(edit.dataset.gwaEdit);
    const cancel = event.target.closest('[data-gwa-cancel]'); if (cancel) return cancelDraw(cancel.dataset.gwaCancel);
  });
  document.querySelectorAll('.tab-btn').forEach(button => {
    if (button.dataset.tab === 'giveaways') button.addEventListener('click', () => loadData(false));
  });
  // If a scheduled draw ends while this admin tab remains open, lock its result and push it to history.
  setInterval(async () => {
    if (!loaded || !tok() || document.getElementById('tab-giveaways').hidden || busy) return;
    try {
      const failures = await finalizeExpiredDraws();
      renderList();
      if (failures.length) say(`Çekiliş süresi doldu ancak rastgelelik doğrulaması bekleniyor. ${failures[0]}`, 'error');
      else if (data.draws.some(d => d.status === 'finalized' && Date.now() - Date.parse(d.finalizedAt || d.scheduledAt) < 15000)) say('Çekiliş sonucu kilitlendi ve geçmiş çekilişlere taşındı.', 'success');
    } catch (_) {}
  }, 5000);
  clearForm();
})();
