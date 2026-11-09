import { Navigate, Outlet, useParams } from 'react-router'
import { useCase } from '../../store/caseStore'

/** Resolves the case from the URL; child routes read it via useCurrentCase(). */
export function CaseLayout() {
  const { caseId } = useParams()
  const c = useCase(caseId)
  if (!c) return <Navigate to="/" replace />
  return <Outlet />
}

export function useCurrentCase() {
  const { caseId } = useParams()
  const c = useCase(caseId)
  if (!c) throw new Error('useCurrentCase must be used inside CaseLayout')
  return c
}
