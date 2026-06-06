# Finalized TODO Sidebar

## Summary

The finalized TODO sidebar turns a completed draft into a small in-memory action list. When the user finalizes a non-empty draft, Freehand snapshots the current plain text, locks the editor read-only, opens a right sidebar, and asks a Mastra agent running in the Electron main process to extract TODO items through OpenRouter.

## User-facing behavior

- `Finalize` is available from the bottom toolbar when the draft contains non-whitespace text.
- Cmd/Ctrl+Shift+Enter also finalizes a non-empty draft.
- Finalizing locks the draft editor read-only.
- The right sidebar opens immediately and shows a loading state while extraction runs.
- The bottom toolbar and elapsed draft timer are hidden after finalization.
- The sidebar stays open until the draft is scrapped.
- If extraction fails, the sidebar shows an error and Retry button.
- Retry uses the same finalized text snapshot.
- Scrap clears the draft, closes the sidebar, resets TODO state, and unlocks a fresh editor.

## TODO item behavior

Each extracted TODO is a simple line item with a checkbox and short task text.

Users can:

- reject an item, removing it from the visible in-memory list
- check an item done
- uncheck a done item
- drag active rows to reprioritize them

Done items move below active items. Completed items are not draggable.

## Backend boundary

TODO extraction runs through Electron IPC:

- Renderer calls `window.freehand.extractTodos(...)`.
- Preload forwards the request through `todo:extract`.
- Main process validates the request and calls the Mastra extraction service.
- Mastra uses OpenRouter for inference.

Required environment variable:

- `OPENROUTER_API_KEY`

Optional environment variable:

- `OPENROUTER_MODEL`

Default model:

- `openrouter/google/gemini-2.5-flash`

## State model

The renderer owns finalized UI state in memory:

- whether the draft is finalized
- finalized text snapshot
- extraction status
- extracted TODO items
- active item order
- completed item order
- rejected item removals

No finalized draft or TODO state is persisted.

## Related code

- `src/main/todoExtraction.ts`
- `src/main/registerTodoIpc.ts`
- `src/preload/index.ts`
- `src/shared/todos.ts`
- `src/renderer/src/App.tsx`
- `src/renderer/src/todos/TodoSidebar.tsx`
- `src/renderer/src/todos/SortableTodoItem.tsx`
- `src/renderer/src/editor/ForwardOnlyEditor.tsx`
- `src/renderer/src/editor/Toolbar.tsx`

## Related features

- `ephemeral-state.md`
- `electron-shell.md`
- `forward-only-editing.md`
- `scrap-flow.md`
- `toolbar.md`
