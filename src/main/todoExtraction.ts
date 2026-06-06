import { Agent } from '@mastra/core/agent'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'

import type { ExtractTodosResponse } from '../shared/todos'
import {
  assertOpenRouterApiKey,
  getOpenRouterModel,
  isStructuredOutputCompatibilityError,
} from './openRouterExtraction'

const MAX_TODOS = 8

const extractedTodoSchema = z.object({
  text: z.string().trim().min(1).max(180),
})

const extractionSchema = z.object({
  todos: z.array(extractedTodoSchema).max(MAX_TODOS),
})

type TodoExtraction = z.infer<typeof extractionSchema>

function createTodoExtractionAgent(): Agent {
  return new Agent({
    id: 'todo-extraction-agent',
    name: 'Todo Extraction Agent',
    instructions: [
      'You extract TODO items from finalized writing drafts.',
      'Return explicit and clearly implied actionable tasks only.',
      'Do not include vague ideas, general observations, summaries, or tasks unsupported by the draft.',
      'Rank tasks by likely priority and usefulness to the writer.',
      `Return no more than ${MAX_TODOS} tasks.`,
      'Each task should be short, concrete, and phrased as an action.',
      'If the draft contains no clear actionable tasks, return an empty todos array.',
    ].join('\n'),
    model: getOpenRouterModel(),
  })
}

function buildExtractionPrompt(draftText: string): string {
  return [
    'Extract prioritized TODO items from this finalized draft.',
    '',
    'Draft:',
    '<draft>',
    draftText,
    '</draft>',
  ].join('\n')
}

function normalizeExtractionResult(
  result: TodoExtraction,
): ExtractTodosResponse {
  const todos = result.todos
    .slice(0, MAX_TODOS)
    .map((todo) => ({
      id: randomUUID(),
      text: todo.text.trim(),
    }))
    .filter((todo) => todo.text.length > 0)

  return { todos }
}

export async function extractTodosFromDraft(
  draftText: string,
): Promise<ExtractTodosResponse> {
  const trimmedDraftText = draftText.trim()

  if (!trimmedDraftText) {
    return { todos: [] }
  }

  assertOpenRouterApiKey()

  const agent = createTodoExtractionAgent()
  const prompt = buildExtractionPrompt(trimmedDraftText)

  try {
    const response = await agent.generate(prompt, {
      structuredOutput: {
        schema: extractionSchema,
        errorStrategy: 'strict',
      },
    })

    if (!response.object) {
      throw new Error('Todo extraction returned no structured output.')
    }

    return normalizeExtractionResult(extractionSchema.parse(response.object))
  } catch (error) {
    if (!isStructuredOutputCompatibilityError(error)) {
      throw error
    }

    const response = await agent.generate(prompt, {
      structuredOutput: {
        schema: extractionSchema,
        errorStrategy: 'strict',
        jsonPromptInjection: true,
      },
    })

    if (!response.object) {
      throw new Error('Todo extraction returned no structured output.', {
        cause: error,
      })
    }

    return normalizeExtractionResult(extractionSchema.parse(response.object))
  }
}
