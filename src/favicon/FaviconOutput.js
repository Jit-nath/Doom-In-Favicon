export class FaviconOutput {
  constructor({ width = 32, height = 32, documentRef = document, linkId = "dynamic-favicon" } = {}) {
    this.width = width; this.height = height; this.document = documentRef; this.linkId = linkId;
    this.canvas = documentRef.createElement("canvas"); this.canvas.width = width; this.canvas.height = height; this.canvas.className = "hidden-canvas";
    this.context = this.canvas.getContext("2d", { willReadFrequently: false });
    // Reuse the page's original icon link. Keeping a second rel="icon" can
    // make Chromium continue displaying the static icon instead of the data URL.
    this.link = documentRef.getElementById(linkId) || documentRef.querySelector('link[rel~="icon"]') || documentRef.createElement("link");
    this.link.id = linkId; this.link.rel = "icon"; this.link.type = "image/png";
    if (!this.link.parentNode) documentRef.head.appendChild(this.link);
    this.framesGenerated = 0; this.updates = 0; this.lastFrameAt = 0; this.lastHash = null; this.updateTimes = [];
  }

  render(frame, { force = false } = {}) {
    if (frame.width !== this.width || frame.height !== this.height) throw new RangeError("Favicon frame dimensions do not match output dimensions");
    this.framesGenerated++;
    const hash = typeof frame.hash === "function" ? frame.hash() : hashBytes(frame.data);
    if (!force && hash === this.lastHash) return false;
    const started = performance.now();
    this.context.putImageData(frame.toImageData ? frame.toImageData() : frame, 0, 0);
    this.link.href = this.canvas.toDataURL("image/png");
    this.lastHash = hash; this.updates++; this.lastFrameAt = performance.now(); this.updateTimes.push(this.lastFrameAt);
    return { encodedMs: this.lastFrameAt - started, hash };
  }

  recentFps(windowMs = 1000, now = performance.now()) {
    const threshold = now - windowMs;
    this.updateTimes = this.updateTimes.filter(timestamp => timestamp >= threshold);
    return this.updateTimes.length;
  }

  reset() { this.lastHash = null; this.framesGenerated = 0; this.updates = 0; this.updateTimes = []; }
  stats() { return { framesGenerated: this.framesGenerated, faviconUpdates: this.updates, lastFrameAt: this.lastFrameAt }; }
}

function hashBytes(data) { let hash = 2166136261; for (const byte of data) { hash ^= byte; hash = Math.imul(hash, 16777619); } return hash >>> 0; }
