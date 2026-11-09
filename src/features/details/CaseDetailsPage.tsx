import {
  Badge,
  Box,
  Button,
  Field,
  Grid,
  HStack,
  Input,
  InputGroup,
  NativeSelect,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
} from '@chakra-ui/react'
import { DatabaseZap, FileCode2, Lock } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { sourceLocation } from '../../domain/case/factory'
import { missingRequiredFields } from '../../domain/metadata/requiredFields'
import { formatBytes } from '../../domain/upload/fileRules'
import type { CaseMetadata, MetadataOrigin } from '../../domain/types'
import { services } from '../../services'
import { useCaseStore } from '../../store/caseStore'
import { InfoTip, Mono, SectionTitle } from '../../ui'
import { CaseHeader } from '../case/CaseHeader'
import { useCurrentCase } from '../case/CaseLayout'
import { ProcessingBanner } from '../case/ProcessingBanner'
import { OncoTreeCombobox } from './OncoTreeCombobox'

type Key = keyof Omit<CaseMetadata, 'origin'>

const ORIGIN_BADGE: Record<MetadataOrigin, { label: string; palette: string }> = {
  vcf: { label: 'from VCF', palette: 'aqua' },
  lims: { label: 'from LIMS', palette: 'brand' },
  user: { label: 'entered', palette: 'ink' },
}

const PANELS = [
  'Solid Tumor 52-gene panel v3',
  'Comprehensive 500-gene panel',
  'Lung Fusion RNA panel v2',
  'Myeloid 40-gene panel',
]

function OriginBadge({ origin }: { origin?: MetadataOrigin }) {
  if (!origin) return null
  const b = ORIGIN_BADGE[origin]
  return (
    <Badge size="xs" variant="subtle" colorPalette={b.palette} ms="auto">
      {b.label}
    </Badge>
  )
}

function Section({
  title,
  hint,
  action,
  children,
}: {
  title: string
  hint?: ReactNode
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <Box layerStyle="card" p={{ base: '4', md: '6' }}>
      <HStack justify="space-between" mb="4" gap="3" flexWrap="wrap">
        <HStack gap="2">
          <SectionTitle>{title}</SectionTitle>
          {hint && <InfoTip content={hint} />}
        </HStack>
        {action}
      </HStack>
      {children}
    </Box>
  )
}

