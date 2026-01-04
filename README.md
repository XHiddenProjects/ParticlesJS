# ParticleJS — Lightweight Particle Engine

> **Two builds included:**  
> - `particles-es6.js` — modern ES module that exports `ParticleJS` and `ParticleScene`.  
> - `particles.js` — global build attaching `ParticleJS` and `ParticleScene` to `window/globalThis`.

This README covers the design, API, configuration options, presets, and usage patterns for both builds.

---

## Table of Contents

1. [Overview](#overview)  
2. [Key Features](#key-features)  
3. [Quick Start](#quick-start)  
   - [ES Module](#es-module-usage)  
   - [Global Script](#global-script-usage)  
4. [API Reference](#api-reference)  
   - [`class ParticleJS`](#class-particlejs)  
   - [`class ParticleScene`](#class-particlescene)  
5. [Options Schema](#options-schema)  
   - [Particles](#particles)  
   - [Interactivity](#interactivity)  
6. [Built‑in Scene Presets](#built-in-scene-presets)  
7. [Advanced Configuration Examples](#advanced-configuration-examples)  
8. [Rendering & Physics Details](#rendering--physics-details)  
9. [Performance & Responsiveness](#performance--responsiveness)  
10. [Troubleshooting](#troubleshooting)  
11. [FAQ](#faq)  
12. [Appendix: Build Differences](#appendix-build-differences)  

---

## Overview

**ParticleJS** is a small, documented particle engine for browser canvases. It automatically creates and manages a `<canvas>` inside any container element, renders animated shapes or images, draws proximity‑based linking lines, and offers interactive behaviors like **grab**, **bubble**, **repulse**, **push**, and **remove**. It includes three turnkey presets: **rain**, **snow**, and **confetti**.

---

## Key Features

- **Plug‑and‑play canvas**: Auto‑creates a canvas (`class="particle-js"`) inside your container.
- **Density clamping**: Scales particle count to container area, within a configurable cap.
- **Spatial grid line‑linking**: Efficient neighbor lookup to draw lines between nearby particles.
- **Interactivity**: Hover and click modes (grab, bubble, repulse, push, remove).
- **Retina aware**: DPR scaling for sharp rendering on high‑density displays.
- **Scenes**: Built‑in presets + your own reusable configurations with `ParticleScene`.
- **Image particles**: Load external images with cross‑origin support.
- **Two builds**: ES module (`export`) and global (`window.ParticleJS`) for maximum flexibility.

---

## Quick Start

### ES Module Usage

```html
<!-- Your container -->
<div id="hero" style="width:100%;height:300px;position:relative;"></div>

<script type="module">
  import { ParticleJS } from './particles-es6.js';

  // Create engine and start
  const engine = new ParticleJS('#hero', {
    background: 'transparent',
    particles: { number: { value: 80 } }
  });

  engine.play();
</script>
```

#### Using a Built‑in Scene (e.g., Snow)

```html
<script type="module">
  import { ParticleJS } from './particles-es6.js';

  const engine = new ParticleJS('#hero');
  engine.setScene(ParticleJS.Scenes.snow).play();
</script>
```

### Global Script Usage

```html
<div id="hero" style="width:100%;height:300px;position:relative;"></div>

<script src="./particles.js"></script>
<script>
  const engine = new window.ParticleJS('#hero');
  engine.setScene(window.ParticleJS.Scenes.confetti).play();
</script>
```

> **Tip:** Make sure your container has a fixed size (width/height). The engine’s canvas is absolutely positioned and fills the container.

---

## API Reference

### `class ParticleJS`

**Constructor**

```ts
new ParticleJS(container: HTMLElement | string, options?: EngineOptions)
```

- `container`: a DOM element or a CSS selector string.
- Throws an error if the container cannot be found.

**Instance Properties** (read‑only in practice)

- `container: HTMLElement`
- `canvas: HTMLCanvasElement`
- `ctx: CanvasRenderingContext2D`
- `dpr: number` — device pixel ratio used for rendering
- `options: EngineOptions` — merged defaults + user options

**Methods**

- `play(): void`  
  Starts the animation loop (no‑op if already running).

- `pause(): void`  
  Pauses the animation loop (no‑op if already paused).

- `destroy(): void`  
  Unbinds events, stops animation, and removes the canvas from the container.

- `setScene(scene: ParticleScene): ParticleJS`  
  Applies a scene/preset (must be a `ParticleScene` instance), rebinds events, reinitializes the particle set, and returns `this` for chaining.

---

### `class ParticleScene`

A lightweight wrapper for reusable presets.

```ts
class ParticleScene {
  constructor(name: string, config: Partial<EngineOptions> | (engine: ParticleJS) => Partial<EngineOptions>);
  toOptions(engine: ParticleJS): Partial<EngineOptions>;
}
```

- `config` may be a plain object or a function that returns options based on the current engine (useful when you want DPR‑ or size‑aware presets).

---

## Options Schema

Below is the full shape with defaults (property names match the code).

```ts
interface EngineOptions {
  retina_detect?: boolean;              // default: true
  background?: string;                  // default: 'transparent'

  particles?: {
    number?: {
      value?: number;                   // default: 60
      density?: { enable?: boolean; value_area?: number }; // enable: true, value_area: 800
      max?: number;                     // default: 300
    };

    color?: { value?: string | string[] }; // default: '#fff'

    shape?: {
      type?: 'circle'|'edge'|'triangle'|'polygon'|'image'; // default: 'circle'
      stroke?: { width?: number; color?: string };         // width: 0
      polygon?: { nb_sides?: number };                     // default: 5
      image?: { src?: string; width?: number; height?: number }; // src: '', width/height: 100
    };

    opacity?: {
      value?: number;                   // default: 0.6
      random?: boolean;                 // default: false
      anim?: { enable?: boolean; speed?: number; opacity_min?: number; sync?: boolean };
    };

    size?: {
      value?: number;                   // default: 4
      random?: boolean;                 // default: true
      anim?: { enable?: boolean; speed?: number; size_min?: number; sync?: boolean };
    };

    line_linked?: {
      enable?: boolean;                 // default: true
      distance?: number;                // default: 150
      color?: string;                   // default: '#fff'
      opacity?: number;                 // default: 0.4
      width?: number;                   // default: 1
    };

    move?: {
      enable?: boolean;                 // default: true
      /**
       * Speed can be a number or a range [min, max]. When a range is given,
       * a random value within the range is selected per particle.
       */
      speed?: number | [number, number]; // default: 2
      direction?: 'none'|'top'|'bottom'|'left'|'right'|
                  'top-right'|'top-left'|'bottom-right'|'bottom-left'; // default: 'none'
      random?: boolean;                 // default: false (randomize direction angle)
      straight?: boolean;               // default: false (vs directional spread)
      out_mode?: 'out'|'bounce';        // default: 'out'
      bounce?: boolean;                 // default: false (alias to out_mode='bounce')
      attract?: { enable?: boolean; rotateX?: number; rotateY?: number }; // default: disabled
    };
  };

  interactivity?: {
    /**
     * Where pointer events are detected.
     * 'canvas' (default), 'window', or any HTMLElement reference.
     */
    detect_on?: 'canvas'|'window'|HTMLElement; // default: 'canvas'
    events?: {
      onhover?: { enable?: boolean; mode?: 'grab'|'bubble'|'repulse' }; // default: enable=true, mode='grab'
      onclick?: { enable?: boolean; mode?: 'push'|'remove'|'repulse'|'bubble' }; // default: enable=false, mode='push'
      resize?: boolean; // default: true (re-populates on container resize)
    };
    modes?: {
      grab?: { distance?: number; line_linked?: { opacity?: number } };       // distance: 140, opacity: 1
      bubble?: { distance?: number; size?: number; duration?: number; opacity?: number; speed?: number }; // 200, 20, 0.4, 0.8, 3
      repulse?: { distance?: number; duration?: number };                      // 100, 0.4
      push?: { particles_nb?: number };                                       // 4
      remove?: { particles_nb?: number };                                     // 2
    };
  };
}
```

---

## Built‑in Scene Presets

Use via `engine.setScene(ParticleJS.Scenes.<name>)`.

- **`rain`**  
  Transparent canvas, **image** particles (raindrop icon), high count with density scaling, straight downward motion, fast speed range, links disabled.

- **`snow`**  
  White **circle** particles, moderate count, downward drift with randomness, hover **bubble** interaction.

- **`confetti`**  
  Multicolor **edge** (square) particles, moderate count, random motion, links disabled.

> Preset values differ slightly between the ES module and global build for `rain` (e.g., `random` flag), but behavior is overall the same.

---

## Advanced Configuration Examples

### 1) Minimal Custom Setup

```js
const engine = new ParticleJS('#hero', {
  background: '#0b0e14',
  particles: {
    number: { value: 50, density: { enable: true, value_area: 900 }, max: 200 },
    color: { value: '#69f' },
    shape: { type: 'circle' },
    line_linked: { enable: true, distance: 120, color: '#69f', opacity: 0.2, width: 1 },
    move: { enable: true, speed: 1.5, direction: 'none', random: true }
  },
  interactivity: {
    detect_on: 'canvas',
    events: { onhover: { enable: true, mode: 'grab' }, resize: true },
    modes: { grab: { distance: 140, line_linked: { opacity: 0.8 } } }
  }
});
engine.play();
```

### 2) Custom Scene for Reuse

```js
import { ParticleJS, ParticleScene } from './particles-es6.js';

const pastelBubbles = new ParticleScene('pastel-bubbles', (engine) => ({
  background: 'transparent',
  particles: {
    number: { value: 100, density: { enable: true, value_area: 800 }, max: 300 },
    color: { value: ['#ffcfe0', '#cfe9ff', '#e5ffd1'] },
    shape: { type: 'circle' },
    opacity: { value: 0.6, random: true },
    size: { value: 6, random: true },
    line_linked: { enable: false },
    move: { enable: true, speed: 2, direction: 'none', random: true, straight: false }
  },
  interactivity: {
    events: { onhover: { enable: true, mode: 'bubble' }, resize: true },
    modes: { bubble: { distance: 160, size: 10, duration: 0.4, opacity: 0.9, speed: 3 } }
  }
}));

const engine = new ParticleJS('#hero');
engine.setScene(pastelBubbles).play();
```

### 3) Image Particles with Click Interactions

```js
const engine = new ParticleJS('#hero', {
  particles: {
    shape: { type: 'image', image: { src: 'https://example.com/star.png', width: 24, height: 24 } },
    number: { value: 60, density: { enable: true, value_area: 800 }, max: 200 },
    move: { enable: true, speed: [1, 3], direction: 'none', random: true }
  },
  interactivity: {
    events: { onclick: { enable: true, mode: 'push' }, onhover: { enable: true, mode: 'repulse' } },
    modes: { push: { particles_nb: 6 }, repulse: { distance: 100, duration: 0.4 } }
  }
});
engine.play();
```

---

## Rendering & Physics Details

- **Motion**
  - Direction is a unit vector (e.g., `bottom` = `{x:0,y:1}`).
  - `straight: true` moves exactly along the direction vector.
  - `random: true` adds an angle perturbation around that base direction.
  - `speed` may be a number or a `[min,max]` range; a random value is chosen per particle.

- **Out‑of‑bounds behavior**
  - `out_mode: 'out'` wraps particles around with a small margin (±50 px).
  - `out_mode: 'bounce'` inverts velocity when hitting canvas edges.

- **Attraction**
  - Optional `move.attract.enable` applies a centripetal pull toward canvas center scaled by `rotateX/rotateY`.

- **Opacity & Size**
  - Hover/click **bubble** linearly interpolates `size` and `opacity` toward target values within `modes.bubble.distance`, restoring smoothly afterward.

- **Line Linking**
  - If `particles.line_linked.enable` is `true`, the engine builds a coarse grid where each cell size equals `distance`.
  - Only particles within the current cell neighborhood are tested for linking.
  - Line alpha fades with distance (`opacity * (1 - d / distance)`).

- **Grab Lines**
  - On hover with `mode: 'grab'`, lines are drawn from the pointer to nearby particles within `modes.grab.distance`, with a separate opacity control.

- **Images**
  - Images are loaded once and cached (`Map` of promises).
  - If an image isn’t ready, a fallback circle is rendered until it loads.

---

## Performance & Responsiveness

- **Retina scaling** (`retina_detect: true`) multiplies internal canvas resolution by `devicePixelRatio`, improving sharpness at higher GPU/CPU cost.
- **Density clamping** ensures that particle count scales with container area but never exceeds `particles.number.max`.
- **Resize handling** (`interactivity.events.resize: true`) re‑populates particles on container resize and updates canvas resolution.
- **Tips**
  - Disable `line_linked` for large counts if you need maximum FPS.
  - Prefer a modest `distance` and `width` for linking lines.
  - Use `speed` ranges judiciously—very high speeds (e.g., for rain) can be expensive.
  - For image particles, host images with proper CORS headers (engine sets `crossOrigin='anonymous'`).

---

## Troubleshooting

- **“container not found” error**  
  Check the selector or pass a real `HTMLElement`. The engine throws if the container is missing.

- **Canvas not visible**  
  Ensure the container has explicit `width` and `height`. The canvas is positioned absolutely and fills the container.

- **Jagged/blurry lines**  
  Enable `retina_detect: true` (default). If already enabled, verify CSS transforms aren’t scaling the container oddly.

- **Images not rendering**  
  Confirm the `image.src` URL is reachable and supports CORS. Until the image loads, a circle is drawn as a placeholder.

- **High CPU usage**  
  Reduce `particles.number.value` or `max`, disable `line_linked`, lower `distance`, or set `resize: false` if you don’t need density updates on resize.

---

## FAQ

**Q: How do I listen to pointer interactions on the whole window?**  
A: Set `interactivity.detect_on: 'window'`. You can also pass an `HTMLElement` to detect on a custom target.

**Q: Can I create multiple engines on the same page?**  
A: Yes—instantiate multiple `ParticleJS` instances with different containers.

**Q: Does the engine support TypeScript?**  
A: The code is plain JS; you can author your own `d.ts` based on the schema above.

**Q: How do I remove the canvas when I’m done?**  
A: Call `engine.destroy()` to pause, unbind events, and remove the canvas from the container.

---

## Appendix: Build Differences

- **`particles-es6.js`** (ES module):  
  ```js
  import { ParticleJS, ParticleScene } from './particles-es6.js';
  ```  
  Exports classes, ideal for modern bundlers and `type="module"` scripts.

- **`particles.js`** (global):  
  ```js
  const { ParticleJS, ParticleScene } = window;
  ```  
  Registers classes on `window/globalThis`, ideal for classic `<script>` inclusion without bundlers.

---

## License

MIT — © Your Name

