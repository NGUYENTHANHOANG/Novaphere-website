/* ═══════════════════════════════════════════════
   NOVASPHERE – script.js
   Core: BG Canvas · Navigation · Search · Private · Voice · Dark Mode
═══════════════════════════════════════════════ */

// ── STATE ──────────────────────────────────────
let isPrivate   = false;
let isDark      = true;
let currentPage = 'home';
let searchOffset = 0;
let currentQuery = '';
let isLoadingMore= false;
let allResults   = [];

const SUGGESTIONS = [
  'How does quantum computing work?',
  'Best programming languages 2024',
  'Artificial intelligence news',
  'Space exploration latest',
  'Climate change solutions',
  'Machine learning tutorials',
  'Web development trends',
  'Cryptocurrency market',
];

// ── INIT ───────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initCanvas();
  restoreState();
  initInfiniteScroll();
});

// ── CANVAS BACKGROUND ──────────────────────────
function initCanvas() {
  const canvas = document.getElementById('bg-canvas');
  const ctx    = canvas.getContext('2d');
  let W, H, stars = [], orbs = [];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function initStars() {
    stars = [];
    for (let i = 0; i < 180; i++) {
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.2 + .2,
        a: Math.random(),
        da: (Math.random() - .5) * .004,
        speed: Math.random() * .15 + .05,
      });
    }
  }

  function initOrbs() {
    orbs = [
      { x: W*.15, y: H*.2, r:250, color:'rgba(124,58,237,', vx:.12, vy:.08 },
      { x: W*.85, y: H*.7, r:200, color:'rgba(6,182,212,',  vx:-.1, vy:.13 },
      { x: W*.5,  y: H*.9, r:180, color:'rgba(99,102,241,', vx:.09, vy:-.11 },
    ];
  }

  function drawOrb(o) {
    const g = ctx.createRadialGradient(o.x,o.y,0,o.x,o.y,o.r);
    g.addColorStop(0,   o.color+'0.12)');
    g.addColorStop(.6,  o.color+'0.06)');
    g.addColorStop(1,   o.color+'0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(o.x, o.y, o.r, 0, Math.PI*2);
    ctx.fill();
  }

  let frame = 0;
  function animate() {
    requestAnimationFrame(animate);
    ctx.clearRect(0,0,W,H);

    // orbs float
    orbs.forEach(o => {
      o.x += o.vx; o.y += o.vy;
      if (o.x < -o.r || o.x > W+o.r) o.vx *= -1;
      if (o.y < -o.r || o.y > H+o.r) o.vy *= -1;
      drawOrb(o);
    });

    // stars twinkle
    stars.forEach(s => {
      s.a += s.da;
      if (s.a <= 0 || s.a >= 1) s.da *= -1;
      s.y -= s.speed;
      if (s.y < -2) s.y = H + 2;
      ctx.globalAlpha = s.a * .7;
      ctx.fillStyle = '#a78bfa';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    frame++;
  }

  window.addEventListener('resize', () => { resize(); initStars(); initOrbs(); });
  resize(); initStars(); initOrbs(); animate();
}

// ── STATE RESTORE ──────────────────────────────
function restoreState() {
  // Dark mode
  const saved = localStorage.getItem('ns_dark');
  isDark = saved !== null ? saved === '1' : true;
  applyDark();

  // Private mode
  isPrivate = sessionStorage.getItem('ns_private') === '1';
  applyPrivate();

  // Query from URL
  const params = new URLSearchParams(window.location.search);
  const q = params.get('q');
  if (q) {
    document.getElementById('main-q').value = q;
    document.getElementById('nav-q').value  = q;
    currentQuery = q;
    showPage('results');
    fetchResults(q, true);
  }
}

// ── DARK MODE ──────────────────────────────────
function toggleDark() {
  isDark = !isDark;
  localStorage.setItem('ns_dark', isDark ? '1' : '0');
  applyDark();
}
function applyDark() {
  document.body.classList.toggle('dark-mode',  isDark);
  document.body.classList.toggle('light-mode', !isDark);
  const btn = document.getElementById('dark-btn');
  btn.innerHTML = isDark
    ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`
    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
}

// ── PRIVATE MODE ───────────────────────────────
function togglePrivate() {
  isPrivate = !isPrivate;
  sessionStorage.setItem('ns_private', isPrivate ? '1' : '0');
  applyPrivate();
}
function applyPrivate() {
  const btn = document.getElementById('private-btn');
  const ind = document.getElementById('private-indicator');
  btn.classList.toggle('active', isPrivate);
  ind.style.display = isPrivate ? 'flex' : 'none';
}

// ── PAGE NAVIGATION ────────────────────────────
function showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(page + '-page').classList.add('active');
  document.body.dataset.page = page;
  currentPage = page;
  if (page === 'home') {
    history.pushState(null, '', window.location.pathname);
  }
}

function goHome() {
  showPage('home');
  document.getElementById('main-q').value = '';
  document.getElementById('nav-q').value  = '';
  currentQuery = ''; allResults = []; searchOffset = 0;
  closeSuggestions();
}

// ── SEARCH ─────────────────────────────────────
function handleMainKey(e) {
  if (e.key === 'Enter') doSearch();
}
function handleNavKey(e) {
  if (e.key === 'Enter') {
    const q = document.getElementById('nav-q').value.trim();
    if (q) { currentQuery = q; fetchResults(q, true); setURLParam(q); }
  }
}

function doSearch() {
  const q = document.getElementById('main-q').value.trim();
  if (!q) return;
  currentQuery = q;
  document.getElementById('nav-q').value = q;
  closeSuggestions();
  setURLParam(q);
  showPage('results');
  fetchResults(q, true);
  if (!isPrivate) saveSearchHistory(q);
}

function setURLParam(q) {
  const url = new URL(window.location);
  url.searchParams.set('q', q);
  history.pushState(null,'',url);
}

// ── DUCKDUCKGO API ─────────────────────────────
async function fetchResults(q, reset = false) {
  if (reset) {
    allResults = [];
    searchOffset = 0;
    document.getElementById('results-list').innerHTML = '';
    document.getElementById('results-info').textContent = `Results for "${q}"`;
  }
  if (isLoadingMore) return;
  isLoadingMore = true;

  const loader = document.getElementById('results-loader');
  loader.style.display = 'flex';

  try {
    // DuckDuckGo Instant Answer API
    const url  = `https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json&no_redirect=1&no_html=1&skip_disambig=1`;
    const res  = await fetch(url);
    const data = await res.json();

    const results = buildResults(data, q);
    renderResults(results, reset);
    allResults = [...allResults, ...results];
  } catch (err) {
    // Fallback: redirect search
    document.getElementById('results-list').innerHTML = `
      <div style="text-align:center;padding:40px;color:var(--text-muted)">
        <p style="margin-bottom:16px">Chuyển sang tìm kiếm nâng cao…</p>
        <a href="https://duckduckgo.com/?q=${encodeURIComponent(q)}" target="_blank" 
           style="color:var(--accent-v);font-weight:600;text-decoration:underline">
          Tìm trên DuckDuckGo ↗
        </a>
      </div>`;
  } finally {
    loader.style.display = 'none';
    isLoadingMore = false;
  }
}

function buildResults(data, q) {
  const results = [];

  // Abstract (main result)
  if (data.AbstractText) {
    results.push({
      title:   data.Heading || q,
      snippet: data.AbstractText,
      url:     data.AbstractURL || '#',
      favicon: getFavicon(data.AbstractURL),
    });
  }

  // Related Topics
  const topics = data.RelatedTopics || [];
  topics.forEach(t => {
    if (t.Text && t.FirstURL) {
      results.push({
        title:   t.Text.split(' - ')[0] || t.Text.substring(0,60),
        snippet: t.Text,
        url:     t.FirstURL,
        favicon: getFavicon(t.FirstURL),
      });
    }
    if (t.Topics) {
      t.Topics.forEach(s => {
        if (s.Text && s.FirstURL) {
          results.push({
            title:   s.Text.split(' - ')[0] || s.Text.substring(0,60),
            snippet: s.Text,
            url:     s.FirstURL,
            favicon: getFavicon(s.FirstURL),
          });
        }
      });
    }
  });

  // Answer
  if (data.Answer) {
    results.unshift({
      title:   '⚡ Instant Answer',
      snippet: data.Answer,
      url:     `https://duckduckgo.com/?q=${encodeURIComponent(q)}`,
      favicon: 'https://duckduckgo.com/favicon.ico',
    });
  }

  // Always include DuckDuckGo web search link
  results.push({
    title:   `Web search: "${q}" on DuckDuckGo`,
    snippet: 'View full web search results on DuckDuckGo',
    url:     `https://duckduckgo.com/?q=${encodeURIComponent(q)}`,
    favicon: 'https://duckduckgo.com/favicon.ico',
    isLink:  true,
  });

  return results.slice(0, 20);
}

