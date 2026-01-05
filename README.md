
# ParticleJS Engine – Professional Documentation (Clean Edition)

> CDN:
> https://cdn.jsdelivr.net/gh/XHiddenProjects/ParticlesJS@1.0.3/particles-es6.min.js
> https://cdn.jsdelivr.net/gh/XHiddenProjects/ParticlesJS@1.0.3/particles.min.js


**Updated:** 2026-01-05  
**Builds:** IIFE (global) and ES Module

## Overview
ParticleJS is a lightweight, canvas-based particle engine featuring density-aware population, spatial-grid line-link rendering, and interactive modes (hover/click) with custom behaviors like **rocket**, **slide**, **swirl**, and **explosion**. By default, hover and click interactivity are disabled.

### Build Variants
- **IIFE / globals:** `ParticleJS` and `ParticleScene` are attached to the global object (via `globalThis`), suitable for direct `<script>` usage.
- **ES Module:** `ParticleJS` and `ParticleScene` are exported for module-based bundlers/imports.

## Quick Start

### IIFE (global) usage
The IIFE build attaches a `<canvas class="particle-js">` to the target container and exposes `ParticleJS`/`ParticleScene` globally.

```html
<div id="hero" style="height: 300px; position: relative;"></div>
<script src="./particles.js"></script>
<script>
  const engine = new ParticleJS('#hero', {
    background: 'transparent',
    interactivity: { events: { onhover: { enable: true, mode: 'grab' } } }
  });
  engine.play();

  // Switch to a predefined scene
  engine.setScene(ParticleJS.Particles.confetti);
</script>
```

### ES Module usage
Import the classes directly:

```js
import { ParticleJS, ParticleScene } from './particles-es6.js';

const engine = new ParticleJS(document.querySelector('#hero'), {
  background: 'transparent'
});
engine.play();

// Use a predefined scene
engine.setScene(ParticleJS.Particles.rocket);
```

## Core Classes

### `ParticleScene`
Holds a named scene configuration. Accepts a plain options object or a function that derives options from the running engine.
- **Constructor:** `new ParticleScene(name, config)` where `config` is `Object | (engine) => Object`.
- **Method:** `toOptions(engine)` – resolves the scene to an options object.

### `ParticleJS`
- **Constructor:** `new ParticleJS(container, options?)` with `container: HTMLElement | string` and optional `options`. Throws if the container cannot be found.
- **Canvas:** Ensures/creates a full-size `<canvas class="particle-js">` inside the container, sets `aria-hidden="true"` and `pointer-events: none`. If the container has `position: static`, it is changed to `position: relative`.
- **Retina:** Detects `devicePixelRatio` and scales internal resolution when `retina_detect` is enabled.
- **Methods:**
  - `play()` – starts the animation loop (requestAnimationFrame).
  - `pause()` – pauses the animation loop.
  - `destroy()` – unbinds events and removes the canvas from the container.
  - `setScene(scene)` – applies a `ParticleScene`, rebinds events, resizes, and repopulates.
- **Static Scenes:** `ParticleJS.Particles` includes: `rain`, `snow`, `confetti`, `explosion`, `rocket`, `slide`.

## Options Schema (defaults)
The engine merges user options with a default schema. Key sections and defaults:

### Top-level
- `background: 'transparent'` – canvas background.
- `retina_detect: true` – enable DPI scaling.

### `particles`
- `number.value: 60`, `number.density: { enable: true, value_area: 800 }`, `number.max: 300` – density-aware count clamped by `max`.
- `color.value: '#fff'` – particle fill color (supports arrays for random picks).
- `shape.type: 'circle'` with optional `stroke`, `polygon.nb_sides`, and `image { src, width, height }`.
- `opacity.value: 0.6` (optionally random/animated).
- `size.value: 4` (optionally random/animated).
- `line_linked`: `{ enable: true, distance: 150, color: '#fff', opacity: 0.4, width: 1 }` – link lines drawn via a spatial grid for performance.
- `physics`: `{ drag: 0.98, gravity: 0 }`.
- `move`:
  - `enable: true`, `speed: 2`, `direction: 'none'`, `random: false`, `straight: false`, `out_mode: 'out'`, `bounce: false`.
  - `attract: { enable: false, rotateX: 600, rotateY: 1200 }`.
  - `behavior: 'default'` with extras: `rocket.thrust`, `slide.stiffness`, `swirl.strength`.

### `interactivity`
- `detect_on: 'container'` (also `'window'` or `'canvas'`).
- `events.onhover: { enable: false, mode: 'grab' }`.
- `events.onclick: { enable: false, mode: 'push' }`.
- `events.resize: true` – repopulates on resize.
- `modes`: `grab`, `bubble`, `repulse`, `push`, `remove`, `explode`, `rocketBoost`.

