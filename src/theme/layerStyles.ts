import { defineLayerStyles } from '@chakra-ui/react'

export const layerStyles = defineLayerStyles({
  /** The main white work surface (application screens). */
  panel: {
    value: {
      bg: 'bg.panel',
      borderWidth: '1px',
      borderColor: 'border',
      borderRadius: 'panel',
      boxShadow: 'panel',
    },
  },
  /** Outlined inner card, e.g. the variant list or the variant detail card. */
  card: {
    value: { bg: 'bg.panel', borderWidth: '1px', borderColor: 'border', borderRadius: 'l3' },
  },
  /** Marketing-style translucent card: stats, upload, empty states. */
  glass: {
    value: {
      bg: 'bg.glass',
      backdropFilter: 'blur(14px) saturate(140%)',
      borderWidth: '1px',
      borderColor: 'border.glass',
      borderRadius: 'glass',
      boxShadow: 'glass',
    },
  },
  /** Gradient tile behind an icon. Layout (size, centering) lives in the <IconTile> component. */
  iconTile: {
    value: {
      borderRadius: '10px',
      bgImage: 'linear-gradient(135deg, var(--chakra-colors-tile-from), var(--chakra-colors-tile-to))',
      color: 'brand.fg',
    },
  },
})
