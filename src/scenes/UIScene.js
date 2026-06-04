import { SCENES, FONT, DAILY_MODIFIERS } from '../config.js';

export default class UIScene extends Phaser.Scene {
  constructor() { super({ key: SCENES.UI }); }

  init(data) {
    this._world       = data.world;
    this._level       = data.level;
    this._lives       = data.lives;
    this._score       = data.score;
    this._coins       = data.coins;
    this._timeLimit   = data.timeLimit;
    this._time        = data.timeLimit;
    this._speedrunBest= data.speedrunBest || null;
    this._isDaily     = data.isDaily || false;
    this._modifiers   = data.modifiers || [];
    this._completion  = 0;
  }

  create() {
    const { width } = this.scale;

    // HUD bar background — tall enough for the larger font
    this.add.rectangle(width / 2, 13, width, 26, 0x000000, 0.75).setScrollFactor(0).setDepth(49);

    // Score — left side
    this._scoreTxt = this.add.text(6, 4, `SCORE: ${this._score.toLocaleString()}`, {
      fontSize: '9px', fontFamily: FONT, color: '#ffffff',
    }).setScrollFactor(0).setDepth(50);

    // World/Level — center
    const wlLabel = this._isDaily
      ? `⭐ DAILY  W${this._world}-${this._level}`
      : `W${this._world}-${this._level}`;
    this.add.text(width / 2, 4, wlLabel, {
      fontSize: '9px', fontFamily: FONT,
      color: this._isDaily ? '#ff8800' : '#aaaaff',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(50);

    // Time — right side
    this._timeTxt = this.add.text(width - 6, 4, `TIME: ${Math.ceil(this._time)}`, {
      fontSize: '9px', fontFamily: FONT, color: '#ffddaa',
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(50);

    // Second row
    this.add.rectangle(width / 2, 33, width, 18, 0x000000, 0.5).setScrollFactor(0).setDepth(49);

    // Lives
    this._livesLabel = this.add.text(6, 25, `LIVES: ${this._lives}`, {
      fontSize: '8px', fontFamily: FONT, color: '#ff8888',
    }).setScrollFactor(0).setDepth(50);

    // Coins — right of center
    this._coinTxt = this.add.text(width - 6, 25, `COINS: ${this._coins}`, {
      fontSize: '8px', fontFamily: FONT, color: '#ffd700',
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(50);

    // Speedrun timer
    if (this._speedrunBest) {
      this._srTxt = this.add.text(width / 2, 25, 'RUN: --', {
        fontSize: '7px', fontFamily: FONT, color: '#aaffaa',
      }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(50);
    }

    // Completion % — small, below HUD
    this._completionTxt = this.add.text(width - 6, 44, 'CLEAR: 0%', {
      fontSize: '7px', fontFamily: FONT, color: '#aaaacc',
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(50);

    // Active modifier badges (daily only) — below hud, left
    this._modifiers.slice(0, 2).forEach((m, i) => {
      const cfg = DAILY_MODIFIERS[m];
      if (!cfg) return;
      this.add.text(6, 44 + i * 11, cfg.label, {
        fontSize: '6px', fontFamily: FONT, color: '#ff8800',
      }).setScrollFactor(0).setDepth(50);
    });
  }

  updateScore(score) {
    this._score = score;
    this._scoreTxt.setText(`SCORE: ${score.toLocaleString()}`);
  }

  updateCoins(coins) {
    this._coins = coins;
    this._coinTxt.setText(`COINS: ${coins}`);
  }

  updateLives(lives) {
    this._lives = lives;
    this._livesLabel.setText(`LIVES: ${lives}`);
  }

  updateTime(time) {
    this._time = time;
    this._timeTxt.setText(`TIME: ${time}`);
    if (time <= 30) {
      this._timeTxt.setColor(time % 2 === 0 ? '#ff4444' : '#ff8800');
      if (time <= 10) this._timeTxt.setScale(time % 2 === 0 ? 1.1 : 1);
    }
  }

  updateSpeedrunTimer(elapsed, best) {
    if (!this._srTxt) return;
    const diff  = elapsed - best;
    const color = diff < 0 ? '#55ff55' : diff < 5 ? '#ffff55' : '#ff6655';
    const sign  = diff < 0 ? '-' : '+';
    this._srTxt.setText(`RUN ${elapsed.toFixed(1)}s (${sign}${Math.abs(diff).toFixed(1)})`);
    this._srTxt.setColor(color);
  }

  updateCompletion(pct) {
    this._completion = pct;
    if (!this._completionTxt) return;
    this._completionTxt.setText(`CLEAR: ${pct}%`);
    this._completionTxt.setColor(pct === 100 ? '#ffd700' : '#aaaacc');
  }

  showQuestComplete(quest) {
    const { width } = this.scale;
    const toast = this.add.container(width / 2, 55).setDepth(100).setScrollFactor(0);
    const bg  = this.add.rectangle(0, 0, 220, 26, 0x1a1a2e, 0.97).setStrokeStyle(1, 0xffd700);
    const txt = this.add.text(0, -3, `${quest.icon} QUEST: ${quest.name}`, {
      fontSize: '8px', fontFamily: FONT, color: '#ffd700',
    }).setOrigin(0.5);
    toast.add([bg, txt]);
    toast.setAlpha(0).setY(35);
    this.tweens.add({
      targets: toast, y: 55, alpha: 1, duration: 300, ease: 'Back.easeOut',
      onComplete: () => {
        this.time.delayedCall(2800, () => {
          this.tweens.add({ targets: toast, alpha: 0, y: 35, duration: 300, onComplete: () => toast.destroy() });
        });
      },
    });
  }
}
