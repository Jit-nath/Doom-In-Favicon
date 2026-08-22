import { Framebuffer } from "../framebuffer/Framebuffer.js";
import { FaviconOutput } from "../favicon/FaviconOutput.js";
import { drawTestPattern } from "../framebuffer/test-patterns.js";

export class BenchmarkRunner {
  constructor({ output = new FaviconOutput({ width: 32, height: 32 }) } = {}) { this.output = output; this.cancelled = false; }
  cancel() { this.cancelled = true; }
  run({ fps = 10, durationMs = 30000, onProgress } = {}) {
    this.cancelled = false;
    const framebuffer = new Framebuffer(this.output.width, this.output.height);
    const interval = 1000 / fps;
    const started = performance.now(); let lastFrame = started; let nextFrame = started; let generated = 0; let updates = 0; let encodeMs = 0; const frameTimes = [];
    return new Promise(resolve => {
      const tick = now => {
        if (this.cancelled || now - started >= durationMs) {
          const elapsed = Math.max(1, now - started);
          resolve({ requestedFps: fps, durationMs: elapsed, generatedFrames: generated, generatedFps: generated * 1000 / elapsed, faviconUpdates: updates, observedUpdateRate: updates * 1000 / elapsed, droppedUpdates: Math.max(0, generated - updates), averageFrameTime: frameTimes.length ? frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length : 0, maxFrameTime: frameTimes.length ? Math.max(...frameTimes) : 0, averageEncodeMs: generated ? encodeMs / generated : 0 });
          return;
        }
        if (now >= nextFrame) {
          const frameStarted = performance.now();
          drawTestPattern(framebuffer, generated);
          const result = this.output.render(framebuffer, { force: true });
          const frameTime = performance.now() - frameStarted;
          frameTimes.push(frameTime); generated++; if (result) { updates++; encodeMs += result.encodedMs || 0; }
          nextFrame += interval;
          while (nextFrame < now) nextFrame += interval;
        }
        onProgress?.({ elapsedMs: now - started, durationMs, generated, updates });
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(now => { lastFrame = now; tick(now); });
    });
  }
}
