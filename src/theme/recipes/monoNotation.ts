import { defineRecipe } from '@chakra-ui/react'

/** Inline genomic notation: `p.V600E`, `deletion cn=0`, `NM_004333.6`. */
export const monoNotationRecipe = defineRecipe({
  className: 'mono-notation',
  base: {
    fontFamily: 'mono',
    letterSpacing: '-0.01em',
    fontWeight: '500',
  },
  variants: {
    tone: {
      brand: { color: 'brand.fg' },
      muted: { color: 'fg.subtle', fontWeight: '400' },
      default: { color: 'fg' },
    },
    size: {
      xs: { fontSize: 'xs' },
      sm: { fontSize: 'sm' },
      md: { fontSize: 'md' },
      lg: { fontSize: 'xl' },
    },
  },
  defaultVariants: { tone: 'brand', size: 'sm' },
})
