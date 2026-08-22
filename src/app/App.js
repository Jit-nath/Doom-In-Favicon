import { Framebuffer } from "../framebuffer/Framebuffer.js";
import { drawTestPattern } from "../framebuffer/test-patterns.js";
import { downsample } from "../framebuffer/downsample.js";
import { FaviconOutput } from "../favicon/FaviconOutput.js";
import { KeyboardInput } from "../input/KeyboardInput.js";
import { GameLoop } from "../game/GameLoop.js";
import { ToyGame } from "../game/ToyGame.js";
import { BenchmarkRunner } from "../benchmark/BenchmarkRunner.js";
import { validateWad, validateWadBuffer } from "../doom/DoomLoader.js";
import { DoomAdapter } from "../doom/DoomAdapter.js";

export function createApp({ pathname = "/" } = {}) {
  return pathname === "/benchmark" ? createBenchmarkPage() : createDemoPage();
}

function shell(title, content, current = "/", heading = null, { minimal = false } = {}) {
  const root = el("div", "shell");
  const top = el("header", "topbar");
  top.append(el("div", "eyebrow", "CHROME EXPERIMENT 01"));
  const nav = el("nav", "nav");
  nav.append(link("/", "Demo", current === "/"), link("/benchmark", "Benchmark", current === "/benchmark"));
  top.append(nav);
  root.append(...(minimal ? [] : [top]), heading || el("h1", "", title), content, el("footer", "credits", "© 2026 Jit Debnath · fan-made browser experiment"));
  return root;
}

