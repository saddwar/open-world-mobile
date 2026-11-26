import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js';
import { TerrainGenerator, BIOMES } from '../world/TerrainGenerator.js';

const root=document.querySelector('#game');
const $=id=>document.getElementById(id);
const scene=new THREE.Scene();
// Lightweight painted sky gradient instead of a flat grey background.
const skyCanvas=document.createElement('canvas');skyCanvas.width=4;skyCanvas.height=256;
const skyCtx=skyCanvas.getContext('2d'),skyGradient=skyCtx.createLinearGradient(0,0,0,256);
skyGradient.addColorStop(0,'#477eaa');skyGradient.addColorStop(.48,'#8db8ce');skyGradient.addColorStop(1,'#d4d9c9');
skyCtx.fillStyle=skyGradient;skyCtx.fillRect(0,0,4,256);
const skyTexture=new THREE.CanvasTexture(skyCanvas);skyTexture.colorSpace=THREE.SRGBColorSpace;scene.background=skyTexture;
scene.fog=new THREE.Fog(0xb9c9c5,55,205); // RADIUS is initialized below; the slider updates fog after startup.
const camera=new THREE.PerspectiveCamera(78,innerWidth/innerHeight,.08,240);
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.18;
root.appendChild(renderer.domElement);
// Balanced natural light: warm sun, cool sky fill, and restrained ambient light.
scene.add(new THREE.HemisphereLight(0xdceaff,0x46513d,.9));
scene.add(new THREE.AmbientLight(0x8995a2,.2));
const sun=new THREE.DirectionalLight(0xffe4bd,2.0);sun.position.set(-28,48,25);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-48;sun.shadow.camera.right=48;sun.shadow.camera.top=48;sun.shadow.camera.bottom=-48;sun.shadow.bias=-.00035;sun.shadow.normalBias=.025;scene.add(sun);
const moonFill=new THREE.DirectionalLight(0x9eb8df,.3);moonFill.position.set(22,18,-28);scene.add(moonFill);

