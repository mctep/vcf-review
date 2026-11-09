import { defineTokens } from '@chakra-ui/react'

export const gradients = defineTokens.gradients({
  /** Thin bar on top of the window and on accent cards. */
  brandStripe: { value: 'linear-gradient(90deg, #18EBF7 0%, #D709B8 100%)' },
  /** Product mark tile. */
  logoTile: { value: 'linear-gradient(135deg, #18EBF7 0%, #541FC7 55%, #D709B8 100%)' },
  /** Gradient text for a single highlight per screen. */
  highlightText: { value: 'linear-gradient(90deg, #07B2BB 0%, #541FC7 55%, #D709B8 100%)' },
})
