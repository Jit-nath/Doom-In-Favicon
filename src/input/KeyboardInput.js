const KEY_ACTIONS = new Map([
  ["KeyW", "moveForward"], ["ArrowUp", "moveForward"], ["KeyS", "moveBackward"], ["ArrowDown", "moveBackward"],
  ["KeyA", "turnLeft"], ["ArrowLeft", "turnLeft"], ["KeyD", "turnRight"], ["ArrowRight", "turnRight"],
  ["KeyQ", "strafeLeft"], ["KeyE", "strafeRight"], ["ControlLeft", "fire"], ["ControlRight", "fire"],
  ["Space", "use"], ["ShiftLeft", "run"], ["ShiftRight", "run"], ["Escape", "pause"]
]);

export class KeyboardInput {
  constructor(target = document) { this.target = target; this.window = target.defaultView || window; this.pressed = new Set(); this.listeners = new Set(); this.boundDown = event => this.handle(event, true); this.boundUp = event => this.handle(event, false); this.boundBlur = () => this.releaseAll(); this.boundVisibility = () => { if (this.target.hidden) this.releaseAll(); }; }
  attach() { this.target.addEventListener("keydown", this.boundDown); this.target.addEventListener("keyup", this.boundUp); this.window.addEventListener("blur", this.boundBlur); this.target.addEventListener("visibilitychange", this.boundVisibility); }
  detach() { this.target.removeEventListener("keydown", this.boundDown); this.target.removeEventListener("keyup", this.boundUp); this.window.removeEventListener("blur", this.boundBlur); this.target.removeEventListener("visibilitychange", this.boundVisibility); this.releaseAll(); }
  onChange(listener) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  isPressed(action) { return this.pressed.has(action); }
  handle(event, down) {
    const action = KEY_ACTIONS.get(event.code);
    if (!action) return;
    if (down) this.pressed.add(action); else this.pressed.delete(action);
    event.preventDefault?.();
    for (const listener of this.listeners) listener({ action, pressed: down, event });
  }
  releaseAll(event = null) { for (const action of this.pressed) for (const listener of this.listeners) listener({ action, pressed: false, event }); this.pressed.clear(); }
}

export { KEY_ACTIONS };
