import { DAILY_MODIFIERS } from '../config.js';
import SaveSystem from './SaveSystem.js';

// Seeded LCG pseudo-random number generator
function seededRNG(seed) {
  let s = seed >>> 0;
  return () => {
    s = Math.imul(1664525, s) + 1013904223 >>> 0;
    return s / 0xffffffff;
  };
}

function todaySeed() {
  const d = new Date();
  return (d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate()) >>> 0;
}

export function getDailyChallenge() {
  const seed = todaySeed();
  const rand = seededRNG(seed);

  // Pick a level from World 1–3 (not boss levels 5, slightly adjusted)
  const world = Math.floor(rand() * 3) + 1;
  const level = Math.floor(rand() * 4) + 1; // 1–4 (avoid boss level for daily)

  // Pick 1–3 modifiers without repeats
  const allMods = Object.keys(DAILY_MODIFIERS);
  const numMods = 1 + Math.floor(rand() * 2); // 1 or 2 modifiers
  const chosen = [];
  const shuffled = [...allMods].sort(() => rand() - 0.5);
  for (let i = 0; i < Math.min(numMods, shuffled.length); i++) {
    chosen.push(shuffled[i]);
  }

  // Date label
  const d = new Date();
  const label = `${d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`;

  return { world, level, modifiers: chosen, seed, date: label };
}

export function getDailySaveKey() {
  const d = new Date();
  return `daily_${d.getFullYear()}_${d.getMonth() + 1}_${d.getDate()}`;
}

export function hasDoneToday() {
  const key = getDailySaveKey();
  const prog = SaveSystem.get('questProgress') || {};
  return !!prog[key];
}

export function markDoneToday(score) {
  const key = getDailySaveKey();
  const prog = SaveSystem.get('questProgress') || {};
  prog[key] = { done: true, score, date: new Date().toLocaleDateString() };
  SaveSystem.set('questProgress', prog);
  SaveSystem.save();
}

export function getTodayBest() {
  const key = getDailySaveKey();
  const prog = SaveSystem.get('questProgress') || {};
  return prog[key]?.score || 0;
}

/** Apply modifiers to a copy of a level config object */
export function applyModifiers(levelCfg, modifiers) {
  const cfg = { ...levelCfg, modifiers };
  if (modifiers.includes('speed_run')) {
    cfg.timeLimit = Math.max(60, Math.floor(levelCfg.timeLimit * 0.45));
  }
  if (modifiers.includes('coin_rush')) {
    cfg._coinScoreMultiplier = 5;
  }
  if (modifiers.includes('double_enemies')) {
    cfg._doubleEnemies = true;
  }
  if (modifiers.includes('no_powerups')) {
    cfg._noPowerups = true;
  }
  if (modifiers.includes('mirror')) {
    cfg._mirror = true;
  }
  return cfg;
}
