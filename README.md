# PixelRift 🎮
**Leap. Explore. Conquer.**

A pixel-art 2D platformer with 15 hand-crafted levels, quests, and a chip-tune soundtrack — built entirely in JavaScript with zero external assets (no copyright issues).

## Play

| Platform | How |
|---|---|
| **Browser (phone/PC)** | https://markusmuellner13-gif.github.io/pixelrift/ |
| **Phone homescreen** | Open in Chrome/Safari → Add to Home Screen |
| **Desktop (Electron)** | `npm run electron:dev` |
| **Steam build** | `npm run electron:build:win` |

## Controls

| Action | Keyboard | Controller | Touch |
|---|---|---|---|
| Move | ← → / A D | Left Stick / D-Pad | Left / Right buttons |
| Jump | ↑ / W / Space / Enter | A / Cross | ▲ button |
| Run | Z / Shift | B / Circle | RUN button |
| Fire | X / Ctrl | X / Square | X button |
| Pause | Escape | Start / Options | ⏸ button |

## Building

```bash
npm install            # Install dependencies
npm run dev            # Web dev server (localhost:3000)
npm run build          # Build web version to dist/
npm run preview        # Preview + LAN access for phone testing

npm run electron:dev        # Run desktop app (dev)
npm run electron:build:win  # Package Windows installer (.exe)
npm run electron:build:mac  # Package macOS app (.dmg)
npm run electron:build:linux # Package Linux (.AppImage)
```

## Features

- **15 Levels** — 3 worlds × 5 levels (Grassy Plains, Desert, Frozen Peaks)
- **3 Enemy types** — Goomba, Koopa (shell kick), Spiny
- **Power-ups** — Mushroom, Fire Flower, Star
- **12 Quests** — from First Jump to True Champion
- **Combo system** — chain stomps for score multipliers
- **Checkpoint & respawn** — midway flags per level
- **Save system** — localStorage with checksum integrity
- **PWA** — installable on any phone/tablet
- **Gamepad** — full Xbox / PlayStation controller support
- **Touch controls** — zone-based multi-touch D-pad for mobile

## Steam Release

1. Package with `npm run electron:build:win`
2. Submit via [Steam Direct](https://partner.steamgames.com/) ($100 fee)
3. Optionally add [steamworks.js](https://github.com/ceifa/steamworks.js) for Steam achievements

All assets (sprites, music, sounds) are procedurally generated — no external files, no copyright issues.
