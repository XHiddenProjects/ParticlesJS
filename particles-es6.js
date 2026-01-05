/**
 * @module particles-es6
 * @fileoverview Canvas particle engine (ES module build).
 *
 * Exports {@link ParticleJS} and {@link ParticleScene}.
 *
 * @version 2026-01-05
 */

/** @typedef {'circle'|'edge'|'triangle'|'polygon'|'image'} ParticleShapeType */
/** @typedef {'none'|'top'|'bottom'|'left'|'right'|'top-right'|'top-left'|'bottom-right'|'bottom-left'} MoveDirection */
/** @typedef {'default'|'rocket'|'slide'|'swirl'} MoveBehavior */
/** @typedef {'grab'|'bubble'|'repulse'|'push'|'remove'|'explode'|'rocketBoost'} InteractivityMode */

/**
 * @typedef {Object} ParticleNumberOptions
 * @property {number} value
 * @property {{enable?: boolean, value_area?: number}} [density]
 * @property {number} [max]
 */

/**
 * @typedef {Object} Particle
 * @property {number} x
 * @property {number} y
 * @property {number} vx
 * @property {number} vy
 * @property {number} ax
 * @property {number} ay
 * @property {number} size
 * @property {number} baseSize
 * @property {number} opacity
 * @property {number} baseOpacity
 * @property {string} fillStyle
 * @property {string|null} strokeStyle
 * @property {HTMLImageElement|null} image
 * @property {boolean} [_dead]
 */


export class ParticleScene { constructor(name, config) { this.name = name; this.config = config; } toOptions(engine) { return (typeof this.config === 'function') ? this.config(engine) : this.config; } }
/**
 * Canvas-based particle engine.
 * @class ParticleJS
 * @param {HTMLElement|string} container - Container element or selector.
 * @param {Object} [options] - Engine options; hover/click are disabled by default.
 * @method play - Starts the animation loop.
 * @method pause - Pauses the animation loop.
 * @method destroy - Removes listeners and canvas from the container.
 * @method setScene - Applies a new ParticleScene and reinitializes.
 */
export class ParticleJS {
  static Particles = {};

/**
 * Built-in and user-registered movement behaviors.
 * A behavior is a function (p, dt, engine) => void (or can return {skipPhysics?:boolean}).
 *
 * - Register globally: ParticleJS.registerBehavior('name', fn)
 * - Register per-instance: engine.registerBehavior('name', fn)
 */
static Behaviors = {};

/**
 * Register a global behavior available to all instances.
 * @param {string} name
 * @param {function(Particle, number, ParticleJS): (void|{skipPhysics?:boolean})} fn
 */
static registerBehavior(name, fn) {
  if (!name || typeof name !== 'string') throw new Error('ParticleJS.registerBehavior: name must be a string.');
  if (typeof fn !== 'function') throw new Error('ParticleJS.registerBehavior: fn must be a function.');
  ParticleJS.Behaviors[name] = fn;
  return ParticleJS;
}

/**
 * Unregister a global behavior.
 * @param {string} name
 */
static unregisterBehavior(name) {
  delete ParticleJS.Behaviors[name];
  return ParticleJS;
}

/**
 * Register a behavior on this instance.
 * @param {string} name
 * @param {function(Particle, number, ParticleJS): (void|{skipPhysics?:boolean})} fn
 * @returns {this}
 */
registerBehavior(name, fn) {
  if (!this.behaviors) this.behaviors = {};
  if (!name || typeof name !== 'string') throw new Error('ParticleJS.registerBehavior(instance): name must be a string.');
  if (typeof fn !== 'function') throw new Error('ParticleJS.registerBehavior(instance): fn must be a function.');
  this.behaviors[name] = fn;
  return this;
}

/**
 * Unregister an instance behavior.
 * @param {string} name
 * @returns {this}
 */
unregisterBehavior(name) {
  if (this.behaviors) delete this.behaviors[name];
  return this;
}

