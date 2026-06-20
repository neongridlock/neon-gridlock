# NEON GRIDLOCK

**Paint the grid. Block the bot. Don't get trapped.**

A premium neon-themed 1v1 grid strategy game where you compete against AI bots on glowing arenas. Leave trails, trap your opponents, and climb the ranks.

## Features

- **5 Power-Up Types**: Speed Boost, Phase Walk, Trail Bomb, Freeze, Ghost Mode
- **3 Special Abilities**: Dash, Wall Drop, Reverse
- **20-Level Campaign Mode** with varied objectives
- **Daily Challenges** with randomized settings
- **Streak & Ranking System**: Bronze to Neon God
- **Unlockable Trail Effects**: Solid, Dotted, Rainbow, Particle, Electric
- **Multi-Bot Matches**: Fight 1-3 bots simultaneously
- **Match Replay Viewer** with speed controls
- **Full Stats Dashboard** with win rates, records, and match history
- **Dynamic Events**: Shrinking zones and crumbling tiles
- **4 Arena Themes**: Dark Void, Cyber City, Deep Space, Acid Rave
- **Desktop & Mobile Controls**: WASD/Arrows + Touch/D-pad

All data is stored in your browser's localStorage — no database required.

## Getting Started (Local Development)

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deploy to Vercel

1. **Upload to GitHub** — Push this project to a new GitHub repository
2. **Import into Vercel** — Go to [vercel.com/new](https://vercel.com/new) and import the GitHub repo
3. **Framework**: Select **Next.js** (should auto-detect)
4. **Build Command**: `npm run build` (default)
5. **No environment variables needed** — the game runs entirely client-side
6. Click **Deploy**

Your game will be live in under a minute.

## Tech Stack

- **Next.js 14** (App Router)
- **React 18**
- **Tailwind CSS** + custom neon theme
- **Framer Motion** for animations
- **HTML Canvas** for game rendering
- **Web Audio API** for sound effects
- **localStorage** for persistence (no database)

## Controls

| Platform | Movement | Ability |
|----------|----------|--------|
| Desktop | WASD or Arrow Keys | Spacebar |
| Mobile | Swipe gestures | Ability button (bottom-right) |

## License

MIT
