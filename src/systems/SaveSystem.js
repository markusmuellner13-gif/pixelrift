const KEY = 'pixelrift_save_v2';

const DEFAULT = {
  highScore: 0,
  totalCoins: 0,
  totalPlayTime: 0,
  lives: 3,
  score: 0,
  coins: 0,
  world: 1,
  level: 1,
  levelProgress: {},   // "W-L": { stars, bestTime, completed }
  questProgress: {},   // questId: { done, progress }
  settings: {
    music: true,
    sfx: true,
    controlsHint: true,
  },
  leaderboard: [],     // [{ name, score, date }]
  totalDeaths: 0,
  totalJumps: 0,
  totalCoinsEver: 0,
  totalEnemiesStomped: 0,
  // Meta-progression (v1.4)
  coinBank: 0,                 // spendable vault — every coin collected goes here
  ownedSkins: ['classic'],
  selectedSkin: 'classic',
  streak: 0,                   // consecutive days played
  lastPlayDate: null,          // local YYYY-MM-DD of last play
};

function checksum(data) {
  const str = JSON.stringify(data);
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(31, h) + str.charCodeAt(i) | 0;
  }
  return (h >>> 0).toString(16);
}

export const SaveSystem = {
  _data: null,

  load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) { this._data = structuredClone(DEFAULT); return; }
      const parsed = JSON.parse(raw);
      const { _cs, ...rest } = parsed;
      if (_cs !== checksum(rest)) {
        console.warn('Save checksum mismatch — using defaults');
        this._data = structuredClone(DEFAULT);
        return;
      }
      this._data = { ...structuredClone(DEFAULT), ...rest };
    } catch {
      this._data = structuredClone(DEFAULT);
    }
  },

  save() {
    try {
      const cs = checksum(this._data);
      localStorage.setItem(KEY, JSON.stringify({ ...this._data, _cs: cs }));
    } catch (e) {
      console.error('Save failed:', e);
    }
  },

  get(key) {
    if (!this._data) this.load();
    return this._data[key];
  },

  set(key, value) {
    if (!this._data) this.load();
    this._data[key] = value;
  },

  getLevel(world, level) {
    if (!this._data) this.load();
    return this._data.levelProgress[`${world}-${level}`] || { stars: 0, bestTime: null, completed: false };
  },

  setLevel(world, level, data) {
    if (!this._data) this.load();
    const key = `${world}-${level}`;
    const existing = this._data.levelProgress[key] || {};
    this._data.levelProgress[key] = {
      ...existing,
      ...data,
      stars: Math.max(existing.stars || 0, data.stars || 0),
      bestTime: existing.bestTime
        ? (data.bestTime ? Math.min(existing.bestTime, data.bestTime) : existing.bestTime)
        : data.bestTime,
    };
    this.save();
  },

  isLevelUnlocked(world, level) {
    if (!this._data) this.load();
    if (world === 1 && level === 1) return true;

    // World 4 requires 3-stars on all W1-3 levels
    if (world === 4) {
      let allThree = true;
      for (let w = 1; w <= 3; w++) {
        for (let l = 1; l <= 5; l++) {
          if ((this._data.levelProgress[`${w}-${l}`]?.stars || 0) < 3) { allThree = false; break; }
        }
        if (!allThree) break;
      }
      if (!allThree) return false;
      if (level === 1) return true;
      return this._data.levelProgress[`4-${level - 1}`]?.completed === true;
    }

    if (level === 1) {
      const prev = this._data.levelProgress[`${world - 1}-5`];
      return prev?.completed === true;
    }
    const prev = this._data.levelProgress[`${world}-${level - 1}`];
    return prev?.completed === true;
  },

  addHighScore(name, score) {
    if (!this._data) this.load();
    const lb = this._data.leaderboard || [];
    lb.push({ name: name || 'NOVA', score, date: new Date().toLocaleDateString() });
    lb.sort((a, b) => b.score - a.score);
    this._data.leaderboard = lb.slice(0, 10);
    if (score > (this._data.highScore || 0)) this._data.highScore = score;
    this.save();
  },

  getLeaderboard() {
    if (!this._data) this.load();
    return this._data.leaderboard || [];
  },

  updateSetting(key, value) {
    if (!this._data) this.load();
    this._data.settings[key] = value;
    this.save();
  },

  getSetting(key) {
    if (!this._data) this.load();
    return this._data.settings?.[key] ?? DEFAULT.settings[key];
  },

  incrementStat(stat, amount = 1) {
    if (!this._data) this.load();
    this._data[stat] = (this._data[stat] || 0) + amount;
  },

  reset() {
    this._data = structuredClone(DEFAULT);
    this.save();
  },
};

export default SaveSystem;
