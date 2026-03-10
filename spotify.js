/* ═══════════════════════════════════════════════
   NOVASPHERE – spotify.js
   Spotify Web API Integration + Vinyl Player
═══════════════════════════════════════════════ */

let spToken      = null;
let spClientId   = null;
let spQueue      = [];
let spQueueIdx   = 0;
let spPlayer     = null;       // Spotify SDK Player instance
let spDeviceId   = null;
let spIsPlaying  = false;
let spProgress   = 0;
let spDuration   = 1;
let spInterval   = null;
let sdkReady     = false;

// ── CONNECT SPOTIFY ────────────────────────────
function connectSpotify() {
  const cid = document.getElementById('sp-client-id').value.trim();
  if (!cid) { alert('Please enter your Spotify Client ID'); return; }
  spClientId = cid;
  localStorage.setItem('sp_client_id', cid);

  // PKCE auth flow
  const redirectUri = window.location.origin + window.location.pathname;
  const scope = [
    'streaming','user-read-email','user-read-private',
    'user-modify-playback-state','user-read-playback-state'
  ].join('%20');

  const state = generateState();
  sessionStorage.setItem('sp_state', state);
  sessionStorage.setItem('sp_client_id', cid);

  window.location.href =
    `https://accounts.spotify.com/authorize?client_id=${cid}` +
    `&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${scope}&state=${state}&show_dialog=true`;
}

function generateState() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ── HANDLE AUTH CALLBACK ───────────────────────
(function handleCallback() {
  const hash = window.location.hash.substring(1);
  if (!hash.includes('access_token')) return;

  const params = Object.fromEntries(hash.split('&').map(p => p.split('=')));
  const token  = params['access_token'];
  const state  = params['state'];

  if (!token) return;
  spToken = token;
  sessionStorage.setItem('sp_token', token);
  window.location.hash = '';

  // Show player UI
  document.getElementById('spotify-setup').style.display    = 'none';
  document.getElementById('spotify-player-ui').style.display = 'block';
  document.getElementById('spotify-modal').style.display     = 'flex';

  initSpotifySDK();
})();

// ── RESTORE TOKEN ──────────────────────────────
(function restoreToken() {
  const tok = sessionStorage.getItem('sp_token');
  if (tok) {
    spToken = tok;
    spClientId = sessionStorage.getItem('sp_client_id') || localStorage.getItem('sp_client_id');
    document.getElementById('spotify-setup').style.display    = 'none';
    document.getElementById('spotify-player-ui').style.display = 'block';
    initSpotifySDK();
  }
})();

// ── SPOTIFY WEB PLAYBACK SDK ───────────────────
function initSpotifySDK() {
  if (document.getElementById('sp-sdk')) return; // already loaded
  const script = document.createElement('script');
  script.id  = 'sp-sdk';
  script.src = 'https://sdk.scdn.co/spotify-player.js';
  document.head.appendChild(script);
}

window.onSpotifyWebPlaybackSDKReady = () => {
  if (!spToken) return;
  sdkReady = true;
  spPlayer = new Spotify.Player({
    name: 'NovaSphere Player',
    getOAuthToken: cb => cb(spToken),
    volume: 0.7,
  });

  spPlayer.addListener('ready', ({ device_id }) => {
    spDeviceId = device_id;
    console.log('[Spotify] Ready, device:', device_id);
  });

  spPlayer.addListener('player_state_changed', state => {
    if (!state) return;
    spIsPlaying = !state.paused;
    spProgress  = state.position;
    spDuration  = state.duration;

    const track = state.track_window.current_track;
    if (track) updateVinyl(track);

    // Update play button
    updatePlayBtn();
    // Vinyl spin
    const disc = document.getElementById('vinyl-disc');
    const arm  = document.getElementById('vinyl-arm');
    disc && disc.classList.toggle('spinning', spIsPlaying);
    arm  && arm.classList.toggle('playing',   spIsPlaying);
  });

  spPlayer.connect();
  startProgressTimer();
};

