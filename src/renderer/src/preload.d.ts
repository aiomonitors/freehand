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
    }
  }
}

export {}
