import { Noise } from './Noise.js';
export const BIOMES={OCEAN:'ocean',PLAINS:'plains',FOREST:'forest',DESERT:'desert',MOUNTAINS:'mountains',SNOW:'snow',SWAMP:'swamp',JUNGLE:'jungle'};
export class BiomeGenerator{
 constructor(seed=1337){this.climate=new Noise(seed+701);this.detail=new Noise(seed+1709);}
 sample(x,z,elevation=0){
  const temperature=this.climate.fractal2(x*.0018+37,z*.0018-19,3);
  const moisture=this.climate.fractal2(x*.0021-83,z*.0021+51,3);
  if(elevation<-.30)return BIOMES.OCEAN;
  if(elevation>.48)return temperature<-.02?BIOMES.SNOW:BIOMES.MOUNTAINS;
  if(temperature<-.28)return BIOMES.SNOW;
  if(moisture<-.22&&temperature>.02)return BIOMES.DESERT;
  if(moisture>.34&&temperature<.16)return BIOMES.SWAMP;
  if(moisture>.25&&temperature>.18)return BIOMES.JUNGLE;
  if(moisture>.02)return BIOMES.FOREST;
  return BIOMES.PLAINS;
 }
}
