import {
  Badge,
  Box,
  Breadcrumb,
  Button,
  createSlotRecipeContext,
  EmptyState,
  HStack,
  Input,
  InputGroup,
  Skeleton,
  Stack,
  Text,
  type HTMLChakraProps,
} from '@chakra-ui/react'
import { Cloud, File, FileCode2, Folder, HardDrive, Lock, Search, ShieldCheck } from 'lucide-react'
import { useEffect, useMemo, useState, type KeyboardEvent } from 'react'
import { buildFullPath, formatBytes, isVcfFileName } from '../../../domain/upload/fileRules'
import type { VcfSource } from '../../../domain/types'
import { services } from '../../../services'
import { AccessDeniedError, type FsEntry, type StorageConnection } from '../../../services/storage'
import { Mono } from '../../../ui'
import { IconTile } from '../../../ui/IconTile'

const { withProvider, withContext } = createSlotRecipeContext({ key: 'fileBrowser' })
const FB = {
  Root: withProvider<HTMLDivElement, HTMLChakraProps<'div'>>('div', 'root'),
  Connections: withContext<HTMLDivElement, HTMLChakraProps<'div'>>('div', 'connections'),
  Connection: withContext<HTMLButtonElement, HTMLChakraProps<'button'>>('button', 'connection'),
  Main: withContext<HTMLDivElement, HTMLChakraProps<'div'>>('div', 'main'),
  Toolbar: withContext<HTMLDivElement, HTMLChakraProps<'div'>>('div', 'toolbar'),
  List: withContext<HTMLDivElement, HTMLChakraProps<'div'>>('div', 'list'),
  Row: withContext<HTMLDivElement, HTMLChakraProps<'div'>>('div', 'row'),
  SelectedBar: withContext<HTMLDivElement, HTMLChakraProps<'div'>>('div', 'selectedBar'),
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

interface Props {
  value: VcfSource | null
  onChange: (source: VcfSource | null) => void
}

type Listing =
  { state: 'loading' } | { state: 'ready'; entries: FsEntry[] } | { state: 'denied'; message: string }

/** Browse pre-configured NFS / S3 connections and pick a VCF — no manual path entry. */
export function FileBrowser({ value, onChange }: Props) {
  const [connections, setConnections] = useState<StorageConnection[]>([])
  const [connId, setConnId] = useState<string>()
  const [path, setPath] = useState('')
  const [listing, setListing] = useState<Listing>({ state: 'loading' })
  const [query, setQuery] = useState('')

  useEffect(() => {
    services.storage.listConnections().then((list) => {
      setConnections(list)
      setConnId((id) => id ?? list[0]?.id)
    })
  }, [])

  useEffect(() => {
    if (!connId) return
    let active = true
    setListing({ state: 'loading' })
    services.storage
      .browse(connId, path)
      .then((entries) => active && setListing({ state: 'ready', entries }))
      .catch(
        (e) =>
          active &&
          setListing({ state: 'denied', message: e instanceof AccessDeniedError ? e.message : String(e) }),
      )
    return () => {
      active = false
    }
  }, [connId, path])

  const conn = connections.find((c) => c.id === connId)
  const segments = path ? path.split('/') : []

  const visible = useMemo(() => {
    if (listing.state !== 'ready') return []
    const q = query.trim().toLowerCase()
    return listing.entries
      .filter((e) => !q || e.name.toLowerCase().includes(q))
      .sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'folder' ? -1 : 1))
  }, [listing, query])

  const open = (rel: string) => {
    setQuery('')
    setPath(rel)
  }

  const select = (entry: FsEntry) => {
    if (!conn) return
    if (entry.type === 'folder') return open(path ? `${path}/${entry.name}` : entry.name)
    if (!isVcfFileName(entry.name)) return
    const rel = path ? `${path}/${entry.name}` : entry.name
    onChange({
      kind: 'remote',
      connectionId: conn.id,
      connectionType: conn.type,
      fileName: entry.name,
      fullPath: buildFullPath(conn.type, conn.root, rel),
      sizeBytes: entry.sizeBytes ?? 0,
    })
  }

  const onRowKey = (e: KeyboardEvent, entry: FsEntry) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      select(entry)
    }
    if (e.key === 'Backspace' && path) open(segments.slice(0, -1).join('/'))
  }

  return (
    <FB.Root>
      <FB.Connections aria-label="Storage connections">
        {connections.length === 0 && <Skeleton h="12" />}
        {connections.map((c) => (
          <FB.Connection
            key={c.id}
            aria-pressed={c.id === connId}
            onClick={() => {
              setConnId(c.id)
              open('')
            }}
          >
            <IconTile boxSize="9" flexShrink={0}>
              {c.type === 's3' ? <Cloud size={16} /> : <HardDrive size={16} />}
            </IconTile>
            <Stack gap="0" minW="0">
              <HStack gap="1.5">
                <Text fontSize="sm" fontWeight="600" truncate>
                  {c.name}
                </Text>
                <Badge size="xs" variant="subtle" colorPalette="ink">
                  {c.type === 's3' ? 'AWS S3' : 'NFS'}
                </Badge>
              </HStack>
              <Mono tone="muted" size="xs" truncate>
                {c.root}
              </Mono>
              <HStack gap="1" fontSize="2xs" color="green.fg">
                <Box boxSize="1.5" borderRadius="full" bg="green.solid" />
                Connected{c.region ? ` · ${c.region}` : ''}
              </HStack>
            </Stack>
          </FB.Connection>
        ))}
        <HStack
          display={{ base: 'none', md: 'flex' }}
          mt="auto"
          gap="2"
          p="2"
          fontSize="xs"
          color="fg.muted"
          align="flex-start"
        >
          <Box as="span" color="green.fg" flexShrink={0} mt="0.5">
            <ShieldCheck size={14} />
          </Box>
          <Text>
            Connections are configured by your administrator ({conn?.access ?? 'read-only'}). No credentials
            are entered here.
          </Text>
        </HStack>
      </FB.Connections>

      <FB.Main>
        <FB.Toolbar>
          <Breadcrumb.Root size="sm" flex="1" minW="0">
            <Breadcrumb.List flexWrap="wrap">
              <Breadcrumb.Item>
                <Breadcrumb.Link asChild>
                  <button type="button" onClick={() => open('')}>
                    <Mono tone={segments.length ? 'brand' : 'default'} size="xs">
                      {conn?.root ?? '…'}
                    </Mono>
                  </button>
                </Breadcrumb.Link>
              </Breadcrumb.Item>
              {segments.map((seg, i) => (
                <Breadcrumb.Item key={i}>
                  <Breadcrumb.Separator />
                  {i === segments.length - 1 ? (
                    <Breadcrumb.CurrentLink>
                      <Mono tone="default" size="xs">
                        {seg}
                      </Mono>
                    </Breadcrumb.CurrentLink>
                  ) : (
                    <Breadcrumb.Link asChild>
                      <button type="button" onClick={() => open(segments.slice(0, i + 1).join('/'))}>
                        <Mono size="xs">{seg}</Mono>
                      </button>
                    </Breadcrumb.Link>
                  )}
                </Breadcrumb.Item>
              ))}
            </Breadcrumb.List>
          </Breadcrumb.Root>
          <InputGroup startElement={<Search size={14} />} maxW={{ base: 'full', sm: '14rem' }}>
            <Input
              size="sm"
              placeholder="Filter this folder"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Filter files"
            />
          </InputGroup>
        </FB.Toolbar>

        <FB.List role="listbox" aria-label="Files">
          <FB.Row
            as="div"
            aria-hidden
            cursor="default"
            color="fg.subtle"
            fontSize="xs"
            fontWeight="600"
            bg="bg.subtle"
            _hover={{ bg: 'bg.subtle' }}
          >
            <span>Name</span>
            <Text textAlign="end">Size</Text>
            <span>Modified</span>
          </FB.Row>

          {listing.state === 'loading' &&
            Array.from({ length: 4 }, (_, i) => (
              <FB.Row key={i} aria-hidden cursor="default" _hover={{ bg: 'transparent' }}>
                <Skeleton h="4" w="60%" />
                <Skeleton h="4" />
                <Skeleton h="4" />
              </FB.Row>
            ))}

          {listing.state === 'denied' && (
            <EmptyState.Root size="sm">
              <EmptyState.Content>
                <EmptyState.Indicator color="red.fg">
                  <Lock />
                </EmptyState.Indicator>
                <EmptyState.Title>No access</EmptyState.Title>
                <EmptyState.Description>
                  {listing.message}. Ask your administrator to grant read access.
                </EmptyState.Description>
                <Button size="sm" variant="outline" onClick={() => open(segments.slice(0, -1).join('/'))}>
                  Go back
                </Button>
              </EmptyState.Content>
            </EmptyState.Root>
          )}

          {listing.state === 'ready' && visible.length === 0 && (
            <EmptyState.Root size="sm">
              <EmptyState.Content>
                <EmptyState.Indicator>
                  <Folder />
                </EmptyState.Indicator>
                <EmptyState.Title>{query ? 'No matching files' : 'This folder is empty'}</EmptyState.Title>
              </EmptyState.Content>
            </EmptyState.Root>
          )}

          {listing.state === 'ready' &&
            visible.map((entry) => {
              const isFolder = entry.type === 'folder'
              const selectable = isFolder || isVcfFileName(entry.name)
              const rel = path ? `${path}/${entry.name}` : entry.name
              const selected =
                value?.kind === 'remote' &&
                conn &&
                value.fullPath === buildFullPath(conn.type, conn.root, rel)
              return (
                <FB.Row
                  key={entry.name}
                  role="option"
                  tabIndex={selectable ? 0 : -1}
                  aria-selected={!!selected}
                  aria-disabled={!selectable}
                  title={!selectable ? 'Only .vcf and .vcf.gz files can be selected' : undefined}
                  onClick={() => (isFolder ? undefined : select(entry))}
                  onDoubleClick={() => isFolder && select(entry)}
                  onKeyDown={(e: KeyboardEvent) => onRowKey(e, entry)}
                >
                  <HStack gap="2.5" minW="0">
                    <Box color={isFolder ? 'brand.fg' : selectable ? 'aqua.fg' : 'fg.subtle'} flexShrink={0}>
                      {isFolder ? (
                        entry.restricted ? (
                          <Lock size={16} />
                        ) : (
                          <Folder size={16} />
                        )
                      ) : selectable ? (
                        <FileCode2 size={16} />
                      ) : (
                        <File size={16} />
                      )}
                    </Box>
                    <Text truncate fontWeight={selectable && !isFolder ? '600' : '500'}>
                      {entry.name}
                    </Text>
                    {isFolder && (
                      <Text fontSize="xs" color="fg.subtle" display={{ base: 'none', md: 'inline' }}>
                        double-click to open
                      </Text>
                    )}
                  </HStack>
                  <Text textAlign="end" color="fg.muted" fontVariantNumeric="tabular-nums">
                    {entry.sizeBytes !== undefined ? formatBytes(entry.sizeBytes) : '—'}
                  </Text>
                  <Text color="fg.muted">{fmtDate(entry.modified)}</Text>
                </FB.Row>
              )
            })}
        </FB.List>
      </FB.Main>

      <FB.SelectedBar>
        {value?.kind === 'remote' ? (
          <>
            <Text color="fg.muted">Selected</Text>
            <Mono tone="default" size="xs" wordBreak="break-all" flex="1">
              {value.fullPath}
            </Mono>
            <Text color="fg.muted">{formatBytes(value.sizeBytes)}</Text>
          </>
        ) : (
          <Text color="fg.subtle">Select a .vcf or .vcf.gz file. Folders open on double-click or Enter.</Text>
        )}
      </FB.SelectedBar>
    </FB.Root>
  )
}
