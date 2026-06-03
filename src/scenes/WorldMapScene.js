import { SCENES, WORLDS, LEVELS_PER_WORLD } from '../config.js';
import { playMusic, SFX } from '../systems/AudioSystem.js';
import SaveSystem from '../systems/SaveSystem.js';
import QuestSystem from '../systems/QuestSystem.js';

const WORLD_COLORS = [0x5c94fc, 0xffcc44, 0x99ccff];
const WORLD_NAMES  = ['GRASSY PLAINS', 'SCORCHING DESERT', 'FROZEN PEAKS'];

export default class WorldMapScene extends Phaser.Scene {
  constructor() { super({ key: SCENES.WORLDMAP }); }

  init(data) {
    this._selectedWorld = data.world || 1;
    this._selectedLevel = data.level || 1;
  }

  create() {
    const { width, height } = this.scale;
    this.add.rectangle(width / 2, height / 2, width, height, 0x0d0d1a);

    this.add.text(width / 2, 14, 'SELECT LEVEL', {
      fontSize: '10px', fontFamily: 'monospace', color: '#ffd700',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5);

    this._worldPanels = [];
    this._levelDots = [];
    this._renderWorlds(width, height);
    this._renderLevelSelect(width, height);

    // Back button
    const back = this.add.text(10, 10, '< BACK', {
      fontSize: '7px', fontFamily: 'monospace', color: '#aaaaaa',
    }).setInteractive();
    back.on('pointerdown', () => { SFX.menu_select(); this.scene.start(SCENES.MENU); });

    // Keyboard
    this._keys = this.input.keyboard.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.LEFT,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      up: Phaser.Input.Keyboard.KeyCodes.UP,
      down: Phaser.Input.Keyboard.KeyCodes.DOWN,
      enter: Phaser.Input.Keyboard.KeyCodes.ENTER,
      esc: Phaser.Input.Keyboard.KeyCodes.ESC,
    });

    // Quest progress
    const doneCount = QuestSystem.completedCount();
    this.add.text(width - 8, height - 10, `Quests: ${doneCount}/12`, {
      fontSize: '6px', fontFamily: 'monospace', color: '#aaffaa',
    }).setOrigin(1, 1);

