export class MobileControls {
  constructor(){
    this.moveX=0;this.moveY=0;this.yaw=0;this.zoom=7.5;this.jumpQueued=false;this.sprinting=false;
    const zone=document.getElementById('stick-zone'),stick=document.getElementById('stick');
    let stickPointer=null;
    const resetStick=()=>{stickPointer=null;this.moveX=0;this.moveY=0;stick.style.transform='translate(0,0)';};
    zone.addEventListener('pointerdown',e=>{e.preventDefault();stickPointer=e.pointerId;zone.setPointerCapture(e.pointerId);this.moveStick(e,zone,stick);});
    zone.addEventListener('pointermove',e=>{if(e.pointerId===stickPointer)this.moveStick(e,zone,stick);});
    zone.addEventListener('pointerup',e=>{if(e.pointerId===stickPointer)resetStick();});
    zone.addEventListener('pointercancel',resetStick);
    let lookPointer=null,lastX=0,lastY=0;
    addEventListener('pointerdown',e=>{
      if(e.clientX>innerWidth*.38&&!e.target.closest('button')&&e.target!==zone){lookPointer=e.pointerId;lastX=e.clientX;lastY=e.clientY;}
    });
    addEventListener('pointermove',e=>{
      if(e.pointerId!==lookPointer)return;
      const dx=e.clientX-lastX,dy=e.clientY-lastY;
      this.yaw-=dx*.006;
      this.zoom=Math.max(5.5,Math.min(10,this.zoom+dy*.018));
      lastX=e.clientX;lastY=e.clientY;
    });
    addEventListener('pointerup',e=>{if(e.pointerId===lookPointer)lookPointer=null;});
    const jump=document.getElementById('jump');
    jump.addEventListener('pointerdown',e=>{e.preventDefault();this.jumpQueued=true;});
    const sprint=document.getElementById('sprint');
    sprint.addEventListener('pointerdown',e=>{e.preventDefault();this.sprinting=true;});
    for(const el of [sprint,jump]){el.addEventListener('pointerup',()=>{if(el===sprint)this.sprinting=false;});el.addEventListener('pointercancel',()=>{if(el===sprint)this.sprinting=false;});}
    addEventListener('keydown',e=>{if(e.code==='Space')this.jumpQueued=true;if(e.code==='ShiftLeft')this.sprinting=true;if(e.code==='ArrowLeft')this.moveX=-1;if(e.code==='ArrowRight')this.moveX=1;if(e.code==='ArrowUp')this.moveY=-1;if(e.code==='ArrowDown')this.moveY=1;});
    addEventListener('keyup',e=>{if(e.code==='ShiftLeft')this.sprinting=false;if(e.code.startsWith('Arrow')){this.moveX=0;this.moveY=0;}});
  }
  moveStick(e,zone,stick){
    const r=zone.getBoundingClientRect(),dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2);
    const max=43,len=Math.hypot(dx,dy),scale=len>max?max/len:1,x=dx*scale,y=dy*scale;
    stick.style.transform=`translate(${x}px,${y}px)`;this.moveX=x/max;this.moveY=y/max;
  }
  consumeJump(){const v=this.jumpQueued;this.jumpQueued=false;return v;}
  update(){}
}