import { Framebuffer } from "./Framebuffer.js";

export function drawTestPattern(framebuffer, frame = 0) {
  const { width, height } = framebuffer;
  framebuffer.clear([8, 11, 13, 255]);
  const split = Math.floor(height * 0.58);
  framebuffer.fillRect(0, 0, width, split, [28, 16, 15, 255]);
  framebuffer.fillRect(0, split, width, height - split, [12, 15, 17, 255]);
  const horizon = Math.floor(width / 2 + Math.sin(frame / 14) * width / 6);
  framebuffer.fillRect(horizon - 2, split - 2, 4, 4, [242, 191, 114, 255]);
  const barWidth = Math.max(1, Math.floor(width / 8));
  for (let i = 0; i < 8; i++) framebuffer.fillRect(i * barWidth, height - 3, barWidth, 3, i % 2 ? [197, 59, 46, 255] : [242, 191, 114, 255]);
  return framebuffer;
}

export function makeTestPattern(width = 32, height = 32) { return new Framebuffer(width, height); }