  constructor(container, options) { this.container = typeof container === 'string' ? (document.querySelector(container)) : container; if (!this.container) { throw new Error('ParticleEngine: container not found.'); } this.options = this._withDefaults(options); this.dpr = this.options.retina_detect ? Math.max(1, window.devicePixelRatio ?? 1) : 1; this.canvas = this._ensureCanvas(this.container); this.ctx = this.canvas.getContext('2d'); this.pointer = { active: false, x: 0, y: 0, lastClick: 0 }; this.particles = []; this.imagesCache = new Map(); this.behaviors = {};  this.running = false; this._rafId = 0; this._lastTs = 0; this._resizeRaf = 0; if (this.options.interactivity?.events?.resize) { window.addEventListener('resize', () => this._resize(), { passive: true }); } this._bindEvents(); this._resize(); this._populate(); }
  /**
   * Start the animation loop.
   * @returns {void}

   */
  play() { if (this.running) return; this.running = true; this._lastTs = performance.now(); const loop = (ts) => { if (!this.running) return; const dt = Math.min(0.05, (ts - this._lastTs) / 1000); this._lastTs = ts; this._step(dt); this._rafId = requestAnimationFrame(loop); }; this._rafId = requestAnimationFrame(loop); }
  /**
   * Pause the animation loop.
   * @returns {void}

   */
  pause() { if (!this.running) return; this.running = false; cancelAnimationFrame(this._rafId); }
  destroy() { this.pause(); this._unbindEvents(); if (this.canvas?.parentElement === this.container) this.container.removeChild(this.canvas); }
  /**
   * Apply a new scene and reinitialize the engine.
   * @param {ParticleScene} scene - Scene to apply.
   * @returns {this}
   */
  setScene(scene) { if (!(scene instanceof ParticleScene)) { throw new Error('ParticleJS.setScene: only ParticleScene instances are supported.'); } const next = scene.toOptions(this); this.options = this._withDefaults(next); this.dpr = this.options.retina_detect ? Math.max(1, window.devicePixelRatio ?? 1) : 1; if (this.canvas) this.canvas.style.background = this.options.background ?? 'transparent'; this._unbindEvents(); this._bindEvents(); this._resize(); this._populate(); return this; }
  _withDefaults(opts) {
    const def = { retina_detect: true, background: 'transparent', particles: { number: { value: 60, density: { enable: true, value_area: 800 }, max: 300 }, color: { value: '#fff' }, shape: { type: 'circle', stroke: { width: 0, color: '#000' }, polygon: { nb_sides: 5 }, image: { src: '', width: 100, height: 100 } }, opacity: { value: 0.6, random: false, anim: { enable: false, speed: 1, opacity_min: 0.1, sync: false } }, size: { value: 4, random: true, anim: { enable: false, speed: 40, size_min: 0.1, sync: false } }, line_linked: { enable: true, distance: 150, color: '#fff', opacity: 0.4, width: 1 }, physics: { drag: 0.98, gravity: 0 }, move: { enable: true, speed: 2, direction: 'none', random: false, straight: false, out_mode: 'out', bounce: false, attract: { enable: false, rotateX: 600, rotateY: 1200 }, behavior: 'default', rocket: { thrust: 120 }, slide: { stiffness: 4 }, swirl: { strength: 60 } } }, interactivity: { detect_on: 'container', events: { onhover: { enable: false, mode: 'grab' }, onclick: { enable: false, mode: 'push' }, resize: true }, modes: { grab: { distance: 140, line_linked: { opacity: 1 } }, bubble: { distance: 200, size: 20, duration: 0.4, opacity: 0.8, speed: 3 }, repulse: { distance: 100, duration: 0.4 }, push: { particles_nb: 4 }, remove: { particles_nb: 2 }, explode: { power: 300 }, rocketBoost: { power: 180 } } } };
    return this._merge(def, opts ?? {});
  }
  _ensureCanvas(parent) { let canvas = parent.querySelector('canvas.particle-js'); if (!canvas) { canvas = document.createElement('canvas'); canvas.className = 'particle-js'; canvas.style.position = 'absolute'; canvas.style.top = '0'; canvas.style.left = '0'; canvas.style.width = '100%'; canvas.style.height = '100%'; canvas.style.zIndex = '0'; canvas.style.pointerEvents = 'none'; canvas.setAttribute('aria-hidden', 'true'); const cs = window.getComputedStyle(parent); if (cs.position === 'static') parent.style.position = 'relative'; parent.appendChild(canvas); } canvas.style.background = this.options.background ?? 'transparent'; return canvas; }
  _bindEvents() { const detectOn = this.options.interactivity.detect_on; const target = detectOn === 'window' ? window : detectOn === 'canvas' ? this.canvas : detectOn === 'container' ? this.container : detectOn; const moveHandler = (e) => { const { x, y } = this._pointerPos(e); this.pointer.x = x; this.pointer.y = y; this.pointer.active = true; }; const leaveHandler = () => { this.pointer.active = false; }; const clickHandler = () => { this.pointer.lastClick = performance.now(); const mode = this.options.interactivity.events.onclick?.mode; this._applyClickMode(mode); }; target.addEventListener('mousemove', moveHandler, { passive: true }); target.addEventListener('touchmove', moveHandler, { passive: true }); target.addEventListener('mouseleave', leaveHandler, { passive: true }); target.addEventListener('touchend', leaveHandler, { passive: true }); target.addEventListener('click', clickHandler); this._listeners = { target, moveHandler, leaveHandler, clickHandler }; }
  _unbindEvents() { if (!this._listeners) return; const { target, moveHandler, leaveHandler, clickHandler } = this._listeners; target.removeEventListener('mousemove', moveHandler); target.removeEventListener('touchmove', moveHandler); target.removeEventListener('mouseleave', leaveHandler); target.removeEventListener('touchend', leaveHandler); target.removeEventListener('click', clickHandler); this._listeners = null; }
  _pointerPos(e) { const detectOn = this.options.interactivity.detect_on; const clientX = (e.touches && e.touches[0] ? e.touches[0].clientX : e.clientX); const clientY = (e.touches && e.touches[0] ? e.touches[0].clientY : e.clientY); const baseEl = detectOn === 'window' ? this.container : detectOn === 'canvas' ? this.canvas : detectOn === 'container' ? this.container : detectOn; const rect = baseEl.getBoundingClientRect(); const cx = clientX - rect.left; const cy = clientY - rect.top; return { x: cx * this.dpr, y: cy * this.dpr }; }
  _populate() { this.particles.length = 0; const numOpt = this.options.particles.number; const cssArea = (this.canvas.width * this.canvas.height) / (this.dpr * this.dpr); let count = numOpt.value; if (numOpt.density?.enable) { const baseArea = Math.max(1, numOpt.density.value_area ?? 800); const factor = cssArea / baseArea; count = Math.max(1, Math.round(numOpt.value * factor)); } const cap = Math.max(1, numOpt.max ?? 300); count = Math.min(count, cap); for (let i = 0; i < count; i++) this.particles.push(this._spawnParticle()); }
  _spawnParticle() { const { particles: p } = this.options; const { width, height } = this.canvas; const x = Math.random() * width; const y = Math.random() * height; const speed = Array.isArray(p.move.speed) ? (Math.floor(Math.random() * (p.move.speed[1] - p.move.speed[0] + 1)) + p.move.speed[0]) : p.move.speed * this.dpr; const dir = this._directionVector(p.move.direction); const straight = p.move.straight; const randomize = p.move.random; let vx, vy; if (straight) { vx = dir.x * speed; vy = dir.y * speed; } else { const baseAngle = Math.atan2(dir.y, dir.x); const a = baseAngle + (randomize ? (Math.random() - 0.5) * Math.PI : 0); vx = Math.cos(a) * speed * (0.5 + Math.random()); vy = Math.sin(a) * speed * (0.5 + Math.random()); } const sizeBase = p.size.value; const size = p.size.random ? sizeBase * (0.5 + Math.random()) : sizeBase; const opBase = p.opacity.value; const opacity = p.opacity.random ? opBase * (0.5 + Math.random()) : opBase; const color = this._pickColor(p.color.value); const stroke = p.shape.stroke?.width > 0 ? p.shape.stroke.color : null; const part = { x, y, vx, vy, ax: 0, ay: 0, size, baseSize: size, opacity, baseOpacity: opacity, fillStyle: color, strokeStyle: stroke, image: null }; if (p.shape.type === 'image' && p.shape.image?.src) { this._loadImage(p.shape.image.src).then(img => part.image = img); } return part; }
  _step(dt) { const ctx = this.ctx; ctx.save(); ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); ctx.restore(); for (const particle of this.particles) { this._updateParticle(particle, dt); this._drawParticle(ctx, particle); } this._linkParticles(ctx); if (this.pointer.active && this.options.interactivity.events.onhover.enable) { const mode = this.options.interactivity.events.onhover.mode; if (mode === 'grab') this._drawGrabLines(ctx); } }
  