const defs=[
 ['grass','Трава','🟩',0x6aa84f],['dirt','Земля','🟫',0x936345],['stone','Камень','🪨',0x92999d],
 ['wood','Дерево','🪵',0x93633a],['leaves','Листва','🌿',0x398447],['sand','Песок','🏖️',0xdcc783],
 ['brick','Кирпич','🧱',0xa95745],['glass','Стекло','🔷',0x9bd9e8],['planks','Доски','🪚',0xb98750],
 ['coal','Уголь','⚫',0x42474c],['flower','Цветок','🌼',0xe7b7d0],['iron','Железная руда','⛏️',0xb58f79],['gold','Золотая руда','🟨',0xe2b83f],['diamond','Алмазная руда','💎',0x55cbd2],['snow','Снег','❄️',0xeaf4fa]
];
const names=Object.fromEntries(defs.map(d=>[d[0],d[1]]));
function texture(type,base){
 // Detailed 64x64 seamless pixel textures: earthy dirt grain and layered wood bark.
 const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');
 const hex=n=>'#'+n.toString(16).padStart(6,'0');
 let seed=type.split('').reduce((a,ch)=>Math.imul(a^ch.charCodeAt(0),16777619),2166136261)>>>0;
 const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
 const palettes={
  grass:['#57913d','#68a947','#78b94d','#477f35','#8ac85a'],
  dirt:['#765038','#865b3d','#966747','#68452f','#a47750'],
  stone:['#777d80','#898f91','#9ba0a1','#656b6e','#b0b3b1'],
  wood:['#704523','#86552b','#a16a35','#593719','#bd8748'],
  leaves:['#286b35','#347e3b','#438e42','#1e592d','#65a34a'],
  sand:['#c7b477','#d9c58a','#ead69a','#b6a36b','#f0dfa9'],
  brick:['#914638','#aa5948','#c06a55','#71382f','#d07b60'],
  glass:['#79b9c8','#a5dce5','#d5f4f5','#4d98ad','#e9ffff'],
  planks:['#9b6838','#b27c45','#c99558','#80552f','#d9a96a'],
  coal:['#353a3d','#484e50','#5a6061','#252a2d','#717777'],
  flower:['#4b843a','#68a94b','#e9a7c9','#f6d7e8','#fff0a5'],
  iron:['#777d80','#b58f79','#d2b5a2','#656b6e','#e0c4b0'],gold:['#777d80','#e2b83f','#f5d66b','#656b6e','#ffe99a'],diamond:['#777d80','#55cbd2','#91f1ed','#656b6e','#c2ffff'],snow:['#dce8ed','#edf6fa','#ffffff','#b7cbd5','#f8ffff']
 };
 const p=palettes[type]||palettes.grass;
 g.fillStyle=p[0];g.fillRect(0,0,64,64);
 // Fine-scale deterministic texture detail, matching the supplied bark and soil references.
 if(type==='wood'){
  for(let x=0;x<64;x++){
   const wave=Math.sin(x*.42)*2+Math.sin(x*.13)*3;
   const groove=rand()<.22;
   g.fillStyle=groove?p[3]:(rand()<.5?p[1]:p[0]);
   g.fillRect(x,0,1,64);
   if(groove){g.fillStyle=p[2];g.fillRect(Math.max(0,x+1),0,1,64)}
   if(x%9===0){g.fillStyle=p[4];g.globalAlpha=.24;g.fillRect(x+wave,0,1,64);g.globalAlpha=1}
  }
  for(let i=0;i<95;i++){const x=rand()*64,y=rand()*64;g.fillStyle=rand()<.5?p[3]:p[4];g.globalAlpha=.28;g.fillRect(x,y,1+rand()*2,2+rand()*8)}g.globalAlpha=1;
 }else if(type==='dirt'||type==='grass'||type==='stone'||type==='coal'||type==='sand'){
  for(let y=0;y<64;y+=2)for(let x=0;x<64;x+=2){
   const n=rand(),idx=n<.13?3:n<.34?1:n<.42?4:0;
   g.fillStyle=p[idx];g.globalAlpha=.32+rand()*.48;g.fillRect(x,y,1+Math.floor(rand()*3),1+Math.floor(rand()*3));
  }
  if(type==='dirt'){
   for(let i=0;i<75;i++){const x=rand()*64,y=rand()*64;g.fillStyle=rand()<.5?p[3]:p[4];g.globalAlpha=.45;g.fillRect(x,y,1+rand()*3,1+rand()*3)}
  }
  g.globalAlpha=1;
 }else{
  for(let y=0;y<64;y++)for(let x=0;x<64;x++){
   const n=rand();if(n<.12){g.fillStyle=p[3];g.globalAlpha=.35;g.fillRect(x,y,1,1)}else if(n>.88){g.fillStyle=p[2];g.globalAlpha=.4;g.fillRect(x,y,1,1)}
  }g.globalAlpha=1;
 }
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearMipmapLinearFilter;t.generateMipmaps=true;t.anisotropy=renderer.capabilities.getMaxAnisotropy();return t;
}
const materials={};
for(const [id,, ,color] of defs){const tex=texture(id,color);materials[id]=new THREE.MeshStandardMaterial({map:tex,roughness:id==='glass'?.28:.92,metalness:id==='iron'||id==='gold'||id==='diamond'?.12:0,transparent:id==='glass',opacity:id==='glass'?.58:1})}
materials.flower=new THREE.MeshStandardMaterial({color:0xe6a6d0,roughness:.78});
materials.water=new THREE.MeshStandardMaterial({color:0x4bafd0,roughness:.18,metalness:.08,transparent:true,opacity:.68,depthWrite:false});
const cube=new THREE.BoxGeometry(1,1,1),blocks=new Map(),chunkMeshes=new Map();
const key=(x,y,z)=>x+','+y+','+z,CHUNK=16,loadedChunks=new Set(),chunkQueue=[],queuedChunks=new Set(),chunkLods=new Map();let RADIUS=6;
function chunkKey(x,z){return x+','+z}
function hash(x,z){let n=(Math.imul(x,374761393)+Math.imul(z,668265263))|0;n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295}
const terrain=new TerrainGenerator(20261120);
function heightAt(x,z){return terrain.heightAt(x,z)}
function treeAt(x,z){return hash(x+193,z-71)>.974&&heightAt(x,z)>2}
function generatedBlock(x,y,z,treeBlocks=null,heightCache=null){
 const columnKey=x+','+z;
 let h=heightCache?.get(columnKey);
 if(h===undefined){h=heightAt(x,z);heightCache?.set(columnKey,h)}
 if(y<=h)return terrain.blockAt(x,y,z)||null;
 return treeBlocks?.get(key(x,y,z))||null;
}
function rebuildChunk(cx,cz,lod=0){
 const ck=chunkKey(cx,cz);for(const m of chunkMeshes.get(ck)||[])scene.remove(m);
 const buckets={},minX=cx*CHUNK,minZ=cz*CHUNK,maxX=minX+CHUNK-1,maxZ=minZ+CHUNK-1;
 const heightCache=new Map(),treeBlocks=new Map(),voxelCache=new Map();
 const columnHeight=(x,z)=>{const k=x+','+z;if(!heightCache.has(k))heightCache.set(k,heightAt(x,z));return heightCache.get(k)};
 // Build tree voxels once per chunk (including a 2-block border), not once per voxel.
 for(let tx=minX-4;tx<=maxX+4;tx++)for(let tz=minZ-4;tz<=maxZ+4;tz++){
  const th=columnHeight(tx,tz),biome=terrain.biomeAt(tx,tz),roll=hash(tx+193,tz-71);
  // Forests and jungles are dense; plains have occasional trees; deserts and high peaks stay bare.
  const density=biome===BIOMES.FOREST?.972:biome===BIOMES.JUNGLE?.945:biome===BIOMES.SWAMP?.965:biome===BIOMES.PLAINS?.994:biome===BIOMES.SNOW?.988:.9999;
  if(roll<=density||th<=2||biome===BIOMES.DESERT||biome===BIOMES.MOUNTAINS||biome===BIOMES.OCEAN)continue;
  const variant=hash(tx+811,tz-337),tall=biome===BIOMES.JUNGLE?7:biome===BIOMES.SWAMP?5:variant>.72?6:4;
  const radius=biome===BIOMES.JUNGLE?3:variant>.72?2:1.8;
  for(let y=th+1;y<=th+tall+2;y++)for(let x=Math.max(minX-1,tx-3);x<=Math.min(maxX+1,tx+3);x++)for(let z=Math.max(minZ-1,tz-3);z<=Math.min(maxZ+1,tz+3);z++){
   const dx=x-tx,dz=z-tz,dy=y-(th+tall);
   if(dx===0&&dz===0&&y<=th+tall)treeBlocks.set(key(x,y,z),'wood');
   else{
    const normalized=(dx*dx+dz*dz)/(radius*radius)+(dy*dy)/(biome===BIOMES.JUNGLE?8:5);
    const conifer=biome===BIOMES.SNOW||variant<.18;
    const allowed=conifer?Math.abs(dx)+Math.abs(dz)<=Math.max(0,(tall+2-(y-th))*.72):normalized<=1.2;
    if(allowed&&y>=th+tall-2)treeBlocks.set(key(x,y,z),'leaves');
   }
  }
 }
 const sample=(x,y,z)=>{
  const k=key(x,y,z);if(blocks.has(k))return blocks.get(k);
  if(voxelCache.has(k))return voxelCache.get(k);
  const value=generatedBlock(x,y,z,treeBlocks,heightCache);voxelCache.set(k,value);return value;
 };
 for(let x=minX;x<=maxX;x++)for(let z=minZ;z<=maxZ;z++){
  const top=columnHeight(x,z)+6;
  for(let y=-24;y<=top;y++){
   const type=sample(x,y,z);if(!type)continue;
   let exposed=false;
   for(const [dx,dy,dz] of [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]]){
    const neighbor=sample(x+dx,y+dy,z+dz);
    if(!neighbor||neighbor==='glass'||type==='glass'){exposed=true;break}
   }
   if(exposed)(buckets[type]??=[]).push([x,y,z]);
  }
 }
 const group=[],dummy=new THREE.Object3D();
 const foliageGeometry=new THREE.IcosahedronGeometry(.72,lod===0?1:0);
 const trunkGeometry=new THREE.CylinderGeometry(.25,.34,1,lod===0?7:5,1);
 for(const [type,coords] of Object.entries(buckets)){
  // Rounded low-poly foliage and tapered trunks replace cube-shaped tree parts.
  const geometry=type==='leaves'?foliageGeometry:type==='wood'?trunkGeometry:cube;
  const mesh=new THREE.InstancedMesh(geometry,materials[type]||materials.grass,coords.length);mesh.userData.coords=coords;
  if(['grass','leaves','dirt'].includes(type))mesh.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(coords.length*3),3);
  coords.forEach((p,i)=>{
   dummy.position.set(p[0]+.5,p[1]+.5,p[2]+.5);
   if(type==='leaves'){const s=.92+hash(p[0],p[2])*.16;dummy.scale.set(s,.88+hash(p[2],p[0])*.12,s);dummy.rotation.set(0,hash(p[0]+4,p[2]+7)*.22,0)}
   else{dummy.scale.set(1,1,1);dummy.rotation.set(0,0,0)}
   dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);
   if(mesh.instanceColor){const v=hash(p[0]+31,p[2]-17),color=new THREE.Color();color.setHSL(type==='leaves'?.31:.27,type==='leaves'?.48:.42,.92+v*.08);mesh.setColorAt(i,color)}
  });
  mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
  mesh.castShadow=lod===0;mesh.receiveShadow=lod===0;mesh.computeBoundingSphere();scene.add(mesh);group.push(mesh)
 }
 // Add calm water planes in low terrain basins.
 const waterCoords=[];
 for(let x=minX;x<=maxX;x++)for(let z=minZ;z<=maxZ;z++)if(columnHeight(x,z)<6)waterCoords.push([x+.5,6.02,z+.5]);
 if(waterCoords.length){
  const water=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),materials.water,waterCoords.length),wm=new THREE.Object3D();
  waterCoords.forEach((p,i)=>{wm.position.set(p[0],p[1],p[2]);wm.rotation.x=-Math.PI/2;wm.updateMatrix();water.setMatrixAt(i,wm.matrix)});
  water.instanceMatrix.needsUpdate=true;water.renderOrder=2;scene.add(water);group.push(water);
 }
 chunkMeshes.set(ck,group);loadedChunks.add(ck);chunkLods.set(ck,lod);
}
function solidAt(x,y,z){const k=key(x,y,z);return blocks.has(k)?blocks.get(k)!==null:generatedBlock(x,y,z)!==null}
function collides(px,py,pz){const r=.29,h=1.75;for(let x=Math.floor(px-r);x<=Math.floor(px+r);x++)for(let z=Math.floor(pz-r);z<=Math.floor(pz+r);z++)for(let y=Math.floor(py+.001);y<=Math.floor(py+h-.001);y++)if(solidAt(x,y,z))return true;return false}
function loadAround(){const px=Math.floor(player.x/CHUNK),pz=Math.floor(player.z/CHUNK),streamRadius=Math.min(RADIUS,5),candidates=[];for(let x=px-streamRadius;x<=px+streamRadius;x++)for(let z=pz-streamRadius;z<=pz+streamRadius;z++){const dx=x-px,dz=z-pz,d=Math.max(Math.abs(dx),Math.abs(dz));if(d>streamRadius)continue;const lod=d>6?2:d>3?1:0;candidates.push({x,z,d,lod})}candidates.sort((a,b)=>a.d-b.d);const wanted=candidates,wantedKeys=new Set(wanted.map(q=>chunkKey(q.x,q.z)));for(const q of wanted){const ck=chunkKey(q.x,q.z);if((!loadedChunks.has(ck)||chunkLods.get(ck)!==q.lod)&&!queuedChunks.has(ck)){chunkQueue.push({...q});queuedChunks.add(ck)}}chunkQueue.sort((a,b)=>a.d-b.d);for(const ck of [...loadedChunks])if(!wantedKeys.has(ck)){for(const m of chunkMeshes.get(ck)||[])scene.remove(m);chunkMeshes.delete(ck);loadedChunks.delete(ck);chunkLods.delete(ck)}chunkQueue.splice(0,chunkQueue.length,...chunkQueue.filter(q=>wantedKeys.has(chunkKey(q.x,q.z))));loadAnimalsAround(px,pz)}
function processChunkQueue(){const next=chunkQueue.shift();if(!next)return;const ck=chunkKey(next.x,next.z);queuedChunks.delete(ck);if(!loadedChunks.has(ck)||chunkLods.get(ck)!==next.lod)rebuildChunk(next.x,next.z,next.lod);}
function addBlock(x,y,z,type='grass'){const k=key(x,y,z);if(blocks.has(k)&&blocks.get(k)!==null)return false;blocks.set(k,type);rebuildChunk(Math.floor(x/CHUNK),Math.floor(z/CHUNK));return true}
function removeBlock(x,y,z){const k=key(x,y,z),old=blocks.has(k)?blocks.get(k):generatedBlock(x,y,z);if(!old)return null;blocks.set(k,null);rebuildChunk(Math.floor(x/CHUNK),Math.floor(z/CHUNK));return old}
// Player camera is truly first-person; only a small arm and held block are visible.
const animalChunks=new Map(), plantChunks=new Map(), animalList=[];
const animalMixers=[];
const animalAssets={
 pig:'https://tevy.dev/models/pig/v1/lod0.glb',
 cow:'https://tevy.dev/models/dairy-cow/v2/lod0.glb',
 sheep:'https://tevy.dev/models/sheep/v1/lod0.glb'
};
const animalTemplates=new Map();
const animalLoader=new GLTFLoader();
const animalLoadPromises=Object.entries(animalAssets).map(async([type,url])=>{
 try{
  const gltf=await animalLoader.loadAsync(url);
  animalTemplates.set(type,{scene:gltf.scene,animations:gltf.animations||[]});
  for(const animal of animalList)if(animal.userData.type===type)attachAnimalModel(animal,type);
 }catch(error){console.warn('Не удалось загрузить модель животного:',type,error)}
});
function attachFallbackAnimal(wrapper,type){
 const root=new THREE.Group();
 const mat=(color)=>new THREE.MeshLambertMaterial({color});
 const bodyColor=type==='pig'?0xe58b91:type==='cow'?0xf0eee5:0xe8e2d3;
 const body=new THREE.Mesh(new THREE.BoxGeometry(type==='cow'?0.9:0.72,type==='sheep'?0.72:0.58,type==='cow'?0.52:0.48),mat(bodyColor));
 body.position.y=type==='cow'?0.78:0.62;root.add(body);
 if(type==='sheep'){
  const wool=new THREE.Mesh(new THREE.IcosahedronGeometry(.43,1),mat(0xf5f0e5));wool.position.set(0,.82,0);wool.scale.set(1,.82,1.15);root.add(wool);
 }
 const head=new THREE.Mesh(new THREE.BoxGeometry(.34,.34,.34),mat(bodyColor));head.position.set(0,type==='cow'?.98:.83,.38);root.add(head);
 const muzzle=new THREE.Mesh(new THREE.BoxGeometry(.24,.17,.13),mat(type==='pig'?0xf3a6a8:0xd8c9b5));muzzle.position.set(0,type==='cow'? .91:.76,.59);root.add(muzzle);
 for(const x of [-.23,.23]){
  const leg=new THREE.Mesh(new THREE.BoxGeometry(.14,.42,.15),mat(type==='cow'?0xeee9df:bodyColor));leg.position.set(x,.25,.13);root.add(leg);
  const leg2=leg.clone();leg2.position.z=-.22;root.add(leg2);
  if(type==='cow'){const patch=new THREE.Mesh(new THREE.BoxGeometry(.25,.2,.025),mat(0x343434));patch.position.set(x*.8,.82,-.267);root.add(patch)}
 }
 if(type==='pig'){
  for(const x of [-.12,.12]){const nostril=new THREE.Mesh(new THREE.BoxGeometry(.035,.05,.02),mat(0x713e43));nostril.position.set(x,.76,.66);root.add(nostril)}
 }else if(type==='cow'){
  for(const x of [-.12,.12]){const horn=new THREE.Mesh(new THREE.ConeGeometry(.055,.2,6),mat(0xd9c9a2));horn.position.set(x,1.23,.34);root.add(horn)}
 }else{
  for(const x of [-.2,.2]){const ear=new THREE.Mesh(new THREE.BoxGeometry(.1,.22,.12),mat(0xe2b8ae));ear.position.set(x,1.02,.34);root.add(ear)}
 }
 wrapper.add(root);wrapper.userData.fallbackModel=root;
}
function attachAnimalModel(wrapper,type){
 const template=animalTemplates.get(type);if(!template||wrapper.userData.modelAttached)return;
 if(wrapper.userData.fallbackModel){wrapper.remove(wrapper.userData.fallbackModel);wrapper.userData.fallbackModel=null;}
 const model=cloneSkeleton(template.scene);
 model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});
 const bounds=new THREE.Box3().setFromObject(model),size=bounds.getSize(new THREE.Vector3());
 // Fit the complete mob inside sensible world dimensions. Some source models
 // have unusually wide bounds, so scaling by height alone makes them look flat.
 const targetHeight=type==='cow'?1.35:type==='sheep'?.95:.9;
 const targetFootprint=type==='cow'?1.25:type==='sheep'?1.05:.95;
 const scale=Math.min(targetHeight/Math.max(size.y,.001),targetFootprint/Math.max(size.x,size.z,.001));
 model.scale.setScalar(scale);
 const scaledBounds=new THREE.Box3().setFromObject(model);
 model.position.set(
  -(scaledBounds.min.x+scaledBounds.max.x)/2,
  -scaledBounds.min.y,
  -(scaledBounds.min.z+scaledBounds.max.z)/2
 );
 wrapper.add(model);wrapper.userData.modelAttached=true;
 const mixer=new THREE.AnimationMixer(model);
 const clips=template.animations;
 const walk=clips.find(c=>/walk/i.test(c.name))||clips.find(c=>/trot/i.test(c.name));
 const idle=clips.find(c=>/idle/i.test(c.name))||clips.find(c=>/graze/i.test(c.name));
 const action=mixer.clipAction(walk||idle||clips[0]);
 if(action)action.play();
 wrapper.userData.mixer=mixer;
 animalMixers.push(mixer);
}
function makeAnimal(type,x,z){
 const group=new THREE.Group();
 group.position.set(x,heightAt(Math.floor(x),Math.floor(z))+.02,z);
 group.userData={type,phase:hash(Math.floor(x*13),Math.floor(z*17))*Math.PI*2,speed:type==='cow'?.8:type==='sheep'?.65:.75,turn:0,modelAttached:false,mixer:null};
 scene.add(group);animalList.push(group);attachFallbackAnimal(group,type);attachAnimalModel(group,type);return group;
}
function loadAnimalsAround(px,pz){
 const animalRadius=Math.min(RADIUS,2);
 for(let cx=px-animalRadius;cx<=px+animalRadius;cx++)for(let cz=pz-animalRadius;cz<=pz+animalRadius;cz++){
  const ck=chunkKey(cx,cz);if(animalChunks.has(ck))continue;
  const animals=[],plants=[],r=hash(cx+902,cz-411);
  if(cx===0&&cz===0){const starters=[['pig',5,5],['cow',10,6],['sheep',7,12]];for(const [type,x,z] of starters)animals.push(makeAnimal(type,x,z));}
  else if(r>.58){const x=cx*CHUNK+3+Math.floor(hash(cx*7,cz*11)*10),z=cz*CHUNK+3+Math.floor(hash(cx*13,cz*5)*10);const type=['pig','cow','sheep'][Math.floor(hash(cx,cz)*3)];animals.push(makeAnimal(type,x,z));}
  for(let n=0;n<12;n++){const x=cx*CHUNK+hash(cx*31+n,cz*17)*CHUNK,z=cz*CHUNK+hash(cx*19,cz*29+n)*CHUNK,bx=Math.floor(x),bz=Math.floor(z),biome=terrain.biomeAt(bx,bz),h=heightAt(bx,bz);if(hash(bx*3,bz*3)<(biome===BIOMES.FOREST?.48:biome===BIOMES.JUNGLE?.58:.82)||h<=2||biome===BIOMES.DESERT||biome===BIOMES.MOUNTAINS)continue;const plant=new THREE.Group();plant.position.set(x,h+.03,z);const stem=new THREE.Mesh(new THREE.CylinderGeometry(.018,.027,.3,5),new THREE.MeshLambertMaterial({color:0x43843b}));stem.position.y=.15;plant.add(stem);const palette=[0xf4d45e,0xf0b6d0,0xffffff,0xb9a4f2,0xe98b55],flower=new THREE.Mesh(new THREE.DodecahedronGeometry(.105+hash(bx+5,bz+7)*.045,0),new THREE.MeshLambertMaterial({color:palette[Math.floor(hash(bx+9,bz+3)*palette.length)]}));flower.position.y=.32;plant.add(flower);scene.add(plant);plants.push(plant)}
  animalChunks.set(ck,animals);plantChunks.set(ck,plants)
 }
 for(const ck of [...animalChunks.keys()]){const [cx,cz]=ck.split(',').map(Number);if(Math.abs(cx-px)>animalRadius+1||Math.abs(cz-pz)>animalRadius+1){for(const a of animalChunks.get(ck)){scene.remove(a);const i=animalList.indexOf(a);if(i>=0)animalList.splice(i,1)}for(const p of plantChunks.get(ck)||[])scene.remove(p);animalChunks.delete(ck);plantChunks.delete(ck)}}
}
function updateAnimals(dt,time){
 for(const a of animalList){
  const u=a.userData;u.turn+=dt;
  if(u.turn>2.5+u.phase%3){u.turn=0;u.phase+=1.7+Math.sin(time+u.phase);u.speed=.15+Math.abs(Math.sin(u.phase))*.35}
  const nx=a.position.x+Math.sin(u.phase)*u.speed*dt,nz=a.position.z+Math.cos(u.phase)*u.speed*dt;
  const oldGround=heightAt(Math.floor(a.position.x),Math.floor(a.position.z)),newGround=heightAt(Math.floor(nx),Math.floor(nz));
  // Keep animals on the terrain surface; turn around at steep edges instead of stepping into holes.
  if(Math.abs(newGround-oldGround)<=0.65&&hash(Math.floor(nx),Math.floor(nz))>.08){a.position.x=nx;a.position.z=nz;a.position.y=newGround+.045;a.rotation.y=Math.atan2(Math.sin(u.phase),Math.cos(u.phase))}else{u.phase+=Math.PI*.72;u.turn=0}
  if(u.mixer)u.mixer.update(dt);
 }
}
const player={x:0,y:heightAt(0,0)+1,z:0};loadAround();
const hand=new THREE.Group();camera.add(hand);hand.position.set(.42,-.38,-.62);
const sleeve=new THREE.Mesh(new THREE.BoxGeometry(.18,.25,.22),new THREE.MeshLambertMaterial({color:0x3477ad}));sleeve.position.set(0,-.12,0);hand.add(sleeve);
const held=new THREE.Mesh(new THREE.BoxGeometry(.2,.2,.2),materials.grass);held.position.set(0,.02,-.17);hand.add(held);camera.add(hand);scene.add(camera);
let yaw=0,pitch=-.12,velY=0,onGround=false,move={x:0,y:0},lookPointer=null,lastX=0,lastY=0,mode='survival',selected='grass',day=1;
let gameStarted=false,paused=false,sensitivity=.004,showFps=false,fpsFrames=0,fpsTime=0;const quality={low:{ratio:devicePixelRatio,shadows:true},medium:{ratio:devicePixelRatio,shadows:true},high:{ratio:devicePixelRatio,shadows:true}};
const inventory={grass:32,dirt:24,stone:20,wood:16,leaves:12,sand:16,brick:12,glass:8,planks:0,coal:0,flower:0};
const hotbarIds=['grass','dirt','stone','wood','leaves','sand','brick','glass','coal','iron','gold','diamond','snow'];
const ray=new THREE.Raycaster();ray.far=6;
function eye(){camera.position.set(player.x,player.y+1.55,player.z);camera.rotation.order='YXZ';camera.rotation.y=yaw;camera.rotation.x=pitch}
function targetBlock(){eye();ray.setFromCamera(new THREE.Vector2(0,0),camera);return ray.intersectObjects([...chunkMeshes.values()].flat(),false)[0]||null}
function updateHeld(){held.material=materials[selected]||materials.grass}
function toast(t){const el=document.querySelector('#toast');el.textContent=t;el.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),1600)}
function renderInventory(){const grid=document.querySelector('#inventory-grid');grid.innerHTML='';for(const [id,label,icon] of defs){const count=inventory[id]||0;const b=document.createElement('button');b.className='inv-slot'+(selected===id?' chosen':'');b.innerHTML='<span class="item-model model-'+id+'">'+icon+'</span><span class="item-name">'+label+'</span><b>'+(mode==='creative'?'∞':count)+'</b>';b.onclick=()=>{selected=id;updateBar();renderInventory();updateHeld()};grid.append(b)}}
function updateBar(){const bar=document.querySelector('#hotbar');bar.innerHTML='';for(const id of hotbarIds){const d=defs.find(x=>x[0]===id);const b=document.createElement('button');b.className=id===selected?'active':'';b.innerHTML='<span>'+d[2]+'</span><small>'+(mode==='creative'?'∞':inventory[id]||0)+'</small>';b.onclick=()=>{selected=id;updateBar();updateHeld()};bar.append(b)}}
function action(place){const hit=targetBlock();if(!hit)return;const coord=hit.object.userData.coords?.[hit.instanceId];if(!coord)return;const [bx,by,bz]=coord;if(place){const x=bx+Math.round(hit.face.normal.x),y=by+Math.round(hit.face.normal.y),z=bz+Math.round(hit.face.normal.z);if(mode==='survival'&&!(inventory[selected]>0))return toast('Нет этого блока в инвентаре');if(Math.abs(x-player.x)<.8&&Math.abs(z-player.z)<.8&&y<=player.y+2)return toast('Здесь стоишь ты');if(addBlock(x,y,z,selected)){if(mode==='survival')inventory[selected]--;updateBar();renderInventory()}}}
let mining=null;
function startMining(){if(!gameStarted||paused||mining)return;const hit=targetBlock();if(!hit)return;const coord=hit.object.userData.coords?.[hit.instanceId];if(!coord)return;mining={coord:coord.slice(),elapsed:0,required:mode==='creative'?.12:.72};$('mine-progress').classList.add('active')}
function stopMining(){mining=null;$('mine-progress').classList.remove('active');$('mine-fill').style.width='0%'}
function updateMining(dt){if(!mining)return;mining.elapsed+=dt;$('mine-fill').style.width=Math.min(100,mining.elapsed/mining.required*100)+'%';if(mining.elapsed>=mining.required){const [x,y,z]=mining.coord;const got=removeBlock(x,y,z);if(got&&mode==='survival'){inventory[got]=(inventory[got]||0)+1;updateBar();renderInventory()}stopMining()}}
const breakButton=$('break');breakButton.addEventListener('pointerdown',e=>{e.preventDefault();startMining()});breakButton.addEventListener('pointerup',stopMining);breakButton.addEventListener('pointercancel',stopMining);breakButton.addEventListener('lostpointercapture',stopMining);
document.querySelector('#place').onclick=()=>action(true);
document.querySelector('#survival').onclick=()=>setMode('survival');document.querySelector('#creative').onclick=()=>setMode('creative');
function setMode(m){mode=m;document.querySelector('#survival').classList.toggle('selected',m==='survival');document.querySelector('#creative').classList.toggle('selected',m==='creative');updateBar();renderInventory();toast(m==='survival'?'Выживание':'Творчество')}
document.querySelector('#bag').onclick=()=>{document.querySelector('#inventory').classList.toggle('open');renderInventory()};
document.querySelector('#close-inventory').onclick=()=>document.querySelector('#inventory').classList.remove('open');
function jump(){if(gameStarted&&!paused&&onGround){velY=7.5;onGround=false}}document.querySelector('#jump').addEventListener('pointerdown',e=>{e.preventDefault();jump()});
const zone=document.querySelector('#left-stick'),knob=document.querySelector('#stick-knob');let stickId=null;
zone.addEventListener('pointerdown',e=>{stickId=e.pointerId;zone.setPointerCapture(stickId);stick(e)});zone.addEventListener('pointermove',e=>{if(e.pointerId===stickId)stick(e)});
function stick(e){const r=zone.getBoundingClientRect(),dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2),len=Math.hypot(dx,dy),s=Math.min(1,48/(len||1));move={x:dx*s/48,y:dy*s/48};knob.style.transform='translate('+move.x*34+'px,'+move.y*34+'px)'}
function resetStick(){stickId=null;move={x:0,y:0};knob.style.transform=''}zone.addEventListener('pointerup',resetStick);zone.addEventListener('pointercancel',resetStick);
renderer.domElement.addEventListener('pointerdown',e=>{if(!gameStarted||paused)return;if(e.clientX<innerWidth*.38||e.target!==renderer.domElement)return;lookPointer=e.pointerId;lastX=e.clientX;lastY=e.clientY;renderer.domElement.setPointerCapture(lookPointer)});
renderer.domElement.addEventListener('pointermove',e=>{if(!gameStarted||paused||e.pointerId!==lookPointer)return;const dx=e.clientX-lastX,dy=e.clientY-lastY;lastX=e.clientX;lastY=e.clientY;yaw-=dx*sensitivity;pitch=Math.max(-1.45,Math.min(1.45,pitch-dy*sensitivity))});
renderer.domElement.addEventListener('pointerup',()=>lookPointer=null);renderer.domElement.addEventListener('pointercancel',()=>lookPointer=null);
addEventListener('keydown',e=>{if(e.code==='Escape'){if(document.querySelector('#settings-panel').classList.contains('hidden'))togglePause();else{closeSettings();if(gameStarted&&paused)showScreen('pause-menu')}return}if(!gameStarted||paused)return;if(e.code==='Space')jump();if(e.code==='KeyW')move.y=-1;if(e.code==='KeyS')move.y=1;if(e.code==='KeyA')move.x=-1;if(e.code==='KeyD')move.x=1;if(e.code==='KeyF'&&!e.repeat)startMining();if(e.code==='KeyE')action(true);if(e.code==='KeyI'||e.code==='Tab'){e.preventDefault();document.querySelector('#inventory').classList.toggle('open')}if(/^Digit[1-8]$/.test(e.code)){selected=hotbarIds[Number(e.code.slice(5))-1];updateBar();updateHeld()}});
addEventListener('keyup',e=>{if(['KeyW','KeyS'].includes(e.code))move.y=0;if(['KeyA','KeyD'].includes(e.code))move.x=0;if(e.code==='KeyF')stopMining()});
updateBar();renderInventory();updateHeld();