function getFavicon(url) {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  } catch { return null; }
}

function renderResults(results, reset) {
  const list = document.getElementById('results-list');
  if (reset) list.innerHTML = '';
  if (!results.length) {
    list.innerHTML = '<div style="color:var(--text-muted);padding:20px;text-align:center">Không tìm thấy kết quả.</div>';
    return;
  }
  results.forEach(r => list.appendChild(buildCard(r)));
}

function buildCard(r) {
  const a = document.createElement('a');
  a.className = 'result-card';
  a.href = r.url; a.target = '_blank';
  a.rel = 'noopener noreferrer';

  let faviconHTML = r.favicon
    ? `<img class="result-favicon" src="${r.favicon}" alt="" onerror="this.style.display='none'">`
    : `<div class="result-favicon-placeholder">🌐</div>`;

  let displayUrl = r.url;
  try { displayUrl = new URL(r.url).hostname; } catch {}

  a.innerHTML = `
    ${faviconHTML}
    <div class="result-body">
      <div class="result-url">${displayUrl}</div>
      <div class="result-title">${escapeHTML(r.title)}</div>
      <div class="result-snippet">${escapeHTML(r.snippet.substring(0,200))}${r.snippet.length>200?'…':''}</div>
    </div>`;
  return a;
}

function escapeHTML(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── INFINITE SCROLL ────────────────────────────
function initInfiniteScroll() {
  window.addEventListener('scroll', () => {
    if (currentPage !== 'results') return;
    const bottom = document.documentElement.scrollHeight - window.innerHeight - 200;
    if (window.scrollY >= bottom && !isLoadingMore) {
      // DuckDuckGo doesn't support pagination, so show link
    }
  });
}

// ── SUGGESTIONS ────────────────────────────────
function showSuggestions(val) {
  const box = document.getElementById('suggestions');
  if (!val || val.length < 1) { closeSuggestions(); return; }
  const filtered = SUGGESTIONS.filter(s => s.toLowerCase().includes(val.toLowerCase())).slice(0,5);
  if (!filtered.length) { closeSuggestions(); return; }
  box.innerHTML = filtered.map(s => `
    <div class="suggestion-item" onclick="selectSuggestion('${s.replace(/'/g,"\\'")}')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
      ${escapeHTML(s)}
    </div>`).join('');
  box.classList.add('open');
}
function selectSuggestion(s) {
  document.getElementById('main-q').value = s;
  closeSuggestions(); doSearch();
}
function closeSuggestions() {
  document.getElementById('suggestions').classList.remove('open');
  document.getElementById('suggestions').innerHTML = '';
}
document.addEventListener('click', e => {
  if (!e.target.closest('.search-container')) closeSuggestions();
});

// ── VOICE SEARCH ───────────────────────────────
function startVoice() {
  if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
    alert('Trình duyệt của bạn không hỗ trợ voice search.');
    return;
  }
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const rec = new SR();
  rec.lang = 'vi-VN';
  rec.interimResults = false;

  const ind = document.getElementById('voice-indicator');
  const vBtn = document.querySelector('.voice-btn');
  ind.style.display = 'flex'; vBtn.classList.add('listening');

  rec.onresult = e => {
    const text = e.results[0][0].transcript;
    document.getElementById('main-q').value = text;
    ind.style.display = 'none'; vBtn.classList.remove('listening');
    doSearch();
  };
  rec.onerror = () => { ind.style.display = 'none'; vBtn.classList.remove('listening'); };
  rec.onend   = () => { ind.style.display = 'none'; vBtn.classList.remove('listening'); };
  rec.start();
}

