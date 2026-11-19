import * as THREE from 'three';
import { World } from './world.js';
import { Player } from './player.js';
import { MobileControls } from './controls.js';
import { HUD } from './ui.js';

const root = document.getElementById('game-root');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9ebfca);
scene.fog = new THREE.Fog(0x9ebfca, 95, 310);
const camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, 0.1, 500);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance', stencil: false });
renderer.domElement.className = 'webgl';
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.6));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
root.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xd9edff, 0x52614d, 1.8));
const sun = new THREE.DirectionalLight(0xffedcf, 2.4);
sun.position.set(-65, 95, 45);
sun.castShadow = true;
sun.shadow.mapSize.set(1536, 1536);
sun.shadow.camera.left = -90; sun.shadow.camera.right = 90;
sun.shadow.camera.top = 90; sun.shadow.camera.bottom = -90;
sun.shadow.normalBias = 0.035;
scene.add(sun);

const world = new World(scene);
const player = new Player(scene);
const controls = new MobileControls();
const hud = new HUD(world);
camera.position.set(0, 5, 9);

let last = performance.now();
let elapsed = 0;
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min((now - last) / 1000, 0.033);
  last = now; elapsed += dt;
  controls.update(dt);
  player.update(dt, controls, world, elapsed);
  world.update(dt, elapsed, player.position);
  const target = player.position.clone().add(new THREE.Vector3(0, 1.35, 0));
  const distance = controls.zoom;
  const offset = new THREE.Vector3(Math.sin(controls.yaw) * distance, 3.4, Math.cos(controls.yaw) * distance);
  camera.position.lerp(target.clone().add(offset), 1 - Math.exp(-8 * dt));
  camera.lookAt(target);
  hud.update(player.position, elapsed);
  renderer.render(scene, camera);
}
requestAnimationFrame(frame);

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.6));
});
addEventListener('contextmenu', e => e.preventDefault());
document.getElementById('loading').remove();
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}