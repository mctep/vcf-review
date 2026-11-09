import { agentReplyFor, type AgentReply } from '../mocks/agentReplies'
import { delay } from './delay'

export type { AgentReply }

export interface InterpretationService {
  /** Sends an instruction to the report assistant. */
  chat(caseId: string, prompt: string): Promise<AgentReply>
}

export const mockInterpretation: InterpretationService = {
  async chat(_caseId, prompt) {
    await delay(900 + Math.random() * 600)
    return agentReplyFor(prompt)
  },
}