// ── SEARCH SPOTIFY ─────────────────────────────
async function searchSpotify() {
  if (!spToken) return;
  const q = document.getElementById('sp-search-input').value.trim();
  if (!q) return;

  try {
    const res  = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=track,artist,album&limit=12`,
      { headers: { Authorization: `Bearer ${spToken}` } }
    );
    if (res.status === 401) { spToken = null; alert('Spotify token hết hạn. Vui lòng kết nối lại.'); return; }
    const data = await res.json();
    renderSpotifyResults(data.tracks?.items || []);
  } catch (err) {
    console.error('[Spotify search]', err);
    document.getElementById('sp-results').innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:16px">Lỗi tìm kiếm. Vui lòng thử lại.</p>';
  }
}

function renderSpotifyResults(tracks) {
  const el = document.getElementById('sp-results');
  if (!tracks.length) {
    el.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:16px">Không tìm thấy kết quả.</p>';
    return;
  }
  spQueue = tracks;
  el.innerHTML = tracks.map((t,i) => `
    <div class="sp-track" onclick="playSpotifyTrack(${i})">
      <img src="${t.album?.images?.[0]?.url || ''}" alt="${escapeHTML(t.name)}" onerror="this.style.display='none'">
      <div class="sp-track-info">
        <div class="sp-track-name">${escapeHTML(t.name)}</div>
        <div class="sp-track-artist">${escapeHTML(t.artists?.map(a=>a.name).join(', ') || '')}</div>
      </div>
      <div class="sp-track-dur">${msToTime(t.duration_ms)}</div>
      <div class="sp-play-icon">
        <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
      </div>
    </div>`).join('');
}

// ── PLAY TRACK ─────────────────────────────────
async function playSpotifyTrack(idx) {
  if (!spToken) return;
  spQueueIdx = idx;
  const track = spQueue[idx];
  if (!track) return;

  // Close modal & show vinyl
  closeModal('spotify-modal');
  showVinyl(track);

  if (spDeviceId && sdkReady) {
    // Play via SDK
    await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${spDeviceId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${spToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ uris: [track.uri] }),
    });
  } else {
    // Fallback: just show the UI with static art (no SDK)
    spIsPlaying = true;
    updatePlayBtn();
    fakeProgress(track.duration_ms);
  }
}

// Fake progress for non-SDK mode
function fakeProgress(duration) {
  spProgress = 0; spDuration = duration || 200000;
  clearInterval(spInterval);
  spInterval = setInterval(() => {
    if (!spIsPlaying) return;
    spProgress += 1000;
    if (spProgress >= spDuration) { spProgress = 0; nextTrack(); }
    renderProgress();
  }, 1000);
}

// ── VINYL UI ───────────────────────────────────
function showVinyl(track) {
  const vp = document.getElementById('vinyl-player');
  vp.style.display = 'block';

  const art    = track.album?.images?.[0]?.url || '';
  const title  = track.name || '–';
  const artist = track.artists?.map(a=>a.name).join(', ') || '–';

  document.getElementById('vinyl-art').src        = art;
  document.getElementById('vinyl-title').textContent  = title;
  document.getElementById('vinyl-artist').textContent = artist;

  spDuration = track.duration_ms || 200000;
  document.getElementById('v-dur').textContent = msToTime(spDuration);
  renderProgress();

  const disc = document.getElementById('vinyl-disc');
  disc.classList.toggle('spinning', spIsPlaying);
}

function updateVinyl(track) {
  const art    = track.album?.images?.[0]?.url || '';
  const title  = track.name || '–';
  const artist = track.artists?.map(a=>a.name).join(', ') || '–';

  const artEl = document.getElementById('vinyl-art');
  if (artEl && artEl.src !== art) artEl.src = art;
  const titleEl = document.getElementById('vinyl-title');
  if (titleEl) titleEl.textContent = title;
  const artistEl = document.getElementById('vinyl-artist');
  if (artistEl) artistEl.textContent = artist;

  const vp = document.getElementById('vinyl-player');
  if (vp.style.display === 'none') vp.style.display = 'block';
}

function updatePlayBtn() {
  const btn = document.getElementById('vinyl-play-btn');
  if (!btn) return;
  btn.querySelector('#play-ico').innerHTML = spIsPlaying
    ? '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>'
    : '<path d="M8 5v14l11-7z"/>';
}

// ── CONTROLS ───────────────────────────────────
async function togglePlay() {
  if (!spToken) return;
  if (sdkReady && spPlayer) {
    await spPlayer.togglePlay();
  } else {
    spIsPlaying = !spIsPlaying;
    updatePlayBtn();
    const disc = document.getElementById('vinyl-disc');
    disc && disc.classList.toggle('spinning', spIsPlaying);
  }
}

async function nextTrack() {
  if (spQueue.length === 0) return;
  spQueueIdx = (spQueueIdx + 1) % spQueue.length;
  await playSpotifyTrack(spQueueIdx);
}

async function prevTrack() {
  if (spQueue.length === 0) return;
  spQueueIdx = (spQueueIdx - 1 + spQueue.length) % spQueue.length;
  await playSpotifyTrack(spQueueIdx);
}

async function seekTrack(val) {
  const pos = Math.floor((val / 100) * spDuration);
  if (sdkReady && spPlayer) {
    await spPlayer.seek(pos);
  } else {
    spProgress = pos;
  }
}

// ── PROGRESS TIMER ─────────────────────────────
function startProgressTimer() {
  clearInterval(spInterval);
  spInterval = setInterval(async () => {
    if (!spIsPlaying || !sdkReady) return;
    spProgress += 1000;
    if (spProgress >= spDuration) spProgress = spDuration;
    renderProgress();
  }, 1000);
}

function renderProgress() {
  const slider = document.getElementById('vinyl-progress');
  const curr   = document.getElementById('v-curr');
  const dur    = document.getElementById('v-dur');
  if (!slider) return;
  const pct = spDuration ? (spProgress / spDuration) * 100 : 0;
  slider.value = pct;
  slider.style.setProperty('--pct', pct + '%');
  curr.textContent = msToTime(spProgress);
  dur.textContent  = msToTime(spDuration);
}

// ── HELPERS ────────────────────────────────────
function msToTime(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2,'0')}`;
}

function escapeHTML(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
