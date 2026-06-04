import { SCENES, FONT } from '../config.js';
import { generateAllTextures, generateIconCanvas } from '../graphics/TextureGenerator.js';
import { initAudio } from '../systems/AudioSystem.js';
import SaveSystem from '../systems/SaveSystem.js';

export default class BootScene extends Phaser.Scene {
  constructor() { super({ key: SCENES.BOOT }); }

  create() {
    SaveSystem.load();
    initAudio();
    generateAllTextures(this);
    this._generateIcons();

    const { width, height } = this.scale;
    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a2e);

    this.add.text(width / 2, height / 2 - 24, 'PIXELRIFT', {
      fontSize: '28px', fontFamily: FONT,
      color: '#ffd700', stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5);

    const sub = this.add.text(width / 2, height / 2 + 14, 'Leap. Explore. Conquer.', {
      fontSize: '10px', fontFamily: FONT, color: '#aaaaff',
    }).setOrigin(0.5);

    this.tweens.add({ targets: sub, alpha: 0, duration: 400, yoyo: true, repeat: 3 });
    this.time.delayedCall(1400, () => this.scene.start(SCENES.MENU));
  }

  _generateIcons() {
    try {
      [192, 512].forEach(size => {
        const canvas = generateIconCanvas(size);
        const url = canvas.toDataURL('image/png');
        let link = document.querySelector(`link[sizes="${size}x${size}"]`);
        if (!link) {
          link = document.createElement('link');
          link.rel = 'apple-touch-icon';
          link.sizes = `${size}x${size}`;
          document.head.appendChild(link);
        }
        link.href = url;
      });
    } catch { /* non-critical */ }
  }
}
