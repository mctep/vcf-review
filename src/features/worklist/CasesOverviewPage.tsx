import { Box, Button, Flex, HStack, Progress, SimpleGrid, Stack, Table, Text } from '@chakra-ui/react'
import { Activity, ClipboardCheck, FilePlus2, Hourglass, Sparkles } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import type { Case } from '../../domain/types'
import { useCaseStore } from '../../store/caseStore'
import { displayStatus } from '../../domain/case/interpretation'
import { GlassCard, Highlight, PageTitle, StatusPill } from '../../ui'
import { IconTile } from '../../ui/IconTile'

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })

function Stat({
  icon,
  label,
  value,
  hint,
}: {
  icon: ReactNode
  label: string
  value: ReactNode
  hint: string
}) {
  return (
    <GlassCard.Root size="sm">
      <GlassCard.AccentBar />
      <HStack gap="3" align="flex-start">
        <IconTile>{icon}</IconTile>
        <Stack gap="0">
          <GlassCard.Eyebrow>{label}</GlassCard.Eyebrow>
          <Text textStyle="h1" lineHeight="1.2">
            {value}
          </Text>
          <Text fontSize="xs" color="fg.subtle">
            {hint}
          </Text>
        </Stack>
      </HStack>
    </GlassCard.Root>
  )
}

function caseTarget(c: Case) {
  return c.status === 'processing' || c.status === 'failed' // includes needsInput
    ? 'details'
    : c.status === 'signed'
      ? 'report'
      : 'variants'
}

export function CasesOverviewPage() {
  const cases = useCaseStore((s) => s.cases)
  const navigate = useNavigate()
  const processing = cases.filter((c) => displayStatus(c) === 'processing').length
  const needsInput = cases.filter((c) => displayStatus(c) === 'needsInput').length
  const awaiting = cases.filter((c) => c.status === 'ready' || c.status === 'review').length
  const signed = cases.filter((c) => c.status === 'signed').length

  return (
    <Stack gap="8">
      <Flex
        justify="space-between"
        align={{ base: 'stretch', md: 'flex-end' }}
        gap="4"
        direction={{ base: 'column', md: 'row' }}
      >
        <Stack gap="1">
          <PageTitle>Cases overview</PageTitle>
          <Text color="fg.muted">Somatic NGS cases from upload to signed report.</Text>
        </Stack>
        <Button asChild colorPalette="brand">
          <Link to="/new">
            <FilePlus2 /> New case
          </Link>
        </Button>
      </Flex>

      <SimpleGrid columns={{ base: 1, sm: 2, xl: 4 }} gap="4">
        <Stat
          icon={<Activity size={18} />}
          label="Processing"
          value={processing}
          hint={needsInput ? `${needsInput} waiting for your input` : 'Running in background'}
        />
        <Stat
          icon={<Hourglass size={18} />}
          label="Awaiting review"
          value={awaiting}
          hint="Interpretation drafted"
        />
        <Stat
          icon={<ClipboardCheck size={18} />}
          label="Signed this week"
          value={signed}
          hint="Released to clinicians"
        />
        <Stat
          icon={<Sparkles size={18} />}
          label="Expert time saved"
          value={<Highlight>6.5 h</Highlight>}
          hint="Estimated, last 7 days"
        />
      </SimpleGrid>

      <Box layerStyle="card" overflowX="auto">
        <Table.Root size="md" interactive css={{ '& tbody tr': { cursor: 'pointer' } }}>
          <Table.Header>
            <Table.Row bg="bg.subtle">
              <Table.ColumnHeader>Sample</Table.ColumnHeader>
              <Table.ColumnHeader>Created</Table.ColumnHeader>
              <Table.ColumnHeader>Tumor type</Table.ColumnHeader>
              <Table.ColumnHeader textAlign="end">Variants</Table.ColumnHeader>
              <Table.ColumnHeader>Status</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {cases.map((c) => {
              return (
                <Table.Row
                  key={c.id}
                  onClick={() => navigate(`/case/${c.id}/${caseTarget(c)}`)}
                  onKeyDown={(e) => e.key === 'Enter' && navigate(`/case/${c.id}/${caseTarget(c)}`)}
                  tabIndex={0}
                  _focusVisible={{
                    outline: '2px solid',
                    outlineColor: 'brand.focusRing',
                    outlineOffset: '-2px',
                  }}
                >
                  <Table.Cell>
                    <Text fontWeight="700" whiteSpace="nowrap">
                      {c.metadata.sampleId}
                    </Text>
                    <Text textStyle="monoSm" color="fg.subtle">
                      {c.id.slice(0, 8)}
                    </Text>
                  </Table.Cell>
                  <Table.Cell color="fg.muted" whiteSpace="nowrap">
                    {fmtDate(c.createdAt)}
                  </Table.Cell>
                  <Table.Cell>
                    {c.metadata.tumorType ? (
                      <>
                        {c.metadata.tumorType.name}{' '}
                        <Text as="span" textStyle="monoSm" color="fg.subtle">
                          {c.metadata.tumorType.code}
                        </Text>
                      </>
                    ) : (
                      <Text as="span" color="fg.subtle">
                        Not set
                      </Text>
                    )}
                  </Table.Cell>
                  <Table.Cell textAlign="end" fontVariantNumeric="tabular-nums">
                    {c.variants.length || '—'}
                  </Table.Cell>
                  <Table.Cell minW="11rem">
                    <Stack gap="1.5">
                      <StatusPill status={displayStatus(c)} alignSelf="flex-start" />
                      {displayStatus(c) === 'processing' && (
                        <Progress.Root
                          value={c.processing.progress}
                          size="xs"
                          colorPalette="aqua"
                          maxW="9rem"
                        >
                          <Progress.Track>
                            <Progress.Range />
                          </Progress.Track>
                        </Progress.Root>
                      )}
                    </Stack>
                  </Table.Cell>
                </Table.Row>
              )
            })}
          </Table.Body>
        </Table.Root>
      </Box>
    </Stack>
  )
}
