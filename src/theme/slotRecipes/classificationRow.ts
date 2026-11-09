import { defineSlotRecipe } from '@chakra-ui/react'

/** "ONCOGENICITY  [VUS] ⓘ  ⌄ Show criteria" row inside the variant card. */
export const classificationRowRecipe = defineSlotRecipe({
  className: 'classification-row',
  slots: ['root', 'header', 'label', 'value', 'info', 'trigger', 'content'],
  base: {
    root: { display: 'flex', flexDirection: 'column', gap: '2', py: '1.5' },
    header: { display: 'flex', alignItems: 'center', flexWrap: 'wrap', columnGap: '3', rowGap: '1' },
    label: { textStyle: 'label', color: 'fg', minW: { md: '13rem' } },
    value: { display: 'inline-flex', alignItems: 'center', gap: '1.5' },
    info: { color: 'fg.subtle', cursor: 'help', '& svg': { boxSize: '3.5' } },
    trigger: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '1',
      fontSize: 'sm',
      fontWeight: '500',
      color: 'fg',
      cursor: 'pointer',
      borderRadius: 'l1',
      _hover: { color: 'brand.fg' },
      '& svg': { boxSize: '4', transition: 'transform 150ms' },
      '&[data-state=open] svg': { transform: 'rotate(180deg)' },
    },
    content: {
      ml: { md: '13rem' },
      pl: { md: '3' },
      borderLeftWidth: '2px',
      borderColor: 'brand.muted',
      px: '3',
      py: '2',
      fontSize: 'sm',
      color: 'fg.muted',
    },
  },
})
