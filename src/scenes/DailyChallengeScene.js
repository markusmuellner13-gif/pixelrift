import { SCENES, FONT, DAILY_MODIFIERS } from '../config.js';
import { getDailyChallenge, hasDoneToday, getTodayBest } from '../systems/DailyChallenge.js';
import { SFX, playMusic } from '../systems/AudioSystem.js';
import SaveSystem from '../systems/SaveSystem.js';

export default class DailyChallengeScene extends Phaser.Scene {
  constructor() { super({ key: SCENES.DAILY }); }

  create() {
    const { width, height } = this.scale;
    const daily   = getDailyChallenge();
    const done    = hasDoneToday();
    const best    = getTodayBest();
    const unlocked= SaveSystem.isLevelUnlocked(daily.world, daily.level);

    this.add.rectangle(width / 2, height / 2, width, height, 0x0d1a0d);
    for (let i = 0; i < 50; i++) {
      this.add.image(Phaser.Math.Between(0, width), Phaser.Math.Between(0, height), 'star_twinkle')
        .setAlpha(Math.random() * 0.5 + 0.1);
    }

    // Title
    this.add.text(width / 2, 16, '★ DAILY CHALLENGE', {
      fontSize: '14px', fontFamily: FONT,
      color: '#ff8800', stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5);
    this.add.text(width / 2, 34, daily.date, {
      fontSize: '9px', fontFamily: FONT, color: '#aaffaa',
    }).setOrigin(0.5);

    // Level info
    this.add.text(width / 2, 52, `LEVEL:  W${daily.world} - ${daily.level}`, {
      fontSize: '10px', fontFamily: FONT, color: '#ffffff',
    }).setOrigin(0.5);

    // Modifiers
    this.add.text(width / 2, 70, 'MODIFIERS:', {
      fontSize: '8px', fontFamily: FONT, color: '#888888',
    }).setOrigin(0.5);

    daily.modifiers.forEach((m, i) => {
      const cfg = DAILY_MODIFIERS[m];
      if (!cfg) return;
      this.add.text(width / 2, 84 + i * 20, cfg.label, {
        fontSize: '9px', fontFamily: FONT, color: '#ff8800',
      }).setOrigin(0.5);
      this.add.text(width / 2, 84 + i * 20 + 11, cfg.desc, {
        fontSize: '7px', fontFamily: FONT, color: '#aa6600',
      }).setOrigin(0.5);
    });

    const baseY = 84 + Math.max(1, daily.modifiers.length) * 20 + 16;

    // Today's best
    if (done) {
      this.add.text(width / 2, baseY, `TODAY'S BEST: ${best.toLocaleString()}`, {
        fontSize: '9px', fontFamily: FONT, color: '#ffd700',
      }).setOrigin(0.5);
    }

    // Start button
    const btnY     = baseY + (done ? 22 : 8);
    const btnLabel = done ? '↺ PLAY AGAIN' : (unlocked ? '▶ START' : '🔒 LOCKED');
    const btnColor = unlocked ? '#55ff88' : '#666666';

    const startBtn = this.add.text(width / 2, btnY, btnLabel, {
      fontSize: '12px', fontFamily: FONT,
      color: btnColor, stroke: '#000', strokeThickness: 2,
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
    } else {
      this.add.text(width / 2, btnY + 18, 'Complete earlier levels to unlock', {
        fontSize: '7px', fontFamily: FONT, color: '#665500',
      }).setOrigin(0.5);
    }

    const back = this.add.text(width / 2, btnY + 44, '< BACK', {
      fontSize: '9px', fontFamily: FONT, color: '#aaaacc',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    back.on('pointerover', () => back.setColor('#ffffff'));
    back.on('pointerout',  () => back.setColor('#aaaacc'));
    back.on('pointerdown', () => { SFX.menu_select(); this.scene.start(SCENES.MENU); });

    this.add.text(width / 2, height - 10, 'Rankings available in Leaderboard > Quests', {
      fontSize: '7px', fontFamily: FONT, color: '#334433',
    }).setOrigin(0.5, 1);

    playMusic('menu');
    this.input.keyboard.once('keydown-ESC', () => this.scene.start(SCENES.MENU));
  }
}
