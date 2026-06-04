import Phaser from 'phaser';
import { GAME_W, GAME_H } from './config.js';
import BootScene from './scenes/BootScene.js';
import MainMenuScene from './scenes/MainMenuScene.js';
import WorldMapScene from './scenes/WorldMapScene.js';
import GameScene from './scenes/GameScene.js';
import UIScene from './scenes/UIScene.js';
import PauseScene from './scenes/PauseScene.js';
import LevelCompleteScene from './scenes/LevelCompleteScene.js';
import GameOverScene from './scenes/GameOverScene.js';
import LeaderboardScene from './scenes/LeaderboardScene.js';
import DailyChallengeScene from './scenes/DailyChallengeScene.js';

const config = {
  type: Phaser.AUTO,
  width: GAME_W,
  height: GAME_H,
  parent: 'game-container',
  backgroundColor: '#0d0d1a',
  pixelArt: true,
  antialias: false,
  // Text rendered with canvas API uses its own antialiasing (unaffected by pixelArt:true)
  // so fonts always look sharp regardless of this setting
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 900 }, debug: false },
  },
  input: { gamepad: true },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_W,
    height: GAME_H,
  },
  scene: [
    BootScene, MainMenuScene, WorldMapScene,
    GameScene, UIScene, PauseScene,
    LevelCompleteScene, GameOverScene,
    LeaderboardScene, DailyChallengeScene,
  ],
};

// Wait for Press Start 2P to load before Phaser renders any text
// This prevents a brief flash of incorrect font on first render
async function start() {
  try {
    await document.fonts.load('16px "Press Start 2P"');
  } catch { /* font CDN unreachable — fall back to monospace, game still works */ }
  new Phaser.Game(config);
}

start();
