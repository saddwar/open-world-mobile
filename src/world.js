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
      road:mat(0x30383d,0.96), sidewalk:mat(0x9a9d96), grass:mat(0x647d5d),
      line:mat(0xe7dfbd), glass:mat(0x41616a,0.3,0.25), trunk:mat(0x604a38),
      leaf:mat(0x477454), lamp:mat(0x29353a,0.55,0.55), yellow:mat(0xd6ad55)
    };
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(520,520), this.materials.grass);
    ground.rotation.x=-Math.PI/2; ground.position.y=-0.08; ground.receiveShadow=true; scene.add(ground);
    this.makeRoads(); this.makeBlocks(); this.makeStreetProps(); this.makePark(); this.makeMission();
    this.makeTraffic(); this.makePedestrians();
  }
  makeRoads() {
    const {road,sidewalk,line}=this.materials;
    for(let i=-5;i<=5;i++){
      const p=i*34;
      box(520,.08,11,road,0,.01,p,this.scene,false);
      box(11,.08,520,road,p,.012,0,this.scene,false);
      box(520,.12,2,sidewalk,0,.04,p-6.7,this.scene,false);
      box(520,.12,2,sidewalk,0,.04,p+6.7,this.scene,false);
      box(2,.12,520,sidewalk,p-6.7,.04,0,this.scene,false);
      box(2,.12,520,sidewalk,p+6.7,.04,0,this.scene,false);
      for(let k=-9;k<=9;k++){
        box(3,.025,.16,line,k*14,.065,p,this.scene,false);
        box(.16,.025,3,line,p,.066,k*14,this.scene,false);
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
      const building=box(w,h,d,mat(color,.88),x,h/2,z,this.scene);
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
    const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(1.25*s,1),leaf);
    crown.position.set(x,2.8*s,z); crown.castShadow=true; this.scene.add(crown);
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
    box(2.1,.65,4,bodyMat,0,.75,0,g);
    box(1.65,.72,1.9,mat(0x47616b,.25,.2),0,1.35,-.15,g,false);
    for(const x of [-1.05,1.05]) for(const z of [-1.25,1.25]){
      const w=new THREE.Mesh(new THREE.CylinderGeometry(.38,.38,.22,12),tire);w.rotation.z=Math.PI/2;w.position.set(x,.4,z);g.add(w);
    }
    box(.5,.18,.08,mat(0xffe8bd),0,.78,-2.02,g,false);
    box(.5,.18,.08,mat(0xe85a4e),0,.78,2.02,g,false);
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
  isBlocked(x,z,r=.55){
    if(Math.abs(x)>250||Math.abs(z)>250)return true;
    if(this.blockers.some(b=>Math.abs(x-b.x)<b.hw+r&&Math.abs(z-b.z)<b.hd+r))return true;
    if(this.traffic.some(c=>Math.abs(x-c.mesh.position.x)<1.35+r&&Math.abs(z-c.mesh.position.z)<2.25+r))return true;
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