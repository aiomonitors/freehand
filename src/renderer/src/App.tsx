import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Editor } from '@tiptap/core'

import type { ExtractedTodo } from '../../shared/todos'
import { ModeTimerPill } from './ModeTimerPill'
import { WritingEditor } from './editor/WritingEditor'
import { ScrapConfirmModal } from './editor/ScrapConfirmModal'
import { Toolbar } from './editor/Toolbar'
import { TodoSidebar } from './todos/TodoSidebar'
import { reorderIds } from './todos/todoReorder'
import type { ExtractionStatus, TodoItem } from './todos/todoTypes'
import { canSelectWritingMode } from './writingModes'
import type { WritingMode, WritingModeSelection } from './writingModes'

const FONTS = [
  { label: 'Inter', cssFamily: 'Inter, system-ui, sans-serif' },
  { label: 'Space Grotesk', cssFamily: 'Space Grotesk, system-ui, sans-serif' },
  { label: 'Geist', cssFamily: 'Geist, system-ui, sans-serif' },
]

const FONT_SIZES = [
  { label: 'Size S', cssSize: 'clamp(1.1rem, 1.55vw, 1.75rem)' },
  { label: 'Size M', cssSize: 'clamp(1.25rem, 1.8vw, 2rem)' },
  { label: 'Size L', cssSize: 'clamp(1.45rem, 2.15vw, 2.35rem)' },
]

function isCommandOrControl(event: KeyboardEvent): boolean {
  return event.metaKey || event.ctrlKey
}

function createClientRequestId(): string {
  return globalThis.crypto?.randomUUID() ?? `${Date.now()}-${Math.random()}`
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  return 'Todo extraction failed.'
}

function buildTodoMap(todos: ExtractedTodo[]): Record<string, TodoItem> {
  return todos.reduce<Record<string, TodoItem>>((todoMap, todo) => {
    todoMap[todo.id] = {
      ...todo,
      completed: false,
    }

    return todoMap
  }, {})
}

