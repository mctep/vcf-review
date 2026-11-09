import type { ChatQuote } from '../domain/types'
import { agentReplyFor, replacePassage } from './agentReplies'

const summary = (text: string): ChatQuote => ({ text, section: 'summary', sectionTitle: 'Summary' })

describe('agentReplyFor with a quote', () => {
  const current = 'EGFR L858R predicts sensitivity to osimertinib. TP53 R273H is also present.'

  it('removes the quoted passage from its section', () => {
    const reply = agentReplyFor('Remove this', summary('TP53 R273H is also present.'))
    expect(reply.section).toBe('summary')
    expect(reply.apply?.(current)).toBe('EGFR L858R predicts sensitivity to osimertinib.')
  })

  it('explains without editing', () => {
    const reply = agentReplyFor('Why?', summary('EGFR L858R'))
    expect(reply.section).toBeUndefined()
    expect(reply.text).toMatch(/drafted from the classifications/)
  })

  it('does not edit generated tables', () => {
    const reply = agentReplyFor('delete', { text: 'BRAF', sectionTitle: 'Clinically significant variants' })
    expect(reply.apply).toBeUndefined()
    expect(reply.text).toMatch(/Variants tab/)
  })

  it('falls back to the general rules', () => {
    expect(agentReplyFor('Add clinical trial options', summary('EGFR')).section).toBe('recommendations')
  })
})

describe('replacePassage', () => {
  it('tolerates whitespace differences from the rendered page', () => {
    expect(replacePassage('A first line.\n• Second  item.', 'first line. • Second item.', '')).toBe('A')
    expect(replacePassage('abc', 'xyz', '')).toBeNull()
  })
})
