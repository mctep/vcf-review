import { Navigate, Route, Routes } from 'react-router'
import { UiShowcasePage } from './dev/UiShowcasePage'
import { CaseLayout } from './features/case/CaseLayout'
import { CaseDetailsPage } from './features/details/CaseDetailsPage'
import { NewCasePage } from './features/new-case/NewCasePage'
import { ReportPage } from './features/report/ReportPage'
import { VariantsPage } from './features/variants/VariantsPage'
import { CasesOverviewPage } from './features/worklist/CasesOverviewPage'
import { AppShell } from './layout/AppShell'

/**
 * Routes (HashRouter — GitHub Pages has no SPA fallback):
 *   #/                     Cases overview
 *   #/new                  New case (choose a VCF)
 *   #/case/:id/details     Metadata + processing status
 *   #/case/:id/variants    Ranked variants and interpretation
 *   #/case/:id/report      Report draft, assistant chat, sign-off (?chat=1 focuses the chat)
 *   #/ui                   Design system showcase
 */
export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<CasesOverviewPage />} />
        <Route path="new" element={<NewCasePage />} />
        <Route path="case/:caseId" element={<CaseLayout />}>
          <Route index element={<Navigate to="details" replace />} />
          <Route path="details" element={<CaseDetailsPage />} />
          <Route path="variants" element={<VariantsPage />} />
          <Route path="report" element={<ReportPage />} />
        </Route>
        <Route path="ui" element={<UiShowcasePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
