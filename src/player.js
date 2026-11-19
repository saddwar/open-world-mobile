import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

export class Player {
  constructor(scene) {
    this.position = new THREE.Vector3(0, 0, 0);
    this.velocityY = 0;
    this.mesh = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.38, 0.85, 5, 10), new THREE.MeshStandardMaterial({ color: 0x263d50, roughness: 0.8 }));
    body.position.y = 0.95; body.castShadow = true; this.mesh.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 12), new THREE.MeshStandardMaterial({ color: 0xd9a77e }));
    head.position.y = 1.72; head.castShadow = true; this.mesh.add(head);
    scene.add(this.mesh);
  }
  update(dt, input, world) {
    const forward = new THREE.Vector3(-Math.sin(input.yaw), 0, -Math.cos(input.yaw));
    const right = new THREE.Vector3(forward.z, 0, -forward.x);
    const move = forward.multiplyScalar(-input.moveY).add(right.multiplyScalar(input.moveX));
    if (move.lengthSq() > 1) move.normalize();
    this.position.addScaledVector(move, dt * 6);
    if (input.jumpPressed && this.position.y <= 0.001) this.velocityY = 7;
    this.velocityY -= 18 * dt;
    this.position.y = Math.max(0, this.position.y + this.velocityY * dt);
    if (this.position.y === 0) this.velocityY = 0;
    this.mesh.position.copy(this.position);
    if (move.lengthSq() > 0.001) this.mesh.rotation.y = Math.atan2(move.x, move.z);
  }
}
