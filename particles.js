/**
 * particles-engine.js (class syntax, no export)
 * A lightweight particle engine with density clamping, spatial grid line-linking,
 * and interactive modes (grab, bubble, repulse, push, remove).
 *
 * This build uses `class` syntax but **does not** use ES module exports.
 * It exposes `ParticleJS` and `ParticleScene` on the global object (window/globalThis).
 */
(function (global) {
  'use strict';

  /** Scene/preset wrapper for convenience. */
  class ParticleScene {
    /**
     * @param {string} name
     * @param {Object|Function} config - Partial EngineOptions or (engine) => options
     */
    constructor(name, config) { this.name = name; this.config = config; }
    /** @param {ParticleJS} engine */
    toOptions(engine) { return (typeof this.config === 'function') ? this.config(engine) : this.config; }
  }

  class ParticleJS {
    /**
     * Built-in scene presets as ParticleScene objects only.
     * Use: engine.setScene(ParticleJS.Scenes.rain)
     */
    static Scenes = {
      rain: new ParticleScene('rain', (engine) => ({
        background: 'transparent',
        retina_detect: true,
        particles: {
          number: { value: 300, density: { enable: true, value_area: 800 }, max: 600 },
          color:  { value: '#7fb3d5' },
          shape:  { type:'image', image:{src: "https://cdn-icons-png.flaticon.com/512/427/427112.png", width: 10, height: 10 } },
          opacity:{ value: 0.8, random: true },
          size:   { value: 1.6, random: true, anim: { enable: false, speed: 0, size_min: 0.8, sync: false } },
          line_linked: { enable: false },
          move: {
            enable: true, speed: [60,120], direction: 'bottom',
            random: false, straight: true, out_mode: 'out', bounce: false
          }
        },
        interactivity: {
          detect_on: 'canvas',
          events: { onhover: { enable: false }, onclick: { enable: false }, resize: true }
        }
      })),
      snow: new ParticleScene('snow', (engine) => ({
        particles: {
          number: { value: 150, density: { enable: true, value_area: 800 }, max: 500 },
          color:  { value: '#ffffff' },
          shape:  { type: 'circle' },
          opacity:{ value: 0.9, random: true },
          size:   { value: 3, random: true },
          line_linked: { enable: false },
          move: {
            enable: true, speed: 12, direction: 'bottom',
            random: true, straight: false, out_mode: 'out', bounce: false
          }
        },
        interactivity: {
          events: { onhover: { enable: true, mode: 'bubble' }, onclick: { enable: false }, resize: true },
          modes:  { bubble: { distance: 120, size: 6, duration: 0.4, opacity: 0.8, speed: 3 } }
        }
      })),
      confetti: new ParticleScene('confetti', (engine) => ({
        particles: {
          number: { value: 180, density: { enable: true, value_area: 800 }, max: 400 },
          color:  { value: ['#f94144','#f3722c','#f8961e','#f9c74f','#90be6d','#43aa8b','#577590'] },
          shape:  { type: 'edge', stroke: { width: 0, color: '#000' } },
          opacity:{ value: 0.9, random: false },
          size:   { value: 3, random: true },
          line_linked: { enable: false },
          move: {
            enable: true, speed: 20, direction: 'none',
            random: true, straight: false, out_mode: 'out', bounce: false
          }
        },
        interactivity: { events: { onhover: { enable: false }, onclick: { enable: false }, resize: true } }
      }))
    };

    /**
     * Create a particle engine.
     * @param {HTMLElement|string} container - Container element or CSS selector.
     * @param {EngineOptions} [options] - Engine configuration.
     */
    constructor(container, options) {
      /** @type {HTMLElement} */
      this.container = typeof container === 'string'
        ? /** @type {HTMLElement} */ (document.querySelector(container))
        : container;
      if (!this.container) { throw new Error('ParticleEngine: container not found.'); }
      this.options = this._withDefaults(options);
      this.dpr = this.options.retina_detect ? Math.max(1, window.devicePixelRatio ?? 1) : 1;

      // Canvas
      this.canvas = this._ensureCanvas(this.container);
      this.ctx = this.canvas.getContext('2d');

      // State
      this.pointer = { active: false, x: 0, y: 0, lastClick: 0 };
      /** @type {Particle[]} */ this.particles = [];
      this.imagesCache = new Map();
      this.running = false;
      this._rafId = 0; this._lastTs = 0; this._resizeRaf = 0;

      // Resize listener
      if (this.options.interactivity?.events?.resize) {
        window.addEventListener('resize', () => this._resize(), { passive: true });
      }

      // Events
      this._bindEvents();

      // Init
      this._resize();
      this._populate();
    }

    /** Start animation loop */
    play() {
      if (this.running) return;
      this.running = true;
      this._lastTs = performance.now();
      const loop = (ts) => {
        if (!this.running) return;
        const dt = Math.min(0.05, (ts - this._lastTs) / 1000);
        this._lastTs = ts;
        this._step(dt);
        this._rafId = requestAnimationFrame(loop);
      };
      this._rafId = requestAnimationFrame(loop);
    }

    /** Pause animation */
    pause() { if (!this.running) return; this.running = false; cancelAnimationFrame(this._rafId); }

    /** Destroy engine */
    destroy() {
      this.pause();
      this._unbindEvents();
      if (this.canvas?.parentElement === this.container) this.container.removeChild(this.canvas);
    }

    /**
     * Set the scene/preset for the engine.
     * NOTE: This method **only** accepts a ParticleScene instance.
     * @param {ParticleScene} scene
     * @returns {ParticleJS} this
     */
    setScene(scene) {
      if (!(scene instanceof ParticleScene)) {
        throw new Error('ParticleJS.setScene: only ParticleScene instances are supported.');
      }
      const next = scene.toOptions(this);

      // Merge and apply
      this.options = this._withDefaults(next);
      this.dpr = this.options.retina_detect ? Math.max(1, window.devicePixelRatio ?? 1) : 1;
      if (this.canvas) this.canvas.style.background = this.options.background ?? 'transparent';

      // Rebind events in case target changed
      this._unbindEvents();
      this._bindEvents();

      // Reinit particles for new scene
      this._resize();
      this._populate();
      return this;
    }

    // ---------- Initialization helpers ----------
    _withDefaults(opts) {
      const def = {
        retina_detect: true,
        background: 'transparent',
        particles: {
          number: { value: 60, density: { enable: true, value_area: 800 }, max: 300 },
          color: { value: '#fff' },
          shape: {
            type: 'circle',
            stroke: { width: 0, color: '#000' },
            polygon: { nb_sides: 5 },
            image: { src: '', width: 100, height: 100 }
          },
          opacity: { value: 0.6, random: false, anim: { enable: false, speed: 1, opacity_min: 0.1, sync: false } },
          size: { value: 4, random: true, anim: { enable: false, speed: 40, size_min: 0.1, sync: false } },
          line_linked: { enable: true, distance: 150, color: '#fff', opacity: 0.4, width: 1 },
          move: {
            enable: true, speed: 2, direction: 'none', random: false, straight: false,
            out_mode: 'out', bounce: false, attract: { enable: false, rotateX: 600, rotateY: 1200 }
          }
        },
        interactivity: {
          detect_on: 'canvas',
          events: {
            onhover: { enable: true, mode: 'grab' },
            onclick: { enable: false, mode: 'push' },
            resize: true
          },
          modes: {
            grab: { distance: 140, line_linked: { opacity: 1 } },
            bubble: { distance: 200, size: 20, duration: 0.4, opacity: 0.8, speed: 3 },
            repulse: { distance: 100, duration: 0.4 },
            push: { particles_nb: 4 },
            remove: { particles_nb: 2 }
          }
        }
      };
      return this._merge(def, opts ?? {});
    }

    _ensureCanvas(parent) {
      let canvas = parent.querySelector('canvas.particle-js');
      if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.className = 'particle-js';
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.zIndex = '0';
        if (!parent.style.position) parent.style.position = 'relative';
        parent.appendChild(canvas);
      }
      canvas.style.background = this.options.background ?? 'transparent';
      return canvas;
    }

    _bindEvents() {
      const detectOn = this.options.interactivity.detect_on;
      const target = detectOn === 'window' ? window : (detectOn === 'canvas' ? this.canvas : detectOn);
      const moveHandler = (e) => {
        const { x, y } = this._pointerPos(e);
        this.pointer.x = x; this.pointer.y = y; this.pointer.active = true;
      };
      const leaveHandler = () => { this.pointer.active = false; };
      const clickHandler = () => {
        this.pointer.lastClick = performance.now();
        const mode = this.options.interactivity.events.onclick?.mode;
        this._applyClickMode(mode);
      };
      target.addEventListener('mousemove', moveHandler, { passive: true });
      target.addEventListener('touchmove', moveHandler, { passive: true });
      target.addEventListener('mouseleave', leaveHandler, { passive: true });
      target.addEventListener('touchend', leaveHandler, { passive: true });
      target.addEventListener('click', clickHandler);
      this._listeners = { target, moveHandler, leaveHandler, clickHandler };
    }

    _unbindEvents() {
      if (!this._listeners) return;
      const { target, moveHandler, leaveHandler, clickHandler } = this._listeners;
      target.removeEventListener('mousemove', moveHandler);
      target.removeEventListener('touchmove', moveHandler);
      target.removeEventListener('mouseleave', leaveHandler);
      target.removeEventListener('touchend', leaveHandler);
      target.removeEventListener('click', clickHandler);
      this._listeners = null;
    }

    _pointerPos(e) {
      const detectOn = this.options.interactivity.detect_on;
      const touchX = e.touches?.[0]?.clientX;
      const touchY = e.touches?.[0]?.clientY;
      if (detectOn === 'window') {
        const x = (touchX ?? e.clientX) * this.dpr;
        const y = (touchY ?? e.clientY) * this.dpr;
        return { x, y };
      }
      const el = detectOn === 'canvas' ? this.canvas : detectOn;
      const rect = el.getBoundingClientRect();
      const cx = (touchX ?? e.clientX) - rect.left;
      const cy = (touchY ?? e.clientY) - rect.top;
      return { x: cx * this.dpr, y: cy * this.dpr };
    }

    _populate() {
      this.particles.length = 0;
      const numOpt = this.options.particles.number;
      const cssArea = (this.canvas.width * this.canvas.height) / (this.dpr * this.dpr);
      let count = numOpt.value;
      if (numOpt.density?.enable) {
        const baseArea = Math.max(1, numOpt.density.value_area ?? 800);
        const factor = cssArea / baseArea;
        count = Math.max(1, Math.round(numOpt.value * factor));
      }
      const cap = Math.max(1, numOpt.max ?? 300);
      count = Math.min(count, cap);
      for (let i = 0; i < count; i++) this.particles.push(this._spawnParticle());
    }

    _spawnParticle() {
      const { particles: p } = this.options;
      const { width, height } = this.canvas;
      const x = Math.random() * width;
      const y = Math.random() * height;
      const speed = Array.isArray(p.move.speed) ? (Math.floor(Math.random() * (p.move.speed[1] - p.move.speed[0] + 1)) +  p.move.speed[0]) : p.move.speed * this.dpr;
      const dir = this._directionVector(p.move.direction);
      const straight = p.move.straight;
      const randomize = p.move.random;
      let vx, vy;
      if (straight) { vx = dir.x * speed; vy = dir.y * speed; }
      else {
        const baseAngle = Math.atan2(dir.y, dir.x);
        const a = baseAngle + (randomize ? (Math.random() - 0.5) * Math.PI : 0);
        vx = Math.cos(a) * speed * (0.5 + Math.random());
        vy = Math.sin(a) * speed * (0.5 + Math.random());
      }
      const sizeBase = p.size.value;
      const size = p.size.random ? sizeBase * (0.5 + Math.random()) : sizeBase;
      const opBase = p.opacity.value;
      const opacity = p.opacity.random ? opBase * (0.5 + Math.random()) : opBase;
      const color = this._pickColor(p.color.value);
      const stroke = p.shape.stroke?.width > 0 ? p.shape.stroke.color : null;
      const part = { x, y, vx, vy, size, baseSize: size, opacity, baseOpacity: opacity, fillStyle: color, strokeStyle: stroke, image: null };
      if (p.shape.type === 'image' && p.shape.image?.src) {
        this._loadImage(p.shape.image.src).then(img => part.image = img);
      }
      return part;
    }

    _step(dt) {
      const ctx = this.ctx;
      ctx.save(); ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); ctx.restore();
      for (const particle of this.particles) {
        this._updateParticle(particle, dt);
        this._drawParticle(ctx, particle);
      }
      this._linkParticles(ctx);
      if (this.pointer.active && this.options.interactivity.events.onhover.enable) {
        const mode = this.options.interactivity.events.onhover.mode;
        if (mode === 'grab') this._drawGrabLines(ctx);
      }
    }

    _updateParticle(p, dt) {
      const move = this.options.particles.move;
      if (move.attract?.enable) {
        const cx = this.canvas.width / 2, cy = this.canvas.height / 2;
        const dx = cx - p.x, dy = cy - p.y;
        const dist2 = dx * dx + dy * dy;
        const f = Math.min(0.00004 * this.dpr, 1 / Math.max(1, dist2));
        p.vx += dx * f * (move.attract.rotateX / 1000);
        p.vy += dy * f * (move.attract.rotateY / 1000);
      }
      if (this.pointer.active && this.options.interactivity.events.onhover.enable) {
        const mode = this.options.interactivity.events.onhover.mode;
        const dx = p.x - this.pointer.x;
        const dy = p.y - this.pointer.y;
        const dist = Math.hypot(dx, dy);
        const m = this.options.interactivity.modes;
        if (mode === 'repulse' && dist < m.repulse.distance * this.dpr) {
          const strength = Math.max(0.0001, m.repulse.distance * this.dpr - dist);
          const angle = Math.atan2(dy, dx);
          const force = (strength / (m.repulse.distance * this.dpr)) * 400 * dt;
          p.vx += Math.cos(angle) * force;
          p.vy += Math.sin(angle) * force;
        } else if (mode === 'bubble' && dist < m.bubble.distance * this.dpr) {
          const k = 1 - dist / (m.bubble.distance * this.dpr);
          p.size = p.baseSize + (m.bubble.size - p.baseSize) * k;
          p.opacity = p.baseOpacity + (m.bubble.opacity - p.baseOpacity) * k;
        } else {
          p.size += (p.baseSize - p.size) * Math.min(1, dt * 4);
          p.opacity += (p.baseOpacity - p.opacity) * Math.min(1, dt * 4);
        }
      }
      const clickSince = (performance.now() - this.pointer.lastClick) / 1000;
      const clickBubble = this.options.interactivity.events.onclick.enable &&
        this.options.interactivity.events.onclick.mode === 'bubble' &&
        clickSince < (this.options.interactivity.modes.bubble.duration);
      if (clickBubble) {
        const dx = p.x - this.pointer.x;
        const dy = p.y - this.pointer.y;
        const dist = Math.hypot(dx, dy);
        const m = this.options.interactivity.modes;
        if (dist < m.bubble.distance * this.dpr) {
          const k = 1 - dist / (m.bubble.distance * this.dpr);
          p.size = p.baseSize + (m.bubble.size - p.baseSize) * k;
          p.opacity = p.baseOpacity + (m.bubble.opacity - p.baseOpacity) * k;
        }
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (this.options.particles.move.out_mode === 'bounce') {
        if (p.x < 0 || p.x > this.canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > this.canvas.height) p.vy *= -1;
        p.x = Math.max(0, Math.min(this.canvas.width, p.x));
        p.y = Math.max(0, Math.min(this.canvas.height, p.y));
      } else {
        if (p.x < -50) p.x = this.canvas.width + 50;
        if (p.x > this.canvas.width + 50) p.x = -50;
        if (p.y < -50) p.y = this.canvas.height + 50;
        if (p.y > this.canvas.height + 50) p.y = -50;
      }
    }

    _drawParticle(ctx, p) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, p.opacity));
      ctx.fillStyle = p.fillStyle;
      if (p.strokeStyle) {
        ctx.strokeStyle = p.strokeStyle;
        ctx.lineWidth = this.options.particles.shape.stroke.width * this.dpr;
      }
      const type = this.options.particles.shape.type;
      switch (type) {
        case 'circle':
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size * this.dpr, 0, Math.PI * 2); ctx.closePath();
          if (p.strokeStyle) ctx.stroke(); ctx.fill();
          break;
        case 'edge': {
          const s = p.size * this.dpr;
          ctx.beginPath(); ctx.rect(p.x - s/2, p.y - s/2, s, s);
          if (p.strokeStyle) ctx.stroke(); ctx.fill(); ctx.closePath();
          break;
        }
        case 'triangle': {
          const s = p.size * this.dpr;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y - s / Math.sqrt(3));
          ctx.lineTo(p.x - s / 2, p.y + s / (2 * Math.sqrt(3)));
          ctx.lineTo(p.x + s / 2, p.y + s / (2 * Math.sqrt(3)));
          ctx.closePath();
          if (p.strokeStyle) ctx.stroke(); ctx.fill();
          break;
        }
        case 'polygon': {
          const sides = Math.max(3, this.options.particles.shape.polygon.nb_sides ?? 5);
          const r = p.size * this.dpr;
          ctx.beginPath();
          for (let i = 0; i < sides; i++) {
            const a = (i / sides) * Math.PI * 2;
            const x = p.x + r * Math.cos(a);
            const y = p.y + r * Math.sin(a);
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          }
          ctx.closePath();
          if (p.strokeStyle) ctx.stroke(); ctx.fill();
          break;
        }
        case 'image':
          if (p.image && p.image.complete) {
            const w = (this.options.particles.shape.image.width ?? p.size) * this.dpr;
            const h = (this.options.particles.shape.image.height ?? p.size) * this.dpr;
            ctx.drawImage(p.image, p.x - w/2, p.y - h/2, w, h);
          } else {
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size * this.dpr, 0, Math.PI * 2); ctx.closePath(); ctx.fill();
          }
          break;
        default:
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size * this.dpr, 0, Math.PI * 2); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }

    _linkParticles(ctx) {
      const opts = this.options.particles.line_linked;
      if (!opts.enable) return;
      const distMax = opts.distance * this.dpr;
      const cellSize = Math.max(1, distMax);
      const cols = Math.max(1, Math.ceil(this.canvas.width / cellSize));
      const rows = Math.max(1, Math.ceil(this.canvas.height / cellSize));
      const grid = new Array(cols * rows);
      for (let i = 0; i < grid.length; i++) grid[i] = [];
      const parts = this.particles;
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        const cx = Math.min(cols - 1, Math.max(0, Math.floor(p.x / cellSize)));
        const cy = Math.min(rows - 1, Math.max(0, Math.floor(p.y / cellSize)));
        grid[cy * cols + cx].push(i);
      }
      ctx.save();
      ctx.lineWidth = opts.width * this.dpr;
      ctx.strokeStyle = this._rgba(opts.color, opts.opacity);
      for (let i = 0; i < parts.length; i++) {
        const a = parts[i];
        const cx = Math.min(cols - 1, Math.max(0, Math.floor(a.x / cellSize)));
        const cy = Math.min(rows - 1, Math.max(0, Math.floor(a.y / cellSize)));
        for (let gx = cx - 1; gx <= cx + 1; gx++) {
          if (gx < 0 || gx >= cols) continue;
          for (let gy = cy - 1; gy <= cy + 1; gy++) {
            if (gy < 0 || gy >= rows) continue;
            const arr = grid[gy * cols + gx];
            for (let k = 0; k < arr.length; k++) {
              const j = arr[k];
              if (j <= i) continue;
              const b = parts[j];
              const dx = a.x - b.x, dy = a.y - b.y;
              const d = Math.hypot(dx, dy);
              if (d <= distMax) {
                const alpha = Math.min(1, opts.opacity * (1 - d / distMax));
                ctx.globalAlpha = alpha;
                ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
              }
            }
          }
        }
      }
      ctx.restore();
    }

    _drawGrabLines(ctx) {
      const m = this.options.interactivity.modes.grab;
      const distMax = m.distance * this.dpr;
      ctx.save();
      ctx.lineWidth = this.options.particles.line_linked.width * this.dpr;
      ctx.strokeStyle = this._rgba(this.options.particles.line_linked.color, m.line_linked.opacity);
      for (const p of this.particles) {
        const d = Math.hypot(p.x - this.pointer.x, p.y - this.pointer.y);
        if (d <= distMax) {
          const o = Math.min(1, m.line_linked.opacity * (1 - d / distMax));
          ctx.globalAlpha = o;
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(this.pointer.x, this.pointer.y); ctx.stroke();
        }
      }
      ctx.restore();
    }

    _applyClickMode(mode) {
      if (!mode) return;
      const modes = this.options.interactivity.modes;
      const cap = Math.max(1, this.options.particles.number.max ?? 300);
      switch (mode) {
        case 'push': {
          const want = modes.push.particles_nb;
          const free = Math.max(0, cap - this.particles.length);
          const add = Math.min(want, free);
          for (let i = 0; i < add; i++) this.particles.push(this._spawnParticle());
          break;
        }
        case 'remove': {
          const n = Math.min(modes.remove.particles_nb, this.particles.length);
          this.particles.splice(0, n);
          break;
        }
        case 'repulse':
          for (const p of this.particles) {
            const dx = p.x - this.pointer.x;
            const dy = p.y - this.pointer.y;
            const d = Math.hypot(dx, dy) || 1;
            const force = Math.min(600, 6000 / d);
            p.vx += (dx / d) * force;
            p.vy += (dy / d) * force;
          }
          break;
        case 'bubble':
          // handled in update via click timing window
          break;
      }
    }

    _resize() {
      if (this._resizeRaf) cancelAnimationFrame(this._resizeRaf);
      this._resizeRaf = requestAnimationFrame(() => {
        const rect = this.container.getBoundingClientRect();
        this.canvas.width = Math.max(1, Math.floor(rect.width * this.dpr));
        this.canvas.height = Math.max(1, Math.floor(rect.height * this.dpr));
        if (this.options.interactivity.events.resize) this._populate();
      });
    }

    // ---------- Utilities ----------
    _merge(a, b) {
      if (Array.isArray(a) || Array.isArray(b)) return b ?? a;
      if (typeof a === 'object' && a !== null && typeof b === 'object' && b !== null) {
        const out = { ...a };
        for (const k of Object.keys(b)) out[k] = this._merge(a[k], b[k]);
        return out;
      }
      return b ?? a;
    }

    _directionVector(dir) {
      const map = {
        'none': { x: (Math.random() - 0.5), y: (Math.random() - 0.5) },
        'top': { x: 0, y: -1 }, 'bottom': { x: 0, y: 1 },
        'left': { x: -1, y: 0 }, 'right': { x: 1, y: 0 },
        'top-right': { x: Math.SQRT1_2, y: -Math.SQRT1_2 },
        'top-left': { x: -Math.SQRT1_2, y: -Math.SQRT1_2 },
        'bottom-right': { x: Math.SQRT1_2, y: Math.SQRT1_2 },
        'bottom-left': { x: -Math.SQRT1_2, y: Math.SQRT1_2 }
      };
      return map[dir] ?? map['none'];
    }

    _pickColor(value) {
      if (Array.isArray(value)) return value[Math.floor(Math.random() * value.length)];
      return /** @type {string} */ (value);
    }

    _rgba(color, opacity) {
      const rgb = this._hexToRgb(color);
      if (!rgb) return `rgba(255, 255, 255, ${Math.max(0, Math.min(1, opacity))})`;
      const { r, g, b } = rgb;
      const a = Math.max(0, Math.min(1, opacity));
      return `rgba(${r}, ${g}, ${b}, ${a})`;
    }

    _hexToRgb(hex) {
      if (!hex) return null;
      let c = ('' + hex).replace('#', '').trim();
      if (c.length === 3) c = c.split('').map(h => h + h).join('');
      const num = parseInt(c, 16);
      if (Number.isNaN(num)) return null;
      return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
    }

    _loadImage(src) {
      if (this.imagesCache.has(src)) return this.imagesCache.get(src);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      const p = new Promise((resolve, reject) => { img.onload = () => resolve(img); img.onerror = reject; img.src = src; });
      this.imagesCache.set(src, p);
      return p;
    }
  }

  // Expose globals (no module exports)
  const root = (typeof globalThis !== 'undefined') ? globalThis : global;
  root.ParticleJS = ParticleJS;
  root.ParticleScene = ParticleScene;

})(typeof window !== 'undefined' ? window : this);