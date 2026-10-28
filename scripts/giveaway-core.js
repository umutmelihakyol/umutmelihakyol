/* Günlüğüm Çekiliş çekirdeği — zaman kilidi, taahhüt doğrulama ve herkeste aynı sonuç. */
(function (root) {
  'use strict';
  const CHAIN_HASH = '52db9ba70e0cc0f6eaf7803dd07447a1f5477735fd3f661792ba94600c84e971';
  const GENESIS_TIME = 1692803367;
  const ROUND_PERIOD = 3;
  const RELAYS = [
    round => `https://api.drand.sh/${CHAIN_HASH}/public/${round}`,
    round => `https://api2.drand.sh/${CHAIN_HASH}/public/${round}`,
    round => `https://drand.cloudflare.com/${CHAIN_HASH}/public/${round}`
  ];
  const enc = new TextEncoder();
  const bytesToHex = bytes => Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  const hexToBytes = hex => {
    const clean = String(hex || '').replace(/[^\da-f]/gi, '');
    if (!clean || clean.length % 2) throw new Error('Rastgelelik verisinin biçimi geçersiz.');
    return Uint8Array.from(clean.match(/.{2}/g), part => parseInt(part, 16));
  };
  async function digestHex(data) {
    if (!root.crypto?.subtle) throw new Error('Güvenli kriptografi için HTTPS bağlantısı gerekli.');
    const input = typeof data === 'string' ? enc.encode(data) : data;
    return bytesToHex(new Uint8Array(await root.crypto.subtle.digest('SHA-256', input)));
  }
  function cleanParticipants(draw) {
    return (Array.isArray(draw?.participants) ? draw.participants : [])
      .map((p, i) => ({ id: String(p?.id || `p-${i + 1}`), name: String(typeof p === 'string' ? p : p?.name || '').trim() }))
      .filter(p => p.name);
  }
  function commitmentPayload(draw) {
    return JSON.stringify({
      id: String(draw?.id || ''),
      scheduledAt: String(draw?.scheduledAt || ''),
      spinDurationSeconds: Math.max(1, Number(draw?.spinDurationSeconds) || 1),
      winnerCount: Math.max(1, Number(draw?.winnerCount) || 1),
      participants: cleanParticipants(draw).map(p => p.name)
    });
  }
  async function makeCommitment(draw) { return digestHex(commitmentPayload(draw)); }
  async function verifyCommitment(draw) {
    if (!draw?.commitment) return false;
    return (await makeCommitment(draw)) === String(draw.commitment).toLowerCase();
  }
  function deadlineMs(draw) {
    const scheduled = Date.parse(draw?.scheduledAt || '');
    if (!Number.isFinite(scheduled)) return NaN;
    return scheduled + Math.max(1, Number(draw?.spinDurationSeconds) || 1) * 1000;
  }
  function beaconRound(draw) {
    const deadlineSeconds = Math.floor(deadlineMs(draw) / 1000);
    if (!Number.isFinite(deadlineSeconds) || deadlineSeconds < GENESIS_TIME) throw new Error('Çekiliş tarihi geçersiz.');
    // Her zaman çekiliş süresinin SONRASINDA yayımlanacak ilk tura geçilir.
    return Math.floor((deadlineSeconds - GENESIS_TIME) / ROUND_PERIOD) + 2;
  }
  async function fetchBeacon(round) {
    const results = await Promise.allSettled(RELAYS.map(async makeUrl => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 9000);
      try {
        const response = await fetch(makeUrl(round), { cache: 'no-store', signal: controller.signal, headers: { Accept: 'application/json' } });
        if (!response.ok) throw new Error(`Rastgelelik kaynağı HTTP ${response.status}`);
        const data = await response.json();
        if (Number(data.round) !== Number(round) || !/^[\da-f]{64,}$/i.test(String(data.randomness || '')) || !/^[\da-f]{64,}$/i.test(String(data.signature || ''))) {
          throw new Error('Rastgelelik kaynağından geçersiz tur verisi geldi.');
        }
        return { round: Number(data.round), randomness: String(data.randomness).toLowerCase(), signature: String(data.signature).toLowerCase(), source: makeUrl(round) };
      } finally { clearTimeout(timeout); }
    }));
    const counts = new Map();
    for (const result of results) {
      if (result.status !== 'fulfilled') continue;
      const beacon = result.value;
      const key = `${beacon.randomness}|${beacon.signature}`;
      const entry = counts.get(key) || { beacon, count: 0 };
      entry.count += 1; counts.set(key, entry);
    }
    const agreed = [...counts.values()].sort((a, b) => b.count - a.count)[0];
    if (!agreed || agreed.count < 2) throw new Error('Rastgelelik kaynağından iki bağımsız doğrulama alınamadı. Sonuç için otomatik yeniden denenecek.');
    // drand spesifikasyonu: randomness, signature değerinin SHA-256 özetidir.
    const calculated = await digestHex(hexToBytes(agreed.beacon.signature));
    if (calculated !== agreed.beacon.randomness) throw new Error('Rastgelelik imzası doğrulanamadı.');
    return agreed.beacon;
  }
  async function winnersFor(draw, beacon) {
    if (Number(beacon.round) !== beaconRound(draw)) throw new Error('Rastgelelik turu bu çekilişin bitiş zamanı ile eşleşmiyor.');
    if (!beacon.signature || !beacon.randomness || (await digestHex(hexToBytes(beacon.signature))) !== String(beacon.randomness).toLowerCase()) throw new Error('Rastgelelik imzası doğrulanamadı.');
    if (!(await verifyCommitment(draw))) throw new Error('Katılımcı listesi taahhüdü uyuşmuyor. Güvenlik için kazananlar gösterilmedi.');
    const participants = cleanParticipants(draw);
    const count = Math.max(1, Math.min(participants.length, Math.floor(Number(draw.winnerCount) || 1)));
    if (!participants.length) throw new Error('Çekilişte katılımcı bulunmuyor.');
    const seedHex = await digestHex(`${beacon.randomness}|${draw.commitment}|${draw.id}`);
    let seed = parseInt(seedHex.slice(0, 8), 16) >>> 0;
    const random = () => {
      seed = (seed + 0x6D2B79F5) | 0;
      let t = seed;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const pool = participants.slice();
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, count);
  }
  function effectivePhase(draw, now = Date.now()) {
    if (draw?.status === 'cancelled') return 'cancelled';
    if (draw?.status === 'finalized') return 'finalized';
    const start = Date.parse(draw?.scheduledAt || '');
    if (!Number.isFinite(start)) return 'invalid';
    if (now < start) return 'scheduled';
    if (now < deadlineMs(draw)) return 'spinning';
    return 'awaiting-result';
  }
  function relayUrl(round) { return `https://api.drand.sh/${CHAIN_HASH}/public/${round}`; }
  root.GiveawayCore = { CHAIN_HASH, GENESIS_TIME, ROUND_PERIOD, cleanParticipants, makeCommitment, verifyCommitment, deadlineMs, beaconRound, fetchBeacon, winnersFor, effectivePhase, relayUrl };
})(window);
