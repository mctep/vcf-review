import { chakra, useRecipe } from '@chakra-ui/react'
import { ExternalLink } from 'lucide-react'
import type { Citation } from '../domain/types'

/** Inline evidence reference (recipe: `citation`). Opens the source in a new tab. */
export function CitationLink({ citation }: { citation: Citation }) {
  const recipe = useRecipe({ key: 'citation' })
  return (
    <chakra.a
      css={recipe()}
      href={citation.url}
      target="_blank"
      rel="noreferrer noopener"
      title={`${citation.source}${citation.version ? ` · ${citation.version}` : ''} · accessed ${citation.accessed}`}
    >
      {citation.label}
      <ExternalLink aria-hidden />
    </chakra.a>
  )
}
