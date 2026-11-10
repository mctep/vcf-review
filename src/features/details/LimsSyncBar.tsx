import { Box, Button, HStack, Stack, Text } from '@chakra-ui/react'
import { DatabaseZap } from 'lucide-react'
import { useState } from 'react'
import type { Case } from '../../domain/types'
import { useCaseStore } from '../../store/caseStore'
import { InfoTip } from '../../ui'

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })

/**
 * Page-level LIMS status and refresh. The order fills fields in several sections (patient, specimen, diagnosis →
 * tumor type, tumor content), so the action does not belong to any single card.
 */
export function LimsSyncBar({ c }: { c: Case }) {
  const fetchLims = useCaseStore((s) => s.fetchLims)
  const [fetching, setFetching] = useState(false)
  const sampleId = c.metadata.sampleId
  const notFound = !fetching && c.lims?.status === 'not-found'

  const status = fetching
    ? `Looking up ${sampleId}…`
    : !c.lims
      ? 'Not requested yet'
      : c.lims.status === 'found'
        ? `Order for ${sampleId} applied · ${fmtTime(c.lims.at)}`
        : `No order for ${sampleId} · ${fmtTime(c.lims.at)} — fill in the fields manually`

  const refresh = async () => {
    setFetching(true)
    try {
      await fetchLims(c.id)
    } finally {
      setFetching(false)
    }
  }

  return (
    <HStack layerStyle="card" px={{ base: '4', md: '6' }} py="3" mb="6" gap="3" flexWrap="wrap">
      <Box layerStyle="iconTile" boxSize="9" flexShrink={0}>
        <DatabaseZap size={18} />
      </Box>
      <Stack gap="0" flex="1" minW="12rem">
        <HStack gap="2">
          <Text fontWeight="700" fontSize="sm">
            LIMS order
          </Text>
          <InfoTip content="Fetched automatically when the case is created (HL7 ORM or FHIR ServiceRequest in a real deployment). Fills patient, specimen and test order, maps the coded diagnosis to a tumor type and adds tumor content from the pathology record. Values you typed are never overwritten." />
        </HStack>
        <Text fontSize="sm" color={notFound ? 'orange.fg' : 'fg.muted'}>
          {status}
        </Text>
      </Stack>
      <Button
        size="sm"
        variant="outline"
        colorPalette="brand"
        loading={fetching}
        disabled={c.report.status === 'signed'}
        onClick={refresh}
      >
        <DatabaseZap /> {c.lims ? 'Refresh from LIMS' : 'Fetch from LIMS'}
      </Button>
    </HStack>
  )
}
