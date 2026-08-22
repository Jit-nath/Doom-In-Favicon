const WIDTH = 320;
const HEIGHT = 200;
const ACTION_TO_DOOM_EXPORT = new Map([
  ["moveForward", "KEY_UPARROW"],
  ["moveBackward", "KEY_DOWNARROW"],
  ["turnLeft", "KEY_LEFTARROW"],
  ["turnRight", "KEY_RIGHTARROW"],
  ["strafeLeft", "KEY_STRAFE_L"],
  ["strafeRight", "KEY_STRAFE_R"],
  ["fire", "KEY_FIRE"],
  ["use", "KEY_USE"],
  ["run", "KEY_SHIFT"],
  ["pause", "KEY_ESCAPE"]
]);

export class DoomAdapter {
  constructor({ wasmUrl = "/doom.wasm", onFrame, onMessage } = {}) {
    this.wasmUrl = wasmUrl; this.onFrame = onFrame; this.onMessage = onMessage; this.instance = null; this.memory = null; this.running = false; this.lastFrame = null; this.width = WIDTH; this.height = HEIGHT; this.frameData = new Uint8ClampedArray(WIDTH * HEIGHT * 4); this.wadBytes = null; this.wadLength = 0;
  }

  async load({ wadBuffer } = {}) {
    if (!(wadBuffer instanceof ArrayBuffer)) throw new Error("DoomAdapter.load requires a WAD ArrayBuffer.");
    this.wadBytes = new Uint8Array(wadBuffer); this.wadLength = this.wadBytes.byteLength;
    const imports = this.createImports();
    let result;
    try { result = await WebAssembly.instantiateStreaming(fetch(this.wasmUrl), imports); }
    catch { const response = await fetch(this.wasmUrl); if (!response.ok) throw new Error(`Unable to load ${this.wasmUrl}. Add the doom.wasm runtime to public/.`); result = await WebAssembly.instantiate(await response.arrayBuffer(), imports); }
    this.instance = result.instance; this.memory = this.instance.exports.memory;
    this.instance.exports.initGame();
    return this;
  }

  createImports() {
    return {
      loading: { onGameInit: (width, height) => { this.width = width || WIDTH; this.height = height || HEIGHT; this.frameData = new Uint8ClampedArray(this.width * this.height * 4); }, wadSizes: (countPtr, totalBytesPtr) => { this.writeI32(countPtr, 1); this.writeI32(totalBytesPtr, this.wadLength); }, readWads: (destination, lengthPtr) => { this.copyWad(destination, lengthPtr); } },
      ui: { drawFrame: pointer => this.copyFrame(pointer) },
      runtimeControl: { timeInMilliseconds: () => BigInt(Math.trunc(performance.now())) },
      console: { onInfoMessage: (pointer, length) => this.message(pointer, length, false), onErrorMessage: (pointer, length) => this.message(pointer, length, true) },
      gameSaving: { sizeOfSaveGame: () => 0, readSaveGame: () => 0, writeSaveGame: () => 0 }
    };
  }

  copyWad(destination, lengthPtr) {
    new Uint8Array(this.memory.buffer).set(this.wadBytes, destination);
    this.writeI32(lengthPtr, this.wadLength);
  }

  writeI32(pointer, value) { new DataView(this.memory.buffer).setInt32(pointer, value, true); }

  copyFrame(pointer) {
    const bytes = new Uint8Array(this.memory.buffer, pointer, this.width * this.height * 4);
    const output = this.frameData;
    for (let i = 0; i < this.width * this.height; i++) { const source = i * 4; output[source] = bytes[source + 2]; output[source + 1] = bytes[source + 1]; output[source + 2] = bytes[source]; output[source + 3] = 255; }
    this.lastFrame = { pixels: output, width: this.width, height: this.height, format: "rgba" };
    this.onFrame?.(this.lastFrame);
  }

  message(pointer, length, error) { const bytes = new Uint8Array(this.memory.buffer, pointer, length); this.onMessage?.(new TextDecoder().decode(bytes), error); }
  tick() { if (this.running) this.instance?.exports.tickGame(); }
  start() { if (!this.instance) throw new Error("Load the DOOM runtime before starting."); this.running = true; }
  stop() { this.running = false; }
  setKeyState(key, pressed) {
    if (!this.instance) return;
    const exportName = ACTION_TO_DOOM_EXPORT.get(key) || key;
    const value = typeof exportName === "number" ? exportName : this.instance.exports[exportName];
    if (value === undefined) return;
    (pressed ? this.instance.exports.reportKeyDown : this.instance.exports.reportKeyUp)(value);
  }
  getFramebuffer() { return this.lastFrame; }
}

export { WIDTH as DOOM_WIDTH, HEIGHT as DOOM_HEIGHT };
