import { SCENES } from '../config.js';
import { generateAllTextures, generateIconCanvas } from '../graphics/TextureGenerator.js';
import { initAudio } from '../systems/AudioSystem.js';
import SaveSystem from '../systems/SaveSystem.js';

export default class BootScene extends Phaser.Scene {
  constructor() { super({ key: SCENES.BOOT }); }

  create() {
    SaveSystem.load();
    initAudio();

    // Generate all game textures procedurally
    generateAllTextures(this);

    // Generate PWA icons programmatically and cache as data URLs
    this._generateIcons();

    // Show brief loading screen
    const { width, height } = this.scale;
    const bg = this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a2e);
    const logo = this.add.text(width / 2, height / 2 - 20, 'PIXELRIFT', {
      fontSize: '28px', fontFamily: 'monospace', color: '#ffd700',
      stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5);
    const sub = this.add.text(width / 2, height / 2 + 12, 'Leap. Explore. Conquer.', {
      fontSize: '8px', fontFamily: 'monospace', color: '#aaaaff',
    }).setOrigin(0.5);

    // Blink
    this.tweens.add({ targets: sub, alpha: 0, duration: 400, yoyo: true, repeat: 3 });

    this.time.delayedCall(1200, () => {
      this.scene.start(SCENES.MENU);
    });
  }

  _generateIcons() {
    try {
      const sizes = [192, 512];
      sizes.forEach(size => {
        const canvas = generateIconCanvas(size);
        const url = canvas.toDataURL('image/png');
        // Set as link element for PWA
        let link = document.querySelector(`link[sizes="${size}x${size}"]`);
        if (!link) {
          link = document.createElement('link');
          link.rel = 'apple-touch-icon';
          link.sizes = `${size}x${size}`;
          document.head.appendChild(link);
        }
        link.href = url;
      });
    } catch (e) { /* non-critical */ }
  }
}
