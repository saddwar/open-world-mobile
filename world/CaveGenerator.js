import { Noise } from './Noise.js';
export class CaveGenerator{
 constructor(seed=1337){this.noise=new Noise(seed+2903);}
 isCave(x,y,z,surfaceY){
  if(y>surfaceY-4||y< -24)return false;
  const a=this.noise.fractal2(x*.075+z*.021,y*.085,3);
  const b=this.noise.fractal2(z*.073-x*.017,y*.091+41,3);
  return Math.abs(a)<.105&&Math.abs(b)<.16;
 }
}
