if(window.ParticleJS){
    const particles = new ParticleJS('#hero');
    particles.setScene(ParticleJS.Particles.rain);
    particles.play();

}else throw new Error('ParticleJS has not been loaded');
