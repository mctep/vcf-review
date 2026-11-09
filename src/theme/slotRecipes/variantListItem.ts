import { defineSlotRecipe } from '@chakra-ui/react'

/** One row of the ranked variant list: checkbox, gene + notation, call · tier. */
export const variantListItemRecipe = defineSlotRecipe({
  className: 'variant-list-item',
  slots: ['root', 'control', 'body', 'title', 'meta', 'dot'],
  base: {
    root: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '3',
      px: '3',
      py: '2.5',
      borderBottomWidth: '1px',
      borderColor: 'border',
      borderLeftWidth: '3px',
      borderLeftColor: 'transparent',
      cursor: 'pointer',
      transition: 'background 120ms',
      _hover: { bg: 'bg.subtle' },
      _last: { borderBottomWidth: 0 },
    },
    control: { pt: '0.5' },
    body: { display: 'flex', flexDirection: 'column', gap: '0.5', minW: 0 },
    title: { fontWeight: '700', fontSize: 'sm', display: 'flex', gap: '1.5', flexWrap: 'wrap' },
    meta: { display: 'flex', alignItems: 'center', gap: '1.5', fontSize: 'xs', color: 'fg.muted' },
    dot: { boxSize: '2', borderRadius: 'full', bg: 'colorPalette.solid', flexShrink: 0 },
  },
  variants: {
    selected: {
      true: { root: { bg: 'bg.selected', borderLeftColor: 'brand.solid', _hover: { bg: 'bg.selected' } } },
      false: {},
    },
  },
  defaultVariants: { selected: false },
})