export default function App(): React.JSX.Element {
  const [fontIndex, setFontIndex] = useState(0)
  const [fontSizeIndex, setFontSizeIndex] = useState(1)
  const [isScrapConfirmOpen, setIsScrapConfirmOpen] = useState(false)
  const [editor, setEditor] = useState<Editor | null>(null)
  const [hasContent, setHasContent] = useState(false)
  const [timerStartedAt, setTimerStartedAt] = useState<number | null>(null)
  const [writingMode, setWritingMode] = useState<WritingModeSelection>(null)
  const writingModeRef = useRef<WritingModeSelection>(null)
  const [isFinalized, setIsFinalized] = useState(false)
  const [finalizedDraftText, setFinalizedDraftText] = useState<string | null>(
    null,
  )
  const [extractionStatus, setExtractionStatus] =
    useState<ExtractionStatus>('idle')
  const [extractionError, setExtractionError] = useState<string | null>(null)
  const [todosById, setTodosById] = useState<Record<string, TodoItem>>({})
  const [activeTodoIds, setActiveTodoIds] = useState<string[]>([])
  const [completedTodoIds, setCompletedTodoIds] = useState<string[]>([])
  const [, setEditorRenderTick] = useState(0)
  const activeExtractionIdRef = useRef<string | null>(null)

  const selectedFont = FONTS[fontIndex]
  const selectedFontSize = FONT_SIZES[fontSizeIndex]

  useEffect(() => {
    writingModeRef.current = writingMode
  }, [writingMode])

  const selectWritingMode = useCallback(
    (nextMode: WritingMode) => {
      if (!canSelectWritingMode(writingModeRef.current, nextMode)) {
        return
      }

      writingModeRef.current = nextMode
      setWritingMode(nextMode)

      window.requestAnimationFrame(() => {
        editor?.commands.focus('end')
      })
    },
    [editor],
  )

  const autoSelectFreewrite = useCallback(() => {
    if (writingModeRef.current !== null) {
      return
    }

    writingModeRef.current = 'freewrite'
    setWritingMode('freewrite')
  }, [])

  const getWritingMode = useCallback(() => writingModeRef.current, [])

  const selectFreewrite = useCallback(() => {
    selectWritingMode('freewrite')
  }, [selectWritingMode])

  const selectEdit = useCallback(() => {
    selectWritingMode('edit')
  }, [selectWritingMode])

  const cycleFont = useCallback(() => {
    setFontIndex((current) => (current + 1) % FONTS.length)
    editor?.commands.focus('end')
  }, [editor])

  const cycleFontSize = useCallback(() => {
    setFontSizeIndex((current) => (current + 1) % FONT_SIZES.length)
    editor?.commands.focus('end')
  }, [editor])

  const startTodoExtraction = useCallback((draftText: string) => {
    const extractionId = createClientRequestId()
    activeExtractionIdRef.current = extractionId
    setExtractionStatus('loading')
    setExtractionError(null)

    void window.freehand
      .extractTodos({ draftText })
      .then((response) => {
        if (activeExtractionIdRef.current !== extractionId) {
          return
        }

        setTodosById(buildTodoMap(response.todos))
        setActiveTodoIds(response.todos.map((todo) => todo.id))
        setCompletedTodoIds([])
        setExtractionStatus('ready')
      })
      .catch((error: unknown) => {
        if (activeExtractionIdRef.current !== extractionId) {
          return
        }

        setExtractionError(getErrorMessage(error))
        setExtractionStatus('error')
      })
  }, [])

  const scrapDraft = useCallback(() => {
    activeExtractionIdRef.current = null
    editor?.setEditable(true)
    editor?.commands.clearContent()
    setHasContent(false)
    setTimerStartedAt(null)
    writingModeRef.current = null
    setWritingMode(null)
    setIsFinalized(false)
    setFinalizedDraftText(null)
    setExtractionStatus('idle')
    setExtractionError(null)
    setTodosById({})
    setActiveTodoIds([])
    setCompletedTodoIds([])
    setIsScrapConfirmOpen(false)

    window.requestAnimationFrame(() => {
      editor?.commands.focus('end')
    })
  }, [editor])

  const requestScrap = useCallback(() => {
    if (hasContent) {
      setIsScrapConfirmOpen(true)
      return
    }

    scrapDraft()
  }, [hasContent, scrapDraft])

  const closeScrapConfirm = useCallback(() => {
    setIsScrapConfirmOpen(false)
    editor?.commands.focus('end')
  }, [editor])

  const refreshEditorControls = useCallback(() => {
    setEditorRenderTick((tick) => tick + 1)
  }, [])

  const handleContentStateChange = useCallback((nextHasContent: boolean) => {
    setHasContent(nextHasContent)

    if (nextHasContent) {
      setTimerStartedAt((current) => current ?? Date.now())
    }
  }, [])

  const finalizeDraft = useCallback(() => {
    if (!editor || !hasContent || isFinalized || isScrapConfirmOpen) {
      return
    }

    const draftText = editor.getText().trim()

    if (!draftText) {
      return
    }

    setIsFinalized(true)
    setFinalizedDraftText(draftText)
    setTodosById({})
    setActiveTodoIds([])
    setCompletedTodoIds([])
    startTodoExtraction(draftText)
  }, [editor, hasContent, isFinalized, isScrapConfirmOpen, startTodoExtraction])

  const retryTodoExtraction = useCallback(() => {
    if (!finalizedDraftText) {
      return
    }

    startTodoExtraction(finalizedDraftText)
  }, [finalizedDraftText, startTodoExtraction])

  const rejectTodo = useCallback((id: string) => {
    setActiveTodoIds((currentIds) =>
      currentIds.filter((currentId) => currentId !== id),
    )
    setCompletedTodoIds((currentIds) =>
      currentIds.filter((currentId) => currentId !== id),
    )
    setTodosById((currentTodos) => {
      const nextTodos = { ...currentTodos }
      delete nextTodos[id]
      return nextTodos
    })
  }, [])

  const toggleTodoDone = useCallback(
    (id: string) => {
      const activeIndex = activeTodoIds.indexOf(id)

      if (activeIndex !== -1) {
        setActiveTodoIds((currentIds) =>
          currentIds.filter((currentId) => currentId !== id),
        )
        setCompletedTodoIds((currentIds) =>
          currentIds.includes(id) ? currentIds : [...currentIds, id],
        )
        setTodosById((currentTodos) => {
          const todo = currentTodos[id]

          if (!todo) {
            return currentTodos
          }

          return {
            ...currentTodos,
            [id]: {
              ...todo,
              completed: true,
              lastActiveIndex: activeIndex,
            },
          }
        })
        return
      }

      if (!completedTodoIds.includes(id)) {
        return
      }

      const previousActiveIndex = todosById[id]?.lastActiveIndex
      const targetIndex =
        previousActiveIndex === undefined
          ? activeTodoIds.length
          : Math.min(Math.max(previousActiveIndex, 0), activeTodoIds.length)

      setCompletedTodoIds((currentIds) =>
        currentIds.filter((currentId) => currentId !== id),
      )
      setActiveTodoIds((currentIds) => {
        if (currentIds.includes(id)) {
          return currentIds
        }

        const nextIds = [...currentIds]
        nextIds.splice(targetIndex, 0, id)
        return nextIds
      })
      setTodosById((currentTodos) => {
        const todo = currentTodos[id]

        if (!todo) {
          return currentTodos
        }

        return {
          ...currentTodos,
          [id]: {
            ...todo,
            completed: false,
          },
        }
      })
    },
    [activeTodoIds, completedTodoIds, todosById],
  )

  const reorderActiveTodos = useCallback(
    (sourceIndex: number, targetIndex: number) => {
      setActiveTodoIds((currentIds) =>
        reorderIds(currentIds, sourceIndex, targetIndex),
      )
    },
    [],
  )

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if (!isCommandOrControl(event)) {
        return
      }

      const key = event.key.toLowerCase()

      if (key === 'f' && event.shiftKey) {
        event.preventDefault()
        cycleFont()
        return
      }

      if (key === 'n' && !event.shiftKey) {
        event.preventDefault()

        if (!isScrapConfirmOpen) {
          requestScrap()
        }

        return
      }

      if (key === 'enter' && event.shiftKey && !isScrapConfirmOpen) {
        if (hasContent && !isFinalized) {
          event.preventDefault()
          finalizeDraft()
        }

        return
      }

      if (key === 'enter' && isScrapConfirmOpen) {
        event.preventDefault()
        scrapDraft()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    cycleFont,
    finalizeDraft,
    hasContent,
    isFinalized,
    isScrapConfirmOpen,
    requestScrap,
    scrapDraft,
  ])

  const editorStyle = useMemo(
    () => ({ fontFamily: selectedFont.cssFamily }),
    [selectedFont.cssFamily],
  )

  const activeTodos = useMemo(
    () => activeTodoIds.flatMap((id) => (todosById[id] ? [todosById[id]] : [])),
    [activeTodoIds, todosById],
  )

  const completedTodos = useMemo(
    () =>
      completedTodoIds.flatMap((id) => (todosById[id] ? [todosById[id]] : [])),
    [completedTodoIds, todosById],
  )

  const canFinalize = Boolean(editor && hasContent && !isFinalized)

  return (
    <main className="app-shell" data-finalized={isFinalized || undefined}>
      {!isFinalized ? (
        <ModeTimerPill
          writingMode={writingMode}
          timerStartedAt={timerStartedAt}
          onSelectFreewrite={selectFreewrite}
          onSelectEdit={selectEdit}
        />
      ) : null}

      <WritingEditor
        fontFamily={selectedFont.cssFamily}
        fontSize={selectedFontSize.cssSize}
        isFinalized={isFinalized}
        getWritingMode={getWritingMode}
        onAutoSelectFreewrite={autoSelectFreewrite}
        onContentStateChange={handleContentStateChange}
        onEditorReady={setEditor}
        onEditorStateChange={refreshEditorControls}
      />

      {isFinalized ? (
        <TodoSidebar
          status={extractionStatus}
          error={extractionError}
          activeTodos={activeTodos}
          completedTodos={completedTodos}
          onRetry={retryTodoExtraction}
          onReject={rejectTodo}
          onToggleDone={toggleTodoDone}
          onReorderActive={reorderActiveTodos}
        />
      ) : null}

      {!isFinalized ? (
        <Toolbar
          editor={editor}
          fontLabel={selectedFont.label}
          fontSizeLabel={selectedFontSize.label}
          canFinalize={canFinalize}
          isFinalized={isFinalized}
          onCycleFont={cycleFont}
          onCycleFontSize={cycleFontSize}
          onFinalize={finalizeDraft}
          onScrap={requestScrap}
          style={editorStyle}
        />
      ) : null}

      <ScrapConfirmModal
        isOpen={isScrapConfirmOpen}
        onCancel={closeScrapConfirm}
        onConfirm={scrapDraft}
      />
    </main>
  )
}