function hideScreen(id){$(id).classList.add('hidden')}
function showScreen(id){$(id).classList.remove('hidden')}
function startGame(chosenMode){mode=chosenMode;setMode(chosenMode);gameStarted=true;paused=false;document.body.classList.add('game-active');hideScreen('main-menu');hideScreen('pause-menu');hideScreen('settings-panel');toast(chosenMode==='survival'?'Выживание':'Творчество')}
function togglePause(){if(!gameStarted)return;stopMining();paused=!paused;if(paused){move={x:0,y:0};hideScreen('settings-panel');showScreen('pause-menu')}else hideScreen('pause-menu')}
function openSettings(){showScreen('settings-panel')}
function closeSettings(){hideScreen('settings-panel')}
$('start-survival').onclick=()=>startGame('survival');$('start-creative').onclick=()=>startGame('creative');
$('open-settings').onclick=openSettings;$('pause-settings').onclick=()=>{hideScreen('pause-menu');openSettings()};
$('close-settings').onclick=()=>{closeSettings();if(gameStarted&&paused)showScreen('pause-menu')};
$('resume-game').onclick=()=>{paused=false;hideScreen('pause-menu')};
$('pause-button').onclick=togglePause;
$('back-menu').onclick=()=>{gameStarted=false;paused=false;document.body.classList.remove('game-active');hideScreen('pause-menu');hideScreen('settings-panel');showScreen('main-menu');move={x:0,y:0}};
$('fov-setting').oninput=e=>{camera.fov=Number(e.target.value);camera.updateProjectionMatrix();$('fov-value').textContent=e.target.value+'°'};
$('sens-setting').oninput=e=>{sensitivity=Number(e.target.value)/1000;$('sens-value').textContent=sensitivity.toFixed(3)};
$('distance-setting').oninput=e=>{RADIUS=Number(e.target.value);$('distance-value').textContent=RADIUS+' чанков';scene.fog.near=Math.max(55,Math.min(420,RADIUS*7));scene.fog.far=Math.max(205,Math.min(700,RADIUS*12));camera.far=Math.max(240,Math.min(760,RADIUS*13));camera.updateProjectionMatrix();loadAround()};
$('quality-setting').onchange=e=>{const q=quality[e.target.value];renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.shadowMap.enabled=q.shadows;sun.castShadow=q.shadows;renderer.shadowMap.needsUpdate=true;renderer.setSize(innerWidth,innerHeight)};
$('fps-setting').onchange=e=>{showFps=e.target.checked;if(!showFps)$('fps-counter').textContent=''};

