import { defineSemanticTokens } from '@chakra-ui/react'

type Mode = { base: string; _dark: string }
const m = (base: string, dark: string): { value: Mode } => ({ value: { base, _dark: dark } })

/**
 * Builds the standard Chakra palette contract (solid, contrast, fg, muted, subtle,
 * emphasized, focusRing) so the palette works with `colorPalette="<name>"` on every
 * built-in component.
 */
function palette(name: string, opts: { solidDark?: string; fgDark?: string } = {}) {
  return {
    solid: m(`{colors.${name}.600}`, opts.solidDark ?? `{colors.${name}.400}`),
    contrast: m('white', `{colors.${name}.950}`),
    fg: m(`{colors.${name}.600}`, opts.fgDark ?? `{colors.${name}.300}`),
    muted: m(`{colors.${name}.100}`, `{colors.${name}.900}`),
    subtle: m(`{colors.${name}.50}`, `{colors.${name}.950}`),
    emphasized: m(`{colors.${name}.200}`, `{colors.${name}.800}`),
    focusRing: m(`{colors.${name}.500}`, `{colors.${name}.400}`),
  }
}

/** Aliases a semantic palette to one of Chakra's built-in palettes (red, green, …). */
function alias(target: string) {
  return {
    solid: { value: `{colors.${target}.solid}` },
    contrast: { value: `{colors.${target}.contrast}` },
    fg: { value: `{colors.${target}.fg}` },
    muted: { value: `{colors.${target}.muted}` },
    subtle: { value: `{colors.${target}.subtle}` },
    emphasized: { value: `{colors.${target}.emphasized}` },
    focusRing: { value: `{colors.${target}.focusRing}` },
  }
}

export const semanticColors = defineSemanticTokens.colors({
  // ── Brand palettes ────────────────────────────────────────────────
  brand: palette('brand'),
  accent: palette('accent'),
  aqua: palette('aqua'),
  ink: palette('ink', { solidDark: '{colors.ink.300}', fgDark: '{colors.ink.300}' }),

  // ── Clinical meaning → palettes (use with colorPalette) ──────────
  /** AMP/ASCO/CAP tiers. */
  tier1: alias('red'),
  tier2: alias('orange'),
  tier3: alias('yellow'),
  tier4: alias('gray'),
  /** Oncogenicity calls. */
  oncogenic: alias('red'),
  vus: alias('yellow'),
  benign: alias('green'),
  unknown: alias('brand'),
  /** Agreement between evidence sources. */
  agreementHigh: alias('green'),
  agreementMedium: alias('yellow'),
  agreementLow: alias('red'),

  // ── Core surfaces (override Chakra defaults) ──────────────────────
  bg: {
    DEFAULT: m('white', '{colors.night.500}'),
    panel: m('white', '{colors.night.400}'),
    subtle: m('{colors.ink.50}', '{colors.night.300}'),
    muted: m('{colors.ink.100}', '{colors.night.200}'),
    emphasized: m('{colors.ink.200}', '{colors.night.100}'),
    /** Translucent surface for glass cards (combine with backdrop blur). */
    glass: m('rgba(255, 255, 255, 0.72)', 'rgba(20, 26, 48, 0.62)'),
    /** Selected row / active nav item. */
    selected: m('{colors.brand.50}', 'rgba(134, 89, 230, 0.18)'),
  },
  fg: {
    DEFAULT: m('{colors.ink.900}', '#EEF1F7'),
    muted: m('{colors.ink.700}', '#A9B4C7'),
    subtle: m('{colors.ink.500}', '#7C879B'),
  },
  border: {
    DEFAULT: m('{colors.ink.200}', 'rgba(255, 255, 255, 0.10)'),
    muted: m('{colors.ink.100}', 'rgba(255, 255, 255, 0.06)'),
    subtle: m('{colors.ink.100}', 'rgba(255, 255, 255, 0.06)'),
    emphasized: m('{colors.ink.300}', 'rgba(255, 255, 255, 0.18)'),
    /** Hairline on glass cards. */
    glass: m('rgba(255, 255, 255, 0.60)', 'rgba(255, 255, 255, 0.08)'),
  },

  // ── App background gradient stops (see globalCss) ─────────────────
  app: {
    stop1: m('#E7E0F5', '#0B0F1E'),
    stop2: m('#F4F2F8', '#11132B'),
    stop3: m('#F5F6FA', '#141433'),
    stop4: m('#EAF5F6', '#0F1C2A'),
    stop5: m('#D9F1F2', '#0D2226'),
    stop6: m('#F4E6F2', '#1A1030'),
  },
  /** Icon tile gradient stops. */
  tile: {
    from: m('{colors.aqua.50}', 'rgba(7, 178, 187, 0.16)'),
    to: m('#E0E7FF', 'rgba(84, 31, 199, 0.22)'),
  },
})

export const semanticShadows = defineSemanticTokens.shadows({
  /** Barely-there elevation for the main white panel. */
  panel: m('0 1px 2px rgba(15, 23, 41, 0.04)', '0 1px 2px rgba(0, 0, 0, 0.4)'),
  /** Soft glow used by glass cards. */
  glass: m(
    '0 0 60px rgba(255, 255, 255, 0.9), 0 4px 24px rgba(0, 0, 0, 0.03), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
    '0 8px 32px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.04)',
  ),
})
