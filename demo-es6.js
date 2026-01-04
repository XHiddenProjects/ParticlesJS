import { ParticleJS, ParticleScene } from './particles-es6.js';

const engine = new ParticleJS('#hero');

// ✅ Pass a ParticleScene instance
engine.setScene(ParticleJS.Particles.rain).play();

// ❌ These will throw:
// engine.setScene('rain');
// engine.setScene({ particles: { number: { value: 200 } } });
// engine.setScene((eng) => ({ background: '#000' }));

// Creating your own scene:
const starfield = new ParticleScene('starfield', (engine) => ({
  background: '#000014',
  particles: {
    number: { value: 200, density: { enable: true, value_area: 800 }, max: 500 },
    color:  { value: ['#ffffff', '#a2c6ff', '#ffe1a2'] },
    shape:  { type: 'circle' },
    opacity:{ value: 1, random: true },
    size:   { value: 2, random: true },
    line_linked: { enable: false },
    move: { enable: true, speed: 10, direction: 'none', random: true, straight: false, out_mode: 'out' }
  },
  interactivity: { events: { onhover: { enable: false }, onclick: { enable: false }, resize: true } }
}));

//engine.setScene(starfield);

