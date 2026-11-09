import { chakra, Spinner, useRecipe, type HTMLChakraProps } from '@chakra-ui/react'
import { STATUS_LABEL } from '../domain/labels'
import type { CaseStatus } from '../domain/types'

interface StatusPillProps extends HTMLChakraProps<'span'> {
  status: CaseStatus
  label?: string
}

/** Case lifecycle pill (recipe: `statusPill`). */
export function StatusPill({ status, label, ...rest }: StatusPillProps) {
  const recipe = useRecipe({ key: 'statusPill' })
  return (
    <chakra.span css={recipe({ status })} {...rest}>
      {status === 'processing' && <Spinner size="xs" borderWidth="1.5px" />}
      {label ?? STATUS_LABEL[status]}
    </chakra.span>
  )
}
