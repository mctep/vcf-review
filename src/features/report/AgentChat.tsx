import { Box, Button, HStack, IconButton, Spinner, Stack, Text, Textarea } from '@chakra-ui/react'
import { Send, Sparkles } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { Case, ChatQuote } from '../../domain/types'
import { SUGGESTED_PROMPTS } from '../../mocks/agentReplies'
import { useCaseStore } from '../../store/caseStore'
import { Eyebrow } from '../../ui'
import { IconTile } from '../../ui/IconTile'
import { QuoteBlock } from './SelectionQuote'

/**
 * Agentic chat that edits the report draft. Replies are canned in the prototype.
 * `quote` is a passage selected in the report; it is sent with the next message.
 */
export function AgentChat({
  c,
  autoFocus,
  quote,
  onQuoteChange,
}: {
  c: Case
  autoFocus?: boolean
  quote?: ChatQuote
  onQuoteChange: (quote: ChatQuote | undefined) => void
}) {
  const send = useCaseStore((s) => s.sendChat)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const input = useRef<HTMLTextAreaElement>(null)
  const end = useRef<HTMLDivElement>(null)
  const locked = c.report.status === 'signed'

  useEffect(() => {
    if (autoFocus) input.current?.focus()
  }, [autoFocus])
  useEffect(() => {
    if (quote) input.current?.focus()
  }, [quote])
  useEffect(() => {
    end.current?.scrollIntoView({ block: 'nearest' })
  }, [c.chat.length, busy])

  const submit = async (prompt: string) => {
    if (!prompt.trim() || busy) return
    const quoted = quote
    setText('')
    onQuoteChange(undefined)
    setBusy(true)
    try {
      await send(c.id, prompt.trim(), quoted)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Stack
      layerStyle="glass"
      borderRadius="l3"
      p="4"
      gap="3"
      h={{ xl: 'calc(100dvh - 12rem)' }}
      position={{ xl: 'sticky' }}
      top={{ xl: '4' }}
    >
      <HStack gap="2">
        <IconTile boxSize="8">
          <Sparkles size={16} />
        </IconTile>
        <Stack gap="0">
          <Eyebrow>Assistant · beta</Eyebrow>
          <Text fontSize="xs" color="fg.subtle">
            Edits the draft. You approve before signing.
          </Text>
        </Stack>
      </HStack>

      <Stack
        flex="1"
        overflowY="auto"
        gap="2"
        minH="10rem"
        maxH={{ base: '22rem', xl: 'none' }}
        aria-live="polite"
      >
        {c.chat.length === 0 && (
          <Text fontSize="sm" color="fg.muted">
            Ask for changes in plain words — the report updates and the changed section is highlighted.
          </Text>
        )}
        {c.chat.map((m) => (
          <Box
            key={m.id}
            alignSelf={m.role === 'user' ? 'flex-end' : 'flex-start'}
            maxW="90%"
            px="3"
            py="2"
            borderRadius="l3"
            fontSize="sm"
            bg={m.role === 'user' ? 'brand.solid' : 'bg.panel'}
            color={m.role === 'user' ? 'brand.contrast' : 'fg'}
            borderWidth={m.role === 'user' ? 0 : '1px'}
            borderColor="border"
          >
            {m.quote && (
              <Box mb="1.5">
                <QuoteBlock quote={m.quote} inverted={m.role === 'user'} />
              </Box>
            )}
            {m.text}
          </Box>
        ))}
        {busy && (
          <HStack gap="2" fontSize="sm" color="fg.muted">
            <Spinner size="xs" /> Working on the draft…
          </HStack>
        )}
        <div ref={end} />
      </Stack>

      {!locked && (
        <HStack gap="1.5" flexWrap="wrap">
          {SUGGESTED_PROMPTS.map((p) => (
            <Button
              key={p}
              size="2xs"
              variant="outline"
              borderRadius="full"
              onClick={() => submit(p)}
              disabled={busy}
            >
              {p}
            </Button>
          ))}
        </HStack>
      )}

      {quote && !locked && <QuoteBlock quote={quote} onRemove={() => onQuoteChange(undefined)} />}

      <HStack
        as="form"
        gap="2"
        align="flex-end"
        onSubmit={(e) => {
          e.preventDefault()
          submit(text)
        }}
      >
        <Textarea
          ref={input}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              submit(text)
            }
          }}
          rows={2}
          autoresize
          maxH="8rem"
          placeholder={
            locked
              ? 'Report is signed and locked'
              : quote
                ? 'What should change? e.g. Remove this, Why?'
                : 'e.g. Make the summary shorter'
          }
          disabled={locked}
          bg="bg.panel"
          aria-label="Message the assistant"
        />
        <IconButton
          type="submit"
          aria-label="Send"
          colorPalette="brand"
          disabled={locked || busy || !text.trim()}
        >
          <Send />
        </IconButton>
      </HStack>
    </Stack>
  )
}
