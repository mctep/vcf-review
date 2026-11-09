import { defineRecipe } from '@chakra-ui/react'

/** Inline evidence reference inside AI-drafted text (PMID, VEP, UniProt, COSMIC…). */
export const citationRecipe = defineRecipe({
  className: 'citation',
  base: {
    display: 'inline-flex',
    alignItems: 'baseline',
    gap: '0.5',
    color: 'brand.fg',
    textDecoration: 'none',
    borderRadius: 'l1',
    transition: 'background 120ms',
    _hover: { bg: 'brand.subtle', textDecoration: 'underline' },
    _focusVisible: { outline: '2px solid', outlineColor: 'brand.focusRing', outlineOffset: '1px' },
    '& svg': { boxSize: '0.75em', alignSelf: 'center' },
  },
})
