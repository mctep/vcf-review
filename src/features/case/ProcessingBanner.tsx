import { Box, Button, Flex, HStack, Link, Progress, Spinner, Stack, Text } from '@chakra-ui/react'
import { AlertTriangle, Check, CircleDashed, Clock, RotateCcw, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { STEP_LABEL } from '../../domain/labels'
import { interpretationBlockers, waitingMessage } from '../../domain/metadata/requiredFields'
import { PROCESSING_STEPS, type Case, type StepState } from '../../domain/types'
import { useCaseStore } from '../../store/caseStore'
import { Eyebrow } from '../../ui'

const STEP_ICON: Record<StepState, React.ReactNode> = {
  pending: <CircleDashed size={16} />,
  running: <Spinner size="xs" borderWidth="2px" />,
  done: <Check size={16} />,
  waiting: <Clock size={16} />,
  failed: <X size={16} />,
}

const STEP_PALETTE: Record<StepState, string> = {
  pending: 'ink',
  running: 'aqua',
  done: 'brand',
  waiting: 'orange',
  failed: 'red',
}

function useElapsed(startedAt: string, finishedAt?: string) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (finishedAt) return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [finishedAt])
  const end = finishedAt ? new Date(finishedAt).getTime() : now
  const s = Math.max(0, Math.round((end - new Date(startedAt).getTime()) / 1000))
  return s < 3600 ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : `${Math.floor(s / 3600)} h`
}

/**
 * Background job status: steps, progress, waiting-for-metadata and failure states.
 * Rendered on Details (full) and on Variants/Report while processing (compact).
 */
export function ProcessingBanner({ c, compact = false }: { c: Case; compact?: boolean }) {
  const retry = useCaseStore((s) => s.retry)
  const { steps, progress, error, startedAt, finishedAt } = c.processing
  const elapsed = useElapsed(startedAt, finishedAt)
  const waiting = steps.interpretation === 'waiting'
  const blockers = interpretationBlockers(c.metadata)
  const failed = c.status === 'failed'

  if (c.status !== 'processing' && !failed) return null

  const palette = failed ? 'red' : waiting ? 'orange' : 'aqua'
  const current = PROCESSING_STEPS.find(
    (s) => steps[s] === 'running' || steps[s] === 'waiting' || steps[s] === 'failed',
  )

  return (
    <Box
      colorPalette={palette}
      layerStyle="glass"
      borderRadius="l3"
      p={compact ? '4' : '5'}
      mb="6"
      position="relative"
      overflow="hidden"
      role="status"
      aria-live="polite"
    >
      <Box position="absolute" insetInline="0" top="0" h="2px" bg="colorPalette.solid" />
      <Flex
        gap="4"
        justify="space-between"
        align={{ base: 'flex-start', md: 'center' }}
        direction={{ base: 'column', md: 'row' }}
      >
        <Stack gap="1">
          <Eyebrow color="colorPalette.fg">
            {failed ? 'Processing failed' : waiting ? 'Action needed' : 'Processing in background'}
          </Eyebrow>
          <Text fontWeight="700">
            {failed && error
              ? `${STEP_LABEL[error.step]}: ${error.message}`
              : waiting
                ? waitingMessage(blockers)
                : `${current ? STEP_LABEL[current] : 'Finishing'}…`}
          </Text>
          <Text fontSize="sm" color="fg.muted">
            {failed
              ? 'Your case and metadata are kept. Retry resumes from the failed step.'
              : waiting
                ? 'Variants are annotated and ranked — you can already review them. Complete or confirm the required fields to draft interpretations.'
                : 'You can keep working on this case — fill in metadata while the file is processed.'}
          </Text>
        </Stack>
        <HStack gap="3" flexShrink={0}>
          <Text fontSize="sm" color="fg.muted" fontVariantNumeric="tabular-nums">
            {progress}% · {elapsed}
          </Text>
          {failed && (
            <Button size="sm" colorPalette="brand" onClick={() => retry(c.id)}>
              <RotateCcw /> Retry
            </Button>
          )}
          {waiting && compact && (
            <Button size="sm" variant="outline" colorPalette="brand" asChild>
              <Link href={`#/case/${c.id}/details`}>Fill in metadata</Link>
            </Button>
          )}
        </HStack>
      </Flex>

      {!compact && (
        <>
          <Progress.Root
            value={progress}
            size="xs"
            mt="4"
            colorPalette={palette}
            aria-label="Processing progress"
          >
            <Progress.Track bg="bg.muted">
              <Progress.Range />
            </Progress.Track>
          </Progress.Root>
          <Flex
            as="ol"
            mt="4"
            gap={{ base: '2', md: '0' }}
            direction={{ base: 'column', md: 'row' }}
            listStyleType="none"
          >
            {PROCESSING_STEPS.map((s, i) => (
              <HStack as="li" key={s} flex="1" gap="2" colorPalette={STEP_PALETTE[steps[s]]} minW="0">
                <Flex
                  boxSize="7"
                  borderRadius="full"
                  align="center"
                  justify="center"
                  flexShrink={0}
                  bg={steps[s] === 'done' ? 'colorPalette.solid' : 'colorPalette.subtle'}
                  color={steps[s] === 'done' ? 'colorPalette.contrast' : 'colorPalette.fg'}
                  borderWidth="1px"
                  borderColor="colorPalette.emphasized"
                >
                  {STEP_ICON[steps[s]]}
                </Flex>
                <Text
                  fontSize="sm"
                  fontWeight={steps[s] === 'running' ? '700' : '500'}
                  color={steps[s] === 'pending' ? 'fg.subtle' : 'fg'}
                  truncate
                >
                  {STEP_LABEL[s]}
                </Text>
                {i < PROCESSING_STEPS.length - 1 && (
                  <Box display={{ base: 'none', md: 'block' }} flex="1" h="1px" bg="border" mx="2" />
                )}
              </HStack>
            ))}
          </Flex>
          {waiting && (
            <HStack mt="4" gap="2" fontSize="sm" color="orange.fg">
              <AlertTriangle size={16} />
              <Text>
                Interpretation depends on the tumor type (evidence levels, tiers) and tumor content
                (clonality, possible germline origin).
              </Text>
            </HStack>
          )}
        </>
      )}
    </Box>
  )
}
