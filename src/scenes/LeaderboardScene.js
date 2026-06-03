import { SCENES } from '../config.js';
import { SFX } from '../systems/AudioSystem.js';
import SaveSystem from '../systems/SaveSystem.js';
import QuestSystem from '../systems/QuestSystem.js';

export default class LeaderboardScene extends Phaser.Scene {
  constructor() { super({ key: SCENES.LEADERBOARD }); }

  create() {
    const { width, height } = this.scale;
    this.add.rectangle(width / 2, height / 2, width, height, 0x0d0d1a);

    // Stars bg
    for (let i = 0; i < 50; i++) {
      this.add.image(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(0, height),
        'star_twinkle'
      ).setAlpha(Math.random() * 0.5 + 0.1);
    }

    this._tab = 'scores'; // 'scores' | 'quests'

    const tabScores = this.add.text(width * 0.3, 14, '🏆 SCORES', {
      fontSize: '8px', fontFamily: 'monospace', color: '#ffd700',
    }).setOrigin(0.5).setInteractive();
    const tabQuests = this.add.text(width * 0.7, 14, '✦ QUESTS', {
      fontSize: '8px', fontFamily: 'monospace', color: '#aaaaaa',
    }).setOrigin(0.5).setInteractive();

    tabScores.on('pointerdown', () => { this._tab = 'scores'; this._refresh(tabScores, tabQuests); SFX.menu_move(); });
    tabQuests.on('pointerdown', () => { this._tab = 'quests'; this._refresh(tabScores, tabQuests); SFX.menu_move(); });

    this._contentGroup = this.add.group();
    this._tabScores = tabScores;
    this._tabQuests = tabQuests;
    this._refresh(tabScores, tabQuests);

    const back = this.add.text(width / 2, height - 14, '← BACK TO MENU', {
      fontSize: '7px', fontFamily: 'monospace', color: '#aaaacc',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    back.on('pointerover', () => back.setColor('#ffffff'));
    back.on('pointerout', () => back.setColor('#aaaacc'));
    back.on('pointerdown', () => { SFX.menu_select(); this.scene.start(SCENES.MENU); });

    this.input.keyboard.once('keydown-ESC', () => this.scene.start(SCENES.MENU));
  }

  _refresh(tabScores, tabQuests) {
    this._contentGroup.clear(true, true);
    const { width } = this.scale;

    tabScores.setColor(this._tab === 'scores' ? '#ffd700' : '#aaaaaa');
    tabQuests.setColor(this._tab === 'quests' ? '#ffd700' : '#aaaaaa');

    if (this._tab === 'scores') {
      this._renderScores(width);
    } else {
      this._renderQuests(width);
    }
  }

  _renderScores(width) {
    const lb = SaveSystem.getLeaderboard();

    this._contentGroup.add(this.add.text(width / 2, 28, 'TOP 10 SCORES', {
      fontSize: '8px', fontFamily: 'monospace', color: '#ffffff',
    }).setOrigin(0.5));

    const medals = ['🥇', '🥈', '🥉'];
    if (lb.length === 0) {
      this._contentGroup.add(this.add.text(width / 2, 100, 'No scores yet!\nPlay a level to get started.', {
        fontSize: '8px', fontFamily: 'monospace', color: '#666688', align: 'center',
      }).setOrigin(0.5));
      return;
    }

    lb.forEach((entry, i) => {
      const y = 42 + i * 18;
      const medal = i < 3 ? medals[i] : `${i + 1}.`;
      const color = i === 0 ? '#ffd700' : i === 1 ? '#cccccc' : i === 2 ? '#cc9966' : '#aaaacc';

      this._contentGroup.add(this.add.text(20, y, `${medal}`, {
        fontSize: '7px', fontFamily: 'monospace', color,
      }));
      this._contentGroup.add(this.add.text(50, y, entry.name, {
        fontSize: '7px', fontFamily: 'monospace', color: '#ffffff',
      }));
      this._contentGroup.add(this.add.text(width - 20, y, entry.score.toLocaleString(), {
        fontSize: '7px', fontFamily: 'monospace', color,
      }).setOrigin(1, 0));
      this._contentGroup.add(this.add.text(width / 2, y, entry.date, {
        fontSize: '5px', fontFamily: 'monospace', color: '#555577',
      }).setOrigin(0.5, 0));
    });
  }

  _renderQuests(width) {
    this._contentGroup.add(this.add.text(width / 2, 28, 'QUEST LOG', {
      fontSize: '8px', fontFamily: 'monospace', color: '#ffffff',
    }).setOrigin(0.5));

    const quests = QuestSystem.getAllProgress();
    const done = quests.filter(q => q.done).length;

    this._contentGroup.add(this.add.text(width / 2, 40, `Completed: ${done}/${quests.length}`, {
      fontSize: '6px', fontFamily: 'monospace', color: '#aaffaa',
    }).setOrigin(0.5));

    quests.forEach((q, i) => {
      const y = 52 + i * 16;
      const pct = q.done ? '✓ DONE' : `${Math.min(q.progress, q.target)}/${q.target}`;
      const color = q.done ? '#55ff55' : '#aaaacc';

      this._contentGroup.add(this.add.text(12, y, `${q.icon}`, {
        fontSize: '7px', fontFamily: 'monospace', color,
      }));
      this._contentGroup.add(this.add.text(28, y, q.name, {
        fontSize: '6px', fontFamily: 'monospace', color,
      }));
      this._contentGroup.add(this.add.text(width - 12, y, pct, {
        fontSize: '6px', fontFamily: 'monospace', color,
      }).setOrigin(1, 0));
    });
  }
}
