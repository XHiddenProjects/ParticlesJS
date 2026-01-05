
# ParticleJS — Lightweight Canvas Particle Engine

**Version:** Updated 2026-01-05 citeturn1search1 citeturn1search2

ParticleJS is a lightweight, canvas-based particle engine that supports density-aware particle spawning, efficient spatial grid line-link rendering, and rich interactivity (hover, click, and custom behaviors like **explode**, **rocket**, **slide**, and **swirl**). citeturn1search1 citeturn1search2

> Default interactivity flags: `onhover.enable = false`, `onclick.enable = false`. citeturn1search1 citeturn1search2

---

## Contents

- [Features](#features)
- [Builds](#builds)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
- [Options](#options)
- [Interactivity Modes](#interactivity-modes)
- [Scenes](#scenes)
- [Rendering & Performance](#rendering--performance)
- [Accessibility & DOM](#accessibility--dom)
- [Examples](#examples)
- [Troubleshooting](#troubleshooting)
- [Changelog](#changelog)

---

## Features

- **Canvas-based rendering** with device-pixel-ratio (DPR) awareness (`retina_detect`) for crisp visuals. citeturn1search1 citeturn1search2
- **Density clamping** to automatically scale particle count to the canvas area, with a hard maximum cap. citeturn1search1 citeturn1search2
- **Spatial grid line-linking** for efficient line connections between nearby particles. citeturn1search1 citeturn1search2
- **Interactivity**: hover & click events with modes like `grab`, `bubble`, `repulse`, `push`, `remove`, `explode`, and `rocketBoost`. citeturn1search1 citeturn1search2
- **Custom motion behaviors**: `default`, `rocket` (vertical thrust), `slide` (damped alignment), and `swirl` (orbital motion). citeturn1search1 citeturn1search2
- **Scene system** to encapsulate named configurations, including functional scenes that derive options from the current engine. citeturn1search1 citeturn1search2

---

## Builds

Two distribution styles are provided:

- **ES Module**: `particles-es6.js` — exports `ParticleJS` and `ParticleScene`. Use with bundlers or native `<script type="module">`. citeturn1search1
- **IIFE (globals)**: `particles.js` — attaches `ParticleJS` and `ParticleScene` to `window`/`globalThis`. citeturn1search2

---

## Installation

### ES Module (recommended)

```html
<!-- Your HTML -->
<div id="particles-container" style="width:600px;height:400px;position:relative"></div>

<script type="module">
  import { ParticleJS, ParticleScene } from './particles-es6.js';

  const engine = new ParticleJS('#particles-container', {
    background: '#0e1117',
    particles: { color: { value: '#61dafb' } },
  });

  engine.play();

  // Switch scenes later
  const swirlScene = new ParticleScene('Swirl', (eng) => ({
    particles: { move: { behavior: 'swirl', swirl: { strength: 80 } } },
  }));
  engine.setScene(swirlScene);
</script>
```

### IIFE (globals)

```html
<div id="particles-container" style="width:600px;height:400px;position:relative"></div>
<script src="./particles.js"></script>
<script>
  const engine = new ParticleJS('#particles-container', {
    background: '#000',
    particles: { shape: { type: 'circle' } },
  });
  engine.play();
</script>
```

The ES module build exports classes, while the IIFE build exposes them globally. citeturn1search1 citeturn1search2

---

## Quick Start

1. **Add a container** element with a fixed size.
2. **Instantiate `ParticleJS`** with optional overrides.
3. Call **`play()`** to start; use **`pause()`**/**`destroy()`** as needed; use **`setScene(...)`** to swap configurations on the fly. citeturn1search1 citeturn1search2

---

## API Reference

### Classes

#### `ParticleJS`

- **Constructor**: `new ParticleJS(container, options?)`
  - `container`: `HTMLElement|string` (selector or element) — throws if not found. citeturn1search1 citeturn1search2
  - `options`: partial options; merged with sensible defaults. citeturn1search1 citeturn1search2
- **Methods**:
  - `play()` — starts the RAF animation loop. citeturn1search1 citeturn1search2
  - `pause()` — stops the RAF loop. citeturn1search1 citeturn1search2
  - `destroy()` — removes listeners and the canvas from the container. citeturn1search1 citeturn1search2
  - `setScene(scene: ParticleScene)` — applies new options and reinitializes. citeturn1search1 citeturn1search2

#### `ParticleScene`

Encapsulates a named configuration. Accepts either a plain options object or a function `(engine) => options` to construct options dynamically. citeturn1search1 citeturn1search2

---

## Options

Below are the main option groups (defaults shown): citeturn1search1 citeturn1search2

```js
{
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
    physics: { drag: 0.98, gravity: 0 },
    move: {
      enable: true,
      speed: 2,            // number or [min, max]
      direction: 'none',   // none|top|bottom|left|right|top-right|top-left|bottom-right|bottom-left
      random: false,
      straight: false,
      out_mode: 'out',     // out|bounce
      bounce: false,
      attract: { enable: false, rotateX: 600, rotateY: 1200 },
      behavior: 'default', // default|rocket|slide|swirl
      rocket: { thrust: 120 },
      slide: { stiffness: 4 },
      swirl: { strength: 60 }
    }
  },
  interactivity: {
    detect_on: 'container', // window|canvas|container|HTMLElement
    events: {
      onhover: { enable: false, mode: 'grab' },
      onclick: { enable: false, mode: 'push' },
      resize: true
    },
    modes: {
      grab: { distance: 140, line_linked: { opacity: 1 } },
      bubble: { distance: 200, size: 20, duration: 0.4, opacity: 0.8, speed: 3 },
      repulse: { distance: 100, duration: 0.4 },
      push: { particles_nb: 4 },
      remove: { particles_nb: 2 },
      explode: { power: 300 },
      rocketBoost: { power: 180 }
    }
  }
}
```

The engine merges user-provided options with defaults (deep merge). citeturn1search1 citeturn1search2

---

## Interactivity Modes

- **Hover (`onhover`)**: `grab`, `bubble`, `repulse`, `slide` (behavior-driven), or passive reset to base size/opacity. Hover is disabled by default. citeturn1search1 citeturn1search2
- **Click (`onclick`)**: `push`, `remove`, `repulse`, `bubble` (timed), `explode`, `rocketBoost`. Click is disabled by default. citeturn1search1 citeturn1search2
- **Pointer source**: `detect_on` can be `'window'`, `'canvas'`, `'container'`, or a specific `HTMLElement`. citeturn1search1 citeturn1search2

---

## Scenes

Use `ParticleScene` to organize presets:

```js
const nightSky = new ParticleScene('Night Sky', {
  background: '#0b132b',
  particles: {
    color: { value: ['#ffffff', '#e0e7ff'] },
    move: { behavior: 'default', speed: [1, 3] }
  }
});

const interactiveSwirl = new ParticleScene('Interactive Swirl', (engine) => ({
  interactivity: {
    events: { onhover: { enable: true, mode: 'grab' }, onclick: { enable: true, mode: 'explode' } }
  },
  particles: { move: { behavior: 'swirl', swirl: { strength: 90 } } }
}));
```

Functional scenes receive the current engine instance and return options. citeturn1search1 citeturn1search2

---

## Rendering & Performance

- Uses `requestAnimationFrame` with clamped `dt` to advance simulation. citeturn1search1 citeturn1search2
- DPR scaling (`retina_detect`) adjusts canvas resolution and sizes. citeturn1search1 citeturn1search2
- Line-linking employs a **grid** to only check neighbors, reducing O(n²) pairs. citeturn1search1 citeturn1search2
- Particle count auto-scales with **CSS area** via density, and is capped by `particles.number.max`. citeturn1search1 citeturn1search2

---

## Accessibility & DOM

- The engine inserts a `<canvas>` with class `particle-js` positioned absolutely inside your container. citeturn1search1 citeturn1search2
- The canvas is marked `aria-hidden="true"` and `pointer-events: none` to avoid obstructing UI interactions. citeturn1search1 citeturn1search2
- If your container has `position: static`, the engine sets it to `position: relative`. citeturn1search1 citeturn1search2

---

## Examples

### Repulse on Hover, Explode on Click

```js
new ParticleJS('#particles', {
  background: '#101518',
  interactivity: {
    events: ({ onhover: { enable: true, mode: 'repulse' }, onclick: { enable: true, mode: 'explode' } })
  },
  particles: {
    color: { value: '#fff' },
    move: { speed: 2, behavior: 'default' }
  }
}).play();
```

### Rocket Behavior (continuous upward thrust)

```js
new ParticleJS('#particles', {
  particles: { move: { behavior: 'rocket', rocket: { thrust: 160 } } }
}).play();
```

---

## Troubleshooting

- **Nothing renders**: Ensure the container exists and has non-zero size; the constructor throws if the container cannot be found. citeturn1search1 citeturn1search2
- **Canvas covers UI**: The canvas uses `pointer-events: none` and sits at `z-index: 0`; place interactive UI above it. citeturn1search1 citeturn1search2
- **Too many/few particles**: Adjust `particles.number.value`, `value_area`, and `max`. Density scales with CSS area. citeturn1search1 citeturn1search2
- **Interaction source**: Change `interactivity.detect_on` to `'window'`, `'canvas'`, `'container'`, or a specific element. citeturn1search1 citeturn1search2

---

## Changelog

- **2026-01-05** — Engine updated with custom behaviors (`explode`, `rocket`, `slide`, `swirl`), density clamping, and spatial grid line-linking. Default hover/click interactivity remains disabled. citeturn1search1 citeturn1search2

---

## License

@ MIT