    playMusic('menu');
    this._refreshHighlight();
  }

  _renderWorlds(width, height) {
    for (let w = 0; w < WORLDS; w++) {
      const wx = 50 + w * 130;
      const wy = 50;

      const panel = this.add.rectangle(wx, wy, 110, 30, WORLD_COLORS[w], 0.8)
        .setStrokeStyle(2, 0xffffff).setInteractive();
      const label = this.add.text(wx, wy, `W${w + 1}: ${WORLD_NAMES[w]}`, {
        fontSize: '6px', fontFamily: 'monospace', color: '#ffffff',
      }).setOrigin(0.5);

      // Stars for this world
      let totalStars = 0;
      for (let l = 1; l <= LEVELS_PER_WORLD; l++) {
        totalStars += SaveSystem.getLevel(w + 1, l).stars || 0;
      }
      this.add.text(wx, wy + 12, '⭐'.repeat(Math.min(totalStars, 5)), {
        fontSize: '6px', fontFamily: 'monospace', color: '#ffd700',
      }).setOrigin(0.5);

      const worldIdx = w + 1;
      panel.on('pointerdown', () => {
        this._selectedWorld = worldIdx;
        this._selectedLevel = 1;
        this._renderLevelSelect(this.scale.width, this.scale.height);
        this._refreshHighlight();
        SFX.menu_move();
      });

      this._worldPanels.push({ panel, label, world: worldIdx });
    }
  }

  _renderLevelSelect(width, height) {
    this._levelDots.forEach(d => d.container?.destroy());
    this._levelDots = [];

    const world = this._selectedWorld;
    const startX = 40;
    const spacing = (width - 80) / (LEVELS_PER_WORLD - 1);
    const y = 150;

    // Path line
    const g = this.add.graphics();
    g.lineStyle(3, 0x444466, 1);
    g.beginPath();
    g.moveTo(startX, y);
    g.lineTo(startX + spacing * (LEVELS_PER_WORLD - 1), y);
    g.strokePath();

    for (let l = 1; l <= LEVELS_PER_WORLD; l++) {
      const x = startX + (l - 1) * spacing;
      const unlocked = SaveSystem.isLevelUnlocked(world, l);
      const prog = SaveSystem.getLevel(world, l);
      const stars = prog.stars || 0;

      const container = this.add.container(x, y);

      const dot = this.add.circle(0, 0, 14, unlocked ? WORLD_COLORS[world - 1] : 0x333355)
        .setStrokeStyle(2, unlocked ? 0xffffff : 0x555577);
      container.add(dot);

      const numTxt = this.add.text(0, 0, l === 5 ? '!' : `${l}`, {
        fontSize: '8px', fontFamily: 'monospace',
        color: unlocked ? '#ffffff' : '#555577',
      }).setOrigin(0.5);
      container.add(numTxt);

      // Stars below dot
      if (stars > 0) {
        const starTxt = this.add.text(0, 18, '★'.repeat(stars), {
          fontSize: '6px', fontFamily: 'monospace', color: '#ffd700',
        }).setOrigin(0.5);
        container.add(starTxt);
      }

      const levelName = this._getLevelName(world, l);
      const nameTxt = this.add.text(0, -22, levelName, {
        fontSize: '5px', fontFamily: 'monospace', color: '#aaaacc',
      }).setOrigin(0.5);
      container.add(nameTxt);

      if (unlocked) {
        dot.setInteractive(new Phaser.Geom.Circle(0, 0, 14), Phaser.Geom.Circle.Contains);
        dot.on('pointerover', () => { this._selectedLevel = l; this._refreshHighlight(); });
        dot.on('pointerdown', () => { this._selectedLevel = l; this._startLevel(); });
      }

      this._levelDots.push({ container, dot, level: l, unlocked });
    }

    // Info panel
    if (this._infoPanel) this._infoPanel.destroy();
    const prog = SaveSystem.getLevel(world, this._selectedLevel);
    const bt = prog.bestTime ? `Best: ${prog.bestTime.toFixed(1)}s` : '';
    this._infoPanel = this.add.text(width / 2, 210, bt, {
      fontSize: '6px', fontFamily: 'monospace', color: '#aaffaa',
    }).setOrigin(0.5);
  }

  _getLevelName(world, level) {
    const names = {
      '1-1': 'First Steps', '1-2': 'Underground Caves', '1-3': 'Rolling Hills',
      '1-4': 'Sky Tower', '1-5': 'Storm Keep',
      '2-1': 'Scorching Dunes', '2-2': 'Desert Ruins', '2-3': 'Pyramid Peril',
      '2-4': 'Mirage Falls', '2-5': "Pharaoh's Tomb",
      '3-1': 'Frostbite Fields', '3-2': 'Blizzard Pass', '3-3': 'Crystal Cavern',
      '3-4': 'Glacier Gauntlet', '3-5': 'The Frozen King',
    };
    return names[`${world}-${level}`] || `Level ${level}`;
  }

  _refreshHighlight() {
    this._levelDots.forEach(({ container, dot, level }) => {
      const selected = level === this._selectedLevel;
      container.setScale(selected ? 1.3 : 1);
    });
    this._worldPanels.forEach(({ panel, world }) => {
      panel.setStrokeStyle(world === this._selectedWorld ? 3 : 2,
        world === this._selectedWorld ? 0xffd700 : 0xffffff);
    });
  }

  _startLevel() {
    if (!SaveSystem.isLevelUnlocked(this._selectedWorld, this._selectedLevel)) return;
    SFX.menu_select();
    this.scene.start(SCENES.GAME, {
      world: this._selectedWorld,
      level: this._selectedLevel,
    });
  }

  update() {
    const k = this._keys;
    if (Phaser.Input.Keyboard.JustDown(k.right)) {
      const next = Math.min(this._selectedLevel + 1, LEVELS_PER_WORLD);
      if (SaveSystem.isLevelUnlocked(this._selectedWorld, next)) {
        this._selectedLevel = next;
        this._refreshHighlight();
        SFX.menu_move();
      }
    }
    if (Phaser.Input.Keyboard.JustDown(k.left)) {
      const prev = Math.max(this._selectedLevel - 1, 1);
      this._selectedLevel = prev;
      this._refreshHighlight();
      SFX.menu_move();
    }
    if (Phaser.Input.Keyboard.JustDown(k.enter)) this._startLevel();
    if (Phaser.Input.Keyboard.JustDown(k.esc)) {
      SFX.menu_select();
      this.scene.start(SCENES.MENU);
    }
  }
}
