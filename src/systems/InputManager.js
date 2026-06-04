/**
 * InputManager — unified keyboard (arrows + WASD) + gamepad + touch input.
 * All scenes share one instance created in GameScene and passed to Player.
 */
export default class InputManager {
  constructor(scene) {
    this.scene = scene;

    // Keyboard — arrows already in cursors, add WASD + extra keys
    const K = Phaser.Input.Keyboard.KeyCodes;
    this._keys = scene.input.keyboard.addKeys({
      w: K.W, a: K.A, s: K.S, d: K.D,
      space: K.SPACE,
      z: K.Z,           // run
      x: K.X,           // fire
      shift: K.SHIFT,   // also run
      ctrl: K.CTRL,     // also fire
      enter: K.ENTER,   // also jump (accessibility)
    });

    // Touch zones (screen-relative, set in buildTouchUI)
    this._touch = {
      left: false, right: false,
      jump: false, jumpJustDown: false,
      run: false,
      fire: false, fireJustDown: false,
    };
    this._prevTouch = { jump: false, fire: false };

    // Gamepad previous-frame state for JustDown detection
    this._pad = {
      jumpPrev: false,
      firePrev: false,
      pausePrev: false,
    };

    // Enable multi-touch (4 simultaneous fingers)
    scene.input.addPointer(3);

    // Touch zones — defined as {x,y,w,h} in screen px (no scroll factor)
    this._zones = null;
  }

  /** Called from GameScene after touch UI is built */
  setTouchZones(zones) {
    this._zones = zones; // { left, right, jump, run, fire }
  }

  /** Call once per frame to update all touch state */
  update() {
    if (!this._zones) return;

    const prev = { ...this._touch };

    // Reset
    this._touch.left = false;
    this._touch.right = false;
    this._touch.jump = false;
    this._touch.run = false;
    this._touch.fire = false;

    // Scan all active pointers
    const ptrs = this.scene.input.manager.pointers;
    for (const ptr of ptrs) {
      if (!ptr.isDown) continue;
      const zone = this._getZone(ptr.x, ptr.y);
      if (zone) this._touch[zone] = true;
    }

    // JustDown = was false last frame, now true
    this._touch.jumpJustDown = this._touch.jump && !prev.jump;
    this._touch.fireJustDown = this._touch.fire && !prev.fire;
  }

  _getZone(x, y) {
    if (!this._zones) return null;
    for (const [name, z] of Object.entries(this._zones)) {
      if (x >= z.x && x <= z.x + z.w && y >= z.y && y <= z.y + z.h) return name;
    }
    return null;
  }

  // ─── Unified accessors ────────────────────────────────────────

  get left() {
    const kb = this.scene.cursors?.left?.isDown || this._keys.a.isDown;
    return kb || this._padAxis() < -0.3 || this._padDpad('left') || this._touch.left;
  }

  get right() {
    const kb = this.scene.cursors?.right?.isDown || this._keys.d.isDown;
    return kb || this._padAxis() > 0.3 || this._padDpad('right') || this._touch.right;
  }

  get jumpHeld() {
    const kb = this.scene.cursors?.up?.isDown || this._keys.w.isDown ||
               this._keys.space.isDown || this._keys.enter.isDown;
    const pad = this._padBtn(0); // A / Cross
    return kb || pad || this._touch.jump;
  }

  get jumpJustDown() {
    const kb = Phaser.Input.Keyboard.JustDown(this.scene.cursors.up) ||
               Phaser.Input.Keyboard.JustDown(this._keys.w) ||
               Phaser.Input.Keyboard.JustDown(this._keys.space) ||
               Phaser.Input.Keyboard.JustDown(this._keys.enter);
    const padNow = this._padBtn(0);
    const padJust = padNow && !this._pad.jumpPrev;
    this._pad.jumpPrev = padNow;
    return kb || padJust || this._touch.jumpJustDown;
  }

  get run() {
    const kb = this._keys.z.isDown || this._keys.shift.isDown ||
               this.scene.runKey?.isDown;
    const pad = this._padBtn(1) || this._padBtn(5); // B/Circle or RB
    return kb || pad || this._touch.run;
  }

  get fireJustDown() {
    const kb = (this.scene.fireKey && Phaser.Input.Keyboard.JustDown(this.scene.fireKey)) ||
               Phaser.Input.Keyboard.JustDown(this._keys.ctrl);
    const padNow = this._padBtn(2) || this._padBtn(4); // X/Square or LB
    const padJust = padNow && !this._pad.firePrev;
    this._pad.firePrev = padNow;
    return kb || padJust || this._touch.fireJustDown;
  }

  get pauseJustDown() {
    const kb = Phaser.Input.Keyboard.JustDown(this.scene.pauseKey);
    const padNow = this._padBtn(9) || this._padBtn(8); // Start / Options
    const padJust = padNow && !this._pad.pausePrev;
    this._pad.pausePrev = padNow;
    return kb || padJust;
  }

  // ─── Gamepad helpers ─────────────────────────────────────────

  _getPad() {
    return this.scene.input.gamepad?.total > 0
      ? this.scene.input.gamepad.getPad(0)
      : null;
  }

  _padAxis() {
    const pad = this._getPad();
    return pad?.axes?.[0]?.getValue() ?? 0;
  }

  _padDpad(dir) {
    const pad = this._getPad();
    if (!pad) return false;
    if (dir === 'left')  return pad.left;
    if (dir === 'right') return pad.right;
    return false;
  }

  _padBtn(index) {
    const pad = this._getPad();
    return pad?.buttons?.[index]?.pressed ?? false;
  }
}
