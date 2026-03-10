# 🌐 NovaSphere

> Futuristic Tech Portal – Search · Music · Intelligence  
> One platform for web search, Spotify music, and AI chat.

---

## ✨ Features

- **Web Search** via DuckDuckGo Instant Answer API — no tracking, no ads
- **Spotify Integration** — search and stream music with a stunning vinyl disc player
- **NovaMind AI Chat** — powered by Claude (Anthropic) with chat history
- **Private Mode** — no search history, no chat history, no cookies saved
- **Voice Search** — via Web Speech API
- **Dark / Light Mode**
- **Draggable Vinyl Player** — always-on-top floating player
- **Responsive** — works on desktop (1920px → 1366px), tablet (1024px), mobile (390px, 412px)

---

## 🚀 Getting Started

### 1. Open locally

Simply open `index.html` in any modern browser:

```bash
# Option A: Double-click index.html
# Option B: Use a local server (recommended for Spotify auth)
npx serve .
# or
python -m http.server 8080
```

### 2. For Spotify (requires local server or deployed URL)

Spotify OAuth requires a valid redirect URI. Use:
```
http://localhost:8080
# or your deployed URL
```

---

## 🎵 Spotify API Setup

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Click **Create App**
3. Fill in:
   - **App Name**: NovaSphere
   - **Redirect URI**: `http://localhost:8080` (or your deployed URL)
4. Copy your **Client ID**
5. In NovaSphere, click the Spotify icon in the navbar
6. Paste your **Client ID** and click **Kết nối Spotify**
7. Authorize in the Spotify popup

> **Note**: The Spotify Web Playback SDK requires a **Spotify Premium** account for actual audio playback.

---

## 🤖 AI Chat Setup

The AI chat is powered by Anthropic's Claude API, handled server-side through the NovaSphere artifact system. No additional setup is needed — just open the AI chat widget (bottom-right corner) and start chatting!

If you're self-hosting and want to use your own API key:
1. Open `ai.js`
2. The fetch call goes to `https://api.anthropic.com/v1/messages`
3. Add your API key to the headers: `'x-api-key': 'YOUR_KEY'`

---

## 🕵️ Private Mode

Click the **Private** button in the navbar to enable Private Mode:

- Search history is **not saved** to `localStorage`
- AI chat history is **not saved**
- Session ends when you close the tab
- A red indicator badge appears when Private Mode is active

To disable: click **Private** again.

---

## 🌍 Deploy

### Netlify (Drag & Drop)
1. Zip the `/novasphere` folder
2. Go to [netlify.com](https://netlify.com)
3. Drag the zip onto the deploy zone

### GitHub Pages
```bash
git init
git add .
git commit -m "NovaSphere launch"
git branch -M main
git remote add origin https://github.com/yourusername/novasphere.git
git push -u origin main
# Enable Pages in repo Settings → Pages → Deploy from main
```

### Vercel
```bash
npx vercel --prod
```

> After deploying, update your Spotify **Redirect URI** to your production URL.

---

## 📁 Project Structure

```
/novasphere
├── index.html    ← Main HTML (all pages: home, results)
├── style.css     ← Futuristic glassmorphism UI
├── script.js     ← Core: search, navigation, canvas BG, voice, drag
├── spotify.js    ← Spotify Web API + vinyl player
├── ai.js         ← NovaMind AI chat
└── README.md     ← This file
```

---

## 🎨 Design System

| Token        | Value                        |
|-------------|-------------------------------|
| Primary font | Syne (display) + DM Sans     |
| Accent 1     | `#a78bfa` (violet)           |
| Accent 2     | `#22d3ee` (cyan)             |
| BG           | `#06040f` (deep space)       |
| Style        | Glassmorphism + Neon Glow    |
| Border-radius| 10px / 16px / 24px           |

---

## 🛠 Tech Stack

- HTML5 + CSS3 (Grid, Flexbox, Custom Properties)
- Vanilla JavaScript ES6+
- [DuckDuckGo Instant Answer API](https://duckduckgo.com/api)
- [Spotify Web API](https://developer.spotify.com/documentation/web-api)
- [Spotify Web Playback SDK](https://developer.spotify.com/documentation/web-playback-sdk)
- [Anthropic Claude API](https://docs.anthropic.com)
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- Google Fonts: [Syne](https://fonts.google.com/specimen/Syne) + [DM Sans](https://fonts.google.com/specimen/DM+Sans)

---

## 📜 License

MIT — free to use, modify, and distribute.

---

*Built with 💜 by NovaSphere*
