import { Box, Button, HStack, Popover, Portal, Stack, Text, Textarea } from '@chakra-ui/react'
import { Info, Pencil } from 'lucide-react'
import { useState } from 'react'
import { richTextToPlain } from '../../domain/report/buildReport'
import type { Citation, RichText } from '../../domain/types'
import { CitationLink, SectionTitle } from '../../ui'

function citationsOf(text: RichText): Citation[] {
  const seen = new Map<string, Citation>()
  for (const part of text) if (typeof part !== 'string') seen.set(part.cite.url + part.cite.label, part.cite)
  return [...seen.values()]
}

/** Where every statement came from: source, version, access date. */
function Traceability({ text, edited }: { text: RichText; edited: boolean }) {
  const cites = citationsOf(text)
  return (
    <Popover.Root positioning={{ placement: 'bottom-start' }}>
      <Popover.Trigger asChild>
        <Button
          variant="plain"
          size="xs"
          px="0"
          h="auto"
          color="fg.subtle"
          fontWeight="500"
          _hover={{ color: 'brand.fg' }}
        >
          Traceability <Info size={12} />
        </Button>
      </Popover.Trigger>
      <Portal>
        <Popover.Positioner>
          <Popover.Content maxW="24rem">
            <Popover.Arrow />
            <Popover.Body>
              <Stack gap="2" fontSize="xs">
                <Text fontWeight="700">Sources used in this paragraph</Text>
                {cites.map((c) => (
                  <Box key={c.url + c.label}>
                    <Text fontWeight="600">{c.label}</Text>
                    <Text color="fg.muted">
                      {c.source}
                      {c.version ? ` · ${c.version}` : ''} · accessed {c.accessed}
                    </Text>
                  </Box>
                ))}
                <Text color="fg.subtle">
                  Drafted by the interpretation model from the sources above
                  {edited ? ', then edited by a reviewer.' : '.'}
                </Text>
              </Stack>
            </Popover.Body>
          </Popover.Content>
        </Popover.Positioner>
      </Portal>
    </Popover.Root>
  )
}

interface Props {
  title: string
  text: RichText
  edited?: string
  locked: boolean
  onSave: (value: string) => void
}

/** AI-drafted paragraph with inline citations; reviewers can edit it. */
export function DescriptionSection({ title, text, edited, locked, onSave }: Props) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')

  return (
    <Stack gap="2">
      <HStack justify="space-between">
        <SectionTitle>{title}</SectionTitle>
        {!locked && !editing && (
          <Button
            size="xs"
            variant="ghostLink"
            onClick={() => {
              setDraft(edited ?? richTextToPlain(text))
              setEditing(true)
            }}
          >
            <Pencil /> Edit
          </Button>
        )}
      </HStack>
      {editing ? (
        <Stack gap="2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={7}
            textStyle="body"
            autoFocus
          />
          <HStack justify="flex-end">
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              colorPalette="brand"
              onClick={() => {
                onSave(draft)
                setEditing(false)
              }}
            >
              Save
            </Button>
          </HStack>
        </Stack>
      ) : (
        <Text textStyle="body" color="fg">
          {edited ??
            text.map((part, i) =>
              typeof part === 'string' ? (
                <span key={i}>{part}</span>
              ) : (
                <CitationLink key={i} citation={part.cite} />
              ),
            )}
          {edited && (
            <Text as="span" ms="2" fontSize="xs" color="accent.fg" fontWeight="600">
              (edited)
            </Text>
          )}
        </Text>
      )}
      <Box>
        <Traceability text={text} edited={!!edited} />
      </Box>
    </Stack>
  )
}
