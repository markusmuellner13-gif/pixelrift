import { SCENES, DAILY_MODIFIERS } from '../config.js';

export default class UIScene extends Phaser.Scene {
  constructor() { super({ key: SCENES.UI }); }

  init(data) {
    this._world = data.world;
    this._level = data.level;
    this._lives = data.lives;
    this._score = data.score;
    this._coins = data.coins;
    this._timeLimit = data.timeLimit;
    this._time = data.timeLimit;
    this._speedrunBest = data.speedrunBest || null;
    this._isDaily = data.isDaily || false;
    this._modifiers = data.modifiers || [];
    this._completion = 0;
  }

  create() {
    const { width } = this.scale;

    // HUD bar
    this.add.rectangle(width / 2, 8, width, 16, 0x000000, 0.65).setScrollFactor(0).setDepth(49);

    // Score
    this._scoreTxt = this.add.text(4, 2, `SCORE: ${this._score.toLocaleString()}`, {
      fontSize: '7px', fontFamily: 'monospace', color: '#ffffff',
    }).setScrollFactor(0).setDepth(50);

    // World/Level + Daily badge
    const wlLabel = this._isDaily ? `⭐ DAILY W${this._world}-${this._level}` : `W${this._world}-${this._level}`;
    this.add.text(width / 2, 2, wlLabel, {
      fontSize: '7px', fontFamily: 'monospace',
      color: this._isDaily ? '#ff8800' : '#aaaaff',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(50);

    // Time
    this._timeTxt = this.add.text(width - 4, 2, `TIME: ${Math.ceil(this._time)}`, {
      fontSize: '7px', fontFamily: 'monospace', color: '#ffddaa',
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(50);

    // Lives
    this._livesLabel = this.add.text(4, 14, `❤×${this._lives}`, {
      fontSize: '6px', fontFamily: 'monospace', color: '#ff8888',
    }).setScrollFactor(0).setDepth(50);

    // Coins
    this.add.image(width - 40, 14, 'ui_coin').setScrollFactor(0).setDepth(50);
    this._coinTxt = this.add.text(width - 33, 11, `×${this._coins}`, {
      fontSize: '6px', fontFamily: 'monospace', color: '#ffd700',
    }).setScrollFactor(0).setDepth(50);

    // Speedrun timer (right below HUD if best exists)
    if (this._speedrunBest) {
      this._srTimerTxt = this.add.text(width - 4, 24, `RUN: 0.0s`, {
        fontSize: '5px', fontFamily: 'monospace', color: '#aaffaa',
      }).setOrigin(1, 0).setScrollFactor(0).setDepth(50);
    }

    // Completion % (bottom right, small)
    this._completionTxt = this.add.text(width - 4, 34, `CLEAR: 0%`, {
      fontSize: '5px', fontFamily: 'monospace', color: '#aaaacc',
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(50);

    // Modifier badges (top-left, stacked below lives)
    this._modifiers.forEach((m, i) => {
      const cfg = DAILY_MODIFIERS[m];
      if (!cfg) return;
      this.add.text(4, 22 + i * 9, cfg.label, {
        fontSize: '5px', fontFamily: 'monospace', color: '#ff8800',
      }).setScrollFactor(0).setDepth(50);
    });
  }

  updateScore(score) {
    this._score = score;
    this._scoreTxt.setText(`SCORE: ${score.toLocaleString()}`);
  }

  updateCoins(coins) {
    this._coins = coins;
    this._coinTxt.setText(`×${coins}`);
  }

  updateLives(lives) {
    this._lives = lives;
    this._livesLabel.setText(`❤×${lives}`);
  }

  updateTime(time) {
    this._time = time;
    this._timeTxt.setText(`TIME: ${time}`);
    if (time <= 30) {
      this._timeTxt.setColor(time % 2 === 0 ? '#ff4444' : '#ffaa00');
    }
  }

  updateSpeedrunTimer(elapsed, best) {
    if (!this._srTimerTxt) return;
    const diff = elapsed - best;
    const color = diff < 0 ? '#55ff55' : diff < 5 ? '#ffff55' : '#ff6655';
    const sign  = diff < 0 ? '-' : '+';
    this._srTimerTxt.setText(`RUN: ${elapsed.toFixed(1)}s (${sign}${Math.abs(diff).toFixed(1)})`);
    this._srTimerTxt.setColor(color);
  }

  updateCompletion(pct) {
    this._completion = pct;
    if (this._completionTxt) {
      this._completionTxt.setText(`CLEAR: ${pct}%`);
      this._completionTxt.setColor(pct === 100 ? '#ffd700' : '#aaaacc');
    }
  }

  showQuestComplete(quest) {
    const { width } = this.scale;
    const toast = this.add.container(width / 2, 40).setDepth(100).setScrollFactor(0);
    const bg = this.add.rectangle(0, 0, 180, 22, 0x1a1a2e, 0.95).setStrokeStyle(1, 0xffd700);
    const txt = this.add.text(0, -3, `${quest.icon} QUEST: ${quest.name}`, {
      fontSize: '6px', fontFamily: 'monospace', color: '#ffd700',
    }).setOrigin(0.5);
    toast.add([bg, txt]);
    toast.setAlpha(0).setY(20);
    this.tweens.add({
      targets: toast, y: 40, alpha: 1, duration: 300, ease: 'Back.easeOut',
      onComplete: () => {
        this.time.delayedCall(2500, () => {
          this.tweens.add({ targets: toast, alpha: 0, y: 20, duration: 300, onComplete: () => toast.destroy() });
        });
      }
    });
  }
}
