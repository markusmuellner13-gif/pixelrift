import { SCENES, DAILY_MODIFIERS } from '../config.js';
import { getDailyChallenge, hasDoneToday, getTodayBest, applyModifiers } from '../systems/DailyChallenge.js';
import { SFX, playMusic } from '../systems/AudioSystem.js';
import SaveSystem from '../systems/SaveSystem.js';

export default class DailyChallengeScene extends Phaser.Scene {
  constructor() { super({ key: SCENES.DAILY }); }

  create() {
    const { width, height } = this.scale;
    const daily = getDailyChallenge();
    const done  = hasDoneToday();
    const best  = getTodayBest();

    this.add.rectangle(width / 2, height / 2, width, height, 0x0d1a0d);

    // Stars
    for (let i = 0; i < 50; i++) {
      this.add.image(Phaser.Math.Between(0, width), Phaser.Math.Between(0, height), 'star_twinkle')
        .setAlpha(Math.random() * 0.5 + 0.1);
    }

    // Title
    this.add.text(width / 2, 18, '⭐ DAILY CHALLENGE', {
      fontSize: '13px', fontFamily: 'monospace', color: '#ff8800',
      stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5);
    this.add.text(width / 2, 34, daily.date, {
      fontSize: '7px', fontFamily: 'monospace', color: '#aaffaa',
    }).setOrigin(0.5);

    // Level info
    this.add.text(width / 2, 52, `Level: W${daily.world}-${daily.level}`, {
      fontSize: '9px', fontFamily: 'monospace', color: '#ffffff',
    }).setOrigin(0.5);

    // Modifier list
    this.add.text(width / 2, 66, 'MODIFIERS:', {
      fontSize: '6px', fontFamily: 'monospace', color: '#aaaaaa',
    }).setOrigin(0.5);
    daily.modifiers.forEach((m, i) => {
      const cfg = DAILY_MODIFIERS[m];
      if (!cfg) return;
      this.add.text(width / 2, 76 + i * 14, `${cfg.label} — ${cfg.desc}`, {
        fontSize: '6px', fontFamily: 'monospace', color: '#ff8800',
      }).setOrigin(0.5);
    });

    const modY = 76 + Math.max(1, daily.modifiers.length) * 14 + 8;

    // Today's best
    if (done) {
      this.add.text(width / 2, modY, `Today's best: ${best.toLocaleString()}`, {
        fontSize: '7px', fontFamily: 'monospace', color: '#ffd700',
      }).setOrigin(0.5);
    }

    // Unlock status
    const unlocked = SaveSystem.isLevelUnlocked(daily.world, daily.level);
    const btnLabel = done ? '↺ PLAY AGAIN' : (unlocked ? '▶ START' : '🔒 LOCKED');
    const btnColor = unlocked ? '#55ff88' : '#888888';

    const startBtn = this.add.text(width / 2, modY + 22, btnLabel, {
      fontSize: '11px', fontFamily: 'monospace', color: btnColor,
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setInteractive({ useHandCursor: unlocked });

    if (unlocked) {
      startBtn.on('pointerover', () => startBtn.setColor('#ffd700'));
      startBtn.on('pointerout',  () => startBtn.setColor(btnColor));
      startBtn.on('pointerdown', () => {
        SFX.daily_start();
        this.scene.start(SCENES.GAME, {
          world: daily.world,
          level: daily.level,
          daily: { ...daily, coinScoreMult: daily.modifiers.includes('coin_rush') ? 5 : 1 },
        });
      });
    }

    const back = this.add.text(width / 2, modY + 44, '← BACK', {
      fontSize: '7px', fontFamily: 'monospace', color: '#aaaacc',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => { SFX.menu_select(); this.scene.start(SCENES.MENU); });

    // Leaderboard teaser
    this.add.text(width / 2, height - 10, '📊 Rankings in Leaderboard → QUESTS tab', {
      fontSize: '5px', fontFamily: 'monospace', color: '#446644',
    }).setOrigin(0.5);

    playMusic('menu');
    this.input.keyboard.once('keydown-ESC', () => this.scene.start(SCENES.MENU));
  }
}