## Rendering & Simulation Details
- **Population:** Density-aware spawn uses container pixel area (CSS size × DPR) to scale `number.value`, then clamps to `number.max`.
- **Motion:** Drag is applied exponentially per frame; gravity adds to vertical velocity; behaviors modify forces (e.g., `rocket` subtracts vertical velocity by `thrust`).
- **Bounds:** With `out_mode: 'bounce'`, particles reflect at edges; otherwise they wrap with an offscreen margin.
- **Shapes:** Supports `circle`, `edge` (square), `triangle`, `polygon`, and `image`. Image resources are loaded with CORS enabled and cached per `src`.
- **Link Lines:** A spatial grid bins particles to reduce pair checks, drawing lines within `line_linked.distance` using opacity falloff.

## Interactivity
- **Hover:** Modes `grab`, `bubble`, `repulse`, `slide` (when enabled). Effects are distance-based to the pointer in engine coordinates (DPR-scaled).
- **Click:** Modes `push`, `remove`, `repulse`, `bubble`, `explode`, `rocketBoost`. Bubble mode respects a short time window after the last click.
- **Pointer Targeting:** `detect_on` selects the event target (`window`, `canvas`, or `container`).

## Predefined Scenes
Each build ships scene presets under `ParticleJS.Particles`. Some parameters differ between builds.

### IIFE / Globals (from `particles.js`)
- **`rain`**: transparent background; image-shaped drops; speed `[60,120]`; direction `'bottom-right'`; straight motion.
- **`snow`**: circular flakes; `onhover` bubble enabled; random drift; speed `12`.
- **`confetti`**: multicolor squares (`edge`), random motion; speed `50`; no line links.
- **`explosion`**: multicolor circles; gravity `20`; click `explode` mode with `power: 400`.
- **`rocket`**: gravity `35` plus behavior `'rocket'` with `thrust: 140`; click `rocketBoost` power `220`.
- **`slide`**: line-linked network; behavior `'slide'` with `stiffness: 4`; `out_mode: 'bounce'`.

### ES Module (from `particles-es6.js`)
- **`rain`**: transparent background; image-shaped drops; speed `[60,120]`; direction `'bottom'`; straight motion with randomness enabled.
- **`snow`**: circular flakes; `onhover` bubble enabled; random drift; speed `12`.
- **`confetti`**: multicolor squares (`edge`), random motion; speed `20`; no line links.
- **`explosion`**: multicolor circles; gravity `20`; click `explode` mode with `power: 400`.
- **`rocket`**: gravity `35` plus behavior `'rocket'` with `thrust: 140`; click `rocketBoost` power `220`.
- **`slide`**: line-linked network; behavior `'slide'` with `stiffness: 4`; `out_mode: 'bounce'`.

## Usage Patterns

### Switching Scenes at Runtime
Swap presets or custom scenes to change behavior without recreating the engine.

```js
// Predefined scene
engine.setScene(ParticleJS.Particles.explosion);

// Custom scene (function form)
const custom = new ParticleScene('swirl-demo', (eng) => ({
  background: 'transparent',
  particles: {
    number: { value: 100, density: { enable: true, value_area: 800 }, max: 300 },
    color: { value: ['#ffd166','#ef476f','#06d6a0','#118ab2','#8338ec'] },
    shape: { type: 'circle' },
    opacity: { value: 0.8 },
    size: { value: 3, random: true },
    line_linked: { enable: false },
    physics: { drag: 0.98, gravity: 0 },
    move: { enable: true, speed: 2, behavior: 'swirl', swirl: { strength: 60 } }
  }
}));
engine.setScene(custom);
```

### Interactivity Examples
Enable hover **repulse** and click **explode**:

```js
engine.setScene(new ParticleScene('interactive', {
  interactivity: {
    events: {
      onhover: { enable: true, mode: 'repulse' },
      onclick: { enable: true, mode: 'explode' },
      resize: true
    },
    modes: { repulse: { distance: 100, duration: 0.4 }, explode: { power: 300 } }
  }
}));
```

## Lifecycle & Events
- **Event binding:** Handlers for pointer move/leave/click attach to the `detect_on` target; removed on `destroy()`.
- **Resize:** Canvas resizes to container bounds (DPR-aware) and repopulates particles when `events.resize` is true.

## Accessibility & Styling
Canvas is positioned absolutely inside the container and marked `aria-hidden` with `pointer-events: none` so it doesn’t block UI interactions.

## Example: Minimal Configuration

```js
const engine = new ParticleJS('#hero', {
  particles: {
    number: { value: 80, density: { enable: true, value_area: 800 }, max: 200 },
    color: { value: '#ffffff' },
    shape: { type: 'circle' },
    opacity: { value: 0.8, random: true },
    size: { value: 3, random: true },
    line_linked: { enable: false },
    physics: { drag: 0.99, gravity: 0 },
    move: { enable: true, speed: 2, direction: 'none', behavior: 'default' }
  },
  interactivity: { events: { onhover: { enable: true, mode: 'grab' }, resize: true } }
});
engine.play();
```

---
**Attribution:** Documentation generated from the provided source files (`particles.js`, `particles-es6.js`).
