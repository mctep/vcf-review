import { Box, CloseButton, Drawer, Portal, Stack, Text } from '@chakra-ui/react'
import { useMatch } from 'react-router'
import type { AuditKind } from '../../domain/types'
import { useCase } from '../../store/caseStore'
import { useUiStore } from '../../store/uiStore'
import { Eyebrow } from '../../ui'

const KIND_PALETTE: Record<AuditKind, string> = {
  'case.created': 'brand',
  'processing.step': 'aqua',
  'processing.failed': 'red',
  'processing.retry': 'yellow',
  'metadata.updated': 'ink',
  'variant.selection': 'brand',
  'variant.edited': 'accent',
  'variant.feedback': 'accent',
  'report.edited': 'accent',
  'report.signed': 'green',
}

const fmt = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

/** Chronological, append-only trail of everything that happened to the case. */
export function AuditDrawer() {
  const match = useMatch('/case/:caseId/*')
  const c = useCase(match?.params.caseId)
  const { auditOpen, setAuditOpen } = useUiStore()

  return (
    <Drawer.Root open={auditOpen && !!c} onOpenChange={(e) => setAuditOpen(e.open)} size="md">
      <Portal>
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content>
            <Drawer.Header flexDirection="column" alignItems="flex-start" gap="1">
              <Eyebrow>Audit log</Eyebrow>
              <Drawer.Title textStyle="h2">{c?.metadata.sampleId}</Drawer.Title>
              <Text fontSize="xs" color="fg.subtle">
                Append-only · {c?.audit.length} events
              </Text>
            </Drawer.Header>
            <Drawer.Body>
              <Stack as="ol" gap="0" listStyleType="none">
                {[...(c?.audit ?? [])].reverse().map((e) => (
                  <Box
                    as="li"
                    key={e.id}
                    display="grid"
                    gridTemplateColumns="auto 1fr"
                    columnGap="3"
                    pb="4"
                    position="relative"
                  >
                    <Box
                      colorPalette={KIND_PALETTE[e.kind]}
                      boxSize="2.5"
                      mt="1.5"
                      borderRadius="full"
                      bg="colorPalette.solid"
                    />
                    <Box>
                      <Text fontSize="sm">{e.message}</Text>
                      <Text fontSize="xs" color="fg.subtle">
                        {fmt(e.at)} · {e.actor} · <code>{e.kind}</code>
                      </Text>
                    </Box>
                  </Box>
                ))}
              </Stack>
            </Drawer.Body>
            <Drawer.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Drawer.CloseTrigger>
          </Drawer.Content>
        </Drawer.Positioner>
      </Portal>
    </Drawer.Root>
  )
}
