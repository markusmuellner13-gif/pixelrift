import SaveSystem from './SaveSystem.js';

export const QUESTS = [
  {
    id: 'first_jump',
    name: 'First Steps',
    desc: 'Jump for the first time',
    icon: '⬆',
    target: 1,
    stat: 'totalJumps',
    reward: { lives: 1 },
  },
  {
    id: 'coin_collector',
    name: 'Coin Collector',
    desc: 'Collect 100 coins total',
    icon: '🟡',
    target: 100,
    stat: 'totalCoinsEver',
    reward: { score: 5000 },
  },
  {
    id: 'enemy_stomper',
    name: 'Boot Camp',
    desc: 'Stomp 50 enemies',
    icon: '👟',
    target: 50,
    stat: 'totalEnemiesStomped',
    reward: { lives: 2 },
  },
  {
    id: 'speed_runner',
    name: 'Speed Demon',
    desc: 'Complete any level in under 60 seconds',
    icon: '⚡',
    target: 1,
    stat: 'fastFinishes',
    reward: { score: 10000 },
  },
  {
    id: 'no_damage',
    name: 'Untouchable',
    desc: 'Complete any level without getting hit',
    icon: '🛡',
    target: 1,
    stat: 'noDamageFinishes',
    reward: { lives: 3 },
  },
  {
    id: 'world1_done',
    name: 'Grasslands Conqueror',
    desc: 'Complete all World 1 levels',
    icon: '🌿',
    target: 5,
    stat: 'world1Levels',
    reward: { score: 20000 },
  },
  {
    id: 'world2_done',
    name: 'Desert Storm',
    desc: 'Complete all World 2 levels',
    icon: '🏜',
    target: 5,
    stat: 'world2Levels',
    reward: { score: 30000 },
  },
  {
    id: 'world3_done',
    name: 'Frozen Peak',
    desc: 'Complete all World 3 levels',
    icon: '❄',
    target: 5,
    stat: 'world3Levels',
    reward: { score: 50000, lives: 5 },
  },
  {
    id: 'combo_king',
    name: 'Combo King',
    desc: 'Stomp 4 enemies in a row without touching the ground',
    icon: '🔥',
    target: 1,
    stat: 'maxComboReached4',
    reward: { score: 15000 },
  },
  {
    id: 'star_chaser',
    name: 'Star Chaser',
    desc: 'Collect 10 star power-ups',
    icon: '⭐',
    target: 10,
    stat: 'starsCollected',
    reward: { score: 8000 },
  },
  {
    id: 'death_wish',
    name: 'Never Give Up',
    desc: 'Die 10 times and keep playing',
    icon: '💀',
    target: 10,
    stat: 'totalDeaths',
    reward: { lives: 2 },
  },
  {
    id: 'true_champion',
    name: 'True Champion',
    desc: 'Get 3 stars on every level',
    icon: '👑',
    target: 1,
    stat: 'allThreeStars',
    reward: { score: 100000 },
  },
];

export const QuestSystem = {
  _listeners: [],

  onComplete(fn) { this._listeners.push(fn); },

  check(statName, value) {
    QUESTS.forEach(q => {
      if (q.stat !== statName) return;
      const prog = SaveSystem.get('questProgress') || {};
      if (prog[q.id]?.done) return;

      const current = SaveSystem.get(statName) || 0;
      const progress = Math.min(current, q.target);

      if (!prog[q.id]) prog[q.id] = { progress: 0, done: false };
      prog[q.id].progress = progress;

      if (progress >= q.target) {
        prog[q.id].done = true;
        this._listeners.forEach(fn => fn(q));
      }

      SaveSystem.set('questProgress', prog);
    });
  },

  getProgress(questId) {
    const prog = SaveSystem.get('questProgress') || {};
    const q = QUESTS.find(x => x.id === questId);
    if (!q) return null;
    return {
      ...q,
      progress: prog[questId]?.progress || 0,
      done: prog[questId]?.done || false,
    };
  },

  getAllProgress() {
    return QUESTS.map(q => this.getProgress(q.id));
  },

  completedCount() {
    return this.getAllProgress().filter(q => q.done).length;
  },

  // Call after level complete
  onLevelComplete(world, level, time, damageTaken, stomp4Combo) {
    // World progress
    const wpKey = `world${world}Levels`;
    SaveSystem.incrementStat(wpKey);
    this.check(wpKey, SaveSystem.get(wpKey));

    // Speed run
    if (time < 60) {
      SaveSystem.incrementStat('fastFinishes');
      this.check('fastFinishes', SaveSystem.get('fastFinishes'));
    }

    // No damage
    if (!damageTaken) {
      SaveSystem.incrementStat('noDamageFinishes');
      this.check('noDamageFinishes', SaveSystem.get('noDamageFinishes'));
    }

    // Combo 4
    if (stomp4Combo) {
      SaveSystem.incrementStat('maxComboReached4');
      this.check('maxComboReached4', 1);
    }

    // Check all 3-stars
    this._checkAllThreeStars();
    SaveSystem.save();
  },

  _checkAllThreeStars() {
    const prog = SaveSystem.get('levelProgress') || {};
    let all = true;
    for (let w = 1; w <= 3; w++) {
      for (let l = 1; l <= 5; l++) {
        const p = prog[`${w}-${l}`];
        if (!p || p.stars < 3) { all = false; break; }
      }
      if (!all) break;
    }
    if (all) {
      SaveSystem.incrementStat('allThreeStars');
      this.check('allThreeStars', 1);
    }
  },

  trackStat(stat, increment = 1) {
    SaveSystem.incrementStat(stat, increment);
    this.check(stat, SaveSystem.get(stat));
  },
};

export default QuestSystem;
