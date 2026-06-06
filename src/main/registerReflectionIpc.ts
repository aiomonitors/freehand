import { ipcMain } from 'electron'
import { z } from 'zod'

import {
  GOALS_EXTRACT_CHANNEL,
  REFLECTION_QUESTIONS_EXTRACT_CHANNEL,
} from '../shared/ipcChannels'
import type {
  ExtractGoalsRequest,
  ExtractReflectionQuestionsRequest,
} from '../shared/reflections'
import {
  extractGoalsFromDraft,
  extractReflectionQuestionsFromDraft,
} from './reflectionExtraction'

const extractGoalsRequestSchema = z.object({
  draftText: z.string(),
})

const extractReflectionQuestionsRequestSchema = z.object({
  draftText: z.string(),
})

function getSafeErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof z.ZodError) {
    return 'Invalid reflection extraction request.'
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  return fallback
}

export function registerReflectionIpc(): void {
  ipcMain.handle(GOALS_EXTRACT_CHANNEL, async (_event, request: unknown) => {
    try {
      const parsedRequest: ExtractGoalsRequest =
        extractGoalsRequestSchema.parse(request)

      return await extractGoalsFromDraft(parsedRequest.draftText)
    } catch (error) {
      throw new Error(getSafeErrorMessage(error, 'Goals extraction failed.'), {
        cause: error,
      })
    }
  })

  ipcMain.handle(
    REFLECTION_QUESTIONS_EXTRACT_CHANNEL,
    async (_event, request: unknown) => {
      try {
        const parsedRequest: ExtractReflectionQuestionsRequest =
          extractReflectionQuestionsRequestSchema.parse(request)

        return await extractReflectionQuestionsFromDraft(
          parsedRequest.draftText,
        )
      } catch (error) {
        throw new Error(
          getSafeErrorMessage(error, 'Reflective questions extraction failed.'),
          { cause: error },
        )
      }
    },
  )
}
