export class HUD {
  constructor() { this.status = document.getElementById('status'); }
  update(position) { this.status.textContent = `Город • ${Math.round(position.x)} м, ${Math.round(position.z)} м`; }
}
