import { DragDropProvider } from '@dnd-kit/react'
import type { DragEndEvent } from '@dnd-kit/react'

import type {
  ExtractedGoal,
  ExtractedReflectionQuestion,
} from '../../../shared/reflections'
import { SortableTodoItem, TodoLineItem } from './SortableTodoItem'
import type { ExtractionStatus, TodoItem } from './todoTypes'

type TodoSidebarProps = {
  status: ExtractionStatus
  error: string | null
  activeTodos: TodoItem[]
  completedTodos: TodoItem[]
  goalsStatus: ExtractionStatus
  goalsError: string | null
  goals: ExtractedGoal[]
  questionsStatus: ExtractionStatus
  questionsError: string | null
  questions: ExtractedReflectionQuestion[]
  onRetry: () => void
  onRetryGoals: () => void
  onRetryQuestions: () => void
  onReject: (id: string) => void
  onToggleDone: (id: string) => void
  onReorderActive: (sourceIndex: number, targetIndex: number) => void
}

type ExtractionSectionProps = {
  title: string
  status: ExtractionStatus
  error: string | null
  loadingMessage: string
  emptyMessage: string
  errorMessage: string
  hasContent: boolean
  onRetry: () => void
  children: React.ReactNode
}

function readSortableIndex(value: unknown): number | null {
  if (
    typeof value === 'object' &&
    value !== null &&
    'index' in value &&
    typeof value.index === 'number'
  ) {
    return value.index
  }

  return null
}

function ExtractionSection({
  title,
  status,
  error,
  loadingMessage,
  emptyMessage,
  errorMessage,
  hasContent,
  onRetry,
  children,
}: ExtractionSectionProps): React.JSX.Element {
  return (
    <section className="finalized-section" aria-label={title}>
      <h3 className="finalized-section__title">{title}</h3>

      {status === 'loading' ? (
        <div className="todo-sidebar__state" role="status">
          {loadingMessage}
        </div>
      ) : null}

      {status === 'error' ? (
        <div className="todo-sidebar__state todo-sidebar__state--error">
          <p>{errorMessage}</p>
          {error ? <p className="todo-sidebar__error">{error}</p> : null}
          <button
            type="button"
            className="todo-sidebar__retry"
            onClick={onRetry}
          >
            Retry
          </button>
        </div>
      ) : null}

      {status === 'ready' && !hasContent ? (
        <div className="todo-sidebar__state">{emptyMessage}</div>
      ) : null}

      {status === 'ready' && hasContent ? children : null}
    </section>
  )
}

export function TodoSidebar({
  status,
  error,
  activeTodos,
  completedTodos,
  goalsStatus,
  goalsError,
  goals,
  questionsStatus,
  questionsError,
  questions,
  onRetry,
  onRetryGoals,
  onRetryQuestions,
  onReject,
  onToggleDone,
  onReorderActive,
}: TodoSidebarProps): React.JSX.Element {
  const hasTodos = activeTodos.length > 0 || completedTodos.length > 0

  function handleDragEnd(event: DragEndEvent): void {
    if (event.canceled) {
      return
    }

    const sourceIndex = readSortableIndex(event.operation.source?.data)
    const targetIndex = readSortableIndex(event.operation.target?.data)

    if (sourceIndex === null || targetIndex === null) {
      return
    }

    onReorderActive(sourceIndex, targetIndex)
  }

  return (
    <aside className="todo-sidebar" aria-label="Finalized outputs">
      <header className="todo-sidebar__header">
        <p className="todo-sidebar__eyebrow">Finalized</p>
        <h2>Outputs</h2>
      </header>

      <ExtractionSection
        title="TODOs"
        status={status}
        error={error}
        loadingMessage="Extracting TODOs…"
        emptyMessage="No clear TODOs found."
        errorMessage="Could not extract TODOs."
        hasContent={hasTodos}
        onRetry={onRetry}
      >
        <div className="todo-list-wrap">
          {activeTodos.length > 0 ? (
            <DragDropProvider onDragEnd={handleDragEnd}>
              <div className="todo-list" aria-label="Active TODOs">
                {activeTodos.map((todo, index) => (
                  <SortableTodoItem
                    key={todo.id}
                    todo={todo}
                    index={index}
                    onReject={onReject}
                    onToggleDone={onToggleDone}
                  />
                ))}
              </div>
            </DragDropProvider>
          ) : null}

          {completedTodos.length > 0 ? (
            <section className="todo-completed" aria-label="Completed TODOs">
              <h3>Done</h3>
              <div className="todo-list">
                {completedTodos.map((todo) => (
                  <TodoLineItem
                    key={todo.id}
                    todo={todo}
                    onReject={onReject}
                    onToggleDone={onToggleDone}
                  />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </ExtractionSection>

      <ExtractionSection
        title="Goals"
        status={goalsStatus}
        error={goalsError}
        loadingMessage="Extracting goals…"
        emptyMessage="No clear goals found."
        errorMessage="Could not extract goals."
        hasContent={goals.length > 0}
        onRetry={onRetryGoals}
      >
        <div className="reflection-list">
          {goals.map((goal) => (
            <article className="goal-card" key={goal.id}>
              <p className="goal-card__text">{goal.text}</p>
              <p className="goal-card__rationale">{goal.rationale}</p>
            </article>
          ))}
        </div>
      </ExtractionSection>

      <ExtractionSection
        title="Reflective Questions"
        status={questionsStatus}
        error={questionsError}
        loadingMessage="Extracting reflective questions…"
        emptyMessage="No reflective questions found."
        errorMessage="Could not extract reflective questions."
        hasContent={questions.length > 0}
        onRetry={onRetryQuestions}
      >
        <div className="reflection-list">
          {questions.map((question) => (
            <p className="question-card" key={question.id}>
              {question.text}
            </p>
          ))}
        </div>
      </ExtractionSection>
    </aside>
  )
}
