import { KeyboardInput } from "../src/input/KeyboardInput.js";

describe("KeyboardInput", () => {
  it("maps key codes to actions", () => { const input = new KeyboardInput(document); input.attach(); document.dispatchEvent(new KeyboardEvent("keydown", { code: "KeyW" })); expect(input.isPressed("moveForward")).toBe(true); document.dispatchEvent(new KeyboardEvent("keyup", { code: "KeyW" })); expect(input.isPressed("moveForward")).toBe(false); input.detach(); });
  it("releases held actions when the window loses focus", () => { const input = new KeyboardInput(document); input.attach(); document.dispatchEvent(new KeyboardEvent("keydown", { code: "KeyW" })); expect(input.isPressed("moveForward")).toBe(true); window.dispatchEvent(new Event("blur")); expect(input.isPressed("moveForward")).toBe(false); input.detach(); });
});
