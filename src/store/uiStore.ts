import { create } from 'zustand'

interface UiStore {
  auditOpen: boolean
  setAuditOpen: (open: boolean) => void
  mobileNavOpen: boolean
  setMobileNavOpen: (open: boolean) => void
}

export const useUiStore = create<UiStore>((set) => ({
  auditOpen: false,
  setAuditOpen: (auditOpen) => set({ auditOpen }),
  mobileNavOpen: false,
  setMobileNavOpen: (mobileNavOpen) => set({ mobileNavOpen }),
}))
