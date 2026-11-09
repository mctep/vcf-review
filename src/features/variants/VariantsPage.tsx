import { Box, Button, Grid, Skeleton, SkeletonText, Stack } from '@chakra-ui/react'
import { Copy, FileText } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { toaster } from '../../components/ui/toaster'
import { interpretationBlockReason, interpretationState, isAnnotated } from '../../domain/case/interpretation'
import { buildReport, reportToPlainText } from '../../domain/report/buildReport'
import { CaseHeader } from '../case/CaseHeader'
import { useCurrentCase } from '../case/CaseLayout'
import { ProcessingBanner } from '../case/ProcessingBanner'
import { StaleInterpretationCallout } from '../case/StaleInterpretationCallout'
import { VariantDetail } from './VariantDetail'
import { VariantList } from './VariantList'

export function VariantsSkeleton() {
  return (
    <Grid
      templateColumns={{ base: '1fr', lg: '20rem 1fr' }}
      gap="5"
      aria-busy="true"
      aria-label="Loading variants"
    >
      <Stack layerStyle="card" p="3" gap="4">
        {Array.from({ length: 6 }, (_, i) => (
          <Stack key={i} gap="2">
            <Skeleton h="4" w="60%" />
            <Skeleton h="3" w="40%" />
          </Stack>
        ))}
      </Stack>
      <Stack layerStyle="card" p="6" gap="6">
        <Skeleton h="7" w="50%" />
        <SkeletonText noOfLines={3} />
        <SkeletonText noOfLines={5} />
      </Stack>
    </Grid>
  )
}

export function VariantsPage() {
  const c = useCurrentCase()
  const navigate = useNavigate()
  const [activeId, setActiveId] = useState<string>()
  const active = c.variants.find((v) => v.id === activeId) ?? c.variants[0]
  const interpreted = interpretationState(c) === 'done'
  const annotated = isAnnotated(c)

  const copyOutput = () => {
    navigator.clipboard?.writeText(reportToPlainText(buildReport(c)))
    toaster.create({ type: 'success', title: 'Report text copied to clipboard', duration: 3000 })
  }

  return (
    <>
      <CaseHeader
        c={c}
        actions={
          annotated && (
            <>
              <Button
                colorPalette="brand"
                disabled={!interpreted}
                title={interpretationBlockReason(c)}
                onClick={() => navigate(`/case/${c.id}/report`)}
              >
                <FileText /> {c.report.status === 'signed' ? 'Open report' : 'Create report'}
              </Button>
              <Button colorPalette="brand" variant="outline" disabled={!interpreted} onClick={copyOutput}>
                <Copy /> Copy output
              </Button>
            </>
          )
        }
      />
      <ProcessingBanner c={c} compact />
      <StaleInterpretationCallout c={c} />
      {!annotated || !active ? (
        <VariantsSkeleton />
      ) : (
        <Grid templateColumns={{ base: '1fr', lg: '20rem minmax(0, 1fr)' }} gap="5" alignItems="start">
          <VariantList c={c} activeId={active.id} onActivate={setActiveId} interpreted={interpreted} />
          <Box minW="0">
            <VariantDetail key={active.id} c={c} v={active} interpreted={interpreted} />
          </Box>
        </Grid>
      )}
    </>
  )
}
