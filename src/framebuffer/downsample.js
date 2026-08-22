import { Framebuffer } from "./Framebuffer.js";

export function downsample(source, width, height, { filter = "nearest", preserveAspect = false, background = [0, 0, 0, 255] } = {}) {
  const input = source.data ? source : new Framebuffer(source.width, source.height, source.data);
  const output = new Framebuffer(width, height).clear(background);
  const scale = preserveAspect ? Math.min(width / input.width, height / input.height) : null;
  const drawWidth = scale ? Math.max(1, Math.round(input.width * scale)) : width;
  const drawHeight = scale ? Math.max(1, Math.round(input.height * scale)) : height;
  const offsetX = Math.floor((width - drawWidth) / 2);
  const offsetY = Math.floor((height - drawHeight) / 2);

  for (let y = 0; y < drawHeight; y++) {
    const sy = Math.min(input.height - 1, Math.floor(y * input.height / drawHeight));
    for (let x = 0; x < drawWidth; x++) {
      const sx = Math.min(input.width - 1, Math.floor(x * input.width / drawWidth));
      const sourceIndex = (sy * input.width + sx) * 4;
      if (filter === "average") {
        const sample = averageSample(input, x, y, drawWidth, drawHeight);
        output.setPixel(offsetX + x, offsetY + y, ...sample);
      } else {
        output.setPixel(offsetX + x, offsetY + y, input.data[sourceIndex], input.data[sourceIndex + 1], input.data[sourceIndex + 2], input.data[sourceIndex + 3]);
      }
    }
  }
  return output;
}

function averageSample(input, x, y, outputWidth, outputHeight) {
  const x0 = Math.floor(x * input.width / outputWidth);
  const x1 = Math.max(x0 + 1, Math.ceil((x + 1) * input.width / outputWidth));
  const y0 = Math.floor(y * input.height / outputHeight);
  const y1 = Math.max(y0 + 1, Math.ceil((y + 1) * input.height / outputHeight));
  const total = [0, 0, 0, 0]; let count = 0;
  for (let py = y0; py < Math.min(y1, input.height); py++) for (let px = x0; px < Math.min(x1, input.width); px++) {
    const i = (py * input.width + px) * 4;
    for (let channel = 0; channel < 4; channel++) total[channel] += input.data[i + channel];
    count++;
  }
  return total.map(value => Math.round(value / count));
}
