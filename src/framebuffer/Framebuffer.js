export class Framebuffer {
  constructor(width, height, data) {
    if (!Number.isInteger(width) || width <= 0 || !Number.isInteger(height) || height <= 0) {
      throw new RangeError("Framebuffer dimensions must be positive integers");
    }
    this.width = width;
    this.height = height;
    this.data = data instanceof Uint8ClampedArray ? data : new Uint8ClampedArray(width * height * 4);
    if (this.data.length !== width * height * 4) throw new RangeError("Framebuffer data has the wrong length");
  }

  index(x, y) { return (y * this.width + x) * 4; }

  setPixel(x, y, r, g, b, a = 255) {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;
    const i = this.index(x, y);
    this.data[i] = r; this.data[i + 1] = g; this.data[i + 2] = b; this.data[i + 3] = a;
  }

  getPixel(x, y) {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return [0, 0, 0, 0];
    const i = this.index(x, y);
    return Array.from(this.data.slice(i, i + 4));
  }

  clear(color = [0, 0, 0, 255]) {
    for (let i = 0; i < this.data.length; i += 4) {
      this.data[i] = color[0]; this.data[i + 1] = color[1]; this.data[i + 2] = color[2]; this.data[i + 3] = color[3] ?? 255;
    }
    return this;
  }

  fillRect(x, y, width, height, color) {
    const left = Math.max(0, Math.floor(x));
    const top = Math.max(0, Math.floor(y));
    const right = Math.min(this.width, Math.ceil(x + width));
    const bottom = Math.min(this.height, Math.ceil(y + height));
    for (let py = top; py < bottom; py++) for (let px = left; px < right; px++) this.setPixel(px, py, ...color);
    return this;
  }

  toImageData() {
    if (typeof ImageData === "undefined") return { data: this.data, width: this.width, height: this.height };
    return new ImageData(this.data, this.width, this.height);
  }

  clone() { return new Framebuffer(this.width, this.height, new Uint8ClampedArray(this.data)); }

  hash() {
    let hash = 2166136261;
    for (const byte of this.data) { hash ^= byte; hash = Math.imul(hash, 16777619); }
    return hash >>> 0;
  }
}