// Click voice indicator to cancel
document.getElementById('voice-indicator').addEventListener('click', () => {
  document.getElementById('voice-indicator').style.display = 'none';
});

// ── SEARCH HISTORY (non-private) ───────────────
function saveSearchHistory(q) {
  try {
    let hist = JSON.parse(localStorage.getItem('ns_history') || '[]');
    hist = [q, ...hist.filter(h => h !== q)].slice(0, 20);
    localStorage.setItem('ns_history', JSON.stringify(hist));
  } catch {}
}

// ── SPOTIFY MODAL ──────────────────────────────
function openSpotify() {
  document.getElementById('spotify-modal').style.display = 'flex';
  const savedId = localStorage.getItem('sp_client_id');
  if (savedId) {
    document.getElementById('sp-client-id').value = savedId;
  }
}
function closeSpotifyModal(e) {
  if (e.target === document.getElementById('spotify-modal')) closeModal('spotify-modal');
}
function closeModal(id) {
  document.getElementById(id).style.display = 'none';
}

// ── KEYBOARD SHORTCUT ──────────────────────────
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    const inp = currentPage === 'home'
      ? document.getElementById('main-q')
      : document.getElementById('nav-q');
    inp && inp.focus();
  }
  if (e.key === 'Escape') {
    closeModal('spotify-modal');
    document.getElementById('voice-indicator').style.display = 'none';
  }
});

