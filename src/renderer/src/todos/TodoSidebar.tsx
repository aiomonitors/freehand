import { DragDropProvider } from '@dnd-kit/react'
import type { DragEndEvent } from '@dnd-kit/react'

import { SortableTodoItem, TodoLineItem } from './SortableTodoItem'
import type { ExtractionStatus, TodoItem } from './todoTypes'

type TodoSidebarProps = {
  status: ExtractionStatus
  error: string | null
  activeTodos: TodoItem[]
  completedTodos: TodoItem[]
  onRetry: () => void
  onReject: (id: string) => void
  onToggleDone: (id: string) => void
  onReorderActive: (sourceIndex: number, targetIndex: number) => void
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

export function TodoSidebar({
  status,
  error,
  activeTodos,
  completedTodos,
  onRetry,
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
    <aside className="todo-sidebar" aria-label="Extracted TODOs">
      <header className="todo-sidebar__header">
        <p className="todo-sidebar__eyebrow">Finalized</p>
        <h2>TODOs</h2>
      </header>

      {status === 'loading' ? (
        <div className="todo-sidebar__state" role="status">
          Extracting TODOs…
        </div>
      ) : null}

      {status === 'error' ? (
        <div className="todo-sidebar__state todo-sidebar__state--error">
          <p>Could not extract TODOs.</p>
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

      {status === 'ready' && !hasTodos ? (
        <div className="todo-sidebar__state">No clear TODOs found.</div>
      ) : null}

      {status === 'ready' && hasTodos ? (
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
      ) : null}
    </aside>
  )
}