/**
 * Resolve movement behavior(s) for a particle.
 * Behavior can be:
 *  - string: name of a built-in or registered behavior
 *  - function: (p, dt, engine) => void
 *  - array: composed behaviors evaluated in order
 * Per-particle override: set p.behavior to any of the above.
 *
 * Custom behaviors can be supplied in options.behaviors and/or options.particles.move.behaviors.
 *
 * @param {Particle} p
 * @returns {Array<function(Particle, number, ParticleJS): (void|{skipPhysics?:boolean})>}
 */
_resolveBehaviors(p) {
  const move = this.options?.particles?.move ?? {};
  const spec = (p && p.behavior !== undefined) ? p.behavior : (move.behavior ?? 'default');

  const registry = {
    ...(ParticleJS.Behaviors || {}),
    ...(this.behaviors || {}),
    ...(this.options?.behaviors || {}),
    ...(move.behaviors || {})
  };

  const toFn = (s) => {
    if (!s) return null;
    if (typeof s === 'function') return s;
    if (typeof s === 'string') return registry[s] || null;
    return null;
  };

  if (Array.isArray(spec)) {
    return spec.map(toFn).filter(Boolean);
  }
  const fn = toFn(spec);
  return fn ? [fn] : [];
}
_updateParticle(p, dt) {
    const move = this.options.particles.move;
    if (move.attract?.enable) { const cx = this.canvas.width / 2, cy = this.canvas.height / 2; const dx = cx - p.x, dy = cy - p.y; const dist2 = dx * dx + dy * dy; const f = Math.min(0.00004 * this.dpr, 1 / Math.max(1, dist2)); p.vx += dx * f * (move.attract.rotateX / 1000); p.vy += dy * f * (move.attract.rotateY / 1000); }
    if (this.pointer.active && this.options.interactivity.events.onhover.enable) { const mode = this.options.interactivity.events.onhover.mode; const dx = p.x - this.pointer.x; const dy = p.y - this.pointer.y; const dist = Math.hypot(dx, dy); const m = this.options.interactivity.modes; if (mode === 'repulse' && dist < m.repulse.distance * this.dpr) { const strength = Math.max(0.0001, m.repulse.distance * this.dpr - dist); const angle = Math.atan2(dy, dx); const force = (strength / (m.repulse.distance * this.dpr)) * 400 * dt; p.vx += Math.cos(angle) * force; p.vy += Math.sin(angle) * force; } else if (mode === 'bubble' && dist < m.bubble.distance * this.dpr) { const k = 1 - dist / (m.bubble.distance * this.dpr); p.size = p.baseSize + (m.bubble.size - p.baseSize) * k; p.opacity = p.baseOpacity + (m.bubble.opacity - p.baseOpacity) * k; } else if (mode === 'slide') { p.vx += (this.pointer.x - p.x) * 0.5 * dt; p.vy += (this.pointer.y - p.y) * 0.2 * dt; } else { p.size += (p.baseSize - p.size) * Math.min(1, dt * 4); p.opacity += (p.baseOpacity - p.opacity) * Math.min(1, dt * 4); } }
    const clickSince = (performance.now() - this.pointer.lastClick) / 1000; const clickBubble = this.options.interactivity.events.onclick.enable && this.options.interactivity.events.onclick.mode === 'bubble' && clickSince < (this.options.interactivity.modes.bubble.duration); if (clickBubble) { const dx = p.x - this.pointer.x; const dy = p.y - this.pointer.y; const dist = Math.hypot(dx, dy); const m = this.options.interactivity.modes; if (dist < m.bubble.distance * this.dpr) { const k = 1 - dist / (m.bubble.distance * this.dpr); p.size = p.baseSize + (m.bubble.size - p.baseSize) * k; p.opacity = p.baseOpacity + (m.bubble.opacity - p.baseOpacity) * k; } }
    const phys = this.options.particles.physics ?? {}; const drag = Math.max(0, Math.min(1, phys.drag ?? 1)); const gravity = (phys.gravity ?? 0) * this.dpr; 
// Movement behaviors (built-in + custom)
// Behavior signature: (particle, dtSeconds, engine) => void | {skipPhysics?:boolean}
const behaviorFns = this._resolveBehaviors(p);
let skipPhysics = false;
for (const fn of behaviorFns) {
  try {
    const out = fn(p, dt, this);
    if (out && typeof out === 'object' && out.skipPhysics) skipPhysics = true;
  } catch (e) {
    // Don't break animation due to a user behavior error.
    // eslint-disable-next-line no-console
    console && console.warn && console.warn('ParticleJS behavior error:', e);
  }
}
if (!skipPhysics) {
      p.vy += gravity * dt; const dragFactor = drag ** (dt * 60); p.vx *= dragFactor; p.vy *= dragFactor; p.x += p.vx * dt; p.y += p.vy * dt;
    }
    if (this.options.particles.move.out_mode === 'bounce') { if (p.x < 0 || p.x > this.canvas.width) p.vx *= -1; if (p.y < 0 || p.y > this.canvas.height) p.vy *= -1; p.x = Math.max(0, Math.min(this.canvas.width, p.x)); p.y = Math.max(0, Math.min(this.canvas.height, p.y)); } else { if (p.x < -50) p.x = this.canvas.width + 50; if (p.x > this.canvas.width + 50) p.x = -50; if (p.y < -50) p.y = this.canvas.height + 50; if (p.y > this.canvas.height + 50) p.y = -50; }
  }
  _drawParticle(ctx, p) { ctx.save(); ctx.globalAlpha = Math.max(0, Math.min(1, p.opacity)); ctx.fillStyle = p.fillStyle; if (p.strokeStyle) { ctx.strokeStyle = p.strokeStyle; ctx.lineWidth = this.options.particles.shape.stroke.width * this.dpr; } const type = this.options.particles.shape.type; switch (type) { case 'circle': ctx.beginPath(); ctx.arc(p.x, p.y, p.size * this.dpr, 0, Math.PI * 2); ctx.closePath(); if (p.strokeStyle) ctx.stroke(); ctx.fill(); break; case 'edge': { const s = p.size * this.dpr; ctx.beginPath(); ctx.rect(p.x - s/2, p.y - s/2, s, s); if (p.strokeStyle) ctx.stroke(); ctx.fill(); ctx.closePath(); break; } case 'triangle': { const s = p.size * this.dpr; ctx.beginPath(); ctx.moveTo(p.x, p.y - s / Math.sqrt(3)); ctx.lineTo(p.x - s / 2, p.y + s / (2 * Math.sqrt(3))); ctx.lineTo(p.x + s / 2, p.y + s / (2 * Math.sqrt(3))); ctx.closePath(); if (p.strokeStyle) ctx.stroke(); ctx.fill(); break; } case 'polygon': { const sides = Math.max(3, this.options.particles.shape.polygon.nb_sides ?? 5); const r = p.size * this.dpr; ctx.beginPath(); for (let i = 0; i < sides; i++) { const a = (i / sides) * Math.PI * 2; const x = p.x + r * Math.cos(a); const y = p.y + r * Math.sin(a); if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); } ctx.closePath(); if (p.strokeStyle) ctx.stroke(); ctx.fill(); break; } case 'image': if (p.image && p.image.complete) { const w = (this.options.particles.shape.image.width ?? p.size) * this.dpr; const h = (this.options.particles.shape.image.height ?? p.size) * this.dpr; ctx.drawImage(p.image, p.x - w/2, p.y - h/2, w, h); } else { ctx.beginPath(); ctx.arc(p.x, p.y, p.size * this.dpr, 0, Math.PI * 2); ctx.closePath(); ctx.fill(); } break; default: ctx.beginPath(); ctx.arc(p.x, p.y, p.size * this.dpr, 0, Math.PI * 2); ctx.closePath(); ctx.fill(); } ctx.restore(); }
  _linkParticles(ctx) { const opts = this.options.particles.line_linked; if (!opts.enable) return; const distMax = opts.distance * this.dpr; const cellSize = Math.max(1, distMax); const cols = Math.max(1, Math.ceil(this.canvas.width / cellSize)); const rows = Math.max(1, Math.ceil(this.canvas.height / cellSize)); const grid = new Array(cols * rows); for (let i = 0; i < grid.length; i++) grid[i] = []; const parts = this.particles; for (let i = 0; i < parts.length; i++) { const p = parts[i]; const cx = Math.min(cols - 1, Math.max(0, Math.floor(p.x / cellSize))); const cy = Math.min(rows - 1, Math.max(0, Math.floor(p.y / cellSize))); grid[cy * cols + cx].push(i); } ctx.save(); ctx.lineWidth = opts.width * this.dpr; ctx.strokeStyle = this._rgba(opts.color, opts.opacity); for (let i = 0; i < parts.length; i++) { const a = parts[i]; const cx = Math.min(cols - 1, Math.max(0, Math.floor(a.x / cellSize))); const cy = Math.min(rows - 1, Math.max(0, Math.floor(a.y / cellSize))); for (let gx = cx - 1; gx <= cx + 1; gx++) { if (gx < 0 || gx >= cols) continue; for (let gy = cy - 1; gy <= cy + 1; gy++) { if (gy < 0 || gy >= rows) continue; const arr = grid[gy * cols + gx]; for (let k = 0; k < arr.length; k++) { const j = arr[k]; if (j <= i) continue; const b = parts[j]; const dx = a.x - b.x, dy = a.y - b.y; const d = Math.hypot(dx, dy); if (d <= distMax) { const alpha = Math.min(1, opts.opacity * (1 - d / distMax)); ctx.globalAlpha = alpha; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); } } } } } ctx.restore(); }
  _drawGrabLines(ctx) { const m = this.options.interactivity.modes.grab; const distMax = m.distance * this.dpr; ctx.save(); ctx.lineWidth = this.options.particles.line_linked.width * this.dpr; ctx.strokeStyle = this._rgba(this.options.particles.line_linked.color, m.line_linked.opacity); for (const p of this.particles) { const d = Math.hypot(p.x - this.pointer.x, p.y - this.pointer.y); if (d <= distMax) { const o = Math.min(1, m.line_linked.opacity * (1 - d / distMax)); ctx.globalAlpha = o; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(this.pointer.x, this.pointer.y); ctx.stroke(); } } ctx.restore(); }
  _applyClickMode(mode) {
    // Do nothing if click is disabled
    if (!(this.options?.interactivity?.events?.onclick?.enable)) return;
 if (!mode) return; const modes = this.options.interactivity.modes; const cap = Math.max(1, this.options.particles.number.max ?? 300); switch (mode) { case 'push': {
    const want = modes.push.particles_nb;
    const cap = Math.max(1, this.options.particles.number.max ?? 300);
    const room = Math.max(0, cap - this.particles.length);
    const add = Math.min(want, room);
    for (let i = 0; i < add; i++) this.particles.push(this._spawnParticle());
    // If at cap, recycle oldest particles so clicks still have an effect.
    const overflow = want - add;
    if (overflow > 0) {
      const removeN = Math.min(overflow, this.particles.length);
      this.particles.splice(0, removeN);
      for (let i = 0; i < removeN; i++) this.particles.push(this._spawnParticle());
    }
    break;
  } case 'remove': { const n = Math.min(modes.remove.particles_nb, this.particles.length); this.particles.splice(0, n); break; } case 'repulse': for (const p of this.particles) { const dx = p.x - this.pointer.x; const dy = p.y - this.pointer.y; const d = Math.hypot(dx, dy) || 1; const force = Math.min(600, 6000 / d); p.vx += (dx / d) * force; p.vy += (dy / d) * force; } break; case 'bubble': break; case 'explode': { const power = modes.explode?.power ?? 300; for (const p of this.particles) { const dx = p.x - this.pointer.x; const dy = p.y - this.pointer.y; const d = Math.hypot(dx, dy) || 1; const impulse = power / d; p.vx += (dx / d) * impulse; p.vy += (dy / d) * impulse; } break; } case 'rocketBoost': { const power = modes.rocketBoost?.power ?? 180; for (const p of this.particles) { p.vy -= power * this.dpr * 0.02; } break; } } }
  _resize() { if (this._resizeRaf) cancelAnimationFrame(this._resizeRaf); this._resizeRaf = requestAnimationFrame(() => { const rect = this.container.getBoundingClientRect(); this.canvas.width = Math.max(1, Math.floor(rect.width * this.dpr)); this.canvas.height = Math.max(1, Math.floor(rect.height * this.dpr)); if (this.options.interactivity.events.resize) this._populate(); }); }
  _merge(a, b) { if (Array.isArray(a) || Array.isArray(b)) return b ?? a; if (typeof a === 'object' && a !== null && typeof b === 'object' && b !== null) { const out = { ...a }; for (const k of Object.keys(b)) out[k] = this._merge(a[k], b[k]); return out; } return b ?? a; }
  _directionVector(dir) { const map = { 'none': { x: (Math.random() - 0.5), y: (Math.random() - 0.5) }, 'top': { x: 0, y: -1 }, 'bottom': { x: 0, y: 1 }, 'left': { x: -1, y: 0 }, 'right': { x: 1, y: 0 }, 'top-right': { x: Math.SQRT1_2, y: -Math.SQRT1_2 }, 'top-left': { x: -Math.SQRT1_2, y: -Math.SQRT1_2 }, 'bottom-right': { x: Math.SQRT1_2, y: Math.SQRT1_2 }, 'bottom-left': { x: -Math.SQRT1_2, y: Math.SQRT1_2 } }; return map[dir] ?? map['none']; }
  _pickColor(value) { if (Array.isArray(value)) return value[Math.floor(Math.random() * value.length)]; return value; }
  _rgba(color, opacity) { const rgb = this._hexToRgb(color); if (!rgb) return `rgba(255, 255, 255, ${Math.max(0, Math.min(1, opacity))})`; const { r, g, b } = rgb; const a = Math.max(0, Math.min(1, opacity)); return `rgba(${r}, ${g}, ${b}, ${a})`; }
  _hexToRgb(hex) { if (!hex) return null; let c = ('' + hex).replace('#', '').trim(); if (c.length === 3) c = c.split('').map(h => h + h).join(''); const num = parseInt(c, 16); if (Number.isNaN(num)) return null; return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 }; }
  _loadImage(src) { if (this.imagesCache.has(src)) return this.imagesCache.get(src); const img = new Image(); img.crossOrigin = 'anonymous'; const p = new Promise((resolve, reject) => { img.onload = () => resolve(img); img.onerror = reject; img.src = src; }); this.imagesCache.set(src, p); return p; }
}

// Built-in behavior implementations
ParticleJS.Behaviors.default = function (p, dt, engine) { /* no-op */ };
ParticleJS.Behaviors.rocket = function (p, dt, engine) {
  const move = engine.options?.particles?.move ?? {};
  const thrust = (move.rocket?.thrust ?? 0) * engine.dpr;
  p.vy -= thrust * dt;
};
ParticleJS.Behaviors.slide = function (p, dt, engine) {
  const move = engine.options?.particles?.move ?? {};
  const stiff = (move.slide?.stiffness ?? 4);
  p.vy += (0 - p.vy) * Math.min(1, dt * stiff);
};
ParticleJS.Behaviors.swirl = function (p, dt, engine) {
  const move = engine.options?.particles?.move ?? {};
  const cx = engine.canvas.width / 2, cy = engine.canvas.height / 2;
  const dx = cx - p.x, dy = cy - p.y;
  const d = Math.hypot(dx, dy) + 0.0001;
  const s = (move.swirl?.strength ?? 60) * engine.dpr;
  p.vx += (-dy / d) * s * dt;
  p.vy += (dx / d) * s * dt;
};