export function CaseDetailsPage() {
  const c = useCurrentCase()
  const update = useCaseStore((s) => s.updateMetadata)
  const applyLims = useCaseStore((s) => s.applyLimsOrder)
  const [fetching, setFetching] = useState(false)
  const m = c.metadata
  // Highlight required fields only once processing is actually waiting for them.
  const waiting = c.processing.steps.interpretation === 'waiting'
  const missing = waiting ? missingRequiredFields(m) : []
  const locked = c.report.status === 'signed'

  const text = (key: Key, label: string, opts: { type?: string; placeholder?: string } = {}) => (
    <Field.Root disabled={locked}>
      <Field.Label w="full">
        {label}
        <OriginBadge origin={m.origin[key]} />
      </Field.Label>
      <Input
        key={`${key}:${String(m[key] ?? '')}`}
        type={opts.type}
        placeholder={opts.placeholder}
        defaultValue={(m[key] as string | number | undefined) ?? ''}
        onBlur={(e) => {
          const value = e.target.value.trim()
          if (value === String(m[key] ?? '')) return
          update(c.id, { [key]: value || undefined }, 'user', `${label} set to “${value || '—'}”`)
        }}
      />
    </Field.Root>
  )

  const fetchLims = async () => {
    setFetching(true)
    try {
      applyLims(c.id, await services.lims.fetchOrder(m.sampleId))
    } finally {
      setFetching(false)
    }
  }

  return (
    <>
      <CaseHeader c={c} />
      <ProcessingBanner c={c} />

      <Grid templateColumns={{ base: '1fr', xl: '2fr 1fr' }} gap="6" alignItems="start">
        <Stack gap="6">
          <Section
            title="Required for interpretation"
            hint="Structured on purpose: evidence levels and AMP/ASCO/CAP tiers depend on the tumor type; VAF interpretation (clonality, possible germline origin) depends on tumor content."
          >
            <SimpleGrid columns={{ base: 1, md: 3 }} gap="4">
              <Field.Root
                required
                invalid={missing.includes('tumorType')}
                disabled={locked}
                gridColumn={{ md: 'span 2' }}
              >
                <Field.Label w="full">
                  Tumor type (OncoTree) <Field.RequiredIndicator />
                  <OriginBadge origin={m.origin.tumorType} />
                </Field.Label>
                <OncoTreeCombobox
                  value={m.tumorType}
                  invalid={missing.includes('tumorType')}
                  disabled={locked}
                  onChange={(t) =>
                    update(
                      c.id,
                      { tumorType: t },
                      'user',
                      t ? `Tumor type set to ${t.name} (${t.code})` : 'Tumor type cleared',
                    )
                  }
                />
                <Field.HelperText>
                  Diagnosis from the pathology report, coded for evidence lookup.
                </Field.HelperText>
              </Field.Root>
              <Field.Root required invalid={missing.includes('tumorContent')} disabled={locked}>
                <Field.Label w="full">
                  Tumor content <Field.RequiredIndicator />
                  <OriginBadge origin={m.origin.tumorContent} />
                </Field.Label>
                <InputGroup endElement="%">
                  <Input
                    key={`tc:${m.tumorContent ?? ''}`}
                    type="number"
                    min={1}
                    max={100}
                    inputMode="numeric"
                    placeholder="e.g. 60"
                    defaultValue={m.tumorContent ?? ''}
                    onBlur={(e) => {
                      const v = e.target.value === '' ? undefined : Number(e.target.value)
                      if (v === m.tumorContent) return
                      update(c.id, { tumorContent: v }, 'user', `Tumor content set to ${v ?? '—'}%`)
                    }}
                  />
                </InputGroup>
                <Field.HelperText>1–100%, estimated by the pathologist.</Field.HelperText>
              </Field.Root>
            </SimpleGrid>
          </Section>

          <Section
            title="Test order"
            hint="In a real deployment these fields arrive from the LIMS (HL7 ORM or FHIR ServiceRequest). Values you type are never overwritten."
            action={
              <Button
                size="sm"
                variant="outline"
                colorPalette="brand"
                loading={fetching}
                disabled={locked}
                onClick={fetchLims}
              >
                <DatabaseZap /> Fetch from LIMS
              </Button>
            }
          >
            <SimpleGrid columns={{ base: 1, md: 2 }} gap="4">
              {text('patientId', 'Patient ID (pseudonymised)')}
              {text('orderingPhysician', 'Ordering physician')}
              {text('specimenType', 'Specimen')}
              {text('collectionDate', 'Collection date', { type: 'date' })}
              <Box gridColumn={{ md: 'span 2' }}>{text('diagnosis', 'Clinical diagnosis')}</Box>
              <Field.Root disabled={locked}>
                <Field.Label w="full">
                  Panel
                  <OriginBadge origin={m.origin.panel} />
                </Field.Label>
                <NativeSelect.Root>
                  <NativeSelect.Field
                    value={m.panel ?? ''}
                    onChange={(e) =>
                      update(
                        c.id,
                        { panel: e.target.value || undefined },
                        'user',
                        `Panel set to ${e.target.value}`,
                      )
                    }
                  >
                    <option value="">Select panel…</option>
                    {PANELS.map((p) => (
                      <option key={p}>{p}</option>
                    ))}
                  </NativeSelect.Field>
                  <NativeSelect.Indicator />
                </NativeSelect.Root>
              </Field.Root>
              <Field.Root disabled={locked}>
                <Field.Label>Assay</Field.Label>
                <NativeSelect.Root disabled>
                  <NativeSelect.Field defaultValue={m.assay}>
                    <option value="somatic">Somatic</option>
                    <option value="germline">Germline (coming soon)</option>
                  </NativeSelect.Field>
                  <NativeSelect.Indicator />
                </NativeSelect.Root>
              </Field.Root>
            </SimpleGrid>
          </Section>

          <Section
            title="Clinical notes"
            hint="Free text. Passed to the AI as context (history, prior therapy, the clinician's question)."
          >
            <Textarea
              key={`notes:${m.clinicalNotes ?? ''}`}
              rows={4}
              disabled={locked}
              placeholder="e.g. Never smoker, treatment-naive. Oncologist asks about first-line targeted options."
              defaultValue={m.clinicalNotes ?? ''}
              onBlur={(e) => {
                if (e.target.value === (m.clinicalNotes ?? '')) return
                update(c.id, { clinicalNotes: e.target.value || undefined }, 'user', 'Clinical notes updated')
              }}
            />
          </Section>
        </Stack>

        <Stack gap="6">
          <Section title="Source file">
            <Stack gap="3" fontSize="sm">
              <HStack gap="2" color="aqua.fg">
                <FileCode2 size={16} />
                <Text fontWeight="600" color="fg" wordBreak="break-all">
                  {c.source.fileName}
                </Text>
              </HStack>
              <Mono tone="muted" size="xs" wordBreak="break-all">
                {sourceLocation(c.source)}
              </Mono>
              <Text color="fg.muted">{formatBytes(c.source.sizeBytes)}</Text>
            </Stack>
          </Section>
          <Section title="From VCF header" hint="Read from the VCF header; not editable.">
            <Stack gap="3" fontSize="sm">
              {(
                [
                  ['Sample ID', m.sampleId],
                  ['Reference genome', m.referenceGenome],
                  ['Variant caller', m.variantCaller ?? '—'],
                ] as const
              ).map(([label, value]) => (
                <HStack key={label} justify="space-between" gap="3">
                  <Text color="fg.muted">{label}</Text>
                  <HStack gap="1.5">
                    <Mono tone="default" size="xs">
                      {value}
                    </Mono>
                    <Lock size={12} color="currentColor" opacity={0.5} />
                  </HStack>
                </HStack>
              ))}
            </Stack>
          </Section>
        </Stack>
      </Grid>
    </>
  )
}
