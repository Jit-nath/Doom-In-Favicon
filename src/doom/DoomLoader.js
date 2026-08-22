export async function validateWad(file) {
  if (!file) throw new Error("Choose a WAD file first.");
  if (file.size < 12) throw new Error("The selected file is too small to be a WAD.");
  const buffer = await file.arrayBuffer();
  return validateWadBuffer(buffer, file);
}

export function validateWadBuffer(buffer, file = null) {
  if (!(buffer instanceof ArrayBuffer) || buffer.byteLength < 12) throw new Error("The selected file is too small to be a WAD.");
  const bytes = new Uint8Array(buffer);
  const signature = new TextDecoder().decode(bytes.slice(0, 4));
  if (signature !== "IWAD" && signature !== "PWAD") throw new Error("This file is not an IWAD or PWAD.");
  const view = new DataView(buffer); const lumpCount = view.getInt32(4, true); const directoryOffset = view.getInt32(8, true);
  if (lumpCount < 0 || directoryOffset < 12 || directoryOffset + lumpCount * 16 > buffer.byteLength) throw new Error("The WAD directory is invalid.");
  return { file, buffer, signature, lumpCount, directoryOffset };
}