// Organic humanoid apparition, built from smooth tapered meshes rather than cubes.
const apparition=new THREE.Group();apparition.visible=false;scene.add(apparition);
const shadowMat=new THREE.MeshStandardMaterial({color:0x101714,roughness:1,metalness:0,transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false});
function apparitionMesh(geometry,position,scale=[1,1,1]){
 const mesh=new THREE.Mesh(geometry,shadowMat);mesh.position.set(...position);mesh.scale.set(...scale);mesh.castShadow=false;mesh.receiveShadow=false;apparition.add(mesh);return mesh;
}
function taperedLimb(a,b,r1,r2){
 const from=new THREE.Vector3(...a),to=new THREE.Vector3(...b),delta=to.clone().sub(from);
 const mesh=apparitionMesh(new THREE.CylinderGeometry(r2,r1,delta.length(),10,2),from.clone().add(to).multiplyScalar(.5).toArray());
 mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());
 apparitionMesh(new THREE.SphereGeometry(r1,10,8),a);
 apparitionMesh(new THREE.SphereGeometry(r2,10,8),b);
}
apparitionMesh(new THREE.SphereGeometry(.22,14,10),[0,1.84,0],[.72,1.18,.72]);
apparitionMesh(new THREE.CylinderGeometry(.16,.27,.68,14,3),[0,1.23,0],[1,1,.82]);
apparitionMesh(new THREE.SphereGeometry(.25,14,10),[0,1.48,0],[1.12,.72,.78]);
apparitionMesh(new THREE.SphereGeometry(.16,12,9),[0,.86,0],[1.05,.9,.8]);
taperedLimb([-.22,1.48,0],[-.34,1.08,.015],.105,.075);
taperedLimb([-.34,1.08,.015],[-.39,.56,.08],.075,.045);
taperedLimb([.22,1.48,0],[.34,1.08,-.015],.105,.075);
taperedLimb([.34,1.08,-.015],[.39,.56,.08],.075,.045);
taperedLimb([-.12,.82,0],[-.15,.42,.015],.13,.095);
taperedLimb([-.15,.42,.015],[-.18,.07,.08],.095,.065);
taperedLimb([.12,.82,0],[.15,.42,-.015],.13,.095);
taperedLimb([.15,.42,-.015],[.18,.07,.08],.095,.065);
let apparitionTimer=9,apparitionAge=0,apparitionDuration=0,apparitionActive=false;
function triggerApparition(){
 const angle=yaw+(Math.random()-.5)*.72,distance=13+Math.random()*8;
 const x=player.x-Math.sin(angle)*distance,z=player.z-Math.cos(angle)*distance;
 const ground=heightAt(Math.floor(x),Math.floor(z));
 apparition.position.set(x,ground+.02,z);
 apparition.lookAt(camera.position.x,ground+1,camera.position.z);
 apparition.rotation.x=0;
 apparitionAge=0;apparitionDuration=.62+Math.random()*.28;apparitionActive=true;apparition.visible=true;
}
function updateApparition(dt){
 if(!gameStarted||paused){if(apparitionActive){apparitionActive=false;apparition.visible=false;shadowMat.opacity=0}return}
 if(!apparitionActive){apparitionTimer-=dt;if(apparitionTimer<=0){triggerApparition();apparitionTimer=19+Math.random()*19}return}
 apparitionAge+=dt;
 const fadeIn=Math.min(1,apparitionAge/.14),fadeOut=Math.min(1,(apparitionDuration-apparitionAge)/.25);
 shadowMat.opacity=.86*Math.max(0,Math.min(fadeIn,fadeOut));
 if(apparitionAge>=apparitionDuration){apparitionActive=false;apparition.visible=false;shadowMat.opacity=0}
}
const clock=new THREE.Clock();let elapsed=0,lastPlayerChunkX=NaN,lastPlayerChunkZ=NaN;
function loop(){requestAnimationFrame(loop);const dt=Math.min(clock.getDelta(),.04);elapsed+=dt;processChunkQueue();updateMining(dt);updateAnimals(dt,elapsed);updateApparition(dt);fpsFrames++;fpsTime+=dt;if(fpsTime>=.5){document.querySelector('#fps-counter').textContent=showFps?Math.round(fpsFrames/fpsTime)+' FPS':'';fpsFrames=0;fpsTime=0}const forward=new THREE.Vector3(-Math.sin(yaw),0,-Math.cos(yaw)),right=new THREE.Vector3(Math.cos(yaw),0,-Math.sin(yaw));const dir=forward.multiplyScalar(gameStarted&&!paused?-move.y:0).add(right.multiplyScalar(gameStarted&&!paused?move.x:0));if(dir.lengthSq()>0){dir.normalize();const speed=mode==='creative'?8:5;const nx=player.x+dir.x*speed*dt,nz=player.z+dir.z*speed*dt;if(mode==='creative'){player.x=nx;player.z=nz}else{if(!collides(nx,player.y,player.z))player.x=nx;if(!collides(player.x,player.y,nz))player.z=nz}}if(gameStarted&&!paused&&mode==='creative'&&move.y<-.1)player.y+=dt*3;else if(gameStarted&&!paused){velY-=19*dt;const nextY=player.y+velY*dt;if(velY<=0&&!collides(player.x,nextY,player.z)){player.y=nextY;onGround=false}else if(velY>0&&!collides(player.x,nextY,player.z)){player.y=nextY;onGround=false}else{if(velY<0){player.y=Math.floor(nextY)+1;onGround=true}else{player.y=Math.ceil(nextY)-1.75;onGround=false}velY=0}}eye();const currentChunkX=Math.floor(player.x/CHUNK),currentChunkZ=Math.floor(player.z/CHUNK);if(currentChunkX!==lastPlayerChunkX||currentChunkZ!==lastPlayerChunkZ){lastPlayerChunkX=currentChunkX;lastPlayerChunkZ=currentChunkZ;loadAround()}sun.position.x=-25+Math.sin(elapsed*.025)*10;sun.intensity=1.45+Math.sin(elapsed*.025)*.18;moonFill.intensity=.34+Math.sin(elapsed*.025)*.06;if(Math.floor(elapsed/75)+1>day){day++;document.querySelector('#stats').textContent='❤ ♥ ♥ ♥ ♥　☀ День '+day}renderer.render(scene,camera)}
loop();addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.75))});
document.querySelector('#loading').remove();