function createDemoPage() {
  const content = el("div", "grid");
  const showcaseButton = button("START");
  showcaseButton.classList.add("start-button");
  const doomStatus = el("div", "visually-hidden", "");
  doomStatus.setAttribute("aria-live", "polite");
  const controlsHint = el("p", "controls-hint", "WASD / ARROWS MOVE · Q E STRAFE · CTRL FIRE · SPACE USE · SHIFT RUN · ESC PAUSE");
  const intro = el("section", "hero panel-wide");
  intro.append(showcaseButton, controlsHint, doomStatus);

  const toyPanel = el("section", "panel");
  toyPanel.append(el("h2", "Toy framebuffer game"), el("p", "Click the page, then use WASD or the arrow keys. The map is rendered only into the favicon."));
  const toyStatus = el("div", "status", "Ready");
  const startToy = button("Start toy game");
  const stopToy = button("Stop", true);
  const resetToy = button("Reset");
  toyPanel.append(el("div", "controls", startToy, stopToy, resetToy), toyStatus);

  const doomPanel = document.createElement("details");
  doomPanel.className = "panel secondary-panel";
  const customSummary = document.createElement("summary");
  customSummary.textContent = "Load another WAD (optional)";
  doomPanel.append(customSummary, el("p", "Freedoom is bundled for the showcase. Use this loader only if you want to try another IWAD/PWAD."));
  const wadInput = document.createElement("input");
  wadInput.type = "file";
  wadInput.accept = ".wad";
  const wasmHint = el("div", "status", "Runtime: public/doom.wasm · data: public/freedoom1.wad");
  const validateButton = button("Validate WAD");
  const startDoom = button("Start selected WAD", true);
  const stopDoom = button("Stop", true);
  doomPanel.append(wadInput, el("div", "controls", validateButton, startDoom, stopDoom), wasmHint);

  const pipelinePanel = el("section", "panel panel-wide");
  pipelinePanel.append(el("h2", "Pipeline status"));
  const readout = el("div", "readout");
  const generated = metric("0", "generated frames");
  const updates = metric("0", "favicon updates");
  const fps = metric("0", "render FPS");
  readout.append(generated, updates, fps);
  pipelinePanel.append(readout);
  content.append(intro);

  const logo = el("h1", "doom-logo");
  logo.setAttribute("aria-label", "Doom In Favicon");
  const logoImage = document.createElement("img");
  logoImage.className = "doom-wordmark";
  logoImage.src = "/doom-logo.svg";
  logoImage.alt = "DOOM";
  logo.append(logoImage, el("span", "doom-subtitle", "IN FAVICON"));
  const root = shell("", content, "/", logo, { minimal: true });
  root.classList.add("doom-frontpage");
  root.tabIndex = 0;
  const output = new FaviconOutput({ width: 32, height: 32 });
  const keyboard = new KeyboardInput(document);
  keyboard.attach();
  const toy = new ToyGame(32);
  toy.setInput(keyboard);
  let loop;
  let doomLoop;
  let doomAdapter;
  let latestDoomFrame;
  let displayedFrames = 0;
  let toyStartedAt = performance.now();
  keyboard.onChange(({ action, pressed }) => doomAdapter?.setKeyState(action, pressed));
  const updatePageTitle = () => { document.title = `${output.recentFps()} FPS`; };
  const resetPageTitle = () => { document.title = "Doom In Favicon"; };

  startToy.onclick = () => {
    doomLoop?.stop();
    doomAdapter?.stop();
    loop?.stop();
    displayedFrames = 0;
    toyStartedAt = performance.now();
    loop = new GameLoop({
      update: dt => toy.update(dt),
      render: () => {
        output.render(toy.render(), { force: true });
        updatePageTitle();
        displayedFrames++;
        const elapsed = Math.max(1, performance.now() - toyStartedAt);
        generated.textContent = String(displayedFrames);
        updates.textContent = String(output.updates);
        fps.textContent = ((displayedFrames * 1000) / elapsed).toFixed(1);
      }
    });
    loop.start();
    startToy.disabled = true;
    stopToy.disabled = false;
    toyStatus.textContent = "Running · focus this page for input";
    root.focus();
  };

  stopToy.onclick = () => {
    loop?.stop();
    startToy.disabled = false;
    stopToy.disabled = true;
    toyStatus.textContent = "Stopped";
    resetPageTitle();
  };

  resetToy.onclick = () => {
    toy.reset();
    output.reset();
    toyStatus.textContent = "Reset";
  };

  const stopDoomGame = message => {
    doomLoop?.stop();
    doomAdapter?.stop();
    startDoom.disabled = !wadInput.files?.length;
    showcaseButton.disabled = false;
    stopDoom.disabled = true;
    doomStatus.textContent = message;
    resetPageTitle();
  };

  const launchDoom = async (wadBuffer, label) => {
    try {
      loop?.stop();
      doomLoop?.stop();
      doomAdapter?.stop();
      latestDoomFrame = null;
      document.title = "0 FPS";
      doomStatus.className = "visually-hidden";
      doomStatus.textContent = `Loading ${label}…`;
      doomAdapter = new DoomAdapter({
        onFrame: frame => { latestDoomFrame = frame; },
        onMessage: (message, error) => {
          doomStatus.textContent = `${error ? "DOOM error" : "DOOM"}: ${message}`;
          doomStatus.className = error ? "status error" : "visually-hidden";
        }
      });
      await doomAdapter.load({ wadBuffer });
      doomAdapter.start();
      doomLoop = new GameLoop({
        simulationFps: 35,
        renderFps: 10,
        update: () => doomAdapter.tick(),
        render: () => {
          if (!latestDoomFrame) return;
          const source = new Framebuffer(latestDoomFrame.width, latestDoomFrame.height, new Uint8ClampedArray(latestDoomFrame.pixels));
          output.render(downsample(source, 32, 32, { preserveAspect: true, background: [0, 0, 0, 255] }), { force: true });
          updatePageTitle();
          updates.textContent = String(output.updates);
        }
      });
      doomLoop.start();
      startDoom.disabled = true;
      showcaseButton.disabled = true;
      stopDoom.disabled = false;
      doomStatus.textContent = `${label} running`;
      root.focus();
    } catch (error) {
      doomStatus.className = "status error";
      doomStatus.textContent = error.message;
      resetPageTitle();
      showcaseButton.disabled = false;
      startDoom.disabled = !wadInput.files?.length;
    }
  };

  validateButton.onclick = async () => {
    try {
      const result = await validateWad(wadInput.files[0]);
      doomStatus.className = "status";
      doomStatus.textContent = `${result.signature} accepted · ${result.lumpCount} lumps · runtime ready to load`;
      startDoom.disabled = false;
    } catch (error) {
      doomStatus.className = "status error";
      doomStatus.textContent = error.message;
      resetPageTitle();
      startDoom.disabled = true;
    }
  };

  startDoom.onclick = async () => {
    try {
      const result = await validateWad(wadInput.files[0]);
      await launchDoom(result.buffer, "selected WAD");
    } catch (error) {
      doomStatus.className = "status error";
      doomStatus.textContent = error.message;
    }
  };

  showcaseButton.onclick = async () => {
    try {
      doomStatus.className = "visually-hidden";
      doomStatus.textContent = "Loading bundled Freedoom data…";
      const response = await fetch("/freedoom1.wad");
      if (!response.ok) throw new Error("Bundled Freedoom data could not be loaded.");
      const result = validateWadBuffer(await response.arrayBuffer());
      await launchDoom(result.buffer, "Freedoom showcase");
    } catch (error) {
      doomStatus.className = "status error";
      doomStatus.textContent = error.message;
      showcaseButton.disabled = false;
    }
  };

  stopDoom.onclick = () => stopDoomGame("DOOM stopped");
  drawTestPattern(new Framebuffer(32, 32), 0);
  return root;
}

