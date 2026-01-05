# Particle Engine Documentation

This documentation covers both builds of the engine:

- **IIFE / Globals**: `particles.js` exposes `ParticleJS` and `ParticleScene` on `globalThis` / `window`.
- **ES Module**: `particles-es6.js` exports `ParticleJS` and `ParticleScene`.

The engine is a lightweight **Canvas 2D** particle system featuring:

- Density-aware initial population (scales particle count by container area)
- Random particle spawning across the canvas
- Optional line-linking using a spatial grid
- Hover and click interactivity modes
- Simple physics (drag + gravity) and movement behaviors (`default`, `rocket`, `slide`, `swirl`)

---

## Table of contents

- [Quick start](#quick-start)
- [API](#api)
  - [ParticleJS](#particlejs)
  - [ParticleScene](#particlescene)
- [Configuration](#configuration)
  - [Core options](#core-options)
  - [Particles](#particles)
  - [Density](#density)
  - [Interactivity](#interactivity)
  - [Movement behaviors](#movement-behaviors)
- [Density-safe click `push`](#density-safe-click-push)
- [Scenes (optional helper file)](#scenes-optional-helper-file)
- [Performance notes](#performance-notes)
- [Troubleshooting](#troubleshooting)
- [Changelog](#changelog)

---

## Quick start

### IIFE / Globals (script tag)

```html
<div id="hero" style="position: relative; height: 320px;"></div>

<script src="particles.js"></script>
<script>
  const engine = new ParticleJS('#hero', {
    particles: {
      number: { value: 80, density: { enable: true, value_area: 800 }, max: 300 },
      color: { value: '#ffffff' },
      shape: { type: 'circle', stroke: { width: 0, color: '#000000' } },
      opacity: { value: 0.6, random: false },
      size: { value: 4, random: true },
      line_linked: { enable: true, distance: 150, color: '#ffffff', opacity: 0.35, width: 1 },
      physics: { drag: 0.98, gravity: 0 },
      move: {
        enable: true,
        speed: 2,
        direction: 'none',
        random: false,
        straight: false,
        out_mode: 'out',
        behavior: 'default'
      }
    },
    interactivity: {
      detect_on: 'container',
      events: {
        onhover: { enable: true, mode: 'grab' },
        onclick: { enable: true, mode: 'push' },
        resize: true
      },
      modes: {
        grab: { distance: 140, line_linked: { opacity: 1 } },
        push: { particles_nb: 10 }
      }
    }
  });

  engine.play();
</script>
```

**Notes**

- The engine creates an absolute-positioned canvas inside the container.
- The canvas is rendered behind your content and is configured with `pointer-events: none` so it will not intercept UI clicks.

### ES Module

```js
import { ParticleJS } from './particles-es6.js';

const engine = new ParticleJS(document.querySelector('#hero'), {
  // same options as above
});

engine.play();
```

---

## API

### `ParticleJS`

Create an engine instance:

```js
const engine = new ParticleJS(container, options);
```

- `container`: `HTMLElement` or CSS selector string
- `options`: configuration object (see [Configuration](#configuration))

#### Methods

- `play()` - Starts the animation loop.
- `pause()` - Pauses the animation loop.
- `destroy()` - Stops animation, removes listeners, and removes the canvas element.
- `setScene(scene)` - Applies a `ParticleScene` and reinitializes the engine. Returns `this`.

#### Common properties

- `engine.canvas` - The canvas element.
- `engine.ctx` - Canvas 2D rendering context.
- `engine.particles` - Array of particle objects.
- `engine.dpr` - Device pixel ratio multiplier when `retina_detect` is enabled.

### `ParticleScene`

A scene is a named wrapper around options (or a function returning options):

```js
const scene = new ParticleScene('Snow', {
  // options
});

engine.setScene(scene).play();
```

If you pass a function, it will be called with the engine instance and should return a valid options object.

---

## Configuration

Top-level shape:

```js
{
  retina_detect: true,
  background: 'transparent',
  particles: { /* particle appearance + motion */ },
  interactivity: { /* hover + click */ }
}
```

### Core options

- `retina_detect` (boolean, default `true`): when enabled, the canvas is scaled by `window.devicePixelRatio` for sharper rendering.
- `background` (string, default `'transparent'`): canvas background.

### Particles

The `particles` section controls creation, appearance, physics, and movement.

Common fields:

- `particles.number.value` - base particle count.
- `particles.number.max` - hard cap for total particles.
- `particles.color.value` - string or array of strings.
- `particles.shape.type` - `'circle' | 'edge' | 'triangle' | 'polygon' | 'image'`.
- `particles.size.value` / `particles.size.random`.
- `particles.opacity.value` / `particles.opacity.random`.
- `particles.line_linked` - link settings.
- `particles.physics.drag` / `particles.physics.gravity`.
- `particles.move` - speed, direction, out mode, and behavior.

### Density

Density scales the initial particle count by container area:

```js
particles: {
  number: {
    value: 80,
    density: { enable: true, value_area: 800 },
    max: 300
  }
}
```

How it works:

1. Compute the canvas area in CSS pixels.
2. Compute a factor: `area / value_area`.
3. Set initial particle count to `round(value * factor)`.
4. Clamp to `max`.

If you want more particles on large screens, increase `max` or reduce `value_area`.

### Interactivity

Interactivity is controlled by:

- `interactivity.detect_on`: `'container' | 'canvas' | 'window'` (or an element in the globals build).
- `interactivity.events.onhover`: `{ enable, mode }`
- `interactivity.events.onclick`: `{ enable, mode }`
- `interactivity.events.resize`: boolean

Modes are configured under `interactivity.modes`:

- `grab`: draws lines from the pointer to nearby particles.
- `bubble`: increases particle size/opacity near the pointer.
- `repulse`: pushes particles away from the pointer.
- `push`: adds particles.
- `remove`: removes particles.
- `explode`: applies an outward impulse.
- `rocketBoost`: applies an upward impulse.

### Movement behaviors

`particles.move.behavior`:

- `default`: normal motion.
- `rocket`: upward thrust.
- `slide`: vertical damping.
- `swirl`: tangential force around the canvas center.

---

## Density-safe click `push`

When density is enabled, the initial population may reach `particles.number.max` on larger containers.
If click mode `push` simply refuses to add particles when the engine is at the cap, clicks can appear to do nothing.

**This engine build uses a density-safe `push`:**

- If there is room under `max`, it adds up to `particles_nb` particles.
- If already at `max`, it **recycles** the oldest particles (removes N, then adds N) so the click always produces a visible change without exceeding the cap.

---

## Scenes (optional helper file)

If you use `particleFunctions.js`, it provides prebuilt scenes (Rain, Snow, Confetti, Fireworks) as factory functions that return `ParticleScene` instances.

Example (globals build):

```js
const scene = window.particleFunctions.confetti();
const engine = new ParticleJS('#hero', scene.toOptions());
engine.play();
```

---

## Performance notes

- Line linking can become expensive at high particle counts. Keep `line_linked.enable` off for maximum performance.
- Density on very large containers can quickly reach `max`. Tune `value_area`, `value`, and `max` together.
- Prefer `detect_on: 'container'` to avoid processing pointer movement across the entire window.

---

## Troubleshooting

### Click does nothing

- Ensure `interactivity.events.onclick.enable = true`.
- Ensure `interactivity.events.onclick.mode = 'push'`.
- Verify `interactivity.modes.push.particles_nb` is greater than 0.

### Particles look blurry

- Keep `retina_detect: true`.
- Ensure the container has a real size (height/width).
- Avoid heavy CSS transforms on the container.

### Canvas blocks UI clicks

- The default canvas style uses `pointer-events: none`. If you changed that, restore it.
