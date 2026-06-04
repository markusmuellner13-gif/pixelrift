// Procedural chip-tune audio engine — no external files, no copyright issues

let ctx = null;
let masterGain = null;
let musicNode = null;
let musicActive = false;
let sfxEnabled = true;
let musicEnabled = true;

function getCtx() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.4;
    masterGain.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function beep(freq, duration, type = 'square', vol = 0.3, startDelay = 0) {
  if (!sfxEnabled) return;
  const c = getCtx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(vol, c.currentTime + startDelay);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + startDelay + duration);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(c.currentTime + startDelay);
  osc.stop(c.currentTime + startDelay + duration);
}

function chord(freqs, duration, type = 'square', vol = 0.15) {
  freqs.forEach(f => beep(f, duration, type, vol));
}

// Haptic feedback helper (mobile only, silent on desktop)
export function haptic(pattern) {
  try { if (navigator?.vibrate) navigator.vibrate(pattern); } catch {}
}

// SFX library
export const SFX = {
  jump()        { beep(300,0.05); beep(500,0.1,'square',0.25,0.05); },
  coin()        { beep(988,0.04); beep(1319,0.1,'square',0.3,0.04); haptic(5); },
  powerup()     { [523,659,784,1047].forEach((f,i) => beep(f,0.1,'square',0.25,i*0.08)); haptic([30,10,30]); },
  stomp()       { beep(200,0.04,'square',0.5); beep(100,0.1,'square',0.35,0.04); haptic(18); },
  hurt()        { beep(440,0.05,'sawtooth',0.4); beep(220,0.2,'sawtooth',0.3,0.05); haptic(60); },
  death()       { [440,400,350,300,250,200,150].forEach((f,i) => beep(f,0.12,'sawtooth',0.3,i*0.07)); haptic([100,30,100]); },
  flagpole()    { [523,659,784,1047,1319].forEach((f,i) => beep(f,0.15,'square',0.3,i*0.1)); },
  levelwin()    { [784,988,1175,988,784,659,784].forEach((f,i) => beep(f,0.18,'square',0.3,i*0.12)); haptic([40,20,40,20,80]); },
  gameover()    { [440,330,220].forEach((f,i) => beep(f,0.4,'sawtooth',0.25,i*0.3)); },
  pause()       { beep(440,0.05); beep(330,0.1,'square',0.2,0.05); },
  resume()      { beep(330,0.05); beep(440,0.1,'square',0.2,0.05); },
  shoot()       { beep(800,0.03,'square',0.2); beep(400,0.06,'square',0.15,0.03); },
  break()       { beep(150,0.04,'sawtooth',0.35); beep(80,0.08,'sawtooth',0.25,0.04); },
  star_collect(){ [784,988,1175,1319,1568].forEach((f,i) => beep(f,0.08,'square',0.3,i*0.05)); haptic([20,10,20,10,20]); },
  enemy_kick()  { beep(300,0.05,'square',0.35); beep(150,0.08,'square',0.25,0.05); haptic(12); },
  checkpoint()  { beep(659,0.1); beep(784,0.15,'square',0.3,0.1); haptic([15,10,15]); },
  extra_life()  { [523,659,784,1047,784,659,523,784,1047,1319].forEach((f,i) => beep(f,0.1,'square',0.25,i*0.09)); haptic([50,20,50,20,100]); },
  menu_select() { beep(440,0.05); beep(660,0.08,'square',0.2,0.05); },
  menu_move()   { beep(330,0.04,'square',0.15); },
  // New SFX
  dash()        { beep(600,0.03,'square',0.3); beep(900,0.08,'square',0.2,0.03); haptic(15); },
  wall_jump()   { beep(400,0.04,'square',0.25); beep(600,0.08,'square',0.2,0.04); },
  crouch()      { beep(200,0.05,'square',0.15); },
  slide()       { beep(150,0.06,'sawtooth',0.12); },
  boss_hit()    { beep(180,0.08,'sawtooth',0.5); beep(90,0.15,'sawtooth',0.35,0.08); haptic([40,20,80]); },
  boss_die()    { [880,660,440,330,220].forEach((f,i) => beep(f,0.2,'sawtooth',0.4,i*0.1));
                  [1047,784,523,392,262].forEach((f,i) => beep(f,0.15,'square',0.3,i*0.12+0.05));
                  haptic([200,50,200,50,300]); },
  boss_shoot()  { beep(500,0.04,'sawtooth',0.25); beep(350,0.1,'sawtooth',0.2,0.04); },
  magnet_on()   { [440,554,659,880].forEach((f,i) => beep(f,0.08,'square',0.2,i*0.06)); },
  daily_start() { [523,587,659,698,784,880].forEach((f,i) => beep(f,0.12,'square',0.3,i*0.08)); haptic([20,10,20,10,40]); },
  combo(n)      { const f = 440 + n * 80; beep(f,0.06,'square',0.3); beep(f*1.25,0.12,'square',0.2,0.06); },
  new_best()    { [784,988,1175,1319,1568,1319,1175,988,784].forEach((f,i) => beep(f,0.1,'square',0.35,i*0.08)); haptic([30,15,30,15,60]); },
};

