import { Engine, Scene, Color4, Vector3, ParticleSystem, DynamicTexture, Texture, WebXRDefaultExperience } from "@babylonjs/core";
// Import side-effect modules for particle emitters and XR features
import "@babylonjs/core/Particles/EmitterTypes/sphereParticleEmitter";
import "@babylonjs/core/XR/webXRDefaultExperience";
import "@babylonjs/loaders/glTF";  // enable GLTF loader so Quest 2 controllers will load models

// Get the canvas element and initialize Babylon Engine and Scene
const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
const engine = new Engine(canvas, true);
const scene = new Scene(engine);

// Set a dark background (black) to resemble night sky
scene.clearColor = new Color4(0, 0, 0, 1);

// **Starry Sky Background**: use a particle system to create static stars
const starCount = 1000;
const starfield = new ParticleSystem("starfield", starCount, scene);
starfield.particleTexture = createStarTexture();              // small white dot texture for stars
starfield.createSphereEmitter(100, 0);                        // emit in a sphere radius 100 (surface)
starfield.manualEmitCount = starCount;                        // emit all stars at once
starfield.minEmitPower = starfield.maxEmitPower = 0;          // no initial velocity (static)
starfield.minLifeTime = starfield.maxLifeTime = Number.MAX_VALUE; // live "forever"
starfield.minSize = 0.1;
starfield.maxSize = 0.3;
starfield.color1 = new Color4(1, 0.5, 1, 1);                  // pink-ish star color
starfield.color2 = new Color4(0.6, 0, 1, 1);                  // purple-ish star color
starfield.start();  // start emitting the starfield particles

// **Emoji Textures**: create an array of dynamic textures for each cat emoji
const emojis = ["🙀","🐈‍⬛","😺","😽","😼","😸","😹","😻","🐱‍🚀","🐱‍👤","🐱‍💻","🐱‍🏍","🐱‍🐉","🐱‍👓","🏴", "👺", "🎃", "👽", "👾", "👁", "👩🏻‍🚀"];
const emojiTextures: DynamicTexture[] = [];
for (const emoji of emojis) {
  const dt = new DynamicTexture("emoji-" + emoji, {width:128, height:128}, scene, false);
  dt.hasAlpha = true;
  // Draw the emoji character to the dynamic texture's canvas
  const ctx = dt.getContext();
  ctx.clearRect(0, 0, 128, 128);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "100px sans-serif";        // large font to fill texture
  ctx.fillText(emoji, 64, 64);          // draw emoji at center
  dt.update();                          // update the texture with the drawn content
  emojiTextures.push(dt);
}

// Function to spawn a firework at a given position using a random emoji
function spawnFirework(position: Vector3) {
  // Create a one-time particle system for the explosion
  const firework = new ParticleSystem("firework", 50, scene);
  firework.particleTexture = emojiTextures[Math.floor(Math.random()*emojiTextures.length)];
  firework.emitter = position.clone();             // emit from the given position
  firework.createSphereEmitter(0, 0);              // point emitter (radius 0 sphere)
  firework.minEmitPower = 5;
  firework.maxEmitPower = 8;                       // particles shoot outwards at random speeds
  firework.minLifeTime = 1.5;
  firework.maxLifeTime = 2.5;                      // particles live 1.5–2.5 seconds
  firework.emitRate = 0;                           // we will use manual burst emit
  firework.manualEmitCount = 50;                   // burst 50 particles at once
  // Set particle colors based on current hue tint (start colored, fade to transparent)
  const tint = getHueColor(currentHue);
  firework.color1 = firework.color2 = new Color4(tint.r, tint.g, tint.b, 1);
  firework.colorDead = new Color4(tint.r, tint.g, tint.b, 0);
  firework.start();
  // Dispose the particle system after its particles have died out
  setTimeout(() => firework.dispose(), 3000);
}

// Utility: create a small white circular texture for star particles
function createStarTexture(): Texture {
  const size = 16;
  const dt = new DynamicTexture("starTex", {width: size, height: size}, scene, false);
  dt.hasAlpha = true;
  const ctx = dt.getContext();
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.arc(size/2, size/2, size/4, 0, 2*Math.PI);
  ctx.fill();
  dt.update();
  return dt;
}

