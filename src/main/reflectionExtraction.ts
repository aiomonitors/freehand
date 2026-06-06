import { Agent } from '@mastra/core/agent'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'

import type {
  ExtractGoalsResponse,
  ExtractReflectionQuestionsResponse,
} from '../shared/reflections'
import {
  assertOpenRouterApiKey,
  getOpenRouterModel,
  isStructuredOutputCompatibilityError,
} from './openRouterExtraction'

const MAX_GOALS = 3
const MAX_REFLECTION_QUESTIONS = 3

const extractedGoalSchema = z.object({
  text: z.string().trim().min(1).max(180),
  rationale: z.string().trim().min(1).max(260),
})

const goalsExtractionSchema = z.object({
  goals: z.array(extractedGoalSchema).max(MAX_GOALS),
})

const extractedReflectionQuestionSchema = z.object({
  text: z.string().trim().min(1).max(220),
})

const reflectionQuestionsExtractionSchema = z.object({
  questions: z
    .array(extractedReflectionQuestionSchema)
    .max(MAX_REFLECTION_QUESTIONS),
})

type GoalsExtraction = z.infer<typeof goalsExtractionSchema>
type ReflectionQuestionsExtraction = z.infer<
  typeof reflectionQuestionsExtractionSchema
>

function createGoalsExtractionAgent(): Agent {
  return new Agent({
    id: 'goals-extraction-agent',
    name: 'Goals Extraction Agent',
    instructions: [
      'You infer goals from finalized writing drafts.',
      'Goals are what the writer appears to be trying to accomplish, decide, communicate, understand, or explore.',
      'Return only goals that are clearly supported by the draft.',
      'Do not return TODOs, action items, advice, summaries, or vague themes.',
      `Return no more than ${MAX_GOALS} goals.`,
      'Each goal should be concise and specific.',
      'Each rationale should briefly explain why the draft supports that goal.',
      'If the draft does not contain enough signal to infer clear goals, return an empty goals array.',
    ].join('\n'),
    model: getOpenRouterModel(),
  })
}

function createReflectionQuestionsAgent(): Agent {
  return new Agent({
    id: 'reflection-questions-extraction-agent',
    name: 'Reflective Questions Extraction Agent',
    instructions: [
      'You create reflective follow-up questions from finalized writing drafts.',
      'Questions should help the writer think more deeply about the draft, their assumptions, tensions, feelings, tradeoffs, or next understanding.',
      'Optimize for reflection, not implementation planning, task extraction, or clarification for another person.',
      'Do not phrase questions as TODOs or action items.',
      'Return only questions that are grounded in the draft.',
      `Return no more than ${MAX_REFLECTION_QUESTIONS} questions.`,
      'Each question should be concise, open-ended, and useful to reflect on after finalizing.',
      'If the draft does not contain enough signal for useful reflection, return an empty questions array.',
    ].join('\n'),
    model: getOpenRouterModel(),
  })
}

function buildGoalsPrompt(draftText: string): string {
  return [
    'Extract inferred goals from this finalized draft.',
    '',
    'Draft:',
    '<draft>',
    draftText,
    '</draft>',
  ].join('\n')
}

function buildReflectionQuestionsPrompt(draftText: string): string {
  return [
    'Extract reflective follow-up questions from this finalized draft.',
    '',
    'Draft:',
    '<draft>',
    draftText,
    '</draft>',
  ].join('\n')
}

function normalizeGoalsResult(result: GoalsExtraction): ExtractGoalsResponse {
  const goals = result.goals
    .slice(0, MAX_GOALS)
    .map((goal) => ({
      id: randomUUID(),
      text: goal.text.trim(),
      rationale: goal.rationale.trim(),
    }))
    .filter((goal) => goal.text.length > 0 && goal.rationale.length > 0)

  return { goals }
}

function normalizeReflectionQuestionsResult(
  result: ReflectionQuestionsExtraction,
): ExtractReflectionQuestionsResponse {
  const questions = result.questions
    .slice(0, MAX_REFLECTION_QUESTIONS)
    .map((question) => ({
      id: randomUUID(),
      text: question.text.trim(),
    }))
    .filter((question) => question.text.length > 0)

  return { questions }
}

export async function extractGoalsFromDraft(
  draftText: string,
): Promise<ExtractGoalsResponse> {
  const trimmedDraftText = draftText.trim()

  if (!trimmedDraftText) {
    return { goals: [] }
  }

  assertOpenRouterApiKey()

  const agent = createGoalsExtractionAgent()
  const prompt = buildGoalsPrompt(trimmedDraftText)

  try {
    const response = await agent.generate(prompt, {
      structuredOutput: {
        schema: goalsExtractionSchema,
        errorStrategy: 'strict',
      },
    })

    if (!response.object) {
      throw new Error('Goals extraction returned no structured output.')
    }

    return normalizeGoalsResult(goalsExtractionSchema.parse(response.object))
  } catch (error) {
    if (!isStructuredOutputCompatibilityError(error)) {
      throw error
    }

    const response = await agent.generate(prompt, {
      structuredOutput: {
        schema: goalsExtractionSchema,
        errorStrategy: 'strict',
        jsonPromptInjection: true,
      },
    })

    if (!response.object) {
      throw new Error('Goals extraction returned no structured output.', {
        cause: error,
      })
    }

    return normalizeGoalsResult(goalsExtractionSchema.parse(response.object))
  }
}

export async function extractReflectionQuestionsFromDraft(
  draftText: string,
): Promise<ExtractReflectionQuestionsResponse> {
  const trimmedDraftText = draftText.trim()

  if (!trimmedDraftText) {
    return { questions: [] }
  }

  assertOpenRouterApiKey()

  const agent = createReflectionQuestionsAgent()
  const prompt = buildReflectionQuestionsPrompt(trimmedDraftText)

  try {
    const response = await agent.generate(prompt, {
      structuredOutput: {
        schema: reflectionQuestionsExtractionSchema,
        errorStrategy: 'strict',
      },
    })

    if (!response.object) {
      throw new Error(
        'Reflective questions extraction returned no structured output.',
      )
    }

    return normalizeReflectionQuestionsResult(
      reflectionQuestionsExtractionSchema.parse(response.object),
    )
  } catch (error) {
    if (!isStructuredOutputCompatibilityError(error)) {
      throw error
    }

    const response = await agent.generate(prompt, {
      structuredOutput: {
        schema: reflectionQuestionsExtractionSchema,
        errorStrategy: 'strict',
        jsonPromptInjection: true,
      },
    })

    if (!response.object) {
      throw new Error(
        'Reflective questions extraction returned no structured output.',
        {
          cause: error,
        },
      )
    }

    return normalizeReflectionQuestionsResult(
      reflectionQuestionsExtractionSchema.parse(response.object),
    )
  }
}