// Chip-tune music patterns
// Each note: [frequency, duration_in_beats]
// BPM-based sequencer

const TRACKS = {
  world1: {
    bpm: 180,
    loop: true,
    melody: [
      [659,0.5],[659,0.5],[0,0.5],[659,0.5],[0,0.5],[523,0.5],[659,1],[784,1],[392,1],
      [523,1],[392,0.5],[0,0.5],[330,0.5],[0,0.25],[440,0.75],[494,0.5],[0,0.5],[466,0.5],[440,1],
      [392,0.67],[659,0.67],[784,0.67],[880,1],[698,0.5],[784,0.5],[0,0.5],[659,1],[523,0.5],[587,0.5],[494,1],
      [523,1],[392,0.5],[0,0.5],[330,0.5],[0,0.25],[440,0.75],[494,0.5],[0,0.5],[466,0.5],[440,1],
      [392,0.67],[659,0.67],[784,0.67],[880,1],[698,0.5],[784,0.5],[0,0.5],[659,1],[523,0.5],[587,0.5],[494,1],
    ],
    bass: [
      [131,1],[131,0.5],[0,0.5],[131,1],[196,1],[131,1],[131,0.5],[0,0.5],[131,1],[196,1],
      [165,1],[165,0.5],[0,0.5],[165,1],[220,1],[165,1],[165,0.5],[0,0.5],[165,1],[220,1],
      [196,1],[196,0.5],[0,0.5],[196,1],[247,1],[196,1],[196,0.5],[0,0.5],[196,1],[247,1],
      [165,1],[165,0.5],[0,0.5],[165,1],[220,1],[165,1],[165,0.5],[0,0.5],[165,1],[220,1],
      [196,1],[196,0.5],[0,0.5],[196,1],[247,1],[196,1],[196,0.5],[0,0.5],[196,1],[247,1],
    ],
  },
  world2: {
    bpm: 160,
    loop: true,
    melody: [
      [440,0.5],[0,0.25],[440,0.25],[0,0.25],[440,0.5],[0,0.25],[349,0.5],[440,0.5],
      [0,0.25],[523,0.75],[0,0.5],[392,0.5],[0,0.5],
      [330,0.5],[0,0.25],[349,0.25],[0,0.5],[311,0.5],[330,0.5],[0,0.25],[262,0.5],[0,0.5],
      [196,0.5],[0,0.5],[196,0.5],[523,0.5],[494,0.5],[466,0.5],[440,1],
      [415,0.5],[440,1],[0,0.25],[415,0.25],[440,0.5],[0,0.25],[415,0.25],[440,0.5],[0,0.25],[440,0.5],
      [392,0.5],[440,0.5],[0,0.5],[392,0.5],[440,0.5],[0,0.25],[440,0.5],[523,0.75],[587,1],
    ],
    bass: [
      [196,1],[196,1],[165,1],[165,1],
      [131,1],[131,1],[110,1],[110,1],
      [196,1],[196,1],[165,1],[165,1],
      [131,1],[131,1],[110,1],[110,1],
    ],
  },
  world3: {
    bpm: 140,
    loop: true,
    melody: [
      [587,1],[554,0.5],[523,0.5],[494,1],[466,1],
      [440,0.5],[415,0.5],[392,1],[370,1],
      [349,1],[330,0.5],[311,0.5],[294,1],[277,1],
      [262,2],[0,2],
      [523,1],[494,0.5],[466,0.5],[440,1],[415,1],
      [392,0.5],[370,0.5],[349,1],[330,1],
      [311,1],[294,0.5],[277,0.5],[262,1],[247,1],
      [233,2],[0,2],
    ],
    bass: [
      [147,1],[147,1],[131,1],[131,1],
      [110,1],[110,1],[98,1],[98,1],
      [147,1],[147,1],[131,1],[131,1],
      [110,1],[110,1],[98,1],[98,1],
    ],
  },
  menu: {
    bpm: 120,
    loop: true,
    melody: [
      [523,1],[659,1],[784,1],[1047,1],[784,0.5],[659,0.5],[523,2],
      [440,1],[523,1],[659,1],[880,1],[659,0.5],[523,0.5],[440,2],
      [392,1],[494,1],[587,1],[784,1],[587,0.5],[494,0.5],[392,2],
      [330,1],[415,1],[494,1],[659,1],[494,0.5],[415,0.5],[330,2],
    ],
    bass: [
      [131,2],[165,2],[196,2],[165,2],
      [110,2],[131,2],[165,2],[131,2],
    ],
  },
  boss: {
    bpm: 200,
    loop: true,
    melody: [
      [880,0.25],[0,0.25],[880,0.25],[0,0.25],[880,0.25],[0,0.25],[698,0.5],[784,0.5],
      [659,0.25],[0,0.25],[659,0.25],[0,0.25],[659,0.25],[0,0.25],[554,0.5],[659,0.5],
      [523,0.25],[0,0.25],[523,0.25],[0,0.25],[523,0.25],[0,0.25],[440,0.5],[523,0.5],
      [415,0.5],[440,0.5],[0,1],[415,0.25],[0,0.25],[440,0.25],[0,0.25],[466,0.5],[440,1],
    ],
    bass: [
      [110,0.5],[110,0.5],[110,0.5],[110,0.5],[131,0.5],[131,0.5],[131,0.5],[131,0.5],
      [98,0.5],[98,0.5],[98,0.5],[98,0.5],[110,0.5],[110,0.5],[110,0.5],[110,0.5],
      [110,0.5],[110,0.5],[110,0.5],[110,0.5],[131,0.5],[131,0.5],[131,0.5],[131,0.5],
      [98,0.5],[98,0.5],[98,0.5],[98,0.5],[87,0.5],[87,0.5],[87,0.5],[87,0.5],
    ],
  },
  starmode: {
    bpm: 220, loop: true,
    melody: [
      [1319,0.25],[1175,0.25],[1047,0.25],[988,0.25],[880,0.25],[784,0.25],[698,0.25],[659,0.25],
      [1319,0.25],[1175,0.25],[1047,0.25],[988,0.25],[880,0.5],[1047,0.5],
      [1175,0.25],[1047,0.25],[988,0.25],[880,0.25],[784,0.25],[698,0.25],[659,0.25],[587,0.25],
      [1175,0.25],[1047,0.25],[988,0.25],[880,0.25],[784,0.5],[988,0.5],
    ],
    bass: [
      [196,0.5],[196,0.5],[196,0.5],[196,0.5],[165,0.5],[165,0.5],[165,0.5],[165,0.5],
      [131,0.5],[131,0.5],[131,0.5],[131,0.5],[110,0.5],[110,0.5],[110,0.5],[110,0.5],
    ],
  },
  world4: {
    bpm: 170, loop: true,
    melody: [
      [1047,0.5],[0,0.25],[880,0.5],[0,0.25],[784,0.5],[0,0.25],[698,0.5],[0,0.25],
      [784,1],[0,0.5],[698,0.5],[659,0.5],[622,0.5],[587,1],
      [523,0.5],[0,0.25],[494,0.5],[0,0.25],[440,0.5],[0,0.25],[415,0.5],[0,0.25],
      [440,1],[0,0.5],[415,0.5],[392,0.5],[370,0.5],[349,1],
      [1047,0.5],[988,0.5],[880,0.5],[784,0.5],[698,0.5],[659,0.5],[587,0.5],[523,0.5],
      [494,0.5],[466,0.5],[440,0.5],[415,0.5],[392,1],[0,1],
    ],
    bass: [
      [147,0.5],[0,0.5],[147,0.5],[0,0.5],[131,0.5],[0,0.5],[131,0.5],[0,0.5],
      [110,0.5],[0,0.5],[110,0.5],[0,0.5],[98,0.5],[0,0.5],[98,0.5],[0,0.5],
      [147,0.5],[0,0.5],[131,0.5],[0,0.5],[110,0.5],[0,0.5],[98,0.5],[0,0.5],
      [87,0.5],[0,0.5],[87,0.5],[0,0.5],[110,0.5],[0,0.5],[131,0.5],[0,0.5],
    ],
  },
  boss_hard: {
    bpm: 230, loop: true,
    melody: [
      [1047,0.25],[0,0.25],[1047,0.25],[0,0.25],[880,0.5],[1047,0.5],
      [988,0.25],[0,0.25],[988,0.25],[0,0.25],[784,0.5],[988,0.5],
      [880,0.25],[0,0.25],[880,0.25],[0,0.25],[698,0.5],[880,0.5],
      [784,0.5],[698,0.5],[0,0.5],[784,0.25],[0,0.25],[784,0.25],[0,0.25],[880,0.5],[1047,0.5],
    ],
    bass: [
      [110,0.25],[0,0.25],[110,0.25],[0,0.25],[110,0.25],[0,0.25],[131,0.5],[110,0.5],
      [98,0.25],[0,0.25],[98,0.25],[0,0.25],[98,0.25],[0,0.25],[110,0.5],[98,0.5],
      [87,0.25],[0,0.25],[87,0.25],[0,0.25],[87,0.25],[0,0.25],[98,0.5],[87,0.5],
      [73,0.5],[82,0.5],[87,0.5],[73,0.5],[82,0.5],[73,0.5],[82,0.25],[87,0.75],
    ],
  },
};

