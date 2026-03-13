/**
 * Default poster textures bundled with the app.
 * Users can replace these files in src/assets for custom scanlines/paper.
 */

import scanlinesUrl from '../assets/scanlines.png';
import paperUrl from '../assets/paper.png';

export interface DefaultTexture {
  id: string;
  name: string;
  url: string;
}

export const DEFAULT_TEXTURES: DefaultTexture[] = [
  { id: 'default-scanlines', name: 'Scanlines', url: scanlinesUrl },
  { id: 'default-paper', name: 'Paper', url: paperUrl },
];
