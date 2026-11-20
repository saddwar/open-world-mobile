import { Noise } from './Noise.js';
import { BiomeGenerator, BIOMES } from './BiomeGenerator.js';
import { CaveGenerator } from './CaveGenerator.js';
export class TerrainGenerator{
 constructor(seed=1337){this.seed=seed;this.shape=new Noise(seed);this.detail=new Noise(seed+101);this.biomes=new BiomeGenerator(seed);this.caves=new CaveGenerator(seed);}
 heightAt(x,z){
  const continental=this.shape.fractal2(x*.003,z*.003,5);
  const hills=this.detail.fractal2(x*.012+120,z*.012-90,4);
  const ridges=1-Math.abs(this.detail.fractal2(x*.006-55,z*.006+73,3));
  return Math.floor(5+continental*17+hills*5+Math.max(0,ridges-.55)*12);
 }
 biomeAt(x,z){const h=this.heightAt(x,z);return this.biomes.sample(x,z,(h-5)/25);}
 blockAt(x,y,z){
  const h=this.heightAt(x,z),biome=this.biomeAt(x,z);
  if(y>h)return null;
  if(this.caves.isCave(x,y,z,h))return null;
  if(y===h){
   if(biome===BIOMES.DESERT||biome===BIOMES.OCEAN||biome===BIOMES.SWAMP)return 'sand';
   if(biome===BIOMES.SNOW)return 'snow';
   if(biome===BIOMES.MOUNTAINS)return 'stone';
   return 'grass';
  }
  if(y>=h-3){
   if(biome===BIOMES.DESERT||biome===BIOMES.OCEAN)return 'sand';
   if(biome===BIOMES.SNOW)return 'dirt';
   return 'dirt';
  }
  if(y< h-3 && y> -18){
   const ore=this.detail.fractal2(x*.19+y*.07,z*.19-y*.04,2);
   const r=((Math.imul(x+this.seed,374761393)^Math.imul(y+17,668265263)^Math.imul(z-31,2246822519))>>>0)/4294967295;
   if(y< -5&&r>.997)return 'diamond';
   if(y< 2&&r>.991)return 'gold';
   if(y< 12&&r>.982)return 'iron';
   if(y< 24&&r>.975)return 'coal';
   if(ore>.72&&y< -2)return 'iron';
  }
  return 'stone';
 }
}
export { BIOMES };
