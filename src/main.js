import * as THREE from 'three';

const root=document.querySelector('#game');
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x9bcff0);
scene.fog=new THREE.Fog(0x9bcff0,34,105);
const camera=new THREE.PerspectiveCamera(78,innerWidth/innerHeight,.08,150);
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.25));renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;
root.appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xe9f7ff,0x596448,2));
const sun=new THREE.DirectionalLight(0xfff0d4,2.1);sun.position.set(-28,48,25);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-45;sun.shadow.camera.right=45;sun.shadow.camera.top=45;sun.shadow.camera.bottom=-45;scene.add(sun);

const defs=[
 ['grass','Трава','🟩',0x6aa84f],['dirt','Земля','🟫',0x936345],['stone','Камень','🪨',0x92999d],
 ['wood','Дерево','🪵',0x93633a],['leaves','Листва','🌿',0x398447],['sand','Песок','🏖️',0xdcc783],
 ['brick','Кирпич','🧱',0xa95745],['glass','Стекло','🔷',0x9bd9e8],['planks','Доски','🪚',0xb98750],
 ['coal','Уголь','⚫',0x42474c],['flower','Цветок','🌼',0xe7b7d0]
];
const names=Object.fromEntries(defs.map(d=>[d[0],d[1]]));
function texture(type,base){
 const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');
 const col='#'+base.toString(16).padStart(6,'0');g.fillStyle=col;g.fillRect(0,0,64,64);
 let seed=type.split('').reduce((a,v)=>a+v.charCodeAt(0),17);
 const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
 for(let i=0;i<210;i++){const v=Math.floor(rnd()*55)-27;g.fillStyle='rgba('+ (v>0?'255,255,255,':'0,0,0,') +(0.08+rnd()*.2)+')';g.fillRect(Math.floor(rnd()*64),Math.floor(rnd()*64),2+Math.floor(rnd()*7),2+Math.floor(rnd()*5))}
 if(type==='grass'){g.fillStyle='#4d873e';g.fillRect(0,0,64,13);for(let i=0;i<30;i++){g.fillStyle=i%2?'#7ebd56':'#39783c';g.fillRect(rnd()*64,0,2,12)}}
 if(type==='wood'||type==='planks'){g.strokeStyle='rgba(54,31,15,.35)';g.lineWidth=3;for(let x=8;x<64;x+=13){g.beginPath();g.moveTo(x,0);g.lineTo(x+(rnd()*5),64);g.stroke()}}
 if(type==='glass'){g.clearRect(0,0,64,64);g.fillStyle='rgba(142,220,242,.35)';g.fillRect(0,0,64,64);g.strokeStyle='rgba(255,255,255,.85)';g.lineWidth=4;g.strokeRect(3,3,58,58);g.beginPath();g.moveTo(12,52);g.lineTo(48,12);g.stroke()}
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.magFilter=THREE.NearestFilter;t.minFilter=THREE.NearestMipmapNearestFilter;return t;
}
const materials={};
for(const [id,, ,color] of defs){const tex=texture(id,color);materials[id]=new THREE.MeshLambertMaterial({map:tex,transparent:id==='glass',opacity:id==='glass'?.62:1})}
materials.flower=new THREE.MeshLambertMaterial({color:0xe6a6d0});
const cube=new THREE.BoxGeometry(1,1,1),blocks=new Map(),chunkMeshes=new Map();
const key=(x,y,z)=>x+','+y+','+z,CHUNK=16,RADIUS=3,loadedChunks=new Set();
function chunkKey(x,z){return x+','+z}
function hash(x,z){let n=(Math.imul(x,374761393)+Math.imul(z,668265263))|0;n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295}
function heightAt(x,z){return Math.floor(5+Math.sin(x*.045)*3.4+Math.cos(z*.052)*3.1+Math.sin((x+z)*.027)*2.2+Math.cos((x-z)*.021)*1.6)}
function treeAt(x,z){return hash(x+193,z-71)>.982&&heightAt(x,z)>2}
function generatedBlock(x,y,z){
 const h=heightAt(x,z);if(y<=h){if(y===h)return h<=1?'sand':'grass';if(y>h-3)return 'dirt';if(y>-3&&hash(x+41,z-17)>.986)return 'coal';return 'stone'}
 for(let tx=x-2;tx<=x+2;tx++)for(let tz=z-2;tz<=z+2;tz++)if(treeAt(tx,tz)){const th=heightAt(tx,tz),dx=x-tx,dz=z-tz;if(dx===0&&dz===0&&y>th&&y<=th+4)return 'wood';if(y>=th+3&&y<=th+6&&Math.abs(dx)+Math.abs(dz)+Math.abs(y-th-4)<=5&&!(dx===0&&dz===0&&y<th+5))return 'leaves'}
 return null;
}
function rebuildChunk(cx,cz){
 const ck=chunkKey(cx,cz);for(const m of chunkMeshes.get(ck)||[])scene.remove(m);
 const buckets={},minX=cx*CHUNK,minZ=cz*CHUNK;
 for(let x=minX;x<minX+CHUNK;x++)for(let z=minZ;z<minZ+CHUNK;z++)for(let y=-3;y<=heightAt(x,z)+6;y++){
  const k=key(x,y,z),type=blocks.has(k)?blocks.get(k):generatedBlock(x,y,z);if(!type)continue;
  let exposed=false;for(const [dx,dy,dz] of [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]]){const nk=key(x+dx,y+dy,z+dz),neighbor=blocks.has(nk)?blocks.get(nk):generatedBlock(x+dx,y+dy,z+dz);if(!neighbor||neighbor==='glass'||type==='glass'){exposed=true;break}}
  if(exposed)(buckets[type]??=[]).push([x,y,z]);
 }
 const group=[],dummy=new THREE.Object3D();
 for(const [type,coords] of Object.entries(buckets)){const mesh=new THREE.InstancedMesh(cube,materials[type]||materials.grass,coords.length);mesh.userData.coords=coords;coords.forEach((p,i)=>{dummy.position.set(p[0]+.5,p[1]+.5,p[2]+.5);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix)});mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();scene.add(mesh);group.push(mesh)}
 chunkMeshes.set(ck,group);loadedChunks.add(ck);
}
function loadAround(){const px=Math.floor(player.x/CHUNK),pz=Math.floor(player.z/CHUNK);for(let x=px-RADIUS;x<=px+RADIUS;x++)for(let z=pz-RADIUS;z<=pz+RADIUS;z++)if(!loadedChunks.has(chunkKey(x,z)))rebuildChunk(x,z);for(const ck of [...loadedChunks]){const [x,z]=ck.split(',').map(Number);if(Math.abs(x-px)>RADIUS+1||Math.abs(z-pz)>RADIUS+1){for(const m of chunkMeshes.get(ck)||[])scene.remove(m);chunkMeshes.delete(ck);loadedChunks.delete(ck)}}}
function addBlock(x,y,z,type='grass'){const k=key(x,y,z);if(blocks.has(k))return false;blocks.set(k,type);rebuildChunk(Math.floor(x/CHUNK),Math.floor(z/CHUNK));return true}
function removeBlock(x,y,z){const k=key(x,y,z),old=blocks.has(k)?blocks.get(k):generatedBlock(x,y,z);if(!old)return null;blocks.set(k,null);rebuildChunk(Math.floor(x/CHUNK),Math.floor(z/CHUNK));return old}
// Player camera is truly first-person; only a small arm and held block are visible.
const player={x:0,y:heightAt(0,0)+1,z:0};\nloadAround();
const hand=new THREE.Group();camera.add(hand);hand.position.set(.42,-.38,-.62);
const sleeve=new THREE.Mesh(new THREE.BoxGeometry(.18,.25,.22),new THREE.MeshLambertMaterial({color:0x3477ad}));sleeve.position.set(0,-.12,0);hand.add(sleeve);
const held=new THREE.Mesh(new THREE.BoxGeometry(.2,.2,.2),materials.grass);held.position.set(0,.02,-.17);hand.add(held);camera.add(hand);scene.add(camera);
let yaw=0,pitch=-.12,velY=0,onGround=false,move={x:0,y:0},lookPointer=null,lastX=0,lastY=0,mode='survival',selected='grass',day=1;
const inventory={grass:32,dirt:24,stone:20,wood:16,leaves:12,sand:16,brick:12,glass:8,planks:0,coal:0,flower:0};
const hotbarIds=['grass','dirt','stone','wood','leaves','sand','brick','glass'];
const ray=new THREE.Raycaster();ray.far=6;
function eye(){camera.position.set(player.x,player.y+1.55,player.z);camera.rotation.order='YXZ';camera.rotation.y=yaw;camera.rotation.x=pitch}
function targetBlock(){eye();ray.setFromCamera(new THREE.Vector2(0,0),camera);return ray.intersectObjects([...chunkMeshes.values()].flat(),false)[0]||null}
function updateHeld(){held.material=materials[selected]||materials.grass}
function toast(t){const el=document.querySelector('#toast');el.textContent=t;el.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),1600)}
function renderInventory(){const grid=document.querySelector('#inventory-grid');grid.innerHTML='';for(const [id,label,icon] of defs){const count=inventory[id]||0;const b=document.createElement('button');b.className='inv-slot'+(selected===id?' chosen':'');b.innerHTML='<span class="item-model model-'+id+'">'+icon+'</span><span class="item-name">'+label+'</span><b>'+(mode==='creative'?'∞':count)+'</b>';b.onclick=()=>{selected=id;updateBar();renderInventory();updateHeld()};grid.append(b)}}
function updateBar(){const bar=document.querySelector('#hotbar');bar.innerHTML='';for(const id of hotbarIds){const d=defs.find(x=>x[0]===id);const b=document.createElement('button');b.className=id===selected?'active':'';b.innerHTML='<span>'+d[2]+'</span><small>'+(mode==='creative'?'∞':inventory[id]||0)+'</small>';b.onclick=()=>{selected=id;updateBar();updateHeld()};bar.append(b)}}
function action(place){const hit=targetBlock();if(!hit)return;const coord=hit.object.userData.coords?.[hit.instanceId];if(!coord)return;const [bx,by,bz]=coord;if(place){const x=bx+Math.round(hit.face.normal.x),y=by+Math.round(hit.face.normal.y),z=bz+Math.round(hit.face.normal.z);if(mode==='survival'&&!(inventory[selected]>0))return toast('Нет этого блока в инвентаре');if(Math.abs(x-player.x)<.8&&Math.abs(z-player.z)<.8&&y<=player.y+2)return toast('Здесь стоишь ты');if(addBlock(x,y,z,selected)){if(mode==='survival')inventory[selected]--;updateBar();renderInventory()}}else{const x=bx,y=by,z=bz;if(y<=-3)return;const got=removeBlock(x,y,z);if(got&&mode==='survival'){inventory[got]=(inventory[got]||0)+1;updateBar();renderInventory()}}}
document.querySelector('#break').onclick=()=>action(false);document.querySelector('#place').onclick=()=>action(true);
document.querySelector('#survival').onclick=()=>setMode('survival');document.querySelector('#creative').onclick=()=>setMode('creative');
function setMode(m){mode=m;document.querySelector('#survival').classList.toggle('selected',m==='survival');document.querySelector('#creative').classList.toggle('selected',m==='creative');updateBar();renderInventory();toast(m==='survival'?'Выживание':'Творчество')}
document.querySelector('#bag').onclick=()=>{document.querySelector('#inventory').classList.toggle('open');renderInventory()};
document.querySelector('#close-inventory').onclick=()=>document.querySelector('#inventory').classList.remove('open');
function jump(){if(onGround){velY=7.5;onGround=false}}document.querySelector('#jump').addEventListener('pointerdown',e=>{e.preventDefault();jump()});
const zone=document.querySelector('#left-stick'),knob=document.querySelector('#stick-knob');let stickId=null;
zone.addEventListener('pointerdown',e=>{stickId=e.pointerId;zone.setPointerCapture(stickId);stick(e)});zone.addEventListener('pointermove',e=>{if(e.pointerId===stickId)stick(e)});
function stick(e){const r=zone.getBoundingClientRect(),dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2),len=Math.hypot(dx,dy),s=Math.min(1,48/(len||1));move={x:dx*s/48,y:dy*s/48};knob.style.transform='translate('+move.x*34+'px,'+move.y*34+'px)'}
function resetStick(){stickId=null;move={x:0,y:0};knob.style.transform=''}zone.addEventListener('pointerup',resetStick);zone.addEventListener('pointercancel',resetStick);
renderer.domElement.addEventListener('pointerdown',e=>{if(e.clientX<innerWidth*.38||e.target!==renderer.domElement)return;lookPointer=e.pointerId;lastX=e.clientX;lastY=e.clientY;renderer.domElement.setPointerCapture(lookPointer)});
renderer.domElement.addEventListener('pointermove',e=>{if(e.pointerId!==lookPointer)return;const dx=e.clientX-lastX,dy=e.clientY-lastY;lastX=e.clientX;lastY=e.clientY;yaw-=dx*.004;pitch=Math.max(-1.45,Math.min(1.45,pitch-dy*.004))});
renderer.domElement.addEventListener('pointerup',()=>lookPointer=null);renderer.domElement.addEventListener('pointercancel',()=>lookPointer=null);
addEventListener('keydown',e=>{if(e.code==='Space')jump();if(e.code==='KeyW')move.y=-1;if(e.code==='KeyS')move.y=1;if(e.code==='KeyA')move.x=-1;if(e.code==='KeyD')move.x=1;if(e.code==='KeyF')action(false);if(e.code==='KeyE')action(true);if(e.code==='KeyI'||e.code==='Tab'){e.preventDefault();document.querySelector('#inventory').classList.toggle('open')}if(/^Digit[1-8]$/.test(e.code)){selected=hotbarIds[Number(e.code.slice(5))-1];updateBar();updateHeld()}});
addEventListener('keyup',e=>{if(['KeyW','KeyS'].includes(e.code))move.y=0;if(['KeyA','KeyD'].includes(e.code))move.x=0});
updateBar();renderInventory();updateHeld();
const clock=new THREE.Clock();let elapsed=0;
function loop(){requestAnimationFrame(loop);const dt=Math.min(clock.getDelta(),.04);elapsed+=dt;const forward=new THREE.Vector3(-Math.sin(yaw),0,-Math.cos(yaw)),right=new THREE.Vector3(Math.cos(yaw),0,-Math.sin(yaw));const dir=forward.multiplyScalar(-move.y).add(right.multiplyScalar(move.x));if(dir.lengthSq()>0){dir.normalize();const speed=mode==='creative'?8:5;player.x+=dir.x*speed*dt;player.z+=dir.z*speed*dt}if(mode==='creative'&&move.y<-.1)player.y+=dt*3;else{velY-=19*dt;player.y+=velY*dt;const ground=heightAt(Math.round(player.x),Math.round(player.z))+1;if(player.y<=ground){player.y=ground;velY=0;onGround=true}}eye();loadAround();sun.position.x=-25+Math.sin(elapsed*.025)*10;sun.intensity=1.8+Math.sin(elapsed*.025)*.25;if(Math.floor(elapsed/75)+1>day){day++;document.querySelector('#stats').textContent='❤ ♥ ♥ ♥ ♥　☀ День '+day}renderer.render(scene,camera)}
loop();addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.5))});
document.querySelector('#loading').remove();
