import { Button, Grid, HStack, Text } from '@chakra-ui/react'
import { Copy, Lock } from 'lucide-react'
import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { toaster } from '../../components/ui/toaster'
import { buildReport, reportToPlainText } from '../../domain/report/buildReport'
import { useCaseStore } from '../../store/caseStore'
import { CaseHeader } from '../case/CaseHeader'
import { useCurrentCase } from '../case/CaseLayout'
import { ProcessingBanner } from '../case/ProcessingBanner'
import { VariantsSkeleton } from '../variants/VariantsPage'
import { AgentChat } from './AgentChat'
import { ReportDocument } from './ReportDocument'
import { SignOffDialog } from './SignOffDialog'

export function ReportPage() {
  const c = useCurrentCase()
  const [params] = useSearchParams()
  const sign = useCaseStore((s) => s.signReport)
  const clearHighlight = useCaseStore((s) => s.clearHighlight)
  const report = useMemo(() => buildReport(c), [c])
  const interpreted = c.processing.steps.interpretation === 'done'
  const signed = c.report.status === 'signed'
  const settle = useCallback(() => clearHighlight(c.id), [c.id, clearHighlight])

  const copy = () => {
    navigator.clipboard?.writeText(reportToPlainText(report))
    toaster.create({ type: 'success', title: 'Report text copied to clipboard', duration: 3000 })
  }

  const signBlock = c.selected.length === 0 ? 'Select at least one variant to include' : undefined

  return (
    <>
      <CaseHeader
        c={c}
        actions={
          interpreted && (
            <>
              {signed ? (
                <HStack gap="1.5" color="green.fg" fontSize="sm" fontWeight="600" px="2">
                  <Lock size={16} /> Signed v{c.report.version}
                </HStack>
              ) : (
                <SignOffDialog disabled={!!signBlock} reason={signBlock} onSign={() => sign(c.id)} />
              )}
              <Button colorPalette="brand" variant="outline" onClick={copy}>
                <Copy /> Copy output
              </Button>
            </>
          )
        }
      />
      <ProcessingBanner c={c} compact />
      {!interpreted ? (
        <VariantsSkeleton />
      ) : (
        <Grid templateColumns={{ base: '1fr', xl: 'minmax(0, 1fr) 22rem' }} gap="6" alignItems="start">
          <Grid gap="3">
            {!signed && (
              <Text fontSize="sm" color="fg.muted">
                Draft built from {c.selected.length} selected variant{c.selected.length === 1 ? '' : 's'}.
                Change the selection on the Variants tab or ask the assistant to edit the text.
              </Text>
            )}
            <ReportDocument r={report} highlighted={c.report.highlighted} onSettled={settle} />
          </Grid>
          <AgentChat c={c} autoFocus={params.get('chat') === '1'} />
        </Grid>
      )}
    </>
  )
}
