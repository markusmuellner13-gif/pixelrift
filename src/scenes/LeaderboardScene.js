import { SCENES } from '../config.js';
import { SFX } from '../systems/AudioSystem.js';
import SaveSystem from '../systems/SaveSystem.js';
import QuestSystem from '../systems/QuestSystem.js';
import SupabaseLeaderboard from '../systems/SupabaseLeaderboard.js';
import { getDailySaveKey } from '../systems/DailyChallenge.js';

export default class LeaderboardScene extends Phaser.Scene {
  constructor() { super({ key: SCENES.LEADERBOARD }); }

  create() {
    const { width, height } = this.scale;
    this.add.rectangle(width / 2, height / 2, width, height, 0x0d0d1a);
    for (let i = 0; i < 50; i++) {
      this.add.image(Phaser.Math.Between(0, width), Phaser.Math.Between(0, height), 'star_twinkle')
        .setAlpha(Math.random() * 0.5 + 0.1);
    }

    this._tab = 'local';
    this._contentGroup = this.add.group();

    // Tabs
    const tabLocal  = this.add.text(width * 0.25, 14, '🏆 LOCAL',  { fontSize: '7px', fontFamily: 'monospace', color: '#ffd700' }).setOrigin(0.5).setInteractive();
    const tabGlobal = this.add.text(width * 0.5,  14, '🌐 GLOBAL', { fontSize: '7px', fontFamily: 'monospace', color: '#aaaaaa' }).setOrigin(0.5).setInteractive();
    const tabQuests = this.add.text(width * 0.75, 14, '✦ QUESTS',  { fontSize: '7px', fontFamily: 'monospace', color: '#aaaaaa' }).setOrigin(0.5).setInteractive();

    this._tabs = { tabLocal, tabGlobal, tabQuests };

    tabLocal.on('pointerdown',  () => { this._tab = 'local';  this._refresh(); SFX.menu_move(); });
    tabGlobal.on('pointerdown', () => { this._tab = 'global'; this._refresh(); SFX.menu_move(); });
    tabQuests.on('pointerdown', () => { this._tab = 'quests'; this._refresh(); SFX.menu_move(); });

    const back = this.add.text(width / 2, height - 12, '← BACK TO MENU', {
      fontSize: '7px', fontFamily: 'monospace', color: '#aaaacc',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    back.on('pointerover', () => back.setColor('#ffffff'));
    back.on('pointerout',  () => back.setColor('#aaaacc'));
    back.on('pointerdown', () => { SFX.menu_select(); this.scene.start(SCENES.MENU); });
    this.input.keyboard.once('keydown-ESC', () => this.scene.start(SCENES.MENU));

    this._refresh();
  }

  _refresh() {
    this._contentGroup.clear(true, true);
    const { width } = this.scale;
    const { tabLocal, tabGlobal, tabQuests } = this._tabs;
    tabLocal.setColor( this._tab === 'local'  ? '#ffd700' : '#aaaaaa');
    tabGlobal.setColor(this._tab === 'global' ? '#ffd700' : '#aaaaaa');
    tabQuests.setColor(this._tab === 'quests' ? '#ffd700' : '#aaaaaa');

    if (this._tab === 'local')  this._renderLocal(width);
    if (this._tab === 'global') this._renderGlobal(width);
    if (this._tab === 'quests') this._renderQuests(width);
  }

  _renderLocal(width) {
    const lb = SaveSystem.getLeaderboard();
    this._add(this.add.text(width / 2, 28, 'LOCAL TOP 10', { fontSize: '8px', fontFamily: 'monospace', color: '#ffffff' }).setOrigin(0.5));

    if (lb.length === 0) {
      this._add(this.add.text(width / 2, 100, 'No scores yet!\nPlay a level to get started.', { fontSize: '8px', fontFamily: 'monospace', color: '#666688', align: 'center' }).setOrigin(0.5));
      return;
    }
    const medals = ['🥇','🥈','🥉'];
    lb.forEach((entry, i) => {
      const y = 42 + i * 18;
      const color = i === 0 ? '#ffd700' : i === 1 ? '#cccccc' : i === 2 ? '#cc9966' : '#aaaacc';
      this._add(this.add.text(20, y, i < 3 ? medals[i] : `${i+1}.`, { fontSize: '7px', fontFamily: 'monospace', color }));
      this._add(this.add.text(50, y, entry.name, { fontSize: '7px', fontFamily: 'monospace', color: '#ffffff' }));
      this._add(this.add.text(width - 20, y, entry.score.toLocaleString(), { fontSize: '7px', fontFamily: 'monospace', color }).setOrigin(1, 0));
      this._add(this.add.text(width / 2, y, entry.date, { fontSize: '5px', fontFamily: 'monospace', color: '#555577' }).setOrigin(0.5, 0));
    });
  }

  async _renderGlobal(width) {
    this._add(this.add.text(width / 2, 28, 'GLOBAL TOP 10', { fontSize: '8px', fontFamily: 'monospace', color: '#ffffff' }).setOrigin(0.5));

    if (!SupabaseLeaderboard.isConfigured()) {
      this._add(this.add.text(width / 2, 80,
        'Global leaderboard disabled.\nAdd Supabase credentials\nto .env.local to enable.', {
          fontSize: '7px', fontFamily: 'monospace', color: '#666688', align: 'center',
        }).setOrigin(0.5));
      this._add(this.add.text(width / 2, 120, 'See .env.example for setup instructions.', {
        fontSize: '6px', fontFamily: 'monospace', color: '#445544',
      }).setOrigin(0.5));
      return;
    }

    const loading = this.add.text(width / 2, 80, 'Loading...', { fontSize: '8px', fontFamily: 'monospace', color: '#aaaaaa' }).setOrigin(0.5);
    this._add(loading);

    try {
      const data = await SupabaseLeaderboard.fetchTop(10);
      loading.destroy();
      if (!data || data.length === 0) {
        this._add(this.add.text(width / 2, 80, 'No global scores yet!', { fontSize: '8px', fontFamily: 'monospace', color: '#aaaaaa' }).setOrigin(0.5));
        return;
      }
      data.forEach((entry, i) => {
        const y = 42 + i * 18;
        const color = i === 0 ? '#ffd700' : '#aaaacc';
        this._add(this.add.text(20, y, `${i+1}.`, { fontSize: '7px', fontFamily: 'monospace', color }));
        this._add(this.add.text(50, y, entry.name, { fontSize: '7px', fontFamily: 'monospace', color: '#ffffff' }));
        this._add(this.add.text(width - 20, y, entry.score.toLocaleString(), { fontSize: '7px', fontFamily: 'monospace', color }).setOrigin(1, 0));
      });
    } catch {
      loading.setText('Failed to load.').setColor('#ff6666');
    }
  }

  _renderQuests(width) {
    this._add(this.add.text(width / 2, 28, 'QUEST LOG', { fontSize: '8px', fontFamily: 'monospace', color: '#ffffff' }).setOrigin(0.5));
    const done = QuestSystem.completedCount();
    this._add(this.add.text(width / 2, 40, `Completed: ${done}/12`, { fontSize: '6px', fontFamily: 'monospace', color: '#aaffaa' }).setOrigin(0.5));

    QuestSystem.getAllProgress().forEach((q, i) => {
      const row = Math.floor(i / 2);
      const col = i % 2;
      const x = col === 0 ? width * 0.25 : width * 0.75;
      const y = 52 + row * 22;
      const color = q.done ? '#55ff55' : '#aaaacc';
      const pct = q.done ? '✓' : `${Math.min(q.progress, q.target)}/${q.target}`;
      this._add(this.add.text(x, y, `${q.icon} ${q.name}`, { fontSize: '5px', fontFamily: 'monospace', color }).setOrigin(0.5));
      this._add(this.add.text(x, y + 8, pct, { fontSize: '5px', fontFamily: 'monospace', color }).setOrigin(0.5));
    });

    // Daily challenge record
    const dKey = getDailySaveKey();
    const prog = SaveSystem.get('questProgress') || {};
    const dailyEntry = prog[dKey];
    if (dailyEntry) {
      this._add(this.add.text(width / 2, 228, `Today's Daily Best: ${dailyEntry.score?.toLocaleString() || '-'}`, {
        fontSize: '6px', fontFamily: 'monospace', color: '#ff8800',
      }).setOrigin(0.5));
    }
  }

  _add(obj) { this._contentGroup.add(obj); return obj; }
}
