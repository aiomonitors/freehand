import type { ExtractedTodo } from '../../../shared/todos'

export type TodoItem = ExtractedTodo & {
  completed: boolean
  lastActiveIndex?: number
}

export type ExtractionStatus = 'idle' | 'loading' | 'ready' | 'error'
