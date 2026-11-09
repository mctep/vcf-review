import type { ChatQuote } from '../domain/types'
import { agentReplyFor, type AgentReply } from '../mocks/agentReplies'
import { delay } from './delay'

export type { AgentReply }

export interface InterpretationService {
  /** Sends an instruction to the report assistant, optionally about a quoted passage of the report. */
  chat(caseId: string, prompt: string, quote?: ChatQuote): Promise<AgentReply>
}

export const mockInterpretation: InterpretationService = {
  async chat(_caseId, prompt, quote) {
    await delay(900 + Math.random() * 600)
    return agentReplyFor(prompt, quote)
  },
}
