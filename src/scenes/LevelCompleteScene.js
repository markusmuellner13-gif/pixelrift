import { SCENES, WORLDS, LEVELS_PER_WORLD, FONT, SKINS } from '../config.js';
import { SFX, playMusic } from '../systems/AudioSystem.js';
import SaveSystem from '../systems/SaveSystem.js';
import SupabaseLeaderboard from '../systems/SupabaseLeaderboard.js';

export default class LevelCompleteScene extends Phaser.Scene {
  constructor() { super({ key: SCENES.LVLCOMPLETE }); }
  init(data) { this._data = data; }

  create() {
    const { width, height } = this.scale;
    const d = this._data;

    this.add.rectangle(width / 2, height / 2, width, height, 0x0d0d1a);
    for (let i = 0; i < 40; i++) {
      const s = this.add.image(Phaser.Math.Between(0, width), Phaser.Math.Between(0, height), 'star_twinkle')
        .setAlpha(Math.random() * 0.7 + 0.2);
      this.tweens.add({ targets: s, alpha: 0.1, duration: Phaser.Math.Between(300, 1200), yoyo: true, repeat: -1 });
    }

    // Title
    this.add.text(width / 2, 20, d.daily ? '⭐ DAILY COMPLETE!' : 'LEVEL COMPLETE!', {
      fontSize: '16px', fontFamily: FONT,
      color: d.daily ? '#ff8800' : '#ffd700', stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5);

    this.add.text(width / 2, 40, `WORLD ${d.world}  LEVEL ${d.level}`, {
      fontSize: '9px', fontFamily: FONT, color: '#aaaaff',
    }).setOrigin(0.5);

    // Stars
    for (let i = 0; i < 3; i++) {
      const star = this.add.text(width / 2 - 30 + i * 30, 58, '★', {
        fontSize: '20px', fontFamily: FONT,
        color: i < d.stars ? '#ffd700' : '#222244',
      }).setOrigin(0.5).setAlpha(0);
      this.time.delayedCall(500 + i * 280, () => {
        this.tweens.add({ targets: star, alpha: 1, scaleX: [0, 1.3, 1], scaleY: [0, 1.3, 1], duration: 300 });
        if (i < d.stars) SFX.coin();
      });
    }

    // Speedrun
    if (d.elapsed !== undefined) {
      const color = d.isNewBest ? '#55ff55' : '#aaaacc';
      const label = d.isNewBest ? '  NEW BEST!' : `  BEST: ${d.elapsed.toFixed(2)}s`;
      this.add.text(width / 2, 82, `TIME: ${d.elapsed.toFixed(2)}s${label}`, {
        fontSize: '8px', fontFamily: FONT, color,
      }).setOrigin(0.5);
    }

    // Completion %
    if (d.clearPct !== undefined) {
      const pctColor = d.clearPct === 100 ? '#ffd700' : '#aaaacc';
      this.add.text(width / 2, 96, `${d.clearPct}% CLEAR${d.clearPct === 100 ? '  PERFECT!' : ''}`, {
        fontSize: '8px', fontFamily: FONT, color: pctColor,
      }).setOrigin(0.5);
    }

    // Score breakdown
    const bank = SaveSystem.get('coinBank') || 0;
    const rows = [
      ['SCORE',      d.score.toLocaleString()],
      ['TIME BONUS', `+${(d.timeBonus   || 0).toLocaleString()}`],
      ['HT BONUS',   `+${(d.heightBonus || 0).toLocaleString()}`],
      ['VAULT',      `+${(d.coinsEarned || 0)} 🪙 → ${bank.toLocaleString()}`],
      ['LIVES',      `x ${d.lives}`],
    ];
    rows.forEach(([label, val], i) => {
      this.add.text(width / 2 - 70, 108 + i * 13, label, {
        fontSize: '8px', fontFamily: FONT, color: '#ccccff',
      });
      this.add.text(width / 2 + 70, 108 + i * 13, val, {
        fontSize: '8px', fontFamily: FONT, color: '#ffffff',
      }).setOrigin(1, 0);
    });

    this.add.rectangle(width / 2, 176, 200, 1, 0x444466);

    const hs = SaveSystem.get('highScore') || 0;
    this.add.text(width / 2, 182, `BEST: ${hs.toLocaleString()}`, {
      fontSize: '8px', fontFamily: FONT, color: '#ffaaaa',
    }).setOrigin(0.5);

    // Next skin unlock teaser — the "one more level" hook
    const owned = SaveSystem.get('ownedSkins') || ['classic'];
    const nextSkin = SKINS.find(s => s.price > 0 && !owned.includes(s.id));
    if (nextSkin) {
      const pct = Phaser.Math.Clamp(bank / nextSkin.price, 0, 1);
      const barW = 160;
      this.add.rectangle(width / 2, 193, barW, 6, 0x222244).setStrokeStyle(1, 0x444466);
      if (pct > 0) this.add.rectangle(width / 2 - barW / 2 + (barW * pct) / 2, 193, barW * pct, 4, 0xffd700);
      const msg = pct >= 1
        ? `'${nextSkin.name}' SKIN UNLOCKABLE IN THE SHOP!`
        : `'${nextSkin.name}' SKIN: ${bank.toLocaleString()} / ${nextSkin.price.toLocaleString()} 🪙`;
      this.add.text(width / 2, 202, msg, {
        fontSize: '7px', fontFamily: FONT, color: pct >= 1 ? '#55ff88' : '#ffdd77',
      }).setOrigin(0.5);
    }

    // Action buttons
    const nextWorld = d.level === LEVELS_PER_WORLD ? d.world + 1 : d.world;
    const nextLevel = d.level === LEVELS_PER_WORLD ? 1 : d.level + 1;
    const hasNext   = nextWorld <= WORLDS && SaveSystem.isLevelUnlocked(nextWorld, nextLevel);

    const btns = [];
    if (hasNext) btns.push({ label: '▶ NEXT LEVEL', fn: () => this._goTo(nextWorld, nextLevel) });
    btns.push({ label: '↺ RETRY',      fn: () => this._retry() });
    btns.push({ label: '⌂ WORLD MAP',  fn: () => this._worldMap() });
    if (d.daily) btns.push({ label: '📊 LEADERBOARD', fn: () => this.scene.start(SCENES.LEADERBOARD) });

    btns.forEach((b, i) => {
      const txt = this.add.text(width / 2, 212 + i * 18, b.label, {
        fontSize: '10px', fontFamily: FONT,
        color: '#ffffff', stroke: '#000', strokeThickness: 2,
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      txt.on('pointerover', () => txt.setColor('#ffd700'));
      txt.on('pointerout',  () => txt.setColor('#ffffff'));
      txt.on('pointerdown', () => { SFX.menu_select(); b.fn(); });
    });

    // Auto-next countdown
    if (hasNext) {
      let cd = 7;
      const at = this.add.text(width - 8, 8, `AUTO NEXT IN ${cd}s`, {
        fontSize: '7px', fontFamily: FONT, color: '#445566',
      }).setOrigin(1, 0);
      this.time.addEvent({
        delay: 1000, repeat: 6,
        callback: () => {
          cd--;
          at.setText(`AUTO NEXT IN ${cd}s`);
          if (cd <= 0) this._goTo(nextWorld, nextLevel);
        },
      });
    }

    // Submit to Supabase
    if (SupabaseLeaderboard.isConfigured()) {
      SupabaseLeaderboard.submit('NOVA', d.score).catch(() => {});
    }

    playMusic('menu');
  }

  _goTo(world, level) {
    this.scene.start(SCENES.GAME, {
      world, level, score: this._data.score,
      lives: this._data.lives, coins: this._data.coins,
    });
  }
  _retry() {
    this.scene.start(SCENES.GAME, {
      world: this._data.world, level: this._data.level,
      score: this._data.score, lives: this._data.lives, coins: this._data.coins,
    });
  }
  _worldMap() {
    this.scene.start(SCENES.WORLDMAP, { world: this._data.world, level: this._data.level });
  }
}
