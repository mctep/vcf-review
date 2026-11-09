import { Badge, Box, CloseButton, Drawer, HStack, List, Portal, Stack, Table, Text } from '@chakra-ui/react'
import type { EvidenceItem, Variant } from '../../domain/types'
import { Eyebrow, SectionTitle } from '../../ui'
import { VariantNotation } from './VariantList'

const SIGNAL_PALETTE: Record<EvidenceItem['signal'], string> = {
  supports: 'green',
  neutral: 'ink',
  conflicts: 'red',
}

/** Step-by-step reasoning, evidence matrix and therapies behind the drafted interpretation. */
export function AnalysisDrawer({
  v,
  open,
  onOpenChange,
}: {
  v: Variant
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const score = v.criteria.reduce((s, c) => s + c.points, 0)
  return (
    <Drawer.Root open={open} onOpenChange={(e) => onOpenChange(e.open)} size="lg">
      <Portal>
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content>
            <Drawer.Header flexDirection="column" alignItems="flex-start" gap="1">
              <Eyebrow>Analysis details</Eyebrow>
              <Drawer.Title display="flex" gap="2" alignItems="baseline" textStyle="h2">
                <VariantNotation v={v} size="lg" />
              </Drawer.Title>
            </Drawer.Header>
            <Drawer.Body>
              <Stack gap="8">
                <Stack gap="3">
                  <SectionTitle>Reasoning</SectionTitle>
                  <List.Root as="ol" gap="2" ps="5" fontSize="sm">
                    {v.reasoning.map((r, i) => (
                      <List.Item key={i}>{r}</List.Item>
                    ))}
                  </List.Root>
                </Stack>

                <Stack gap="3">
                  <SectionTitle>Evidence by source</SectionTitle>
                  <Box layerStyle="card" overflow="hidden">
                    <Table.Root size="sm">
                      <Table.Body>
                        {v.evidence.map((e) => (
                          <Table.Row key={e.source + e.finding}>
                            <Table.Cell fontWeight="600" w="8rem" verticalAlign="top">
                              {e.source}
                            </Table.Cell>
                            <Table.Cell color="fg.muted">{e.finding}</Table.Cell>
                            <Table.Cell w="6rem" textAlign="end">
                              <Badge size="sm" colorPalette={SIGNAL_PALETTE[e.signal]}>
                                {e.signal}
                              </Badge>
                            </Table.Cell>
                          </Table.Row>
                        ))}
                      </Table.Body>
                    </Table.Root>
                  </Box>
                </Stack>

                <Stack gap="3">
                  <HStack justify="space-between">
                    <SectionTitle>Oncogenicity criteria</SectionTitle>
                    <Text fontSize="sm" color="fg.muted">
                      Total score <b>{score}</b>
                    </Text>
                  </HStack>
                  <Stack gap="2">
                    {v.criteria.map((c) => (
                      <HStack key={c.code} align="flex-start" gap="3" fontSize="sm">
                        <Badge
                          variant="outline"
                          colorPalette={c.direction === 'oncogenic' ? 'oncogenic' : 'benign'}
                          fontFamily="mono"
                          minW="3.5rem"
                          justifyContent="center"
                        >
                          {c.code} {c.points > 0 ? `+${c.points}` : c.points}
                        </Badge>
                        <Text color="fg.muted">
                          <Text as="span" color="fg" fontWeight="600">
                            {c.strength}
                          </Text>{' '}
                          — {c.rationale}
                        </Text>
                      </HStack>
                    ))}
                  </Stack>
                </Stack>

                {v.therapies.length > 0 && (
                  <Stack gap="3">
                    <SectionTitle>Therapeutic implications</SectionTitle>
                    {v.therapies.map((t) => (
                      <HStack
                        key={t.drug}
                        justify="space-between"
                        gap="3"
                        fontSize="sm"
                        layerStyle="card"
                        px="3"
                        py="2"
                      >
                        <Box>
                          <Text fontWeight="600">{t.drug}</Text>
                          <Text color="fg.muted" fontSize="xs">
                            {t.context}
                          </Text>
                        </Box>
                        <Stack gap="1" align="flex-end">
                          <Badge colorPalette={t.effect === 'sensitive' ? 'green' : 'red'}>{t.effect}</Badge>
                          <Text fontSize="xs" color="fg.subtle">
                            {t.level}
                          </Text>
                        </Stack>
                      </HStack>
                    ))}
                  </Stack>
                )}
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
