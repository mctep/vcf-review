import { Box, Button, CloseButton, HStack, Portal, Text } from '@chakra-ui/react'
import { Quote } from 'lucide-react'
import { useEffect, useState, type RefObject } from 'react'
import type { ChatQuote, ReportSectionId } from '../../domain/types'

/** Longest passage that can be quoted; longer selections are trimmed with an ellipsis. */
const MAX_QUOTE_CHARS = 600

interface Pending {
  quote: ChatQuote
  /** Viewport position of the selection end. */
  top: number
  left: number
}

/** Reads the current selection if it lies inside `container`. */
function readSelection(container: HTMLElement): Pending | null {
  const sel = window.getSelection()
  if (!sel || sel.isCollapsed || sel.rangeCount === 0) return null
  const range = sel.getRangeAt(0)
  if (!container.contains(range.commonAncestorContainer)) return null
  const raw = sel.toString().trim()
  if (raw.length < 3) return null

  const anchor =
    range.commonAncestorContainer instanceof Element
      ? range.commonAncestorContainer
      : range.commonAncestorContainer.parentElement
  const sectionEl = anchor?.closest<HTMLElement>('[data-section-title]')
  const text = raw.length > MAX_QUOTE_CHARS ? `${raw.slice(0, MAX_QUOTE_CHARS - 1)}…` : raw

  const rects = range.getClientRects()
  const last = rects[rects.length - 1] ?? range.getBoundingClientRect()
  return {
    quote: {
      text,
      section: (sectionEl?.dataset.section as ReportSectionId | undefined) || undefined,
      sectionTitle: sectionEl?.dataset.sectionTitle ?? 'Report',
    },
    top: last.bottom + 6,
    left: Math.min(last.right, window.innerWidth - 160),
  }
}

/**
 * Floating "Quote in chat" button for text selected inside `container` (the report document).
 * Mark quotable regions with `data-section-title` (and `data-section` for editable sections).
 */
export function SelectionQuoteButton({
  container,
  disabled,
  onQuote,
}: {
  container: RefObject<HTMLElement | null>
  disabled?: boolean
  onQuote: (quote: ChatQuote) => void
}) {
  const [pending, setPending] = useState<Pending | null>(null)

  useEffect(() => {
    if (disabled) return
    const update = () => {
      const el = container.current
      setPending(el ? readSelection(el) : null)
    }
    const clearIfCollapsed = () => {
      if (window.getSelection()?.isCollapsed) setPending(null)
    }
    const hide = () => setPending(null)
    document.addEventListener('mouseup', update)
    document.addEventListener('keyup', update)
    document.addEventListener('selectionchange', clearIfCollapsed)
    window.addEventListener('scroll', hide, true)
    window.addEventListener('resize', hide)
    return () => {
      document.removeEventListener('mouseup', update)
      document.removeEventListener('keyup', update)
      document.removeEventListener('selectionchange', clearIfCollapsed)
      window.removeEventListener('scroll', hide, true)
      window.removeEventListener('resize', hide)
    }
  }, [container, disabled])

  if (!pending || disabled) return null

  return (
    <Portal>
      <Button
        size="xs"
        colorPalette="brand"
        position="fixed"
        top={`${pending.top}px`}
        left={`${pending.left}px`}
        zIndex="popover"
        boxShadow="lg"
        // Keep the selection while clicking.
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => {
          onQuote(pending.quote)
          window.getSelection()?.removeAllRanges()
          setPending(null)
        }}
      >
        <Quote /> Quote in chat
      </Button>
    </Portal>
  )
}

/** Quoted passage: above the chat input (with a remove button) and inside sent messages. */
export function QuoteBlock({
  quote,
  onRemove,
  inverted,
}: {
  quote: ChatQuote
  onRemove?: () => void
  /** On a brand-colored user bubble. */
  inverted?: boolean
}) {
  return (
    <HStack
      align="flex-start"
      gap="2"
      borderStartWidth="3px"
      borderColor={inverted ? 'brand.contrast/60' : 'accent.solid'}
      bg={inverted ? 'brand.contrast/12' : 'bg.panel'}
      borderRadius="l1"
      ps="2.5"
      pe={onRemove ? '1' : '2.5'}
      py="1.5"
      w="full"
    >
      <Box flex="1" minW="0">
        <Text fontSize="2xs" fontWeight="700" textTransform="uppercase" letterSpacing="wider" opacity={0.75}>
          {quote.sectionTitle}
        </Text>
        <Text fontSize="xs" lineClamp={3} fontStyle="italic">
          {quote.text}
        </Text>
      </Box>
      {onRemove && <CloseButton size="2xs" aria-label="Remove quote" onClick={onRemove} />}
    </HStack>
  )
}
