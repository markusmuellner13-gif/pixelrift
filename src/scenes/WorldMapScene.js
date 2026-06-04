import { SCENES, LEVELS_PER_WORLD, FONT } from '../config.js';
import { playMusic, SFX } from '../systems/AudioSystem.js';
import SaveSystem from '../systems/SaveSystem.js';
import QuestSystem from '../systems/QuestSystem.js';

const WORLD_COLORS = [0x5c94fc, 0xffcc44, 0x99ccff, 0x8800ff];
const WORLD_NAMES  = ['GRASSY PLAINS', 'SCORCHING DESERT', 'FROZEN PEAKS', 'STAR DIMENSION'];

function world4Unlocked() {
  for (let w = 1; w <= 3; w++) {
    for (let l = 1; l <= 5; l++) {
      if ((SaveSystem.getLevel(w, l).stars || 0) < 3) return false;
    }
  }
  return true;
}

export default class WorldMapScene extends Phaser.Scene {
  constructor() { super({ key: SCENES.WORLDMAP }); }

  init(data) {
    this._selectedWorld = data.world || 1;
    this._selectedLevel = data.level || 1;
  }

  create() {
    const { width, height } = this.scale;
    this.add.rectangle(width / 2, height / 2, width, height, 0x0d0d1a);
    // Stars
    for (let i = 0; i < 60; i++) {
      this.add.image(Phaser.Math.Between(0, width), Phaser.Math.Between(0, height), 'star_twinkle')
        .setAlpha(Math.random() * 0.4 + 0.1);
    }

    this.add.text(width / 2, 10, 'SELECT LEVEL', {
      fontSize: '13px', fontFamily: FONT,
      color: '#ffd700', stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5);

    this._worldPanels = [];
    this._levelDots   = [];
    this._w4unlocked  = world4Unlocked();
    this._renderWorlds(width, height);
    this._renderLevelSelect(width, height);

    // Back
    const back = this.add.text(10, 8, '< BACK', {
      fontSize: '9px', fontFamily: FONT, color: '#aaaaaa',
    }).setInteractive({ useHandCursor: true });
    back.on('pointerover', () => back.setColor('#ffffff'));
    back.on('pointerout',  () => back.setColor('#aaaaaa'));
    back.on('pointerdown', () => { SFX.menu_select(); this.scene.start(SCENES.MENU); });

    // Quest count
    const doneCount = QuestSystem.completedCount();
    this.add.text(width - 8, height - 8, `QUESTS: ${doneCount}/12`, {
      fontSize: '8px', fontFamily: FONT, color: '#aaffaa',
    }).setOrigin(1, 1);

    // World 4 teaser
    if (!this._w4unlocked) {
      this.add.text(width / 2, height - 18, '★ 3-STAR ALL LEVELS TO UNLOCK STAR DIMENSION', {
        fontSize: '7px', fontFamily: FONT, color: '#8844aa',
      }).setOrigin(0.5, 1);
    }

    // Keyboard nav
    this._keys = this.input.keyboard.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.LEFT,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      up: Phaser.Input.Keyboard.KeyCodes.UP,
      down: Phaser.Input.Keyboard.KeyCodes.DOWN,
      enter: Phaser.Input.Keyboard.KeyCodes.ENTER,
      esc: Phaser.Input.Keyboard.KeyCodes.ESC,
    });