class ChipTunePlayer {
  constructor() {
    this.playing = false;
    this.timeouts = [];
    this.currentTrack = null;
  }

  play(trackName) {
    this.stop();
    if (!musicEnabled) return;
    const track = TRACKS[trackName];
    if (!track) return;
    this.currentTrack = trackName;
    this.playing = true;
    this._schedule(track);
  }

  _schedule(track) {
    if (!this.playing || !musicEnabled) return;
    const c = getCtx();
    const beatDur = 60 / track.bpm;
    let now = c.currentTime + 0.05;

    const playLine = (notes, type, vol) => {
      let t = now;
      for (const [freq, beats] of notes) {
        if (freq > 0) {
          const osc = c.createOscillator();
          const g = c.createGain();
          osc.type = type;
          osc.frequency.value = freq;
          g.gain.setValueAtTime(vol, t);
          g.gain.exponentialRampToValueAtTime(0.001, t + beats * beatDur * 0.9);
          osc.connect(g);
          g.connect(masterGain);
          osc.start(t);
          osc.stop(t + beats * beatDur * 0.95);
        }
        t += beats * beatDur;
      }
      return t - now;
    };

    const melodyDur = playLine(track.melody, 'square', 0.18);
    playLine(track.bass, 'triangle', 0.25);

    // Schedule percussion (simple kick on downbeats)
    const kickFreqs = [80, 60, 50];
    const kickBeats = Math.ceil(melodyDur / beatDur / 4);
    for (let i = 0; i < kickBeats; i++) {
      const t = now + i * beatDur * 4;
      if (t < now + melodyDur) {
        const osc = c.createOscillator();
        const g = c.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(kickFreqs[0], t);
        osc.frequency.exponentialRampToValueAtTime(kickFreqs[2], t + 0.08);
        g.gain.setValueAtTime(0.3, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
        osc.connect(g);
        g.connect(masterGain);
        osc.start(t);
        osc.stop(t + 0.12);
      }
    }

    if (track.loop) {
      const id = setTimeout(() => {
        if (this.playing && this.currentTrack === track) {
          this._schedule(track);
        }
      }, melodyDur * 1000 - 50);
      this.timeouts.push(id);
    }
  }

  stop() {
    this.playing = false;
    this.currentTrack = null;
    this.timeouts.forEach(clearTimeout);
    this.timeouts = [];
  }

  pause() { this.stop(); }

  setVolume(v) {
    if (masterGain) masterGain.gain.value = v;
  }
}

let player = null;
function getPlayer() {
  if (!player) player = new ChipTunePlayer();
  return player;
}

export function playMusic(trackName) {
  if (!musicEnabled) return;
  getPlayer().play(trackName);
}

export function stopMusic() {
  getPlayer().stop();
}

export function pauseMusic() {
  getPlayer().pause();
}

export function resumeMusic(trackName) {
  if (musicEnabled) getPlayer().play(trackName);
}

export function setMusicEnabled(v) {
  musicEnabled = v;
  if (!v) stopMusic();
}

export function setSfxEnabled(v) {
  sfxEnabled = v;
}

export function getMusicEnabled() { return musicEnabled; }
export function getSfxEnabled()   { return sfxEnabled; }

export function initAudio() {
  // Unlock AudioContext on first user gesture
  const unlock = () => {
    getCtx();
    document.removeEventListener('pointerdown', unlock);
    document.removeEventListener('keydown', unlock);
  };
  document.addEventListener('pointerdown', unlock);
  document.addEventListener('keydown', unlock);
}
