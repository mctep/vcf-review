import { defineTokens } from '@chakra-ui/react'

export const fonts = defineTokens.fonts({
  heading: { value: "'Montserrat', ui-sans-serif, system-ui, sans-serif" },
  body: { value: "'Montserrat', ui-sans-serif, system-ui, sans-serif" },
  mono: { value: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace" },
})

/** Adds the display sizes used by page titles on top of Chakra's default scale. */
export const fontSizes = defineTokens.fontSizes({
  '2xs': { value: '0.6875rem' }, // 11px
  display: { value: '3.0625rem' }, // 49px
})

export const letterSpacings = defineTokens.letterSpacings({
  display: { value: '-0.04em' },
  title: { value: '-0.035em' },
  heading: { value: '-0.02em' },
  eyebrow: { value: '0.12em' },
  caps: { value: '0.06em' },
})
