import * as THREE from 'three';

const material=(color,roughness=.8)=>new THREE.MeshStandardMaterial({color,roughness});
export class Player {
  constructor(scene){
    this.position=new THREE.Vector3(0,0,0);this.velocityY=0;this.speed=0;this.walkTime=0;this.inVehicle=false;
    this.mesh=new THREE.Group();
    const shirt=material(0x253f50),pants=material(0x202b35),skin=material(0xc99572),shoe=material(0x111820);
    const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.34,.62,5,10),shirt);torso.position.y=1.13;torso.castShadow=true;this.mesh.add(torso);
    const head=new THREE.Mesh(new THREE.SphereGeometry(.23,16,12),skin);head.position.y=1.78;head.castShadow=true;this.mesh.add(head);
    this.legs=[];
    for(const x of [-.16,.16]){
      const leg=new THREE.Mesh(new THREE.CapsuleGeometry(.13,.55,4,8),pants);leg.position.set(x,.48,0);leg.castShadow=true;this.mesh.add(leg);this.legs.push(leg);
      const foot=new THREE.Mesh(new THREE.BoxGeometry(.25,.13,.38),shoe);foot.position.set(x,.12,-.07);this.mesh.add(foot);
    }
    for(const x of [-.42,.42]){
      const arm=new THREE.Mesh(new THREE.CapsuleGeometry(.105,.52,4,8),shirt);arm.position.set(x,1.15,0);arm.rotation.z=x>0?-.12:.12;this.mesh.add(arm);
    }
    const shadow=new THREE.Mesh(new THREE.CircleGeometry(.55,20),new THREE.MeshBasicMaterial({color:0x101820,transparent:true,opacity:.28}));
    shadow.rotation.x=-Math.PI/2;shadow.position.y=.025;this.mesh.add(shadow);
    scene.add(this.mesh);
  }
  update(dt,input,world,time){
    const forward=new THREE.Vector3(-Math.sin(input.yaw),0,-Math.cos(input.yaw));
    const right=new THREE.Vector3(-forward.z,0,forward.x);
    const move=forward.multiplyScalar(-input.moveY).add(right.multiplyScalar(input.moveX));
    if(move.lengthSq()>1)move.normalize();
    const sprint=input.sprinting?1.55:1;
    const desired=move.multiplyScalar(5.4*sprint);
    this.speed=THREE.MathUtils.damp(this.speed,desired.length(),10,dt);
    const dx=desired.x*dt,dz=desired.z*dt;
    if(!world.isBlocked(this.position.x+dx,this.position.z,.55))this.position.x+=dx;
    if(!world.isBlocked(this.position.x,this.position.z+dz,.55))this.position.z+=dz;
    if(input.consumeJump()&&this.position.y<=.001)this.velocityY=7.2;
    this.velocityY-=19*dt;this.position.y=Math.max(0,this.position.y+this.velocityY*dt);
    if(this.position.y===0)this.velocityY=0;
    this.mesh.position.copy(this.position);
    if(move.lengthSq()>.001)this.mesh.rotation.y=Math.atan2(move.x,move.z);
    this.walkTime+=dt*this.speed*1.8;
    this.legs[0].rotation.x=Math.sin(this.walkTime)*.48*(this.speed/5.4);
    this.legs[1].rotation.x=-Math.sin(this.walkTime)*.48*(this.speed/5.4);
  }
}