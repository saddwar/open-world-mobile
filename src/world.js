import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

export class World {
  constructor(scene) {
    this.scene = scene;
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(220, 220), new THREE.MeshStandardMaterial({ color: 0x526b55, roughness: 1 }));
    ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x30363b, roughness: 0.95 });
    for (let i = -3; i <= 3; i++) {
      const roadA = new THREE.Mesh(new THREE.BoxGeometry(220, 0.04, 9), roadMat);
      roadA.position.set(0, 0.025, i * 28); scene.add(roadA);
      const roadB = new THREE.Mesh(new THREE.BoxGeometry(9, 0.04, 220), roadMat);
      roadB.position.set(i * 28, 0.026, 0); scene.add(roadB);
    }
    const colors = [0x9aabb1, 0xb5a18b, 0x6e8990, 0xc0b8a4, 0x7d8980];
    for (let x = -5; x <= 5; x++) for (let z = -5; z <= 5; z++) {
      if (Math.abs(x % 2) === 0 && Math.abs(z % 2) === 0) continue;
      const h = 5 + Math.random() * 19;
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(8 + Math.random()*3, h, 8 + Math.random()*3), new THREE.MeshStandardMaterial({ color: colors[Math.floor(Math.random()*colors.length)], roughness: 0.86 }));
      mesh.position.set(x * 18 + 9, h/2, z * 18 + 9);
      mesh.castShadow = true; mesh.receiveShadow = true; scene.add(mesh);
    }
  }
}
