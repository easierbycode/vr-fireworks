/* src/main.ts – Pixi v8.11.0, Vite, TypeScript
   ‣ “dancing-bear” – 6 FPS animated, centred
   ‣ “orange-turd” – elliptical sine-wave orbit (8–20 s per lap)          */

import {
  Application,
  Texture,
  Rectangle,
  AnimatedSprite,
  Sprite,
} from "pixi.js";
import dancingBearAtlas from "./assets/dancing-bear-atlas.json"; // JSON you placed in src/assets

(async () => {
  /* ──────────────────────────────────────────────
     1 Pixi application (async init, v8-safe)
  ─────────────────────────────────────────────── */
  const app = new Application();
  await app.init({
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: 0x000000,
    antialias: true,
    resolution: window.devicePixelRatio || 1,
  });
  document.body.appendChild(app.canvas);

  window.addEventListener("resize", () => {
    app.renderer.resize(window.innerWidth, window.innerHeight);
  });

  /* ──────────────────────────────────────────────
     2 Dancing-bear animated sprite  (frames 0-5)
  ─────────────────────────────────────────────── */
  const atlas = JSON.parse(dancingBearAtlas.json);
  const sheetImg = new Image();
  sheetImg.src = `data:image/png;base64,${dancingBearAtlas.png}`;
  await sheetImg.decode();

  const baseTex = Texture.from(sheetImg).baseTexture;
  const frames = (atlas.textures[0].frames as any[])
    .sort((a: any, b: any) =>
      a.filename.localeCompare(b.filename, undefined, { numeric: true }),
    )
    .map((f: any) => {
      const r = f.frame;
      return new Texture(baseTex, new Rectangle(r.x, r.y, r.w, r.h));
    });

  const bear = new AnimatedSprite(frames);
  bear.anchor.set(0.5);
  bear.animationSpeed = 6 / 60; // 6 FPS
  bear.x = app.screen.width / 2;
  bear.y = app.screen.height / 2;
  bear.play();
  app.stage.addChild(bear);

  /* ──────────────────────────────────────────────
     3 Orange-turd sprite (single-frame)
  ─────────────────────────────────────────────── */
  const ORANGE_TURD =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGgAAABoCAYAAAAdHLWhAAAAAXNSR0IArs4c6QAAA7NJREFUeJztnD9oFEEUxndFl4QYjzu5nDEa/4BFiEQEhVQiphILRcRCEMUindY5EaLgv1o7C6MIqURsRFBiYRVQCEiIYqOihmjgNJrDeBrWNm+8zGSys7Pf6feDK15mMjO3X959ebNzGwbgvLjba+oSO54yXBj0HBl1PLwdKzKdnRihQOBQIHBWZr2AJXiMimvPMY0f1u3lCWYQOBQIHAoEjncPyqCuaWiYQeBQIHAoEDiZ10GBpeds6j6Y1jqCIAiC75W3St3DvTiigQKBQ4HA8e5BUXGfiGvTT7T9z9fyIh5yviJJa2Gz8MTDw/tF+71jD73uzTGDwKFA4FAgcDL3oNbuS9r+Q9NXRdz5+KyIm7bL/q/bL1utZ9tkWcRhKC0mH67j/SCyOBQIHAoEjncPasl1iPi35e+fWrtGxDfHv8kO7Xbj1Sb0f6PTxSm7AR3DDAKHAoFDgcDx/j/+1OQ7ETfPDEOfQch1lVkHkcWhQOBQIHC810HzUafwnNnigGhfrey92ZLbdceq/8zz44nmSxtmEDgUCBwKBE7qHhRuPP3Xj5TYaR3k2lPqrF8Qv7/udD4VZhA4FAgcCgRO4n0m02d0HRJ5zoexa9r2alukbW/5XNO2b9h5xrQEq2uW1KOYQeBQIHAoEDjWHrQEz/F6f+f2jQva9t4DJRGPPvik7X+ifzDpkrTX1NaTmEHgUCBwKBA4xr04NM9R6dud17ZXlVj1JFNdtAycPuuHGQQOBQKHAoGzHIFi5dXQVNsi8UKDGQQOBQKHAoGD8KyeVFHrHESf0cEMAocCgUOBwPnnPUjFuPdmPpPgFWYQOBQIHAoEThYelOrZbNfElRERh4U+r/Mzg8ChQOBQIHCsPejQnibhIbfOFbQecvJiRfS//3TOdkotI8++OB3PxNdH67Xtrt8vMwgcCgQOBQLH+szWzMsriSbM7R2TC4hKieogtU5JilrnqOMP9PeIa1bu36EdL9dV1rabYAaBQ4HAoUDg+H8WWumojGfHoffiguYt8hr9eCPbqxOpTs8MAocCgUOBwMn8TILv+yu2xL/kXl9Y2Crb6UH/NxQIHAoEjncPCqOSuRMQ4aq80++c2sIMAocCgUOBwMm8Dgrcn5MzeQT23p8CMwgcCgQOBQIHwYPS9oSG8hwVZhA4FAgcCgSOdw+Ka/KZoUn35uK5j9q6J2zq0DXbjx//TDSeLcwgcCgQOBQIHP910Lx8iqiDs9WyzonahGfElVdux+f9ILIQCgQOBQLnDyEXrhBpRPYWAAAAAElFTkSuQmCC";

  const turd = new Sprite(Texture.from(ORANGE_TURD));
  turd.anchor.set(0.5);
  app.stage.addChild(turd);
  app.stage.setChildIndex(turd, app.stage.children.length - 1); // ensure top layer

  /* ──────────────────────────────────────────────
     4 Orbit animation (3-D effect via scale)
  ─────────────────────────────────────────────── */
  const RX = 160;          // horizontal radius
  const RY = 80;           // vertical radius
  const MIN_S = 0.5;
  const MAX_S = 1.0;

  let angle = 0;
  let period = 8 + Math.random() * 12;          // 8-20 s
  let dθ = (Math.PI * 2) / (period * 60);       // rad/frame @60 FPS

  app.ticker.add((delta) => {
    angle += dθ * delta;
    if (angle >= Math.PI * 2) {
      angle -= Math.PI * 2;
      period = 8 + Math.random() * 12;
      dθ = (Math.PI * 2) / (period * 60);
    }

    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    turd.x = bear.x + cos * RX;
    turd.y = bear.y + sin * RY;

    const depth = (sin + 1) / 2;               // 0-1 (front when sin = +1)
    const scale = MIN_S + (MAX_S - MIN_S) * depth;
    turd.scale.set(scale);
  });
})();
// This code initializes a Pixi.js application, creates an animated sprite of a dancing bear,
// and adds a static sprite of an orange turd that orbits the bear in an elliptical