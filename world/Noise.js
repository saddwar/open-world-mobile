// Seeded gradient noise for deterministic, infinite terrain generation.
export class Noise {
  constructor(seed=1337){this.seed=seed>>>0;this.permutation=this.buildPermutation();}
  random(){this.seed=(Math.imul(this.seed,1664525)+1013904223)>>>0;return this.seed/4294967296;}
  buildPermutation(){const p=Array.from({length:256},(_,i)=>i);for(let i=255;i>0;i--){const j=Math.floor(this.random()*(i+1));[p[i],p[j]]=[p[j],p[i]];}return [...p,...p];}
  fade(t){return t*t*t*(t*(t*6-15)+10);}
  lerp(a,b,t){return a+(b-a)*t;}
  grad(hash,x,y){switch(hash&7){case 0:return x+y;case 1:return -x+y;case 2:return x-y;case 3:return -x-y;case 4:return x;case 5:return -x;case 6:return y;default:return -y;}}
  noise2(x,y){const X=Math.floor(x)&255,Y=Math.floor(y)&255;x-=Math.floor(x);y-=Math.floor(y);const u=this.fade(x),v=this.fade(y),p=this.permutation;const aa=p[p[X]+Y],ab=p[p[X]+Y+1],ba=p[p[X+1]+Y],bb=p[p[X+1]+Y+1];return this.lerp(this.lerp(this.grad(aa,x,y),this.grad(ba,x-1,y),u),this.lerp(this.grad(ab,x,y-1),this.grad(bb,x-1,y-1),u),v)*0.5;}
  fractal2(x,y,octaves=4,lacunarity=2,gain=.5){let sum=0,amp=1,norm=0,freq=1;for(let i=0;i<octaves;i++){sum+=this.noise2(x*freq,y*freq)*amp;norm+=amp;amp*=gain;freq*=lacunarity;}return sum/norm;}
}
