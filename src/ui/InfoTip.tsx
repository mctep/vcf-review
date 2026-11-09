import { chakra } from '@chakra-ui/react'
import { Info } from 'lucide-react'
import type { ReactNode } from 'react'
import { Tooltip } from '../components/ui/tooltip'

/** Small ⓘ icon with an explanatory tooltip. */
export function InfoTip({ content, label = 'More information' }: { content: ReactNode; label?: string }) {
  return (
    <Tooltip content={content} showArrow openDelay={150} contentProps={{ maxW: '20rem', fontSize: 'xs' }}>
      <chakra.button
        type="button"
        aria-label={label}
        display="inline-flex"
        color="fg.subtle"
        cursor="help"
        borderRadius="full"
        _hover={{ color: 'brand.fg' }}
        _focusVisible={{ outline: '2px solid', outlineColor: 'brand.focusRing' }}
      >
        <Info size={14} />
      </chakra.button>
    </Tooltip>
  )
}
