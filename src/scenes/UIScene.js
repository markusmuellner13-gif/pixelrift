import { SCENES, GAME_W } from '../config.js';

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
  }

  create() {
    const { width } = this.scale;

    // HUD bar background
    this.add.rectangle(width / 2, 8, width, 16, 0x000000, 0.6).setScrollFactor(0);

    // Score
    this._scoreTxt = this.add.text(4, 2, `SCORE: ${this._score.toLocaleString()}`, {
      fontSize: '7px', fontFamily: 'monospace', color: '#ffffff',
    }).setScrollFactor(0).setDepth(50);

    // World/Level
    this.add.text(width / 2, 2, `W${this._world}-${this._level}`, {
      fontSize: '7px', fontFamily: 'monospace', color: '#aaaaff',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(50);

    // Time
    this._timeTxt = this.add.text(width - 4, 2, `TIME: ${this._time}`, {
      fontSize: '7px', fontFamily: 'monospace', color: '#ffddaa',
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(50);

    // Lives row
    this._heartIcons = [];
    this._livesLabel = this.add.text(4, 14, '', {
      fontSize: '6px', fontFamily: 'monospace', color: '#ff8888',
    }).setScrollFactor(0).setDepth(50);
    this._updateLivesDisplay();

    // Coins
    this.add.image(width - 40, 14, 'ui_coin').setScrollFactor(0).setDepth(50);
    this._coinTxt = this.add.text(width - 33, 11, `×${this._coins}`, {
      fontSize: '6px', fontFamily: 'monospace', color: '#ffd700',
    }).setScrollFactor(0).setDepth(50);

    // Quest toast container
    this._toastQueue = [];
    this._toastActive = false;

    // Listen for quest completions
    const { QuestSystem } = this.scene.get(SCENES.GAME) ? {} : {};
  }

  _updateLivesDisplay() {
    this._livesLabel.setText(`❤×${this._lives}`);
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
    this._updateLivesDisplay();
  }

  updateTime(time) {
    this._time = time;
    this._timeTxt.setText(`TIME: ${time}`);
    if (time <= 30) {
      this._timeTxt.setColor('#ff4444');
      if (time % 2 === 0) this._timeTxt.setScale(1.1);
      else this._timeTxt.setScale(1);
    }
  }

  showQuestComplete(quest) {
    const { width, height } = this.scale;
    const toast = this.add.container(width / 2, 40).setDepth(100).setScrollFactor(0);
    const bg = this.add.rectangle(0, 0, 180, 22, 0x1a1a2e, 0.95).setStrokeStyle(1, 0xffd700);
    const txt = this.add.text(0, -3, `${quest.icon} QUEST: ${quest.name}`, {
      fontSize: '6px', fontFamily: 'monospace', color: '#ffd700',
    }).setOrigin(0.5);
    toast.add([bg, txt]);
    toast.setAlpha(0).setY(20);
    this.tweens.add({
      targets: toast, y: 40, alpha: 1,
      duration: 300, ease: 'Back.easeOut',
      onComplete: () => {
        this.time.delayedCall(2500, () => {
          this.tweens.add({ targets: toast, alpha: 0, y: 20, duration: 300, onComplete: () => toast.destroy() });
        });
      }
    });
  }
}
