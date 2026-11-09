import { defineSlotRecipe } from '@chakra-ui/react'
import { tooltipAnatomy } from '@chakra-ui/react/anatomy'

/**
 * Extends Chakra's built-in tooltip (merged by createSystem): the default `xs` text is too small for the
 * explanatory hints used across the app, so content uses `sm` with a little more padding and line height.
 */
export const tooltipRecipe = defineSlotRecipe({
  slots: tooltipAnatomy.keys(),
  base: {
    content: {
      textStyle: 'sm',
      lineHeight: '1.5',
      px: '3',
      py: '2',
      maxW: '20rem',
    },
  },
})