// Utility: compute a Color4 from a 0–1 hue value (simple interpolation over a rainbow gradient)
const hueColors = [
  new Color4(1, 0, 0, 1),   // red
  new Color4(1, 1, 0, 1),   // yellow
  new Color4(0, 1, 0, 1),   // green
  new Color4(0, 1, 1, 1),   // cyan
  new Color4(0, 0, 1, 1),   // blue
  new Color4(1, 0, 1, 1)    // magenta
];
function getHueColor(h: number): Color4 {
  // h is between 0 and 1
  const steps = hueColors.length - 1;
  const scaled = h * steps;
  const idx = Math.floor(scaled);
  const frac = scaled - idx;
  if (idx >= steps) {
    return hueColors[steps];
  }
  const c1 = hueColors[idx], c2 = hueColors[idx+1];
  // linear interpolation between c1 and c2
  const r = c1.r + (c2.r - c1.r) * frac;
  const g = c1.g + (c2.g - c1.g) * frac;
  const b = c1.b + (c2.b - c1.b) * frac;
  return new Color4(r, g, b, 1);
}

// **WebXR Setup**: enable VR (WebXR) for immersive VR on Quest 2
let xrHelper: WebXRDefaultExperience;
scene.createDefaultXRExperienceAsync({
  disableDefaultUI: false,
  disableTeleportation: true   // disable teleport so we can use thumbstick input freely
}).then((xrExp) => {
  xrHelper = xrExp;
  // When in VR, adjust the camera's far clip plane if needed (to ensure stars are visible)
  xrHelper.baseExperience.camera.maxZ = 10000; 
  // Set up controller input handling
  xrHelper.input.onControllerAddedObservable.add((xrController) => {
    // Each XR controller (left/right hand) has motion controller data once initialized
    xrController.onMotionControllerInitObservable.add((motionController) => {
      // Iterate through all components (buttons/axes) on the controller
      for (const id of motionController.getComponentIds()) {
        const component = motionController.getComponent(id);
        // Listen for changes in button state or axis on this component
        component.onButtonStateChangedObservable.add(() => {
          // If any button is pressed down, spawn fireworks around the user
          if (component.changes.pressed && component.pressed) {
            triggerFireworksAroundUser();
          }
          // If this component has an X-axis (e.g., thumbstick), use it to adjust hue
          if (component.axes && component.axes.x !== undefined) {
            // Normalize X axis (-1 to 1) to 0–1 range for hue
            currentHue = (component.axes.x + 1) / 2;
          }
        });
      }
    });
  });
});

// Helper: spawn a few fireworks in random directions around the user's current position
function triggerFireworksAroundUser() {
  const userPos = scene.activeCamera?.globalPosition || Vector3.Zero();
  const radius = 4;
  for (let i = 0; i < 3; i++) {
    // random direction vector
    const dir = new Vector3(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5).normalize().scale(radius);
    spawnFirework(userPos.add(dir));
  }
}

// Start a loop of random fireworks appearing at intervals
function scheduleRandomFirework() {
  const interval = Math.random() * 2000 + 1000; // random interval between 1s and 3s
  setTimeout(() => {
    // Spawn at a random position in front of the user
    const angle = Math.random() * 2 * Math.PI;
    const dist = 6 + Math.random() * 4;
    const height = 2 + Math.random() * 3;
    const randPos = new Vector3(Math.cos(angle) * dist, height, Math.sin(angle) * dist);
    spawnFirework(randPos);
    scheduleRandomFirework(); // schedule the next one recursively
  }, interval);
}
scheduleRandomFirework();

// **Render loop**: render the scene and update on each frame
engine.runRenderLoop(() => {
  scene.render();
});

// Adjust on window resize
window.addEventListener("resize", () => engine.resize());

// Initialize current hue value (0 = red, 0.5 = green/blue, 1 = magenta in our gradient)
let currentHue: number = 0;
