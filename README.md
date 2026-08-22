# DOOM in Favicon

An experiment that renders a changing framebuffer through a browser tab icon.

## Run it

```bash
npm install
npm run dev
```

Open the printed local URL in Chrome. The demo starts with a tiny playable map rendered only through the favicon. Open `/benchmark` to measure generated frames and favicon replacement requests separately.

## DOOM runtime

The project includes an adapter for the small `doom.wasm` interface used by the upstream [doom.wasm project](https://github.com/jacobenget/doom.wasm). A compatible release runtime is bundled at `public/doom.wasm`, along with the freely redistributable `public/freedoom1.wad` showcase data. Click **Start Freedoom showcase** to run immediately, or choose another IWAD/PWAD from disk.

The repository does not include proprietary DOOM game data. The bundled Freedoom data is a free replacement; see `THIRD_PARTY_NOTICES.md`. You are responsible for supplying any additional game data that you are legally allowed to use.

## Architecture

```text
DOOM/WASM or toy game
  -> normalized RGBA framebuffer
  -> downsampled 32x32 framebuffer
  -> canvas PNG data URL
  -> link[rel=icon]
```

The simulation loop and favicon render rate are independent. The benchmark reports generated FPS and favicon replacement FPS; Chrome may paint the tab at a lower or coalesced visual rate.

## Commands

```bash
npm run dev       # local development server
npm run build     # production build
npm test          # unit tests
```
