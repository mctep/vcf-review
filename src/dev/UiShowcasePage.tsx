import { Badge, Box, Button, Grid, HStack, SimpleGrid, Stack, Text } from '@chakra-ui/react'
import { ArrowRight, MessageSquarePlus, Sparkles } from 'lucide-react'
import { useColorMode } from '../components/ui/color-mode'
import type { DisplayStatus } from '../domain/types'
import {
  CitationLink,
  Eyebrow,
  GlassCard,
  Highlight,
  InfoTip,
  Mono,
  PageTitle,
  SectionTitle,
  StatusPill,
} from '../ui'
import { IconTile } from '../ui/IconTile'

const PALETTES = ['brand', 'accent', 'aqua', 'ink']
const STEPS = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950']
const SEMANTIC = ['solid', 'fg', 'muted', 'subtle', 'emphasized']
const CLINICAL = [
  'tier1',
  'tier2',
  'tier3',
  'tier4',
  'oncogenic',
  'vus',
  'benign',
  'unknown',
  'agreementHigh',
  'agreementMedium',
  'agreementLow',
]
const STATUSES: DisplayStatus[] = ['processing', 'needsInput', 'ready', 'signed', 'failed']
const SURFACES = ['bg', 'bg.panel', 'bg.subtle', 'bg.muted', 'bg.emphasized', 'bg.glass', 'bg.selected']
const TEXT_STYLES = [
  'display',
  'h1',
  'h2',
  'h3',
  'eyebrow',
  'sectionTitle',
  'label',
  'bodyLg',
  'body',
  'mono',
  'monoSm',
  'caption',
]

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Stack gap="3" layerStyle="card" p="5">
      <SectionTitle>{title}</SectionTitle>
      {children}
    </Stack>
  )
}

