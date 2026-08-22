import { vi } from "vitest";

globalThis.requestAnimationFrame = callback => setTimeout(() => callback(performance.now()), 16);
globalThis.cancelAnimationFrame = id => clearTimeout(id);
HTMLCanvasElement.prototype.getContext = function getContext() {
  return { putImageData: vi.fn() };
};
HTMLCanvasElement.prototype.toDataURL = vi.fn(() => "data:image/png;base64,test");
