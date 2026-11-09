import { Button, Flex, Spinner, Stack, Text } from '@chakra-ui/react'
import { AlertTriangle, Clock, Lock, Sparkles } from 'lucide-react'
import { Link } from 'react-router'
import { interpretationBlockReason, interpretationState } from '../../domain/case/interpretation'
import type { Case } from '../../domain/types'
import { IconTile } from '../../ui/IconTile'

interface Props {
  c: Case
  /** What is locked, e.g. "Classifications and descriptions" or "The report". */
  subject: string
  size?: 'sm' | 'lg'
}

/** Placeholder for AI-derived content that is not available until interpretation is done. */
export function InterpretationPending({ c, subject, size = 'sm' }: Props) {
  const state = interpretationState(c)
  const reason = interpretationBlockReason(c)
  if (state === 'done') return null

  const icon =
    state === 'running' ? (
      <Spinner size="sm" />
    ) : state === 'waiting' ? (
      <Clock size={18} />
    ) : state === 'failed' ? (
      <AlertTriangle size={18} />
    ) : size === 'lg' ? (
      <Lock size={18} />
    ) : (
      <Sparkles size={18} />
    )

  return (
    <Flex
      layerStyle="glass"
      borderRadius="l3"
      p={size === 'lg' ? { base: '6', md: '10' } : '5'}
      gap="4"
      align={size === 'lg' ? 'center' : 'flex-start'}
      direction={size === 'lg' ? 'column' : 'row'}
      textAlign={size === 'lg' ? 'center' : 'start'}
      role="status"
    >
      <IconTile boxSize={size === 'lg' ? '12' : '10'}>{icon}</IconTile>
      <Stack gap="1" align={size === 'lg' ? 'center' : 'flex-start'}>
        <Text fontWeight="700">{subject} will appear after AI interpretation</Text>
        <Text fontSize="sm" color="fg.muted" maxW="36rem">
          {reason}
        </Text>
        {(state === 'waiting' || state === 'failed') && (
          <Button
            asChild
            size="sm"
            mt="2"
            colorPalette="brand"
            variant={state === 'waiting' ? 'solid' : 'outline'}
          >
            <Link to={`/case/${c.id}/details`}>
              {state === 'waiting' ? 'Fill in metadata' : 'Open details'}
            </Link>
          </Button>
        )}
      </Stack>
    </Flex>
  )
}
