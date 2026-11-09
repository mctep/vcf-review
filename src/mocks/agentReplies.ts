import type { ReportSectionId } from '../domain/types'

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

export function agentReplyFor(prompt: string): AgentReply {
  const rule = RULES.find((r) => r.match.test(prompt))
  if (rule) return rule.reply
  return {
    text:
      'Noted. In the full product I would apply this instruction to the draft and show the diff. ' +
      'In this prototype try one of the suggested prompts.',
  }
}
