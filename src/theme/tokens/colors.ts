import { defineTokens } from '@chakra-ui/react'

/**
 * Raw color palettes. Components never reference these directly —
 * use the semantic tokens from `semanticTokens.ts` (e.g. `brand.solid`, `fg.muted`).
 */
export const colors = defineTokens.colors({
  /** Primary violet. 600 is the main brand color. */
  brand: {
    50: { value: '#F3EEFD' },
    100: { value: '#E6DCFB' },
    200: { value: '#CDB9F7' },
    300: { value: '#AB8CF0' },
    400: { value: '#8659E6' },
    500: { value: '#6A33D9' },
    600: { value: '#541FC7' },
    700: { value: '#4518A6' },
    800: { value: '#381485' },
    900: { value: '#2B1066' },
    950: { value: '#1B0943' },
  },
  /** Magenta accent, used sparingly (secondary CTAs, gradient end). */
  accent: {
    50: { value: '#FDEEFA' },
    100: { value: '#FBD5F4' },
    200: { value: '#F7ABE9' },
    300: { value: '#F073DA' },
    400: { value: '#E73BCA' },
    500: { value: '#DE16BF' },
    600: { value: '#D709B8' },
    700: { value: '#AC0793' },
    800: { value: '#820670' },
    900: { value: '#5C044F' },
    950: { value: '#3A0332' },
  },
  /** Aqua / teal, the cool counterpart of the brand gradient. */
  aqua: {
    50: { value: '#E7F8F9' },
    100: { value: '#C4EFF1' },
    200: { value: '#8EE1E6' },
    300: { value: '#4FD0D8' },
    400: { value: '#1BC3CC' },
    500: { value: '#07B2BB' },
    600: { value: '#058F97' },
    700: { value: '#066F76' },
    800: { value: '#07565B' },
    900: { value: '#083F43' },
    950: { value: '#04282B' },
  },
  /** Cool slate neutrals for text, borders and surfaces. */
  ink: {
    50: { value: '#F7F9FC' },
    100: { value: '#EFF2F7' },
    200: { value: '#E1E7EF' },
    300: { value: '#C8D1DE' },
    400: { value: '#94A1B5' },
    500: { value: '#65758B' },
    600: { value: '#4F6079' },
    700: { value: '#435670' },
    800: { value: '#24324A' },
    900: { value: '#0F1729' },
    950: { value: '#080D19' },
  },
  /** Dark-mode surfaces (slightly violet-tinted navy). */
  night: {
    50: { value: '#2A3552' },
    100: { value: '#243049' },
    200: { value: '#1B243C' },
    300: { value: '#151D33' },
    400: { value: '#121A2E' },
    500: { value: '#0E1424' },
    600: { value: '#0B0F1E' },
  },
})
