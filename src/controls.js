export class MobileControls {
  constructor() {
    this.moveX = 0; this.moveY = 0; this.yaw = 0; this.jumpPressed = false;
    const zone = document.getElementById('stick-zone');
    const stick = document.getElementById('stick');
    let active = false;
    const reset = () => { active = false; this.moveX = this.moveY = 0; stick.style.transform = 'translate(0px,0px)'; };
    zone.addEventListener('pointerdown', e => { active = true; zone.setPointerCapture(e.pointerId); this.moveStick(e, zone, stick); });
    zone.addEventListener('pointermove', e => { if (active) this.moveStick(e, zone, stick); });
    zone.addEventListener('pointerup', reset); zone.addEventListener('pointercancel', reset);
    let lookId = null, lastX = 0;
    addEventListener('pointerdown', e => { if (e.clientX > innerWidth * 0.42 && e.target.id !== 'jump') { lookId = e.pointerId; lastX = e.clientX; } });
    addEventListener('pointermove', e => { if (e.pointerId === lookId) { this.yaw -= (e.clientX - lastX) * 0.008; lastX = e.clientX; } });
    addEventListener('pointerup', e => { if (e.pointerId === lookId) lookId = null; });
    const jump = document.getElementById('jump');
    jump.addEventListener('pointerdown', e => { e.preventDefault(); this.jumpPressed = true; });
    jump.addEventListener('pointerup', () => this.jumpPressed = false);
    jump.addEventListener('pointercancel', () => this.jumpPressed = false);
  }
  moveStick(e, zone, stick) {
    const r = zone.getBoundingClientRect(), dx = e.clientX - (r.left + r.width/2), dy = e.clientY - (r.top + r.height/2);
    const max = 42, len = Math.hypot(dx,dy), scale = len > max ? max/len : 1;
    const x = dx*scale, y = dy*scale;
    stick.style.transform = `translate(${x}px,${y}px)`;
    this.moveX = x/max; this.moveY = y/max;
  }
}
