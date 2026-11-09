import { Badge, Box, Grid, HStack, Stack, Table, Text } from '@chakra-ui/react'
import { useEffect } from 'react'
import type { ReportHeaderBlock, ReportModel, ReportRow } from '../../domain/report/buildReport'
import type { ReportSectionId } from '../../domain/types'
import { Mono, SectionTitle } from '../../ui'

function VariantTable({ rows, empty }: { rows: ReportRow[]; empty: string }) {
  if (!rows.length)
    return (
      <Text color="fg.subtle" fontSize="sm">
        {empty}
      </Text>
    )
  return (
    <Box overflowX="auto">
      <Table.Root size="sm" variant="line">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>Variant</Table.ColumnHeader>
            <Table.ColumnHeader>VAF / CN</Table.ColumnHeader>
            <Table.ColumnHeader>Classification</Table.ColumnHeader>
            <Table.ColumnHeader>Therapies</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {rows.map((r) => (
            <Table.Row key={r.id}>
              <Table.Cell>
                <Text fontWeight="700" display="inline">
                  {r.gene}
                </Text>{' '}
                <Mono size="xs">{r.notation}</Mono>
                {r.hgvsc && (
                  <Mono display="block" tone="muted" size="xs">
                    {r.hgvsc}
                  </Mono>
                )}
              </Table.Cell>
              <Table.Cell fontVariantNumeric="tabular-nums">
                {r.vaf !== undefined ? `${r.vaf}%` : r.copyNumber !== undefined ? `CN ${r.copyNumber}` : '—'}
              </Table.Cell>
              <Table.Cell>
                {r.classification} · {r.tierLevel}
              </Table.Cell>
              <Table.Cell>{r.therapies}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Box>
  )
}

/** Patient / Specimen / Clinical / Test blocks at the top of the report. */
function ReportHeader({ blocks }: { blocks: ReportHeaderBlock[] }) {
  return (
    <Grid
      templateColumns={{ base: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' }}
      gap={{ base: '4', lg: '6' }}
      mb="6"
      pb="6"
      borderBottomWidth="1px"
      borderColor="border"
      fontSize="sm"
      data-section-title="Report header"
    >
      {blocks.map((b) => (
        <Stack key={b.title} gap="2" minW="0">
          <Text textStyle="eyebrow" color="fg.subtle">
            {b.title}
          </Text>
          {b.fields.map((f) => (
            <Box key={f.label}>
              <Text fontSize="xs" color="fg.subtle">
                {f.label}
              </Text>
              <Text fontWeight="500" color={f.value ? 'fg' : 'fg.subtle'} wordBreak="break-word">
                {f.value ?? '—'}
              </Text>
            </Box>
          ))}
        </Stack>
      ))}
    </Grid>
  )
}

function Section({
  id,
  title,
  highlighted,
  children,
}: {
  id?: ReportSectionId
  title: string
  highlighted?: ReportSectionId
  children: React.ReactNode
}) {
  const on = !!id && id === highlighted
  return (
    <Stack
      gap="2"
      p="3"
      mx="-3"
      borderRadius="l2"
      bg={on ? 'accent.subtle' : 'transparent'}
      outline={on ? '1px solid' : 'none'}
      outlineColor="accent.emphasized"
      transition="background 600ms"
      data-section={id}
      data-section-title={title}
    >
      <HStack justify="space-between">
        <SectionTitle>{title}</SectionTitle>
        {on && (
          <Badge size="xs" colorPalette="accent">
            just updated
          </Badge>
        )}
      </HStack>
      {children}
    </Stack>
  )
}

/** Paper-like rendering of the report model. */
export function ReportDocument({
  r,
  highlighted,
  onSettled,
}: {
  r: ReportModel
  highlighted?: ReportSectionId
  onSettled: () => void
}) {
  useEffect(() => {
    if (!highlighted) return
    const t = setTimeout(onSettled, 4000)
    return () => clearTimeout(t)
  }, [highlighted, onSettled])

  return (
    <Box
      as="article"
      bg="bg.panel"
      borderWidth="1px"
      borderColor="border"
      borderRadius="l3"
      boxShadow="panel"
      p={{ base: '5', md: '10' }}
      position="relative"
      overflow="hidden"
    >
      <Box position="absolute" insetInline="0" top="0" h="3px" bgImage="brandStripe" />
      <HStack justify="space-between" align="flex-start" mb="6" gap="4" flexWrap="wrap">
        <Stack gap="1">
          <Text textStyle="eyebrow" color="fg.subtle">
            Molecular pathology report
          </Text>
          <Text textStyle="h2">Somatic NGS — {r.tumorType}</Text>
        </Stack>
        <Badge size="md" colorPalette={r.status === 'signed' ? 'green' : 'yellow'} variant="outline">
          {r.status === 'signed' ? `v${r.version} · signed` : 'Draft'}
        </Badge>
      </HStack>

      <ReportHeader blocks={r.header} />

      <Stack gap="5">
        <Section id="summary" title="Summary" highlighted={highlighted}>
          <Text textStyle="bodyLg" whiteSpace="pre-line">
            {r.sections.summary}
          </Text>
        </Section>
        <Section title="Clinically significant variants">
          <VariantTable rows={r.significant} empty="No Tier I/II variants selected." />
        </Section>
        <Section title="Variants of uncertain significance">
          <VariantTable rows={r.uncertain} empty="None selected." />
        </Section>
        <Section id="recommendations" title="Recommendations" highlighted={highlighted}>
          <Text textStyle="body" whiteSpace="pre-line">
            {r.sections.recommendations}
          </Text>
        </Section>
        <Section id="methods" title="Methods and limitations" highlighted={highlighted}>
          <Text fontSize="xs" color="fg.muted" whiteSpace="pre-line">
            {r.sections.methods}
          </Text>
        </Section>
        {r.signedBy && (
          <Text fontSize="sm" color="fg.muted" borderTopWidth="1px" borderColor="border" pt="4">
            Electronically signed by <b>{r.signedBy}</b> on{' '}
            {new Date(r.signedAt!).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
          </Text>
        )}
      </Stack>
    </Box>
  )
}
