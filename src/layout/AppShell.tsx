import { Box, CloseButton, Drawer, Flex, IconButton, Portal } from '@chakra-ui/react'
import { Menu } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Outlet, useNavigate } from 'react-router'
import { toaster, Toaster } from '../components/ui/toaster'
import { displayStatus } from '../domain/case/interpretation'
import { missingRequiredFields, waitingMessage } from '../domain/metadata/requiredFields'
import type { DisplayStatus } from '../domain/types'
import { AuditDrawer } from '../features/audit/AuditDrawer'
import { useCaseStore } from '../store/caseStore'
import { useUiStore } from '../store/uiStore'
import { Logo } from './Logo'
import { Sidebar } from './Sidebar'

/** Notifies when a background job finishes, fails or starts waiting for input, wherever the user is. */
function useProcessingNotifications() {
  const navigate = useNavigate()
  const previous = useRef<Record<string, DisplayStatus>>({})
  useEffect(() => {
    previous.current = Object.fromEntries(useCaseStore.getState().cases.map((c) => [c.id, displayStatus(c)]))
    return useCaseStore.subscribe((state) => {
      for (const c of state.cases) {
        const before = previous.current[c.id]
        const now = displayStatus(c)
        const viewing = window.location.hash.includes(c.id)
        if (before === 'processing' && now === 'needsInput' && !viewing) {
          toaster.create({
            type: 'warning',
            title: `Case ${c.metadata.sampleId} needs input`,
            description: `Variants are ranked. ${waitingMessage(missingRequiredFields(c.metadata))}.`,
            action: { label: 'Open', onClick: () => navigate(`/case/${c.id}/details`) },
            duration: 8000,
          })
        }
        if (before === 'processing' && now === 'ready') {
          toaster.create({
            type: 'success',
            title: `Case ${c.metadata.sampleId} is ready for review`,
            description: `${c.variants.length} reportable variants with drafted interpretations.`,
            action: { label: 'Open', onClick: () => navigate(`/case/${c.id}/variants`) },
            duration: 8000,
          })
        }
        if (before === 'processing' && now === 'failed') {
          toaster.create({
            type: 'error',
            title: `Processing failed for ${c.metadata.sampleId}`,
            description: c.processing.error?.message,
            action: { label: 'View', onClick: () => navigate(`/case/${c.id}/details`) },
            duration: 10000,
          })
        }
        previous.current[c.id] = now
      }
    })
  }, [navigate])
}

export function AppShell() {
  const init = useCaseStore((s) => s.init)
  const { mobileNavOpen, setMobileNavOpen } = useUiStore()
  useEffect(() => {
    init()
  }, [init])
  useProcessingNotifications()

  return (
    <Flex minH="100dvh" direction={{ base: 'column', lg: 'row' }}>
      {/* Desktop sidebar */}
      <Box
        as="aside"
        display={{ base: 'none', lg: 'block' }}
        w="16rem"
        flexShrink={0}
        position="sticky"
        top="0"
        h="100dvh"
        overflowY="auto"
        px="3"
        py="5"
      >
        <Sidebar />
      </Box>

      {/* Mobile top bar */}
      <Flex
        display={{ base: 'flex', lg: 'none' }}
        align="center"
        justify="space-between"
        px="3"
        pt="4"
        pb="1"
      >
        <Logo />
        <Drawer.Root open={mobileNavOpen} onOpenChange={(e) => setMobileNavOpen(e.open)} placement="start">
          <Drawer.Trigger asChild>
            <IconButton aria-label="Open navigation" variant="ghost">
              <Menu />
            </IconButton>
          </Drawer.Trigger>
          <Portal>
            <Drawer.Backdrop />
            <Drawer.Positioner>
              <Drawer.Content bg="app.stop2" maxW="18rem">
                <Drawer.Body px="3" py="5">
                  <Sidebar />
                </Drawer.Body>
                <Drawer.CloseTrigger asChild>
                  <CloseButton size="sm" position="absolute" top="3" right="3" />
                </Drawer.CloseTrigger>
              </Drawer.Content>
            </Drawer.Positioner>
          </Portal>
        </Drawer.Root>
      </Flex>

      <Box as="main" flex="1" minW="0" p={{ base: '3', md: '4' }} pl={{ lg: '0' }}>
        <Box layerStyle="panel" minH={{ lg: 'calc(100dvh - 2rem)' }} p={{ base: '4', md: '6', xl: '8' }}>
          <Outlet />
        </Box>
      </Box>

      <AuditDrawer />
      <Toaster />
    </Flex>
  )
}
