import {
  Badge,
  Box,
  Button,
  Dialog,
  Flex,
  HStack,
  IconButton,
  Portal,
  Separator,
  Stack,
  Text,
  Textarea,
} from '@chakra-ui/react'
import { ArrowRight, Copy, MessageSquarePlus } from 'lucide-react'
import { useState } from 'react'
import { toaster } from '../../components/ui/toaster'
import {
  AGREEMENT_LABEL,
  AGREEMENT_PALETTE,
  FLAG_LABEL,
  FUNCTION_LABEL,
  ONCOGENICITY_LABEL,
  ONCOGENICITY_PALETTE,
  TIER_PALETTE,
} from '../../domain/labels'
import type { Case, Variant } from '../../domain/types'
import { useCaseStore } from '../../store/caseStore'
import { InfoTip, Mono, SectionTitle } from '../../ui'
import { AnalysisDrawer } from './AnalysisDrawer'
import { ClassificationRow } from './ClassificationRow'
import { DescriptionSection } from './DescriptionSection'

function FeedbackDialog({ onSubmit }: { onSubmit: (text: string) => void }) {
  const [text, setText] = useState('')
  const [open, setOpen] = useState(false)
  return (
    <Dialog.Root open={open} onOpenChange={(e) => setOpen(e.open)}>
      <Dialog.Trigger asChild>
        <Button variant="ghostLink" size="sm">
          <MessageSquarePlus /> Leave feedback
        </Button>
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Feedback on this interpretation</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Textarea
                rows={4}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="What is wrong or missing? Feedback improves future drafts."
              />
            </Dialog.Body>
            <Dialog.Footer>
              <Dialog.ActionTrigger asChild>
                <Button variant="ghost">Cancel</Button>
              </Dialog.ActionTrigger>
              <Button
                colorPalette="brand"
                disabled={!text.trim()}
                onClick={() => {
                  onSubmit(text.trim())
                  setText('')
                  setOpen(false)
                }}
              >
                Send feedback
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}

/** Right-hand card: header, classifications, AI-drafted descriptions, agreement + actions. */
export function VariantDetail({ c, v }: { c: Case; v: Variant }) {
  const edit = useCaseStore((s) => s.editDescription)
  const feedback = useCaseStore((s) => s.leaveFeedback)
  const [analysisOpen, setAnalysisOpen] = useState(false)
  const locked = c.report.status === 'signed'
  const score = v.criteria.reduce((s, x) => s + x.points, 0)

  const copy = () => {
    const line = [`${v.gene} ${v.notation}`, v.transcript, v.hgvsg, v.hgvsc].filter(Boolean).join(' · ')
    navigator.clipboard?.writeText(line)
    toaster.create({ type: 'success', title: 'Variant copied', description: line, duration: 3000 })
  }

  return (
    <Box layerStyle="card" p={{ base: '4', md: '6' }} minW="0">
      {/* Header */}
      <Flex justify="space-between" gap="3" align="flex-start">
        <Stack gap="1.5" minW="0">
          <HStack gap="2" align="baseline" flexWrap="wrap">
            <Text textStyle="h2">{v.gene}</Text>
            <Mono size="lg">{v.notation}</Mono>
            {v.transcript && (
              <Mono tone="muted" size="md">
                {v.transcript.split(' ')[0]}
              </Mono>
            )}
          </HStack>
          <HStack gap="2" flexWrap="wrap">
            <Mono tone="muted" size="xs">
              {[v.transcript, v.hgvsg, v.hgvsc].filter(Boolean).join(' · ')}
            </Mono>
            <Badge size="sm" variant="subtle" colorPalette="ink">
              {v.consequence}
            </Badge>
          </HStack>
          <Text fontSize="sm" color="fg.muted">
            {v.kind === 'cnv'
              ? `Copy number ${v.copyNumber}`
              : `VAF ${v.vaf}% · ${v.altReads}/${v.depth} reads`}
          </Text>
          {v.flags.length > 0 && (
            <HStack gap="1.5" flexWrap="wrap">
              {v.flags.map((f) => (
                <Badge key={f} size="sm" variant="outline" colorPalette="accent">
                  {FLAG_LABEL[f]}
                </Badge>
              ))}
            </HStack>
          )}
        </Stack>
        <IconButton aria-label="Copy variant" variant="ghost" size="sm" onClick={copy}>
          <Copy />
        </IconButton>
      </Flex>

      <Separator my="5" />

      <Stack gap="7">
        {/* Classifications */}
        <Stack gap="2">
          <SectionTitle>Classifications</SectionTitle>
          <ClassificationRow
            label="Oncogenicity"
            value={
              <Badge variant="subtle" colorPalette={ONCOGENICITY_PALETTE[v.oncogenicity]}>
                {ONCOGENICITY_LABEL[v.oncogenicity]}
              </Badge>
            }
            info="ClinGen/CGC/VICC 2022 oncogenicity framework. Points from oncogenic and benign criteria are summed: ≥10 oncogenic, 6–9 likely oncogenic, 0–5 VUS."
            triggerLabel="Show criteria"
          >
            <Stack gap="1.5">
              {v.criteria.map((cr) => (
                <Text key={cr.code}>
                  <Mono size="xs" tone={cr.direction === 'oncogenic' ? 'brand' : 'default'}>
                    {cr.code} ({cr.points > 0 ? '+' : ''}
                    {cr.points})
                  </Mono>{' '}
                  {cr.rationale}
                </Text>
              ))}
              <Text fontWeight="600" color="fg">
                Score {score} → {ONCOGENICITY_LABEL[v.oncogenicity]}
              </Text>
            </Stack>
          </ClassificationRow>
          <ClassificationRow
            label="AMP/ASCO/CAP"
            value={
              <Badge variant="subtle" colorPalette={TIER_PALETTE[v.tier]}>
                Tier {v.tier === 'III' || v.tier === 'IV' ? v.tier : v.tierLevel}
              </Badge>
            }
            info="2017 AMP/ASCO/CAP somatic tiers. Tier I: strong clinical significance; II: potential; III: unknown; IV: benign or likely benign."
            triggerLabel="Show evidence"
          >
            <Stack gap="1.5">
              {v.evidence.map((e) => (
                <Text key={e.source + e.finding}>
                  <b>{e.source}:</b> {e.finding}
                </Text>
              ))}
              {v.therapies.map((t) => (
                <Text key={t.drug}>
                  <b>{t.drug}</b> — {t.effect}, {t.level} ({t.context})
                </Text>
              ))}
            </Stack>
          </ClassificationRow>
          <ClassificationRow
            label="Biological function"
            value={
              <Badge
                variant="outline"
                colorPalette={v.biologicalFunction === 'unknown' ? 'unknown' : 'brand'}
              >
                {FUNCTION_LABEL[v.biologicalFunction]}
              </Badge>
            }
            info="Predicted effect on protein function based on functional studies and curated databases."
          />
        </Stack>

        <DescriptionSection
          title="Gene description"
          text={v.geneDescription}
          edited={c.edits[`${v.id}:gene`]}
          locked={locked}
          onSave={(t) => edit(c.id, v.id, 'gene', t)}
        />
        <DescriptionSection
          title="Variant description"
          text={v.variantDescription}
          edited={c.edits[`${v.id}:variant`]}
          locked={locked}
          onSave={(t) => edit(c.id, v.id, 'variant', t)}
        />
      </Stack>

      <Separator my="5" />

      {/* Footer */}
      <Flex
        gap="3"
        justify="space-between"
        align={{ base: 'stretch', sm: 'center' }}
        direction={{ base: 'column', sm: 'row' }}
      >
        <HStack gap="1.5">
          <Badge variant="outline" colorPalette={AGREEMENT_PALETTE[v.agreement]}>
            {AGREEMENT_LABEL[v.agreement]}
          </Badge>
          <InfoTip content="How consistently the evidence sources agree on this variant. Low agreement means the reviewer should look closer." />
        </HStack>
        <HStack gap="2" justify="flex-end" flexWrap="wrap">
          <FeedbackDialog
            onSubmit={(text) => {
              feedback(c.id, v.id, text)
              toaster.create({
                type: 'success',
                title: 'Thanks — feedback recorded in the audit log',
                duration: 3000,
              })
            }}
          />
          <Button colorPalette="brand" size="sm" onClick={() => setAnalysisOpen(true)}>
            <ArrowRight /> View analysis details
          </Button>
        </HStack>
      </Flex>

      <AnalysisDrawer v={v} open={analysisOpen} onOpenChange={setAnalysisOpen} />
    </Box>
  )
}
