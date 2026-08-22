import { validateWad } from "../src/doom/DoomLoader.js";

describe("validateWad", () => {
  it("rejects missing files", async () => { await expect(validateWad()).rejects.toThrow("Choose a WAD file first"); });
  it("accepts a valid minimal WAD header", async () => { const buffer = new ArrayBuffer(28); const bytes = new Uint8Array(buffer); bytes.set(new TextEncoder().encode("IWAD")); const view = new DataView(buffer); view.setInt32(4, 1, true); view.setInt32(8, 12, true); const file = new File([buffer], "test.wad"); await expect(validateWad(file)).resolves.toMatchObject({ signature: "IWAD", lumpCount: 1 }); });
});
