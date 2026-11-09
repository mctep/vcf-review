import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react'
import { globalCss } from './globalCss'
import { layerStyles } from './layerStyles'
import { recipes } from './recipes'
import { semanticColors, semanticShadows } from './semanticTokens'
import { slotRecipes } from './slotRecipes'
import { textStyles } from './textStyles'
import { colors } from './tokens/colors'
import { gradients } from './tokens/gradients'
import { radii } from './tokens/radii'
import { fontSizes, fonts, letterSpacings } from './tokens/typography'

/**
 * App design system. Documented in docs/THEME.md.
 * After changing anything here run `npm run theme:types`.
 */
export const config = defineConfig({
  globalCss,
  theme: {
    tokens: { colors, fonts, fontSizes, letterSpacings, radii, gradients },
    semanticTokens: { colors: semanticColors, shadows: semanticShadows },
    textStyles,
    layerStyles,
    recipes,
    slotRecipes,
  },
})

export const system = createSystem(defaultConfig, config)
