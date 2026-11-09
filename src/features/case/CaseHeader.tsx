import { Flex, HStack, Stack, Text } from '@chakra-ui/react'
import type { ReactNode } from 'react'
import { NavLink } from 'react-router'
import type { Case } from '../../domain/types'
import { displayStatus } from '../../domain/case/interpretation'
import { PageTitle, StatusPill } from '../../ui'

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

const TABS = [
  { to: 'details', label: 'Details' },
  { to: 'variants', label: 'Variants' },
  { to: 'report', label: 'Report' },
]

/** "Case <uuid>" title, meta line, actions and the case tabs. */
export function CaseHeader({ c, actions }: { c: Case; actions?: ReactNode }) {
  const meta = [
    fmtDate(c.createdAt),
    c.metadata.sampleId,
    c.variants.length ? `${c.variants.length} variants` : null,
    c.metadata.assay === 'somatic' ? 'Somatic' : 'Germline',
    c.metadata.tumorType?.name ?? 'Tumor type not set',
  ].filter(Boolean)

  return (
    <Stack gap="4" mb="6">
      <Flex
        gap="4"
        justify="space-between"
        align={{ base: 'stretch', md: 'flex-start' }}
        direction={{ base: 'column', md: 'row' }}
      >
        <Stack gap="2" minW="0">
          <PageTitle wordBreak="break-all">
            Case{' '}
            <Text as="span" fontWeight="800">
              {c.id}
            </Text>
          </PageTitle>
          <HStack gap="2" flexWrap="wrap" color="fg.muted" fontSize="sm">
            {meta.map((m, i) => (
              <HStack key={i} gap="2">
                {i > 0 && (
                  <Text as="span" color="fg.subtle">
                    ·
                  </Text>
                )}
                <Text as="span">{m}</Text>
              </HStack>
            ))}
            <Text as="span" color="fg.subtle">
              ·
            </Text>
            <StatusPill status={displayStatus(c)} />
          </HStack>
        </Stack>
        {actions && (
          <HStack gap="2" flexShrink={0} flexWrap="wrap">
            {actions}
          </HStack>
        )}
      </Flex>
      <HStack gap="1" borderBottomWidth="1px" borderColor="border" overflowX="auto">
        {TABS.map((t) => (
          <Text
            key={t.to}
            asChild
            px="3"
            py="2"
            mb="-1px"
            fontSize="sm"
            fontWeight="600"
            color="fg.muted"
            borderBottomWidth="2px"
            borderColor="transparent"
            _hover={{ color: 'fg' }}
            css={{ '&[aria-current=page]': { color: 'brand.fg', borderColor: 'brand.solid' } }}
          >
            <NavLink to={`/case/${c.id}/${t.to}`}>{t.label}</NavLink>
          </Text>
        ))}
      </HStack>
    </Stack>
  )
}
