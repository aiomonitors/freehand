import { useSortable } from '@dnd-kit/react/sortable'

import type { TodoItem } from './todoTypes'

type TodoLineItemProps = {
  todo: TodoItem
  onReject: (id: string) => void
  onToggleDone: (id: string) => void
}

type SortableTodoItemProps = TodoLineItemProps & {
  index: number
}

export function TodoLineItem({
  todo,
  onReject,
  onToggleDone,
}: TodoLineItemProps): React.JSX.Element {
  return (
    <div className="todo-line" data-completed={todo.completed || undefined}>
      <input
        type="checkbox"
        className="todo-line__checkbox"
        checked={todo.completed}
        aria-label={
          todo.completed ? `Mark ${todo.text} undone` : `Mark ${todo.text} done`
        }
        onChange={() => onToggleDone(todo.id)}
      />
      <span className="todo-line__text">{todo.text}</span>
      <button
        type="button"
        className="todo-line__reject"
        aria-label={`Reject ${todo.text}`}
        title="Reject"
        onClick={() => onReject(todo.id)}
      >
        ×
      </button>
    </div>
  )
}

export function SortableTodoItem({
  todo,
  index,
  onReject,
  onToggleDone,
}: SortableTodoItemProps): React.JSX.Element {
  const { ref, isDragging, isDropTarget } = useSortable({
    id: todo.id,
    index,
    group: 'active-todos',
    data: { index },
  })

  return (
    <div
      ref={ref}
      className="todo-line"
      data-sortable="true"
      data-dragging={isDragging || undefined}
      data-drop-target={isDropTarget || undefined}
      title="Drag to reprioritize"
    >
      <input
        type="checkbox"
        className="todo-line__checkbox"
        checked={false}
        aria-label={`Mark ${todo.text} done`}
        onChange={() => onToggleDone(todo.id)}
      />
      <span className="todo-line__text">{todo.text}</span>
      <button
        type="button"
        className="todo-line__reject"
        aria-label={`Reject ${todo.text}`}
        title="Reject"
        onClick={() => onReject(todo.id)}
      >
        ×
      </button>
    </div>
  )
}
