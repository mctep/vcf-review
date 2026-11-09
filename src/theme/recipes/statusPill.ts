import { defineRecipe } from '@chakra-ui/react'

/** Case lifecycle status shown next to case titles and in the worklist. */
export const statusPillRecipe = defineRecipe({
  className: 'status-pill',
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '1.5',
    px: '2.5',
    py: '0.5',
    borderRadius: 'full',
    borderWidth: '1px',
    fontSize: 'xs',
    fontWeight: '600',
    lineHeight: '1.25rem',
    whiteSpace: 'nowrap',
  },
  variants: {
    status: {
      processing: { color: 'aqua.fg', borderColor: 'aqua.emphasized', bg: 'aqua.subtle' },
      ready: { color: 'brand.fg', borderColor: 'brand.emphasized', bg: 'bg.panel' },
      review: { color: 'yellow.fg', borderColor: 'yellow.emphasized', bg: 'yellow.subtle' },
      signed: { color: 'green.fg', borderColor: 'green.emphasized', bg: 'green.subtle' },
      failed: { color: 'red.fg', borderColor: 'red.emphasized', bg: 'red.subtle' },
    },
  },
  defaultVariants: { status: 'ready' },
})
