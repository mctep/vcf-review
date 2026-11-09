import { defineRecipe } from '@chakra-ui/react'

/**
 * Extends Chakra's built-in button recipe (merged by createSystem).
 * New variants: `accent` (magenta CTA) and `ghostLink` (icon + brand text, no box).
 */
export const buttonRecipe = defineRecipe({
  base: {
    fontWeight: '600',
    borderRadius: 'l2',
  },
  variants: {
    variant: {
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
