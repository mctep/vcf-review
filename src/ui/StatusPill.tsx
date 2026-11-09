import { chakra, Spinner, useRecipe, type HTMLChakraProps } from '@chakra-ui/react'
import { PenLine } from 'lucide-react'
import { STATUS_LABEL } from '../domain/labels'
import type { DisplayStatus } from '../domain/types'

interface StatusPillProps extends HTMLChakraProps<'span'> {
  /** Pass `displayStatus(case)`, not `case.status`, so waiting cases show "Needs input". */
  status: DisplayStatus
  label?: string
}

/** Case lifecycle pill (recipe: `statusPill`). */
export function StatusPill({ status, label, ...rest }: StatusPillProps) {
  const recipe = useRecipe({ key: 'statusPill' })
  return (
    <chakra.span css={recipe({ status })} {...rest}>
      {status === 'processing' && <Spinner size="xs" borderWidth="1.5px" />}
      {status === 'needsInput' && <PenLine size={12} aria-hidden />}
      {label ?? STATUS_LABEL[status]}
    </chakra.span>
  )
}
