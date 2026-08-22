import { FaviconOutput } from "../src/favicon/FaviconOutput.js";
import { Framebuffer } from "../src/framebuffer/Framebuffer.js";

describe("FaviconOutput", () => {
  it("reuses the existing page icon link", () => {
    const original = document.createElement("link");
    original.rel = "icon";
    original.href = "/favicon.svg";
    document.head.appendChild(original);
    const output = new FaviconOutput({ width: 2, height: 2 });
    expect(output.link).toBe(original);
    expect(document.querySelectorAll('link[rel~="icon"]')).toHaveLength(1);
  });
  it("keeps one icon link and suppresses duplicate frames", () => { const output = new FaviconOutput({ width: 2, height: 2 }); const frame = new Framebuffer(2, 2).clear([1, 2, 3, 255]); output.render(frame); output.render(frame); expect(document.querySelectorAll("link#dynamic-favicon")).toHaveLength(1); expect(output.updates).toBe(1); });
  it("rejects mismatched dimensions", () => { const output = new FaviconOutput({ width: 2, height: 2 }); expect(() => output.render(new Framebuffer(1, 1))).toThrow(); });
});
