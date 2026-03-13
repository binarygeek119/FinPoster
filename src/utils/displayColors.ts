/**
 * Effective display colors – apply color mode (off / colorful / mono).
 * Off = user-entered colors; Colorful = default palette; Mono = all light gray.
 */

import type { MediaShowcaseSettings } from '../types';
import { MONO_GRAY } from '../defaults';
import {
  DEFAULT_TICKER_COLOR,
  DEFAULT_HOME_CINEMA_TITLE_COLOR,
  DEFAULT_TIME_PILL_COLOR,
  DEFAULT_ACCENT_HEX,
} from '../defaults';

const METAPILL_KEYS = [
  'type',
  'community-rating',
  'year',
  'runtime',
  'parental-rating',
  'studio',
  'network',
  'publisher',
  'artist',
  'author',
];

export interface EffectiveDisplayColors {
  borderColor: string;
  homeCinemaTitleColor: string;
  tickerColor: string;
  timePillColor: string;
  accentColor: string;
  metapillsColors: Record<string, string>;
}

/** Default metapill colors when color mode is "colorful". */
const COLORFUL_METAPILLS: Record<string, string> = {
  year: '#7b5ec9',
  type: '#f20707',
  runtime: '#0ce208',
  'parental-rating': '#9fe30d',
  network: '#7f31bf',
  studio: '#7f31bf',
};

/** Default palette used when color mode is "colorful". */
function getColorfulDefaults(): EffectiveDisplayColors {
  return {
    borderColor: '#ffffff',
    homeCinemaTitleColor: DEFAULT_HOME_CINEMA_TITLE_COLOR,
    tickerColor: DEFAULT_TICKER_COLOR,
    timePillColor: DEFAULT_TIME_PILL_COLOR,
    accentColor: DEFAULT_ACCENT_HEX,
    metapillsColors: { ...COLORFUL_METAPILLS },
  };
}

/**
 * Returns the effective display colors for the given Media Showcase settings.
 * - off: use user-entered colors from the color fields
 * - colorful: use default palette (white, red title, etc.)
 * - mono: all MONO_GRAY
 */
export function getEffectiveDisplayColors(
  opts: MediaShowcaseSettings | undefined | null
): EffectiveDisplayColors {
  if (!opts) {
    return getColorfulDefaults();
  }
  if (opts.colorMode === 'mono') {
    const gray = MONO_GRAY;
    return {
      borderColor: gray,
      homeCinemaTitleColor: gray,
      tickerColor: gray,
      timePillColor: gray,
      accentColor: gray,
      metapillsColors: Object.fromEntries(METAPILL_KEYS.map((k) => [k, gray])),
    };
  }
  if (opts.colorMode === 'colorful') {
    return getColorfulDefaults();
  }
  /* off or undefined: use user-entered colors */
  return {
    borderColor: opts.borderColor ?? '#ffffff',
    homeCinemaTitleColor: opts.homeCinemaTitleColor ?? opts.tickerColor ?? '#ff0000',
    tickerColor: opts.tickerColor ?? '#ffffff',
    timePillColor: opts.timePillColor ?? opts.tickerColor ?? '#eef207',
    accentColor: opts.accentColor ?? '#00a4dc',
    metapillsColors: opts.metapillsColors ?? {},
  };
}
