import type {
  ExtractGoalsRequest,
  ExtractGoalsResponse,
  ExtractReflectionQuestionsRequest,
  ExtractReflectionQuestionsResponse,
} from '../../shared/reflections'
import type {
  ExtractTodosRequest,
  ExtractTodosResponse,
} from '../../shared/todos'

declare global {
  interface Window {
    freehand: {
      extractTodos: (
        request: ExtractTodosRequest,
      ) => Promise<ExtractTodosResponse>
      extractGoals: (
        request: ExtractGoalsRequest,
      ) => Promise<ExtractGoalsResponse>
      extractReflectionQuestions: (
        request: ExtractReflectionQuestionsRequest,
      ) => Promise<ExtractReflectionQuestionsResponse>
    }
  }
}

export {}
