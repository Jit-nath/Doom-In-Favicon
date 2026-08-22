import { Framebuffer } from "../framebuffer/Framebuffer.js";

const MAP = [
  "1111111111111111", "1000000000000001", "1000111001110001", "1000100000010001",
  "1000101111010001", "1000001000010001", "1011101000011101", "1000000000000001",
  "1001111111100001", "1001000000100001", "1001000000100001", "1000000000000001",
  "1000011111000001", "1000000000000001", "1000000000000001", "1111111111111111"
];

export class ToyGame {
  constructor(size = 32) { this.framebuffer = new Framebuffer(size, size); this.tileSize = size / MAP.length; this.player = { x: 2.5, y: 2.5 }; this.heading = 0; this.input = null; this.frame = 0; }
  setInput(input) { this.input = input; }
  isWall(x, y) { const tx = Math.floor(x), ty = Math.floor(y); return !MAP[ty] || MAP[ty][tx] === "1"; }
  update(dt) {
    if (!this.input) return;
    const speed = this.input.isPressed("run") ? 3.5 : 2.2;
    if (this.input.isPressed("turnLeft")) this.heading -= dt * 2.8;
    if (this.input.isPressed("turnRight")) this.heading += dt * 2.8;
    const dx = (this.input.isPressed("strafeRight") ? 1 : 0) - (this.input.isPressed("strafeLeft") ? 1 : 0);
    const dy = (this.input.isPressed("moveForward") ? 1 : 0) - (this.input.isPressed("moveBackward") ? 1 : 0);
    const cos = Math.cos(this.heading), sin = Math.sin(this.heading);
    const nextX = this.player.x + (cos * dy - sin * dx) * speed * dt;
    const nextY = this.player.y + (sin * dy + cos * dx) * speed * dt;
    if (!this.isWall(nextX, this.player.y)) this.player.x = nextX;
    if (!this.isWall(this.player.x, nextY)) this.player.y = nextY;
  }
  render() {
    const fb = this.framebuffer, ts = this.tileSize;
    fb.clear([7, 9, 11, 255]);
    for (let y = 0; y < MAP.length; y++) for (let x = 0; x < MAP[y].length; x++) if (MAP[y][x] === "1") fb.fillRect(x * ts, y * ts, ts + 0.2, ts + 0.2, [102, 32, 27, 255]);
    const px = this.player.x * ts, py = this.player.y * ts;
    fb.fillRect(px - 1.5, py - 1.5, 3, 3, [242, 191, 114, 255]);
    fb.fillRect(px + Math.cos(this.heading) * 4 - 0.8, py + Math.sin(this.heading) * 4 - 0.8, 1.6, 1.6, [255, 238, 174, 255]);
    this.frame++;
    return fb;
  }
  reset() { this.player.x = 2.5; this.player.y = 2.5; this.heading = 0; }
}
