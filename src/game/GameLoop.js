export class GameLoop {
  constructor({ update, render, simulationFps = 60, renderFps = 10, onStats } = {}) {
    this.update = update; this.render = render; this.simulationStep = 1 / simulationFps; this.renderInterval = 1000 / renderFps; this.onStats = onStats; this.running = false; this.paused = false; this.accumulator = 0; this.lastTime = 0; this.lastRender = 0; this.frameCount = 0; this.raf = null;
  }
  start() { if (this.running) return; this.running = true; this.lastTime = performance.now(); this.lastRender = this.lastTime; this.raf = requestAnimationFrame(this.tick); }
  stop() { this.running = false; if (this.raf !== null) cancelAnimationFrame(this.raf); this.raf = null; }
  setPaused(paused) { this.paused = paused; }
  setRenderFps(fps) { this.renderInterval = 1000 / Math.max(1, fps); }
  tick = now => {
    if (!this.running) return;
    const elapsed = Math.min(250, now - this.lastTime); this.lastTime = now;
    if (!this.paused) {
      this.accumulator += elapsed / 1000;
      while (this.accumulator >= this.simulationStep) { this.update(this.simulationStep); this.accumulator -= this.simulationStep; }
      if (now - this.lastRender >= this.renderInterval) { this.render(this.accumulator / this.simulationStep); this.lastRender = now; this.frameCount++; }
    }
    this.onStats?.({ now, frameCount: this.frameCount, paused: this.paused });
    this.raf = requestAnimationFrame(this.tick);
  };
}
