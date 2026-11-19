export class HUD {
  constructor(world){
    this.world=world;this.status=document.getElementById('location');this.clock=document.getElementById('clock');
    this.map=document.getElementById('minimap');this.ctx=this.map.getContext('2d');this.message=document.getElementById('message');
    this.lastMessage=0;this.showMessage('Добро пожаловать! Исследуй город.',3200);
  }
  update(position,time){
    this.status.textContent=Math.hypot(position.x,position.z)<48?'Центральный район':Math.abs(position.x)>100?'Западный район':Math.abs(position.z)>100?'Жилой район':'Городские улицы';
    const mins=(8*60+30+Math.floor(time*2))%(24*60);this.clock.textContent=`${String(Math.floor(mins/60)).padStart(2,'0')}:${String(mins%60).padStart(2,'0')}`;
    this.drawMap(position);
  }
  drawMap(p){
    const c=this.ctx,w=160;c.clearRect(0,0,w,w);c.fillStyle='#17262a';c.fillRect(0,0,w,w);
    c.save();c.translate(80,80);c.scale(1.5,1.5);c.translate(-p.x,-p.z);
    c.strokeStyle='#68787a';c.lineWidth=7;
    for(let i=-5;i<=5;i++){c.beginPath();c.moveTo(-260,i*34);c.lineTo(260,i*34);c.stroke();c.beginPath();c.moveTo(i*34,-260);c.lineTo(i*34,260);c.stroke();}
    c.fillStyle='#d6e7dc';c.beginPath();c.arc(17,17,3,0,Math.PI*2);c.fill();
    c.restore();c.fillStyle='#77e7c1';c.beginPath();c.arc(80,80,4,0,Math.PI*2);c.fill();c.strokeStyle='#eafff6';c.lineWidth=1.5;c.stroke();
  }
  showMessage(text,duration=2200){
    this.message.textContent=text;this.message.classList.add('show');clearTimeout(this.lastMessage);
    this.lastMessage=setTimeout(()=>this.message.classList.remove('show'),duration);
  }
}