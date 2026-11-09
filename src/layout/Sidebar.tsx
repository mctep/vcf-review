import { Box, createSlotRecipeContext, HStack, Spinner, Text, type HTMLChakraProps } from '@chakra-ui/react'
import {
  ClipboardList,
  FilePlus2,
  FileText,
  History,
  LayoutList,
  LogOut,
  MessageSquareText,
  Microscope,
  Moon,
  Sun,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, NavLink, useMatch } from 'react-router'
import { displayStatus } from '../domain/case/interpretation'
import { useColorMode } from '../components/ui/color-mode'
import { CURRENT_USER } from '../domain/case/factory'
import { useCase } from '../store/caseStore'
import { useUiStore } from '../store/uiStore'
import { Logo } from './Logo'

const { withProvider, withContext } = createSlotRecipeContext({ key: 'sidebarNav' })

const Nav = {
  Root: withProvider<HTMLElement, HTMLChakraProps<'nav'>>('nav', 'root'),
  Group: withContext<HTMLDivElement, HTMLChakraProps<'div'>>('div', 'group'),
  GroupLabel: withContext<HTMLParagraphElement, HTMLChakraProps<'p'>>('p', 'groupLabel'),
  Badge: withContext<HTMLSpanElement, HTMLChakraProps<'span'>>('span', 'badge'),
  Item: withContext<HTMLAnchorElement, HTMLChakraProps<'a'>>('a', 'item'),
  SubItem: withContext<HTMLAnchorElement, HTMLChakraProps<'a'>>('a', 'subItem'),
  Footer: withContext<HTMLDivElement, HTMLChakraProps<'div'>>('div', 'footer'),
}

function Item({
  to,
  icon,
  children,
  end,
  busy,
  attention,
}: {
  to: string
  icon: ReactNode
  children: ReactNode
  end?: boolean
  busy?: boolean
  /** Orange dot: something on this page waits for the user. */
  attention?: boolean
}) {
  const close = useUiStore((s) => s.setMobileNavOpen)
  return (
    <Nav.Item asChild>
      <NavLink to={to} end={end} onClick={() => close(false)}>
        {icon}
        <Text as="span" flex="1">
          {children}
        </Text>
        {busy && <Spinner size="xs" color="aqua.fg" borderWidth="1.5px" />}
        {attention && (
          <Box boxSize="2" borderRadius="full" bg="orange.solid" aria-label="Needs input" role="img" />
        )}
      </NavLink>
    </Nav.Item>
  )
}

export function Sidebar() {
  const match = useMatch('/case/:caseId/*')
  const caseId = match?.params.caseId
  const current = useCase(caseId)
  const openAudit = useUiStore((s) => s.setAuditOpen)
  const { colorMode, toggleColorMode } = useColorMode()
  const status = current && displayStatus(current)
  const busy = status === 'processing'

  return (
    <Nav.Root aria-label="Main">
      <Logo />

      <Nav.Group>
        <Nav.GroupLabel>Cases</Nav.GroupLabel>
        <Item to="/" end icon={<LayoutList />}>
          Cases overview
        </Item>
        <Item to="/new" icon={<FilePlus2 />}>
          New case
        </Item>
      </Nav.Group>

      {current && (
        <Nav.Group>
          <Nav.GroupLabel>
            Current case
            <Text as="span" textStyle="monoSm" color="fg.subtle" letterSpacing="normal" textTransform="none">
              {current.metadata.sampleId}
            </Text>
          </Nav.GroupLabel>
          <Item
            to={`/case/${current.id}/details`}
            icon={<ClipboardList />}
            attention={status === 'needsInput'}
          >
            Details
          </Item>
          <Item to={`/case/${current.id}/variants`} icon={<Microscope />} busy={busy}>
            Variants
          </Item>
          <Item to={`/case/${current.id}/report`} icon={<FileText />} busy={busy}>
            Report
          </Item>
          <Nav.Item asChild>
            <button type="button" onClick={() => openAudit(true)}>
              <History />
              <Text as="span">Audit log</Text>
            </button>
          </Nav.Item>
        </Nav.Group>
      )}

      <Nav.Group>
        <Nav.GroupLabel>
          Assistant <Nav.Badge>Beta</Nav.Badge>
        </Nav.GroupLabel>
        {current ? (
          <Nav.Item asChild>
            {/* Plain Link: should not show as active together with "Report". */}
            <Link to={`/case/${current.id}/report?chat=1`}>
              <MessageSquareText />
              <Text as="span">Chat about this case</Text>
            </Link>
          </Nav.Item>
        ) : (
          <Nav.Item aria-disabled="true">
            <MessageSquareText />
            <Text as="span">Open a case to chat</Text>
          </Nav.Item>
        )}
      </Nav.Group>

      <Nav.Footer>
        <div>
          <Text color="brand.fg" fontWeight="600">
            {CURRENT_USER}
          </Text>
          <Text color="brand.fg" fontSize="xs">
            Molecular Pathology Lab
          </Text>
        </div>
        <HStack asChild gap="2" color="fg.muted" _hover={{ color: 'fg' }} cursor="pointer">
          <button type="button" onClick={toggleColorMode}>
            {colorMode === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            {colorMode === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
        </HStack>
        <HStack asChild gap="2" color="fg.muted" _hover={{ color: 'fg' }} cursor="pointer">
          <button
            type="button"
            onClick={() => undefined}
            title="Sign-out is not implemented in the prototype"
          >
            <LogOut size={16} />
            Logout
          </button>
        </HStack>
        <HStack
          justify="space-between"
          pt="3"
          borderTopWidth="1px"
          borderColor="border"
          fontSize="xs"
          color="fg.muted"
        >
          <span>Release notes</span>
          <span>v0.1.0</span>
        </HStack>
      </Nav.Footer>
    </Nav.Root>
  )
}
