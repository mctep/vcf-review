import { defineSlotRecipe } from '@chakra-ui/react'

/** Marketing-style translucent card with an optional gradient bar on top. */
export const glassCardRecipe = defineSlotRecipe({
  className: 'glass-card',
  slots: ['root', 'accentBar', 'eyebrow', 'title', 'body'],
  base: {
    root: {
      layerStyle: 'glass',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      gap: '2',
    },
    accentBar: {
      position: 'absolute',
      insetInline: 0,
      top: 0,
      height: '2px',
      bgImage: 'brandStripe',
    },
    eyebrow: { textStyle: 'eyebrow', color: 'brand.fg', display: 'flex', alignItems: 'center', gap: '2' },
    title: { textStyle: 'h2' },
    body: { textStyle: 'body', color: 'fg.muted' },
  },
  variants: {
    size: {
      sm: { root: { p: '4' } },
      md: { root: { p: '6' } },
      lg: { root: { p: '8' } },
    },
  },
  defaultVariants: { size: 'md' },
})
