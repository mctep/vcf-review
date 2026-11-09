import { defineGlobalStyles } from '@chakra-ui/react'

const appGradient = `linear-gradient(135deg,
  var(--chakra-colors-app-stop1) 0%,
  var(--chakra-colors-app-stop2) 20%,
  var(--chakra-colors-app-stop3) 40%,
  var(--chakra-colors-app-stop4) 60%,
  var(--chakra-colors-app-stop5) 80%,
  var(--chakra-colors-app-stop6) 100%)`

export const globalCss = defineGlobalStyles({
  html: {
    colorPalette: 'brand',
    fontFeatureSettings: '"ss01", "cv11"',
  },
  body: {
    minHeight: '100dvh',
    color: 'fg',
    bg: 'app.stop3',
    bgImage: appGradient,
    bgAttachment: 'fixed',
    // Thin brand stripe across the very top of the window.
    _before: {
      content: '""',
      position: 'fixed',
      insetInline: 0,
      top: 0,
      height: '3px',
      bgImage: 'brandStripe',
      zIndex: 'banner',
      pointerEvents: 'none',
    },
  },
  '::selection': { bg: 'brand.muted', color: 'brand.fg' },
  'code, kbd, pre': { fontFamily: 'mono' },
})
