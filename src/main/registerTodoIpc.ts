import { ipcMain } from 'electron'
import { z } from 'zod'

import { TODO_EXTRACT_CHANNEL } from '../shared/ipcChannels'
import type { ExtractTodosRequest } from '../shared/todos'
import { extractTodosFromDraft } from './todoExtraction'

const extractTodosRequestSchema = z.object({
  draftText: z.string(),
})

function getSafeErrorMessage(error: unknown): string {
  if (error instanceof z.ZodError) {
    return 'Invalid TODO extraction request.'
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  return 'Todo extraction failed.'
}

export function registerTodoIpc(): void {
  ipcMain.handle(TODO_EXTRACT_CHANNEL, async (_event, request: unknown) => {
    try {
      const parsedRequest: ExtractTodosRequest =
        extractTodosRequestSchema.parse(request)

      return await extractTodosFromDraft(parsedRequest.draftText)
    } catch (error) {
      throw new Error(getSafeErrorMessage(error), { cause: error })
    }
  })
}