    playMusic('menu');
    this._refreshHighlight();
  }

  _renderWorlds(width, height) {
    const totalWorlds = this._w4unlocked ? 4 : 3;
    const spacing = (width - 40) / totalWorlds;

    for (let w = 0; w < totalWorlds; w++) {
      const wx = 20 + spacing * w + spacing / 2;
      const wy = 44;

      const panel = this.add.rectangle(wx, wy, spacing - 8, 28, WORLD_COLORS[w], 0.85)
        .setStrokeStyle(2, 0xffffff).setInteractive({ useHandCursor: true });

      this.add.text(wx, wy - 5, `W${w + 1}`, {
        fontSize: '10px', fontFamily: FONT, color: '#ffffff',
      }).setOrigin(0.5);

      this.add.text(wx, wy + 7, WORLD_NAMES[w].substring(0, 12), {
        fontSize: '6px', fontFamily: FONT, color: '#ffffff',
      }).setOrigin(0.5);

      const worldIdx = w + 1;
      panel.on('pointerdown', () => {
        this._selectedWorld = worldIdx;
        this._selectedLevel = 1;
        this._renderLevelSelect(this.scale.width, this.scale.height);
        this._refreshHighlight();
        SFX.menu_move();
      });
      this._worldPanels.push({ panel, world: worldIdx });
    }
  }

  _renderLevelSelect(width, height) {
    this._levelDots.forEach(d => d.container?.destroy());
    this._levelDots = [];

    const world   = this._selectedWorld;
    const startX  = 30;
    const spacing = (width - 60) / (LEVELS_PER_WORLD - 1);
    const y       = 130;

    // Path
    const g = this.add.graphics();
    g.lineStyle(3, 0x333355, 1);
    g.beginPath();
    g.moveTo(startX, y);
    g.lineTo(startX + spacing * (LEVELS_PER_WORLD - 1), y);
    g.strokePath();

    for (let l = 1; l <= LEVELS_PER_WORLD; l++) {
      const x        = startX + (l - 1) * spacing;
      const unlocked = SaveSystem.isLevelUnlocked(world, l);
      const prog     = SaveSystem.getLevel(world, l);
      const stars    = prog.stars || 0;

      const container = this.add.container(x, y);
      const dotColor  = l === 5 ? 0xaa2222 : WORLD_COLORS[world - 1];
      const dot = this.add.circle(0, 0, 16, unlocked ? dotColor : 0x222244)
        .setStrokeStyle(2, unlocked ? 0xffffff : 0x444466);
      container.add(dot);

      const label = l === 5 ? '!' : `${l}`;
      container.add(this.add.text(0, 0, label, {
        fontSize: '10px', fontFamily: FONT, color: unlocked ? '#ffffff' : '#444466',
      }).setOrigin(0.5));

      // Stars
      if (stars > 0) {
        container.add(this.add.text(0, 22, '★'.repeat(stars), {
          fontSize: '8px', fontFamily: FONT, color: '#ffd700',
        }).setOrigin(0.5));
      }

      // Level name above dot
      container.add(this.add.text(0, -26, this._getLevelName(world, l), {
        fontSize: '6px', fontFamily: FONT, color: '#aaaacc',
      }).setOrigin(0.5));

      if (unlocked) {
        dot.setInteractive(new Phaser.Geom.Circle(0, 0, 16), Phaser.Geom.Circle.Contains);
        dot.on('pointerover', () => { this._selectedLevel = l; this._refreshHighlight(); });
        dot.on('pointerdown', () => { this._selectedLevel = l; this._startLevel(); });
      }
      this._levelDots.push({ container, dot, level: l, unlocked });
    }

    // Info panel
    this._infoPanel?.destroy();
    const prog = SaveSystem.getLevel(world, this._selectedLevel);
    const bt   = prog.bestTime ? `BEST: ${prog.bestTime.toFixed(1)}s` : '';
    this._infoPanel = this.add.text(width / 2, 195, bt, {
      fontSize: '8px', fontFamily: FONT, color: '#aaffaa',
    }).setOrigin(0.5);
  }

  _getLevelName(world, level) {
    const names = {
      '1-1':'FIRST STEPS','1-2':'CAVE','1-3':'ROLLING HILLS','1-4':'SKY TOWER','1-5':'STORM KEEP',
      '2-1':'DUNES','2-2':'RUINS','2-3':'PYRAMID','2-4':'MIRAGE','2-5':'PHARAOH',
      '3-1':'FROSTBITE','3-2':'BLIZZARD','3-3':'CRYSTAL','3-4':'GLACIER','3-5':'FROZEN KING',
      '4-1':'HORIZON','4-2':'NEBULA','4-3':'CORE','4-4':'SINGULARITY','4-5':'VOID LORD',
    };
    return names[`${world}-${level}`] || `L${level}`;
  }

  _refreshHighlight() {
    this._levelDots.forEach(({ container, level }) => {
      container.setScale(level === this._selectedLevel ? 1.3 : 1);
    });
    this._worldPanels.forEach(({ panel, world }) => {
      panel.setStrokeStyle(world === this._selectedWorld ? 3 : 1.5,
        world === this._selectedWorld ? 0xffd700 : 0xffffff);
    });
  }

  _startLevel() {
    if (!SaveSystem.isLevelUnlocked(this._selectedWorld, this._selectedLevel)) return;
    SFX.menu_select();
    this.scene.start(SCENES.GAME, { world: this._selectedWorld, level: this._selectedLevel });
  }

  update() {
    const k = this._keys;
    if (Phaser.Input.Keyboard.JustDown(k.right)) {
      const next = Math.min(this._selectedLevel + 1, LEVELS_PER_WORLD);
      if (SaveSystem.isLevelUnlocked(this._selectedWorld, next)) {
        this._selectedLevel = next; this._refreshHighlight(); SFX.menu_move();
      }
    }
    if (Phaser.Input.Keyboard.JustDown(k.left)) {
      this._selectedLevel = Math.max(this._selectedLevel - 1, 1);
      this._refreshHighlight(); SFX.menu_move();
    }
    if (Phaser.Input.Keyboard.JustDown(k.enter)) this._startLevel();
    if (Phaser.Input.Keyboard.JustDown(k.esc))  { SFX.menu_select(); this.scene.start(SCENES.MENU); }
  }
}
