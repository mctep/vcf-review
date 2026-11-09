import type { ChatQuote, ReportSectionId } from '../domain/types'

export interface AgentReply {
  text: string
  /** Section to overwrite and highlight in the report. */
  section?: ReportSectionId
  /** Builds the new section text from the current one. */
  apply?: (current: string) => string
}

interface Rule {
  match: RegExp
  reply: AgentReply
}

/** Canned assistant behaviour for the report chat (no real model in this prototype). */
const RULES: Rule[] = [
  {
    match: /short|concise|brief|condense/i,
    reply: {
      text: 'I condensed the clinical summary to the two most decision-relevant findings.',
      section: 'summary',
      apply: (current) => {
        const sentences = current.split(/(?<=\.)\s+/).filter(Boolean)
        return sentences.slice(0, 2).join(' ')
      },
    },
  },
  {
    match: /trial|study|studies/i,
    reply: {
      text: 'I added a clinical-trial note to the recommendations. Trial matching uses a synthetic registry in this prototype.',
      section: 'recommendations',
      apply: (current) =>
        `${current}\n• Consider enrolment in a clinical trial for CDKN2A-deleted or PIK3CA-mutant solid tumors (example registry entry).`,
    },
  },
  {
    match: /germline|counsel/i,
    reply: {
      text: 'I made the germline recommendation more explicit in the recommendations section.',
      section: 'recommendations',
      apply: (current) =>
        `${current}\n• The BRCA2 frameshift should be confirmed on a germline sample (blood or saliva) before any familial cascade testing.`,
    },
  },
  {
    match: /patient|plain|lay/i,
    reply: {
      text: 'I rewrote the summary in plain language for the clinician-patient discussion.',
      section: 'summary',
      apply: () =>
        'The tumor carries a change in the EGFR gene that makes it likely to respond to targeted tablets such as osimertinib. ' +
        'A change in BRCA2 may be inherited, so a separate blood test and genetic counselling are recommended.',
    },
  },
]

export const SUGGESTED_PROMPTS = [
  'Make the summary shorter',
  'Add clinical trial options',
  'Emphasise germline follow-up',
  'Rewrite the summary in plain language',
]

/** Collapses whitespace so a passage copied from the rendered page matches the section source text. */
const squash = (s: string) => s.replace(/\s+/g, ' ').trim()

/** Replaces `passage` in `text`, tolerating whitespace differences. Returns `null` when not found. */
export function replacePassage(text: string, passage: string, replacement: string): string | null {
  if (text.includes(passage)) return tidy(text.replace(passage, replacement))
  const flat = squash(text)
  const needle = squash(passage)
  if (!needle || !flat.includes(needle)) return null
  // Fall back to the whitespace-normalised text (line breaks inside the section are lost).
  return tidy(flat.replace(needle, replacement))
}

const tidy = (s: string) =>
  s
    .split('\n')
    .map((line) =>
      line
        .replace(/\s{2,}/g, ' ')
        .replace(/\s+([.,;:])/g, '$1')
        .trim(),
    )
    .filter((line) => line !== '•')
    .join('\n')

const short = (s: string) => {
  const flat = squash(s)
  return flat.length > 60 ? `${flat.slice(0, 57)}…` : flat
}

/** Behaviour when the user quoted a passage. Falls through to the general rules when nothing specific applies. */
function quotedReply(prompt: string, quote: ChatQuote): AgentReply | undefined {
  const where = quote.sectionTitle.toLowerCase()
  if (/remove|delete|drop|cut/i.test(prompt)) {
    if (!quote.section)
      return {
        text: `“${short(quote.text)}” is part of ${where}, which is generated from the variant selection. Exclude the variant on the Variants tab to remove it from the report.`,
      }
    return {
      text: `I removed “${short(quote.text)}” from the ${where} section.`,
      section: quote.section,
      apply: (current) => replacePassage(current, quote.text, '') ?? current,
    }
  }
  if (/why|source|evidence|explain|based on|where/i.test(prompt)) {
    return {
      text:
        `“${short(quote.text)}” in ${where} is drafted from the classifications and evidence of the selected variants. ` +
        'The supporting sources are cited inline on the Variants tab (Traceability) and in View analysis details.',
    }
  }
  if (/short|concise|brief|condense/i.test(prompt) && quote.section) {
    return {
      text: `I shortened the quoted passage in the ${where} section to its first clause.`,
      section: quote.section,
      apply: (current) => {
        const first = squash(quote.text)
          .split(/[,;(—]/)[0]
          .trim()
          .replace(/\.?$/, '.')
        return replacePassage(current, quote.text, first) ?? current
      },
    }
  }
  return undefined
}

export function agentReplyFor(prompt: string, quote?: ChatQuote): AgentReply {
  const quoted = quote && quotedReply(prompt, quote)
  if (quoted) return quoted
  const rule = RULES.find((r) => r.match.test(prompt))
  if (rule) return rule.reply
  return {
    text: quote
      ? `Noted — about “${short(quote.text)}”. In the full product I would apply this instruction to the quoted passage and show the diff. In this prototype try “remove this”, “make it shorter” or “why?”.`
      : 'Noted. In the full product I would apply this instruction to the draft and show the diff. ' +
        'In this prototype try one of the suggested prompts.',
  }
}
