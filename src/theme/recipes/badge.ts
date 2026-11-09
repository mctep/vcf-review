import { defineRecipe } from '@chakra-ui/react'

/**
 * Extends Chakra's badge: all badges are pills.
 * Combine with a clinical palette: <Badge colorPalette="vus">VUS</Badge>.
 */
export const badgeRecipe = defineRecipe({
  base: {
    borderRadius: 'full',
    fontWeight: '500',
    px: '2',
  },
})