/** Living reference of the design system (#/ui). See docs/THEME.md. */
export function UiShowcasePage() {
  const { colorMode, toggleColorMode } = useColorMode()
  return (
    <Stack gap="6">
      <HStack justify="space-between" flexWrap="wrap" gap="3">
        <Stack gap="1">
          <Eyebrow>Design system</Eyebrow>
          <PageTitle>UI showcase</PageTitle>
          <Text color="fg.muted">
            Tokens, text styles, layer styles and recipes. Documented in docs/THEME.md.
          </Text>
        </Stack>
        <Button variant="outline" onClick={toggleColorMode}>
          Switch to {colorMode === 'dark' ? 'light' : 'dark'} mode
        </Button>
      </HStack>

      <Block title="Palettes (tokens)">
        {PALETTES.map((p) => (
          <HStack key={p} gap="0" borderRadius="l2" overflow="hidden">
            <Text w="5rem" fontSize="xs" fontWeight="600">
              {p}
            </Text>
            {STEPS.map((s) => (
              <Box key={s} flex="1" h="8" bg={`${p}.${s}`} title={`${p}.${s}`} />
            ))}
          </HStack>
        ))}
      </Block>

      <Block title="Semantic palette tokens (adapt to dark mode)">
        <Grid templateColumns="5rem repeat(5, 1fr)" gap="1" fontSize="xs">
          <span />
          {SEMANTIC.map((s) => (
            <Text key={s} fontWeight="600">
              .{s}
            </Text>
          ))}
          {[...PALETTES, ...CLINICAL].map((p) => (
            <Box key={p} display="contents">
              <Text fontWeight="600">{p}</Text>
              {SEMANTIC.map((s) => (
                <Box
                  key={s}
                  h="6"
                  borderRadius="l1"
                  bg={`${p}.${s}`}
                  borderWidth="1px"
                  borderColor="border"
                />
              ))}
            </Box>
          ))}
        </Grid>
      </Block>

      <Block title="Surfaces">
        <SimpleGrid columns={{ base: 2, md: 4, xl: 7 }} gap="3">
          {SURFACES.map((s) => (
            <Stack key={s} gap="1">
              <Box h="14" borderRadius="l2" bg={s} borderWidth="1px" borderColor="border" />
              <Text textStyle="monoSm">{s}</Text>
            </Stack>
          ))}
        </SimpleGrid>
      </Block>

      <Block title="Text styles">
        {TEXT_STYLES.map((t) => (
          <HStack key={t} gap="4" align="baseline">
            <Text w="7rem" flexShrink={0} textStyle="monoSm" color="fg.subtle">
              {t}
            </Text>
            <Text textStyle={t} truncate>
              {t === 'mono' || t === 'monoSm'
                ? 'NM_005228.5 c.2573T>G p.L858R'
                : 'Spend expertise where it matters'}
            </Text>
          </HStack>
        ))}
        <Text>
          Gradient highlight: <Highlight fontWeight="800">6.5 hours saved</Highlight>
        </Text>
      </Block>

      <SimpleGrid columns={{ base: 1, md: 2 }} gap="6">
        <Block title="Buttons (recipe: button)">
          <HStack gap="2" flexWrap="wrap">
            <Button colorPalette="brand">
              <ArrowRight /> Solid
            </Button>
            <Button variant="accent">Accent</Button>
            <Button variant="outline" colorPalette="brand">
              Outline
            </Button>
            <Button variant="ghostLink">
              <MessageSquarePlus /> Ghost link
            </Button>
            <Button colorPalette="brand" disabled>
              Disabled
            </Button>
          </HStack>
        </Block>

        <Block title="Badges & status (recipes: badge, statusPill)">
          <HStack gap="2" flexWrap="wrap">
            <Badge colorPalette="tier1">Tier IA</Badge>
            <Badge colorPalette="tier2">Tier IIC</Badge>
            <Badge colorPalette="tier3">Tier III</Badge>
            <Badge colorPalette="vus">VUS</Badge>
            <Badge colorPalette="oncogenic">Oncogenic</Badge>
            <Badge variant="outline" colorPalette="unknown">
              Unknown
            </Badge>
            <Badge variant="outline" colorPalette="agreementLow">
              Med-low source agreement
            </Badge>
          </HStack>
          <HStack gap="2" flexWrap="wrap">
            {STATUSES.map((s) => (
              <StatusPill key={s} status={s} />
            ))}
          </HStack>
        </Block>

        <Block title="Mono notation & citations">
          <HStack gap="3" flexWrap="wrap" align="baseline">
            <Text fontWeight="700">BRAF</Text>
            <Mono>p.V600E</Mono>
            <Mono tone="muted">NM_004333.6</Mono>
            <Mono size="lg">deletion cn=0</Mono>
          </HStack>
          <Text textStyle="body">
            Evidence is cited inline (
            <CitationLink
              citation={{
                label: 'OncoKB: BRAF V600E',
                url: 'https://www.oncokb.org/gene/BRAF/V600E',
                source: 'OncoKB',
                accessed: '2026-11-02',
              }}
            />
            ) with an info tip <InfoTip content="Tooltip text explains the field." />.
          </Text>
        </Block>

        <Block title="Layer styles">
          <SimpleGrid columns={2} gap="3">
            <Box layerStyle="panel" p="4" fontSize="sm">
              panel
            </Box>
            <Box layerStyle="card" p="4" fontSize="sm">
              card
            </Box>
            <Box layerStyle="glass" p="4" fontSize="sm">
              glass
            </Box>
            <HStack gap="2" fontSize="sm">
              <IconTile>
                <Sparkles size={18} />
              </IconTile>
              iconTile
            </HStack>
          </SimpleGrid>
        </Block>
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, md: 3 }} gap="4">
        <GlassCard.Root>
          <GlassCard.AccentBar />
          <GlassCard.Eyebrow>Glass card</GlassCard.Eyebrow>
          <GlassCard.Title>Slot recipe</GlassCard.Title>
          <GlassCard.Body>
            Translucent surface with a gradient accent bar. Used for stats, upload and empty states.
          </GlassCard.Body>
        </GlassCard.Root>
        <GlassCard.Root size="sm">
          <GlassCard.Eyebrow>Small, no bar</GlassCard.Eyebrow>
          <GlassCard.Body>size="sm"</GlassCard.Body>
        </GlassCard.Root>
        <GlassCard.Root size="lg">
          <GlassCard.AccentBar />
          <GlassCard.Title>Large</GlassCard.Title>
        </GlassCard.Root>
      </SimpleGrid>
    </Stack>
  )
}
