/**
 * Default poster textures bundled with the app.
 * Default texture images live in src/assets/textures/.
 */

import scanlinesUrl from '../assets/textures/scanlines.png';
import paperUrl from '../assets/textures/paper.png';
import strainGlassColorfulUrl from '../assets/textures/strain-glass-colorful.png';
import strainGlassDarkUrl from '../assets/textures/strain-glass-dark.png';

export interface DefaultTexture {
  id: string;
  name: string;
  url: string;
}

export const DEFAULT_TEXTURES: DefaultTexture[] = [
  { id: 'default-scanlines', name: 'Scanlines', url: scanlinesUrl },
  { id: 'default-paper', name: 'Paper', url: paperUrl },
  { id: 'default-strain-glass-colorful', name: 'Strain Glass Colorful', url: strainGlassColorfulUrl },
  { id: 'default-strain-glass-dark', name: 'Strain Glass Dark', url: strainGlassDarkUrl },
];
