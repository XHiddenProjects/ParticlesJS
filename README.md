# ParticleJS Documentation

> Lightweight, dependency-free particle engine for HTML5 Canvas with **IIFE** and **ES module** builds.

- **IIFE build:** `particles.js` exposes `ParticleJS` and `ParticleScene` on `globalThis` / `window`.
- **ES module build:** `particles-es6.js` exports `ParticleJS` and `ParticleScene`.

---

## Table of Contents

1. [What it is](#what-it-is)
2. [Key features](#key-features)
3. [Quick start](#quick-start)
   - [IIFE build (script tag)](#iife-build-script-tag)
   - [ES module build (import)](#es-module-build-import)
4. [Core concepts](#core-concepts)
   - [ParticleJS](#particlejs)
   - [ParticleScene](#particlescene)
   - [Behaviors](#behaviors)
5. [API reference](#api-reference)
6. [Configuration](#configuration)
   - [Top-level options](#top-level-options)
   - [Particles options](#particles-options)
   - [Interactivity options](#interactivity-options)
   - [Custom behaviors in options](#custom-behaviors-in-options)
7. [Examples](#examples)
8. [Performance & quality tips](#performance--quality-tips)
9. [Troubleshooting](#troubleshooting)
10. [Version](#version)

---

## What it is

ParticleJS is a **Canvas 2D** particle renderer that attaches an internal `<canvas class="particle-js">` to your container element, runs an animation loop via `requestAnimationFrame`, and provides configurable particle spawning, drawing, linking lines, and pointer-based interactivity. 

It supports:

- multiple particle shapes (`circle`, `edge`, `triangle`, `polygon`, `image`) 
- pointer hover/click modes (`grab`, `bubble`, `repulse`, `push`, `remove`, `explode`, `rocketBoost`) 
- pluggable movement behaviors (built-in + custom, global or per-instance) 

---

## Key features

- **Two builds**
  - IIFE: usable directly in browser without a bundler (`window.ParticleJS`).
  - ES module: `import { ParticleJS, ParticleScene } from './particles-es6.js'`.
- **Retina support (DPR-aware):** scales internal canvas by `devicePixelRatio` when `retina_detect` is enabled. 
- **Density scaling:** automatically scales particle count with canvas area (optional). 
- **Scene switching:** apply a new configuration at runtime with `setScene(new ParticleScene(...))`. 
- **Behavior system:** register movement behaviors globally or per engine instance; behaviors can be composed. 

---

## Quick start

### IIFE build (script tag)

```html
<div id="hero" style="position: relative; height: 320px;"></div>
<script src="./particles.js"></script>
<script>
  const engine = new ParticleJS('#hero', {
    background: 'transparent',
    particles: {
      number: { value: 80 },
      color: { value: ['#ffffff', '#aaccff'] },
      line_linked: { enable: true, distance: 140 }
    },
    interactivity: {
      events: {
        onhover: { enable: true, mode: 'repulse' },
        onclick: { enable: true, mode: 'push' }
      }
    }
  });

  engine.play();
</script>
```

- `particles.js` attaches a canvas to your container; if the container is `position: static`, it is set to `position: relative`.
- The canvas uses `pointer-events: none` so it won't block UI interactions in the container. 

### ES module build (import)

```html
<div id="hero" style="position: relative; height: 320px;"></div>
<script type="module">
  import { ParticleJS, ParticleScene } from './particles-es6.js';

  const scene = new ParticleScene('calm', {
    background: 'transparent',
    particles: {
      move: { behavior: 'swirl', speed: 1.2 },
      line_linked: { enable: false }
    },
    interactivity: {
      events: { onhover: { enable: false }, onclick: { enable: false } }
    }
  });

  const engine = new ParticleJS('#hero', scene.toOptions());
  engine.play();
</script>
```

`particles-es6.js` provides the same engine as an ES module export.

---

## Core concepts

### ParticleJS

The engine class:

- **Constructor:** `new ParticleJS(container, options?)` where `container` is an `HTMLElement` or a selector string. 
- **Lifecycle:** `play()`, `pause()`, `destroy()` 
- **Scene management:** `setScene(scene)` re-applies defaults, rebinds events, resizes, and repopulates particles. 

Internally, the engine:

- creates or reuses `canvas.particle-js` inside the container 
- maintains a particle array and updates/draws each frame 
- optionally draws linking lines and hover "grab" lines 

### ParticleScene

A scene is a named wrapper around a configuration object **or** a function returning options:

```js
const scene = new ParticleScene('dense', (engine) => ({
  particles: {
    number: { value: 120, max: 300 }
  }
}));
```

`scene.toOptions(engine)` resolves the final options (useful for functional scenes). 

### Behaviors

ParticleJS has a **movement behavior registry**:

- built-in behaviors include: `default`, `rocket`, `slide`, `swirl`. 
- register globally: `ParticleJS.registerBehavior(name, fn)` 
- register per instance: `engine.registerBehavior(name, fn)` 

Behaviors can be specified as:

- a **string** (name of a behavior)
- a **function** `(particle, dtSeconds, engine) => void | { skipPhysics?: boolean }`
- an **array** of strings/functions (composed behaviors executed in order) 

Per-particle override is supported via `p.behavior` (same spec types). 

> **Error isolation:** behavior exceptions are caught and logged via `console.warn` so the animation loop continues. 

---

## API reference

### `new ParticleJS(container, options?)`

- **container:** `HTMLElement | string` selector. Throws if not found. 
- **options:** configuration; defaults are applied via an internal merge. 

### `engine.play()`

Starts the `requestAnimationFrame` loop and advances the simulation with a capped timestep (`dt <= 0.05s`). 

### `engine.pause()`

Stops the loop and cancels the RAF handle. 

### `engine.destroy()`

Unbinds events, stops animation, and removes the canvas from the container (if present). 

### `engine.setScene(scene)`

- requires an instance of `ParticleScene`
- re-applies defaults and reinitializes (events, resize, particle population) 

### `ParticleJS.registerBehavior(name, fn)` (static)

Registers a behavior in the global registry. Validates argument types. 

### `engine.registerBehavior(name, fn)`

Registers a behavior on one engine instance. Validates argument types. 

### `ParticleJS.unregisterBehavior(name)` / `engine.unregisterBehavior(name)`

Removes the named behavior from the corresponding registry. 

---

## Configuration

ParticleJS merges user-provided options onto a default configuration. 

### Top-level options

- `retina_detect: boolean` -- DPR scaling. 
- `background: string` -- canvas background (`transparent` by default). 
- `particles: object` -- particle appearance & movement. 
- `interactivity: object` -- hover/click/resize behaviors. 
- `behaviors: object` -- optional registry of custom behaviors (name -> fn) that can be referenced by string. 

### Particles options

Below are the most commonly used knobs (names match the engine defaults): 

#### `particles.number`

- `value: number` -- base particle count. 
- `density.enable: boolean` -- scale count by canvas area. 
- `density.value_area: number` -- reference area for density scaling (default `800`). 
- `max: number` -- hard cap for particle count (default `300`). 

#### `particles.color`

- `value: string | string[]` -- a color or list of colors; one is picked at spawn time. 

#### `particles.shape`

- `type: 'circle' | 'edge' | 'triangle' | 'polygon' | 'image'` 
- `stroke.width`, `stroke.color` -- outline settings. 
- `polygon.nb_sides` -- polygon side count. 
- `image.src`, `image.width`, `image.height` -- image particle source and draw size. 

> Image particles are loaded via `new Image()` and cached by source URL. 

#### `particles.opacity` / `particles.size`

- `value: number`
- `random: boolean`
- `anim.enable`, `anim.speed`, `anim.*` are present in defaults but animation is not explicitly implemented in the core step shown in these builds. 

#### `particles.line_linked`

- `enable: boolean`
- `distance: number` -- max link distance.
- `color: string`, `opacity: number`, `width: number` 

The engine uses a uniform grid to reduce the cost of line linking by only checking nearby cells. 

#### `particles.physics`

- `drag: number` -- applied each frame as `dragFactor = drag ** (dt * 60)`.
- `gravity: number` -- vertical acceleration term added to `vy`. 

#### `particles.move`

- `enable: boolean`
- `speed: number | [min, max]`
- `direction: 'none' | 'top' | 'bottom' | 'left' | 'right' | 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'` 
- `random: boolean`, `straight: boolean`
- `out_mode: 'out' | 'bounce'` -- wrap or bounce at bounds.
- `attract.enable`, `attract.rotateX`, `attract.rotateY` -- center attraction.
- `behavior: string | fn | (string|fn)[]` -- movement behaviors (see [Behaviors](#behaviors)). 

### Interactivity options

#### `interactivity.detect_on`

Where pointer coordinates are measured:

- `'container'` (default)
- `'canvas'`
- `'window'`
- or a custom element reference 

#### `interactivity.events`

- `onhover.enable: boolean`, `onhover.mode: 'grab' | 'bubble' | 'repulse' | 'slide'` 
- `onclick.enable: boolean`, `onclick.mode: 'push' | 'remove' | 'repulse' | 'bubble' | 'explode' | 'rocketBoost'` 
- `resize: boolean` -- repopulates particles on resize. 

> Note: hover and click are **disabled by default** in the default options. 

#### `interactivity.modes`

Mode settings used by hover/click logic:

- `grab.distance`, `grab.line_linked.opacity` 
- `bubble.distance`, `bubble.size`, `bubble.opacity`, `bubble.duration` 
- `repulse.distance`, `repulse.duration` 
- `push.particles_nb`, `remove.particles_nb` 
- `explode.power`
- `rocketBoost.power` 

### Custom behaviors in options

In addition to registering behaviors via API, you can provide a registry inside options and reference behaviors by name:

- `options.behaviors` -- custom registry merged into the resolution map 
- `options.particles.move.behaviors` -- additional behavior registry at the move level 

---

## Examples

### 1) Switch scenes at runtime

```js
const calm = new ParticleScene('calm', { particles: { move: { speed: 1 }, line_linked: { enable: false } } });
const busy = new ParticleScene('busy', { particles: { number: { value: 140 }, line_linked: { enable: true } } });

const engine = new ParticleJS('#hero', calm.toOptions());
engine.play();

// Later...
engine.setScene(busy);
```

Scene application via `setScene` triggers rebind, resize, and repopulation. 

### 2) Add a custom behavior (global)

```js
ParticleJS.registerBehavior('driftRight', (p, dt, engine) => {
  p.vx += 15 * engine.dpr * dt;
});

const engine = new ParticleJS('#hero', {
  particles: { move: { behavior: 'driftRight', speed: 1 } }
});
engine.play();
```

Global behavior registration is supported via `ParticleJS.registerBehavior`. 

### 3) Compose behaviors

```js
const engine = new ParticleJS('#hero', {
  particles: {
    move: {
      behavior: ['swirl', (p, dt) => { p.vy += 10 * dt; }]
    }
  }
});
```

Behavior specs can be arrays (executed in order). 

### 4) Click to "explode"

```js
const engine = new ParticleJS('#hero', {
  interactivity: {
    events: { onclick: { enable: true, mode: 'explode' } },
    modes: { explode: { power: 420 } }
  }
});
engine.play();
```

The `explode` click mode applies an impulse based on distance to click position. 

---

## Performance & quality tips

- **Keep particle count reasonable.** Use `particles.number.max` to cap density scaling. 
- **Reduce linking cost** by disabling `line_linked` or lowering `distance` and `opacity`. Linking checks neighbors in a grid, but still scales with particle count. 
- **Retina tradeoff:** `retina_detect` improves sharpness at the cost of more pixels to render. 
- **Prefer simple shapes** over image particles for large counts (image draw calls are heavier). Image sources are cached. 

---

## Troubleshooting

### Canvas not visible

- Ensure the container has a non-zero size (e.g., set `height`). The engine sizes the canvas to the container's bounding box. 

### Particles look blurry

- Enable `retina_detect` (default) so the canvas scales with DPR. 

### Hover/click do nothing

- Hover and click are disabled by default; set:

```js
interactivity: {
  events: {
    onhover: { enable: true, mode: 'grab' },
    onclick: { enable: true, mode: 'push' }
  }
}
```

Interactivity event toggles default to `false`. 

### My custom behavior breaks animation

- Behavior errors are caught; check DevTools console for `ParticleJS behavior error`. 

---

## Version

- `particles.js`: `@version 2026-01-05`
- `particles-es6.js`: `@version 2026-01-05`

---

### Appendix: Minimal full configuration skeleton

Below is a compact scaffold you can copy and customize (values shown are representative of the built-in defaults). 

```js
const options = {
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
    opacity: { value: 0.6, random: false, anim: { enable: false } },
    size: { value: 4, random: true, anim: { enable: false } },
    line_linked: { enable: true, distance: 150, color: '#fff', opacity: 0.4, width: 1 },
    physics: { drag: 0.98, gravity: 0 },
    move: {
      enable: true,
      speed: 2,
      direction: 'none',
      random: false,
      straight: false,
      out_mode: 'out',
      bounce: false,
      attract: { enable: false, rotateX: 600, rotateY: 1200 },
      behavior: 'default',
      rocket: { thrust: 120 },
      slide: { stiffness: 4 },
      swirl: { strength: 60 }
    }
  },
  interactivity: {
    detect_on: 'container',
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
};
```


