import * as THREE from 'three';

const mat = (color, roughness = 0.85, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
const box = (w,h,d,material,x,y,z,scene,shadow=true) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), material);
  m.position.set(x,y,z); m.castShadow = shadow; m.receiveShadow = true; scene.add(m); return m;
};

export class World {
  constructor(scene) {
    this.scene = scene; this.blockers = []; this.traffic = []; this.npcs = []; this.time = 0;
    this.materials = {
      road:mat(0x252e35,0.94), sidewalk:mat(0xb2b5ad), grass:mat(0x526f50),
      line:mat(0xf3e7c7,.72), glass:mat(0x284b60,0.18,0.38), trunk:mat(0x604331),
      leaf:mat(0x356b45), lamp:mat(0x29353a,0.45,0.65), yellow:mat(0xe2b85d)
    };
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(520,520), this.materials.grass);
    ground.rotation.x=-Math.PI/2; ground.position.y=-0.08; ground.receiveShadow=true; scene.add(ground);
    this.makeRoads(); this.makeBlocks(); this.makeStreetProps(); this.makePark(); this.makeMission();
    this.makeTraffic(); this.makePedestrians();
    this.playerCar=this.createCar(0x2876a8); this.playerCar.position.set(5,0,1); this.scene.add(this.playerCar);
    this.vehicle={mesh:this.playerCar,speed:0,occupied:false};
  }
  makeRoads() {
    const {road,sidewalk,line}=this.materials;
    for(let i=-5;i<=5;i++){
      const p=i*34;
      box(520,.12,11,road,0,.01,p,this.scene,false);
      box(11,.12,520,road,p,.012,0,this.scene,false);
      // Raised curbs and subtle road-edge strips
      box(520,.22,.22,mat(0xd0d0c6),0,.12,p-5.55,this.scene,false);
      box(520,.22,.22,mat(0xd0d0c6),0,.12,p+5.55,this.scene,false);
      box(.22,.22,520,mat(0xd0d0c6),p-5.55,.12,0,this.scene,false);
      box(.22,.22,520,mat(0xd0d0c6),p+5.55,.12,0,this.scene,false);
      box(520,.12,2,sidewalk,0,.04,p-6.7,this.scene,false);
      box(520,.12,2,sidewalk,0,.04,p+6.7,this.scene,false);
      box(2,.12,520,sidewalk,p-6.7,.04,0,this.scene,false);
      box(2,.12,520,sidewalk,p+6.7,.04,0,this.scene,false);
      for(let k=-17;k<=17;k++){
        const mark=k*14;
        box(3.8,.018,.13,line,mark,.083,p,this.scene,false);
        box(.13,.018,3.8,line,p,.084,mark,this.scene,false);
      }
      // Crosswalks at each intersection
      for(let n=-3;n<=3;n++){
        box(.72,.025,4.8,line,p+n*1.45,.09,p-7.9,this.scene,false);
        box(4.8,.025,.72,line,p-7.9,.09,p+n*1.45,this.scene,false);
      }
    }
  }
  makeBlocks() {
    const palettes=[0x9eaaa6,0xb9a68f,0x788d91,0xc3c0b4,0x7e9189,0x9a8c80];
    const windowMats=[0x304e5c,0x46636a,0x273f4b].map(c=>mat(c,.25,.25));
    for(let gx=-7;gx<=7;gx++) for(let gz=-7;gz<=7;gz++){
      if(Math.abs(gx*34)<19 && Math.abs(gz*34)<19) continue;
      if(Math.abs(gx*34)>245||Math.abs(gz*34)>245) continue;
      const x=gx*34+17, z=gz*34+17;
      const w=12+Math.random()*7, d=12+Math.random()*7, h=8+Math.random()*34;
      const color=palettes[Math.floor(Math.random()*palettes.length)];
      const facade=mat(color,.76);
      const building=box(w,h,d,facade,x,h/2,z,this.scene);
      const baseMat=mat(0x424e50,.82);
      box(w+.35,.55,d+.35,baseMat,x,.3,z,this.scene,false);
      box(w+.5,.22,d+.5,mat(0xd0c7b4,.82),x,h+.11,z,this.scene,false);
      // Side facade windows and floor ledges give buildings depth.
      for(let f=0;f<Math.floor(h/3.2);f++){
        const y=1.6+f*3.2;
        box(w+.08,.09,d+.08,mat(0x697779,.8),x,y,z,this.scene,false);
        for(const side of [-1,1]) box(.07,1.15,1.0,windowMats[(f+gx+gz+30)%3],x+side*(w/2+.045),y+.65,z,this.scene,false);
      }
      if(h>18){
        const rooftop=box(w*.48,.35,d*.5,mat(0x667578,.82),x,h+.32,z,this.scene,false);
        box(w*.5,.16,.18,mat(0xb8c2bd),x,h+.56,z-d*.25,this.scene,false);
      }
      this.blockers.push({x,z,hw:w/2+1,hd:d/2+1});
      // Repeating facade bands and windows add readable scale without thousands of draw calls.
      const floors=Math.max(2,Math.floor(h/3.2));
      for(let f=0;f<floors;f++){
        const y=1.5+f*3.2;
        if(y>h-1) break;
        for(let col=0;col<Math.max(2,Math.floor(w/2.6));col++){
          const wx=x-w/2+1.5+col*2.6;
          box(.95,1.25,.07,windowMats[(gx+gz+f+col+20)%3],wx,y,z-d/2-.045,this.scene,false);
          box(.95,1.25,.07,windowMats[(gx+gz+f+col+21)%3],wx,y,z+d/2+.045,this.scene,false);
        }
      }
      if(h>25){
        box(w*.42,.6,d*.42,mat(0x687a7c),x,h+.3,z,this.scene,false);
      }
    }
  }
  makeStreetProps() {
    for(let i=-7;i<=7;i++) for(let j=-7;j<=7;j++){
      const x=i*34+8,z=j*34+8;
      if(Math.abs(x)<18&&Math.abs(z)<18) continue;
      if(Math.abs(i%2)===0 && Math.abs(j%2)===0) this.tree(x,z,1+Math.random()*.5);
      if((i+j)%3===0) this.lamp(x+4,z-3);
    }
  }
  tree(x,z,s=1){
    const {trunk,leaf}=this.materials;
    const t=new THREE.Mesh(new THREE.CylinderGeometry(.18*s,.28*s,2.3*s,7),trunk);
    t.position.set(x,1.15*s,z); t.castShadow=true; this.scene.add(t); this.blockers.push({x,z,hw:.72*s,hd:.72*s});
    const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(1.25*s,2),leaf);
    crown.position.set(x,2.8*s,z); crown.castShadow=true; crown.receiveShadow=true; this.scene.add(crown);
    const crown2=new THREE.Mesh(new THREE.IcosahedronGeometry(.82*s,1),mat(0x477f4e));
    crown2.position.set(x+.48*s,3.05*s,z-.18*s); crown2.castShadow=true; this.scene.add(crown2);
  }
  lamp(x,z){
    const g=new THREE.Group();
    const pole=new THREE.Mesh(new THREE.CylinderGeometry(.07,.1,4.5,7),this.materials.lamp); pole.position.y=2.25; g.add(pole);
    const arm=new THREE.Mesh(new THREE.BoxGeometry(.9,.08,.08),this.materials.lamp); arm.position.set(.38,4.35,0); g.add(arm);
    const bulb=new THREE.Mesh(new THREE.SphereGeometry(.16,8,8),mat(0xffe5a6,.25)); bulb.position.set(.75,4.25,0); g.add(bulb);
    g.position.set(x,0,z); this.scene.add(g); this.blockers.push({x,z,hw:.42,hd:.42});
  }
  makePark(){
    const park=box(25,.12,25,mat(0x77936a),17,.01,17,this.scene,false);
    for(let i=0;i<8;i++) this.tree(8+(i%4)*6,8+Math.floor(i/4)*9,.8);
    box(8,.18,1.2,mat(0x8e9a9b),17,.2,17,this.scene,false);
  }
  makeMission(){
    this.marker=new THREE.Group();
    const ring=new THREE.Mesh(new THREE.TorusGeometry(1.5,.12,8,32),mat(0x66f0bb,.35,.2));
    ring.rotation.x=Math.PI/2; ring.position.y=.16; this.marker.add(ring);
    const beam=new THREE.Mesh(new THREE.CylinderGeometry(.08,.5,3.5,16,1,true),new THREE.MeshBasicMaterial({color:0x64edb8,transparent:true,opacity:.16,side:THREE.DoubleSide}));
    beam.position.y=1.8; this.marker.add(beam); this.marker.position.set(17,0,17); this.scene.add(this.marker);
  }
  makeTraffic(){
    const colors=[0xc34e43,0x315d80,0xd0b66b,0xeeeeea,0x343a42];
    for(let i=0;i<9;i++){
      const g=this.createCar(colors[i%colors.length]);
      const lane=(i%2?1:-1), z=-150+i*36;
      g.position.set(lane*2,0,z); const dir=lane===1?1:-1; g.rotation.y=dir>0?Math.PI:0;
      this.scene.add(g); this.traffic.push({mesh:g,speed:5+(i%4)*1.5,dir});
    }
  }
  createCar(color){
    const g=new THREE.Group(), bodyMat=mat(color,.38,.18), dark=mat(0x202a30,.3,.2), tire=mat(0x151719,.95);
    box(2.1,.62,4,bodyMat,0,.72,0,g);
    box(1.72,.76,1.95,mat(0x31566a,.16,.42),0,1.36,-.12,g,false);
    box(1.72,.12,2.05,dark,0,1.02,-.12,g,false);
    box(2.14,.18,.18,dark,0,.48,-1.98,g,false);
    box(2.14,.18,.18,dark,0,.48,1.98,g,false);
    box(1.65,.08,1.72,mat(0x1b2930,.35,.35),0,1.77,-.12,g,false);
    for(const x of [-1.05,1.05]) for(const z of [-1.25,1.25]){
      const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.39,.39,.24,16),tire);wheel.rotation.z=Math.PI/2;wheel.position.set(x,.4,z);wheel.castShadow=true;g.add(wheel);
      const hub=new THREE.Mesh(new THREE.CylinderGeometry(.19,.19,.255,12),mat(0x9da9ac,.28,.8));hub.rotation.z=Math.PI/2;hub.position.set(x,.4,z);g.add(hub);
    }
    box(.58,.2,.08,mat(0xfff1c9,.2,.15),-.62,.8,-2.04,g,false);
    box(.58,.2,.08,mat(0xfff1c9,.2,.15),.62,.8,-2.04,g,false);
    box(.55,.17,.08,mat(0xe85a4e,.3,.1),-.62,.8,2.04,g,false);
    box(.55,.17,.08,mat(0xe85a4e,.3,.1),.62,.8,2.04,g,false);
    return g;
  }
  makePedestrians(){
    const colors=[0x354c61,0x8b5b43,0x657c59,0x4c4a68,0x9a9b9a];
    for(let i=0;i<14;i++){
      const g=new THREE.Group();
      const body=new THREE.Mesh(new THREE.CapsuleGeometry(.23,.65,4,7),mat(colors[i%colors.length]));
      body.position.y=.72; body.castShadow=true;g.add(body);
      const head=new THREE.Mesh(new THREE.SphereGeometry(.17,10,8),mat(0xc99875));head.position.y=1.35;g.add(head);
      g.position.set(-95+(i*31)%190,0,-105+((i*47)%210));
      this.scene.add(g);this.npcs.push({mesh:g,phase:i*1.7,origin:g.position.clone()});
    }
  }
  interactionAt(position,inVehicle=false){
    if(inVehicle)return 'exit';
    if(Math.hypot(position.x-this.playerCar.position.x,position.z-this.playerCar.position.z)<4)return 'enter';
    if(this.marker.visible&&Math.hypot(position.x-17,position.z-17)<3.2)return 'mission';
    return '';
  }
  interact(player){
    if(player.inVehicle){
      const car=this.vehicle.mesh, yaw=car.rotation.y;
      const ex=car.position.x+Math.cos(yaw)*2.1, ez=car.position.z-Math.sin(yaw)*2.1;
      if(this.isBlocked(ex,ez,.55)){return 'Здесь нельзя выйти из машины';}
      player.position.set(ex,0,ez); player.inVehicle=false; player.mesh.visible=true; this.vehicle.occupied=false; this.vehicle.speed=0;
      return 'Вы вышли из машины';
    }
    const car=this.vehicle.mesh;
    if(Math.hypot(player.position.x-car.position.x,player.position.z-car.position.z)<4){
      player.inVehicle=true; player.mesh.visible=false; this.vehicle.occupied=true; player.position.copy(car.position);
      return 'Вы за рулём. Используй стик для движения';
    }
    if(this.marker.visible&&Math.hypot(player.position.x-17,player.position.z-17)<3.2){
      this.marker.visible=false; this.missionComplete=true; return 'Задание выполнено! Первая точка найдена.';
    }
    return '';
  }
  driveVehicle(dt,input){
    const v=this.vehicle, car=v.mesh;
    const throttle=-input.moveY;
    v.speed=THREE.MathUtils.damp(v.speed,throttle*12,3.2,dt);
    if(Math.abs(v.speed)>.25)car.rotation.y-=input.moveX*dt*1.35*Math.sign(v.speed);
    const dx=-Math.sin(car.rotation.y)*v.speed*dt, dz=-Math.cos(car.rotation.y)*v.speed*dt;
    const nx=car.position.x+dx,nz=car.position.z+dz;
    if(!this.isBlocked(nx,nz,1.15)){car.position.x=nx;car.position.z=nz;}else v.speed=0;
  }
  isBlocked(x,z,r=.55){
    if(Math.abs(x)>250||Math.abs(z)>250)return true;
    if(this.blockers.some(b=>Math.abs(x-b.x)<b.hw+r&&Math.abs(z-b.z)<b.hd+r))return true;
    if(this.traffic.some(c=>Math.abs(x-c.mesh.position.x)<1.35+r&&Math.abs(z-c.mesh.position.z)<2.25+r))return true;
    if(this.vehicle&&!this.vehicle.occupied&&Math.abs(x-this.vehicle.mesh.position.x)<1.25+r&&Math.abs(z-this.vehicle.mesh.position.z)<2.2+r)return true;
    return this.npcs.some(n=>Math.abs(x-n.mesh.position.x)<.48+r&&Math.abs(z-n.mesh.position.z)<.48+r);
  }
  update(dt,time,playerPosition){
    this.time=time; this.marker.rotation.y= time*.55; this.marker.position.y=.08+Math.sin(time*2)*.08;
    for(const car of this.traffic){
      car.mesh.position.z+=car.speed*dt*car.dir;
      if(car.mesh.position.z>190)car.mesh.position.z=-190;
      if(car.mesh.position.z< -190)car.mesh.position.z=190;
    }
    for(const npc of this.npcs){
      const a=time*.32+npc.phase;
      npc.mesh.position.x=npc.origin.x+Math.sin(a)*2.8;
      npc.mesh.position.z=npc.origin.z+Math.cos(a*.7)*2.8;
      npc.mesh.rotation.y=Math.atan2(Math.cos(a)*2.8,-Math.sin(a*.7)*1.96);
    }
  }
}