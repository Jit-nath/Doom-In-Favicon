import { Framebuffer } from "../src/framebuffer/Framebuffer.js";
import { downsample } from "../src/framebuffer/downsample.js";

describe("Framebuffer", () => {
  it("writes and reads pixels", () => { const frame = new Framebuffer(2, 2); frame.setPixel(1, 0, 1, 2, 3); expect(frame.getPixel(1, 0)).toEqual([1, 2, 3, 255]); });
  it("clips filled rectangles", () => { const frame = new Framebuffer(2, 2).clear([0, 0, 0, 255]); frame.fillRect(-1, -1, 2, 2, [255, 0, 0, 255]); expect(frame.getPixel(0, 0)).toEqual([255, 0, 0, 255]); expect(frame.getPixel(1, 1)).toEqual([0, 0, 0, 255]); });
  it("downsamples with nearest neighbor", () => { const frame = new Framebuffer(2, 2).clear([0, 0, 0, 255]); frame.setPixel(1, 1, 255, 0, 0); const small = downsample(frame, 1, 1); expect(small.getPixel(0, 0)).toEqual([0, 0, 0, 255]); });
  it("preserves aspect ratio with letterboxing", () => { const frame = new Framebuffer(4, 2).clear([255, 0, 0, 255]); const small = downsample(frame, 4, 4, { preserveAspect: true, background: [0, 0, 0, 255] }); expect(small.getPixel(0, 0)).toEqual([0, 0, 0, 255]); expect(small.getPixel(0, 1)).toEqual([255, 0, 0, 255]); });
});
