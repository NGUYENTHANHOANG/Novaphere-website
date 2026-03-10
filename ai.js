/* ═══════════════════════════════════════════════
   NOVASPHERE – ai.js
   NovaMind AI Chat (powered by Anthropic API via Claude)
═══════════════════════════════════════════════ */

let aiOpen    = false;
let aiHistory = [];   // { role, content }

// ── TOGGLE AI PANEL ────────────────────────────
function toggleAI() {
  aiOpen = !aiOpen;
  const panel = document.getElementById('ai-panel');
  panel.style.display = aiOpen ? 'flex' : 'none';
  if (aiOpen) {
    restoreAIHistory();
    setTimeout(() => document.getElementById('ai-input').focus(), 100);
  }
}

// ── SEND MESSAGE ───────────────────────────────
async function sendAI() {
  const input = document.getElementById('ai-input');
  const msg   = input.value.trim();
  if (!msg) return;
  input.value = '';

  appendMsg('user', msg);
  aiHistory.push({ role: 'user', content: msg });

  const typingId = appendTyping();

  try {
    const reply = await callClaude(msg);
    removeTyping(typingId);
    appendMsg('bot', reply);
    aiHistory.push({ role: 'assistant', content: reply });
    saveAIHistory();
  } catch (err) {
    removeTyping(typingId);
    appendMsg('bot', '⚠️ Có lỗi xảy ra. Vui lòng thử lại sau.');
    console.error('[AI]', err);
  }
}

// ── CALL CLAUDE API ────────────────────────────
async function callClaude(userMsg) {
  const systemPrompt = `You are NovaMind, the intelligent AI assistant embedded in NovaSphere – a futuristic tech portal featuring web search, Spotify music, and AI chat. 
You are helpful, knowledgeable, friendly, and concise. 
You respond in the same language the user writes in (Vietnamese or English).
Keep responses focused and useful. Format with markdown when it helps clarity.`;

  const messages = [
    ...aiHistory.slice(-8),  // last 4 turns for context
    { role: 'user', content: userMsg },
  ].filter(m => m.role !== 'user' || m.content !== userMsg); 
  // Actually include the current message properly:
  const fullMessages = [
    ...aiHistory.slice(0, -1).slice(-8),
    { role: 'user', content: userMsg }
  ];

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model:      'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system:     systemPrompt,
      messages:   fullMessages,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `HTTP ${res.status}`);
  }

  const data = await res.json();
  return data.content?.map(c => c.text || '').join('') || '(no response)';
}

// ── RENDER MESSAGES ────────────────────────────
function appendMsg(role, text) {
  const container = document.getElementById('ai-messages');
  const wrap = document.createElement('div');
  wrap.className = `ai-msg ${role}`;
  wrap.innerHTML = `<div class="msg-bubble">${formatAIText(text)}</div>`;
  container.appendChild(wrap);
  container.scrollTop = container.scrollHeight;
}

function formatAIText(text) {
  // Basic markdown: bold, code, links
  return text
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/`([^`]+)`/g,'<code style="background:rgba(167,139,250,.15);padding:2px 5px;border-radius:4px;font-size:.85em">$1</code>')
    .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
    .replace(/\*(.+?)\*/g,'<em>$1</em>')
    .replace(/\n/g,'<br>');
}

// ── TYPING INDICATOR ───────────────────────────
let typingCounter = 0;
function appendTyping() {
  const id = 'typing-' + (++typingCounter);
  const container = document.getElementById('ai-messages');
  const wrap = document.createElement('div');
  wrap.className = 'ai-msg bot';
  wrap.id = id;
  wrap.innerHTML = `<div class="msg-bubble"><div class="typing-dots"><span></span><span></span><span></span></div></div>`;
  container.appendChild(wrap);
  container.scrollTop = container.scrollHeight;
  return id;
}
function removeTyping(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

// ── HISTORY ────────────────────────────────────
function saveAIHistory() {
  if (isPrivate) return;   // no save in private mode
  try {
    localStorage.setItem('ns_ai_history', JSON.stringify(aiHistory.slice(-30)));
  } catch {}
}

function restoreAIHistory() {
  if (aiHistory.length > 0) return; // already loaded
  if (isPrivate) return;
  try {
    const saved = JSON.parse(localStorage.getItem('ns_ai_history') || '[]');
    if (saved.length) {
      aiHistory = saved;
      const container = document.getElementById('ai-messages');
      // Clear default welcome and re-render
      container.innerHTML = '';
      // Add welcome back
      const w = document.createElement('div');
      w.className = 'ai-msg bot';
      w.innerHTML = `<div class="msg-bubble">Xin chào! Tôi là NovaMind, trợ lý AI của NovaSphere. Tôi có thể giúp gì cho bạn? 🚀</div>`;
      container.appendChild(w);
      // Render last few messages
      saved.slice(-10).forEach(m => appendMsg(m.role === 'user' ? 'user' : 'bot', m.content));
    }
  } catch {}
}

function clearAIChat() {
  aiHistory = [];
  try { localStorage.removeItem('ns_ai_history'); } catch {}
  const container = document.getElementById('ai-messages');
  container.innerHTML = `
    <div class="ai-msg bot">
      <div class="msg-bubble">Cuộc trò chuyện đã được xóa. Bắt đầu lại thôi! 🚀</div>
    </div>`;
}

// ── HANDLE isPrivate (from script.js) ──────────
// isPrivate is a global from script.js
// saveAIHistory checks it before writing to localStorage
