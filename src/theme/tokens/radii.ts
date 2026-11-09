import { defineTokens } from '@chakra-ui/react'

/**
 * Chakra's built-in components use the layered radii `l1`–`l3`.
 * They are bumped up so buttons/inputs get 8px and panels 12px, matching the reference style.
 */
export const radii = defineTokens.radii({
  l1: { value: '0.25rem' }, // 4px  — checkboxes, small chips
  l2: { value: '0.5rem' }, // 8px  — buttons, inputs, menus
  l3: { value: '0.75rem' }, // 12px — panels, dialogs, cards
  panel: { value: '0.75rem' },
  glass: { value: '1.125rem' }, // 18px — marketing-style glass cards
})
