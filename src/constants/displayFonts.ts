/**
 * Cinema-themed display fonts for ticker bar and HomeCinema title.
 * Option id is stored in settings; fontFamily is applied to CSS.
 */

export interface DisplayFontOption {
  id: string;
  label: string;
  /** CSS font-family value (e.g. "'Bebas Neue', sans-serif"). Use empty for default theme font. */
  fontFamily: string;
}

export const DISPLAY_FONT_DEFAULT = 'default';

export const DISPLAY_FONTS: DisplayFontOption[] = [
  { id: 'default', label: 'Default', fontFamily: '' },
  { id: 'bebas-neue', label: 'Bebas Neue', fontFamily: "'Bebas Neue', sans-serif" },
  { id: 'oswald', label: 'Oswald', fontFamily: "'Oswald', sans-serif" },
  { id: 'archivo-black', label: 'Archivo Black', fontFamily: "'Archivo Black', sans-serif" },
  { id: 'anton', label: 'Anton', fontFamily: "'Anton', sans-serif" },
  { id: 'teko', label: 'Teko', fontFamily: "'Teko', sans-serif" },
  { id: 'rajdhani', label: 'Rajdhani', fontFamily: "'Rajdhani', sans-serif" },
  { id: 'orbitron', label: 'Orbitron', fontFamily: "'Orbitron', sans-serif" },
  { id: 'staatliches', label: 'Staatliches', fontFamily: "'Staatliches', sans-serif" },
  { id: 'black-ops-one', label: 'Black Ops One', fontFamily: "'Black Ops One', sans-serif" },
  { id: 'passero-one', label: 'Passero One', fontFamily: "'Passero One', sans-serif" },
  { id: 'audiowide', label: 'Audiowide', fontFamily: "'Audiowide', sans-serif" },
  { id: 'impact', label: 'Impact', fontFamily: "Impact, 'Impact', Haettenschweiler, 'Arial Narrow Bold', sans-serif" },
];

export function getDisplayFontFamily(fontId: string | undefined): string {
  if (!fontId || fontId === DISPLAY_FONT_DEFAULT) return '';
  const opt = DISPLAY_FONTS.find((f) => f.id === fontId);
  return opt?.fontFamily ?? '';
}
