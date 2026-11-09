import { Box, Button, Dialog, Flex, HStack, List, Portal, Stack, Text } from '@chakra-ui/react'
import { AlertTriangle, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { formatInput, staleInputs } from '../../domain/case/interpretation'
import { canStartInterpretation, REQUIRED_FIELD_LABELS } from '../../domain/metadata/requiredFields'
import type { Case } from '../../domain/types'
import { useCaseStore } from '../../store/caseStore'
import { Eyebrow } from '../../ui'

const capitalize = (s: string) => s[0].toUpperCase() + s.slice(1)

/**
 * Shown when tumor type or tumor content changed after the AI draft was produced.
 * Interpretation is never re-run silently: the reviewer re-runs it (after a confirmation) or keeps the draft.
 */
export function StaleInterpretationCallout({ c }: { c: Case }) {
  const rerun = useCaseStore((s) => s.rerunInterpretation)
  const keep = useCaseStore((s) => s.keepInterpretation)
  const [open, setOpen] = useState(false)
  const fields = staleInputs(c)
  if (!fields.length) return null

  const ctx = c.interpretationContext ?? {}
  const canRun = canStartInterpretation(c.metadata)
  const editedDescriptions = Object.keys(c.edits).length
  const editedSections = Object.keys(c.report.overrides).length

  const changes = (
    <List.Root gap="1" ps="4">
      {fields.map((f) => (
        <List.Item key={f}>
          {capitalize(REQUIRED_FIELD_LABELS[f])}: <s>{formatInput(f, ctx)}</s> →{' '}
          <b>{formatInput(f, c.metadata)}</b>
        </List.Item>
      ))}
    </List.Root>
  )

  return (
    <Box
      colorPalette="yellow"
      layerStyle="glass"
      borderRadius="l3"
      p="5"
      mb="6"
      position="relative"
      overflow="hidden"
      role="status"
    >
      <Box position="absolute" insetInline="0" top="0" h="2px" bg="colorPalette.solid" />
      <Flex
        gap="4"
        justify="space-between"
        align={{ base: 'flex-start', md: 'center' }}
        direction={{ base: 'column', md: 'row' }}
      >
        <HStack gap="3" align="flex-start">
          <Box color="colorPalette.fg" pt="0.5">
            <AlertTriangle size={18} />
          </Box>
          <Stack gap="1" fontSize="sm">
            <Eyebrow color="colorPalette.fg">Interpretation out of date</Eyebrow>
            <Text fontWeight="700" fontSize="md">
              The AI draft was produced for different inputs
            </Text>
            {changes}
            <Text color="fg.muted">
              {canRun
                ? 'Classifications, descriptions and the report still reflect the old values. Re-run the interpretation or keep the current draft.'
                : 'Complete the required fields to re-run the interpretation.'}
            </Text>
          </Stack>
        </HStack>
        <HStack gap="2" flexShrink={0}>
          <Button size="sm" variant="ghost" colorPalette="gray" onClick={() => keep(c.id)}>
            Keep current
          </Button>
          <Button size="sm" colorPalette="brand" disabled={!canRun} onClick={() => setOpen(true)}>
            <RotateCcw /> Re-run…
          </Button>
        </HStack>
      </Flex>

      <Dialog.Root open={open} onOpenChange={(e) => setOpen(e.open)} role="alertdialog">
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header>
                <Dialog.Title>Re-run AI interpretation?</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <Stack gap="3" fontSize="sm">
                  <Text>Interpretation inputs changed since the draft was produced:</Text>
                  {changes}
                  <Text color="fg.muted">
                    Classifications, descriptions and the report draft will be regenerated. Variant selection
                    is kept.
                  </Text>
                  {(editedDescriptions > 0 || editedSections > 0) && (
                    <HStack
                      colorPalette="red"
                      bg="colorPalette.subtle"
                      borderWidth="1px"
                      borderColor="colorPalette.emphasized"
                      borderRadius="l2"
                      px="3"
                      py="2"
                      gap="2"
                      align="flex-start"
                    >
                      <Box color="colorPalette.fg" pt="0.5">
                        <AlertTriangle size={16} />
                      </Box>
                      <Text>
                        Your edits will be discarded:{' '}
                        {[
                          editedDescriptions &&
                            `${editedDescriptions} edited description${editedDescriptions === 1 ? '' : 's'}`,
                          editedSections &&
                            `${editedSections} edited report section${editedSections === 1 ? '' : 's'}`,
                        ]
                          .filter(Boolean)
                          .join(' and ')}
                        .
                      </Text>
                    </HStack>
                  )}
                </Stack>
              </Dialog.Body>
              <Dialog.Footer>
                <Dialog.ActionTrigger asChild>
                  <Button variant="ghost">Cancel</Button>
                </Dialog.ActionTrigger>
                <Button
                  colorPalette="brand"
                  onClick={() => {
                    rerun(c.id)
                    setOpen(false)
                  }}
                >
                  <RotateCcw /> Re-run interpretation
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </Box>
  )
}
