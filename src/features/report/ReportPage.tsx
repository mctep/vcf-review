import { Button, Grid, HStack, Text } from '@chakra-ui/react'
import { Copy, Lock } from 'lucide-react'
import { useCallback, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { toaster } from '../../components/ui/toaster'
import { interpretationState, isInterpretationStale } from '../../domain/case/interpretation'
import { buildReport, reportToPlainText, signOffBlockReason } from '../../domain/report/buildReport'
import { useCaseStore } from '../../store/caseStore'
import { CaseHeader } from '../case/CaseHeader'
import { useCurrentCase } from '../case/CaseLayout'
import { ProcessingBanner } from '../case/ProcessingBanner'
import { StaleInterpretationCallout } from '../case/StaleInterpretationCallout'
import { InterpretationPending } from '../case/InterpretationPending'
import { AgentChat } from './AgentChat'
import { ReportDocument } from './ReportDocument'
import { SelectionQuoteButton } from './SelectionQuote'
import { SignOffDialog } from './SignOffDialog'
import type { ChatQuote } from '../../domain/types'

export function ReportPage() {
  const c = useCurrentCase()
  const [params] = useSearchParams()
  const sign = useCaseStore((s) => s.signReport)
  const clearHighlight = useCaseStore((s) => s.clearHighlight)
  const report = useMemo(() => buildReport(c), [c])
  const interpreted = interpretationState(c) === 'done'
  const signed = c.report.status === 'signed'
  const settle = useCallback(() => clearHighlight(c.id), [c.id, clearHighlight])
  const documentRef = useRef<HTMLDivElement>(null)
  const [quote, setQuote] = useState<ChatQuote>()

  const copy = () => {
    navigator.clipboard?.writeText(reportToPlainText(report))
    toaster.create({ type: 'success', title: 'Report text copied to clipboard', duration: 3000 })
  }

  const signBlock =
    signOffBlockReason(c) ??
    (isInterpretationStale(c)
      ? 'Interpretation inputs changed — re-run the interpretation or keep the current draft first'
      : undefined)

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
                <SignOffDialog
                  disabled={!!signBlock}
                  reason={signBlock}
                  metadata={c.metadata}
                  onSign={() => sign(c.id)}
                />
              )}
              <Button colorPalette="brand" variant="outline" onClick={copy}>
                <Copy /> Copy output
              </Button>
            </>
          )
        }
      />
      <ProcessingBanner c={c} />
      <StaleInterpretationCallout c={c} />
      {!interpreted ? (
        <InterpretationPending c={c} subject="The report" size="lg" />
      ) : (
        <Grid templateColumns={{ base: '1fr', xl: 'minmax(0, 1fr) 22rem' }} gap="6" alignItems="start">
          <Grid gap="3">
            {!signed && (
              <Text fontSize="sm" color="fg.muted">
                Draft built from {c.selected.length} selected variant{c.selected.length === 1 ? '' : 's'}.
                Change the selection on the Variants tab or ask the assistant to edit the text — select a
                passage to quote it in the chat.
              </Text>
            )}
            <div ref={documentRef}>
              <ReportDocument r={report} highlighted={c.report.highlighted} onSettled={settle} />
            </div>
            <SelectionQuoteButton container={documentRef} disabled={signed} onQuote={setQuote} />
          </Grid>
          <AgentChat c={c} autoFocus={params.get('chat') === '1'} quote={quote} onQuoteChange={setQuote} />
        </Grid>
      )}
    </>
  )
}
