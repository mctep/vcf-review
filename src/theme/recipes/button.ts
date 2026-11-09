import { defineRecipe } from '@chakra-ui/react'

/**
 * Extends Chakra's built-in button recipe (merged by createSystem).
 * New variants: `accent` (magenta CTA) and `ghostLink` (icon + brand text, no box).
 * `outline` and `subtle` are tuned for dark mode: Chakra's defaults use the darkest palette
 * steps there, which disappear on the night panels, so we add a tinted fill and a lighter border.
 */
export const buttonRecipe = defineRecipe({
  base: {
    fontWeight: '600',
    borderRadius: 'l2',
  },
  variants: {
    variant: {
      outline: {
        borderColor: { base: 'colorPalette.muted', _dark: 'colorPalette.fg/45' },
        bg: { base: 'transparent', _dark: 'colorPalette.solid/12' },
        _hover: { bg: { base: 'colorPalette.subtle', _dark: 'colorPalette.solid/24' } },
        _expanded: { bg: { base: 'colorPalette.subtle', _dark: 'colorPalette.solid/24' } },
      },
      subtle: {
        bg: { base: 'colorPalette.subtle', _dark: 'colorPalette.solid/20' },
        _hover: { bg: { base: 'colorPalette.muted', _dark: 'colorPalette.solid/30' } },
        _expanded: { bg: { base: 'colorPalette.muted', _dark: 'colorPalette.solid/30' } },
      },
      accent: {
        bg: 'accent.solid',
        color: 'accent.contrast',
        _hover: { bg: 'accent.solid/90' },
        _expanded: { bg: 'accent.solid/90' },
      },
      ghostLink: {
        bg: 'transparent',
        color: 'brand.fg',
        px: '1',
        _hover: { bg: 'brand.subtle' },
      },
    },
  },
})
