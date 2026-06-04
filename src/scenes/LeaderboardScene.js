import { SCENES, FONT } from '../config.js';
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
    const tabLocal  = this.add.text(width * 0.22, 12, 'LOCAL',  { fontSize: '9px', fontFamily: FONT, color: '#ffd700' }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    const tabGlobal = this.add.text(width * 0.50, 12, 'GLOBAL', { fontSize: '9px', fontFamily: FONT, color: '#aaaaaa' }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    const tabQuests = this.add.text(width * 0.78, 12, 'QUESTS', { fontSize: '9px', fontFamily: FONT, color: '#aaaaaa' }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this._tabs = { tabLocal, tabGlobal, tabQuests };

    tabLocal.on('pointerdown',  () => { this._tab = 'local';  this._refresh(); SFX.menu_move(); });
    tabGlobal.on('pointerdown', () => { this._tab = 'global'; this._refresh(); SFX.menu_move(); });
    tabQuests.on('pointerdown', () => { this._tab = 'quests'; this._refresh(); SFX.menu_move(); });

    const back = this.add.text(width / 2, height - 12, '< BACK TO MENU', {
      fontSize: '9px', fontFamily: FONT, color: '#aaaacc',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    back.on('pointerover', () => back.setColor('#ffffff'));
    back.on('pointerout',  () => back.setColor('#aaaacc'));
    back.on('pointerdown', () => { SFX.menu_select(); this.scene.start(SCENES.MENU); });

    this.input.keyboard.once('keydown-ESC', () => this.scene.start(SCENES.MENU));

    // Divider below tabs
    this.add.rectangle(width / 2, 24, width - 20, 1, 0x333355);

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
    this._add(this.add.text(width / 2, 32, 'TOP 10 LOCAL SCORES', {
      fontSize: '10px', fontFamily: FONT, color: '#ffffff',
    }).setOrigin(0.5));

    if (lb.length === 0) {
      this._add(this.add.text(width / 2, 110, 'NO SCORES YET!\nPLAY A LEVEL TO START.', {
        fontSize: '9px', fontFamily: FONT, color: '#666688', align: 'center',
      }).setOrigin(0.5));
      return;
    }

    const medals = ['🥇', '🥈', '🥉'];
    lb.forEach((entry, i) => {
      const y     = 48 + i * 19;
      const color = i === 0 ? '#ffd700' : i === 1 ? '#cccccc' : i === 2 ? '#cc9966' : '#aaaacc';
      this._add(this.add.text(16, y, i < 3 ? medals[i] : `${i+1}.`, { fontSize: '8px', fontFamily: FONT, color }));
      this._add(this.add.text(50, y, entry.name,  { fontSize: '8px', fontFamily: FONT, color: '#ffffff' }));
      this._add(this.add.text(width - 16, y, entry.score.toLocaleString(), { fontSize: '8px', fontFamily: FONT, color }).setOrigin(1, 0));
      this._add(this.add.text(width / 2, y + 9, entry.date, { fontSize: '6px', fontFamily: FONT, color: '#444466' }).setOrigin(0.5, 0));
    });
  }

  async _renderGlobal(width) {
    this._add(this.add.text(width / 2, 32, 'GLOBAL TOP 10', {
      fontSize: '10px', fontFamily: FONT, color: '#ffffff',
    }).setOrigin(0.5));

    if (!SupabaseLeaderboard.isConfigured()) {
      this._add(this.add.text(width / 2, 90,
        'GLOBAL LEADERBOARD DISABLED', {
          fontSize: '9px', fontFamily: FONT, color: '#666688', align: 'center',
        }).setOrigin(0.5));
      this._add(this.add.text(width / 2, 115,
        'Add Supabase credentials to\n.env.local to enable global\nonline rankings.', {
          fontSize: '8px', fontFamily: FONT, color: '#445544', align: 'center',
        }).setOrigin(0.5));
      return;
    }

    const loading = this.add.text(width / 2, 90, 'LOADING...', {
      fontSize: '10px', fontFamily: FONT, color: '#aaaaaa',
    }).setOrigin(0.5);
    this._add(loading);

    try {
      const data = await SupabaseLeaderboard.fetchTop(10);
      loading.destroy();
      if (!data || data.length === 0) {
        this._add(this.add.text(width / 2, 90, 'NO GLOBAL SCORES YET!', { fontSize: '10px', fontFamily: FONT, color: '#aaaaaa' }).setOrigin(0.5));
        return;
      }
      data.forEach((entry, i) => {
        const y     = 48 + i * 19;
        const color = i === 0 ? '#ffd700' : '#aaaacc';
        this._add(this.add.text(16, y, `${i+1}.`, { fontSize: '8px', fontFamily: FONT, color }));
        this._add(this.add.text(50, y, entry.name, { fontSize: '8px', fontFamily: FONT, color: '#ffffff' }));
        this._add(this.add.text(width - 16, y, entry.score.toLocaleString(), { fontSize: '8px', fontFamily: FONT, color }).setOrigin(1, 0));
      });
    } catch {
      loading.setText('FAILED TO LOAD').setColor('#ff6666');
    }
  }

  _renderQuests(width) {
    this._add(this.add.text(width / 2, 32, 'QUEST LOG', {
      fontSize: '10px', fontFamily: FONT, color: '#ffffff',
    }).setOrigin(0.5));

    const done = QuestSystem.completedCount();
    this._add(this.add.text(width / 2, 46, `COMPLETED: ${done} / 12`, {
      fontSize: '8px', fontFamily: FONT, color: '#aaffaa',
    }).setOrigin(0.5));

    QuestSystem.getAllProgress().forEach((q, i) => {
      const row   = Math.floor(i / 2);
      const col   = i % 2;
      const x     = col === 0 ? width * 0.26 : width * 0.76;
      const y     = 60 + row * 24;
      const color = q.done ? '#55ff55' : '#aaaacc';
      const pct   = q.done ? '✓' : `${Math.min(q.progress, q.target)}/${q.target}`;
      this._add(this.add.text(x, y,      `${q.icon} ${q.name}`, { fontSize: '6px', fontFamily: FONT, color }).setOrigin(0.5));
      this._add(this.add.text(x, y + 11, pct,                   { fontSize: '7px', fontFamily: FONT, color }).setOrigin(0.5));
    });

    // Daily best
    const dKey   = getDailySaveKey();
    const prog   = SaveSystem.get('questProgress') || {};
    const dailyE = prog[dKey];
    if (dailyE) {
      this._add(this.add.text(width / 2, 236, `TODAY'S DAILY BEST: ${dailyE.score?.toLocaleString() || '-'}`, {
        fontSize: '7px', fontFamily: FONT, color: '#ff8800',
      }).setOrigin(0.5));
    }
  }

  _add(obj) { this._contentGroup.add(obj); return obj; }
}