// ── DRAGGABLE VINYL ────────────────────────────
(function initDrag() {
  const handle = document.getElementById('vinyl-drag');
  const player = document.getElementById('vinyl-player');
  if (!handle || !player) return;

  let dragging = false, startX, startY, origX, origY;

  handle.addEventListener('mousedown', start);
  handle.addEventListener('touchstart', start, {passive:true});

  function start(e) {
    dragging = true;
    const rect = player.getBoundingClientRect();
    origX = rect.left; origY = rect.top;
    const pt = e.touches ? e.touches[0] : e;
    startX = pt.clientX; startY = pt.clientY;
    player.style.transition = 'none';
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup',   end);
    document.addEventListener('touchmove', move, {passive:false});
    document.addEventListener('touchend',  end);
  }
  function move(e) {
    if (!dragging) return;
    if (e.touches) e.preventDefault();
    const pt = e.touches ? e.touches[0] : e;
    const dx = pt.clientX - startX;
    const dy = pt.clientY - startY;
    let nx = origX + dx, ny = origY + dy;
    nx = Math.max(0, Math.min(window.innerWidth  - player.offsetWidth,  nx));
    ny = Math.max(0, Math.min(window.innerHeight - player.offsetHeight, ny));
    player.style.left   = nx + 'px';
    player.style.top    = ny + 'px';
    player.style.right  = 'auto';
    player.style.bottom = 'auto';
  }
  function end() {
    dragging = false;
    player.style.transition = '';
    document.removeEventListener('mousemove', move);
    document.removeEventListener('mouseup',   end);
    document.removeEventListener('touchmove', move);
    document.removeEventListener('touchend',  end);
  }
})();

// ── CLOSE VINYL ────────────────────────────────
function closeVinyl() {
  document.getElementById('vinyl-player').style.display = 'none';
}