function createBenchmarkPage() {
  const content = el("div", "grid");
  const panel = el("section", "panel panel-wide");
  panel.append(el("p", "lede", "Measure generated frames and favicon replacement requests separately. The browser may coalesce or delay tab-icon painting, so the observed visual rate is a separate manual observation."));
  const fpsInput = document.createElement("input"); fpsInput.type = "number"; fpsInput.min = "1"; fpsInput.max = "60"; fpsInput.step = "1"; fpsInput.value = "10";
  const durationInput = document.createElement("input"); durationInput.type = "number"; durationInput.min = "1000"; durationInput.step = "1000"; durationInput.value = "10000";
  const run = button("Run benchmark"); const cancel = button("Cancel", true); const exportButton = button("Export JSON", true); const status = el("div", "status", "Ready"); const progress = el("div", "status", ""); const table = document.createElement("table"); table.innerHTML = "<thead><tr><th>Metric</th><th>Value</th></tr></thead><tbody></tbody>"; const body = table.querySelector("tbody"); panel.append(el("div", "controls", field("Requested FPS", fpsInput), field("Duration (ms)", durationInput), run, cancel, exportButton), status, progress, table); content.append(panel);
  const root = shell("FAVICON BENCHMARK", content, "/benchmark"); const output = new FaviconOutput({ width: 32, height: 32 }); const runner = new BenchmarkRunner({ output }); let latest = null;
  run.onclick = async () => { run.disabled = true; cancel.disabled = false; exportButton.disabled = true; status.textContent = "Running…"; latest = await runner.run({ fps: Number(fpsInput.value), durationMs: Number(durationInput.value), onProgress: value => { progress.textContent = `${value.generated} generated · ${value.updates} updates · ${(value.elapsedMs / 1000).toFixed(1)}s`; } }); renderResults(body, latest); status.textContent = "Complete"; run.disabled = false; cancel.disabled = true; exportButton.disabled = false; };
  cancel.onclick = () => { runner.cancel(); status.textContent = "Cancelling…"; cancel.disabled = true; };
  exportButton.onclick = () => { const blob = new Blob([JSON.stringify(latest, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = "favicon-benchmark.json"; anchor.click(); URL.revokeObjectURL(url); };
  return root;
}

function renderResults(body, result) { body.replaceChildren(...Object.entries(result).map(([key, value]) => { const row = document.createElement("tr"); row.innerHTML = `<td>${key}</td><td>${typeof value === "number" ? value.toFixed(2) : value}</td>`; return row; })); }
function field(label, input) { const wrapper = el("label", "field", label); wrapper.append(input); return wrapper; }
function metric(value, label) { const wrapper = el("div"); const strong = el("strong", "", value); strong.textContent = value; wrapper.append(strong, el("span", "", label)); return strong; }
function button(text, disabled = false) { const item = document.createElement("button"); item.type = "button"; item.textContent = text; item.disabled = disabled; return item; }
function link(href, text, current) { const anchor = document.createElement("a"); anchor.href = href; anchor.textContent = text; if (current) anchor.setAttribute("aria-current", "page"); return anchor; }
function el(tag, className = "", text = "") { const node = document.createElement(tag); if (className) node.className = className; if (text) node.textContent = text; return node; }
