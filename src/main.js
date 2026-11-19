import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { World } from './world.js';
import { Player } from './player.js';
import { MobileControls } from './controls.js';
import { HUD } from './ui.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9bc8df);
scene.fog = new THREE.Fog(0x9bc8df, 45, 190);
const camera = new THREE.PerspectiveCamera(65, innerWidth / innerHeight, 0.1, 400);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xd9efff, 0x52634e, 2));
const sun = new THREE.DirectionalLight(0xffedcf, 2.2);
sun.position.set(-35, 60, 25);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
scene.add(sun);

const world = new World(scene);
const player = new Player(scene);
const controls = new MobileControls();
const hud = new HUD();
camera.position.set(0, 5, 9);

let previous = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min((now - previous) / 1000, 0.04);
  previous = now;
  player.update(dt, controls, world);
  const target = player.position.clone().add(new THREE.Vector3(0, 1.3, 0));
  const offset = new THREE.Vector3(Math.sin(controls.yaw) * 6, 3.1, Math.cos(controls.yaw) * 6);
  camera.position.lerp(target.clone().add(offset), 1 - Math.exp(-7 * dt));
  camera.lookAt(target);
  hud.update(player.position);
  renderer.render(scene, camera);
}
requestAnimationFrame(frame);

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
document.getElementById('loading').remove();
