# Finalized Output Sidebar

## Summary

The finalized output sidebar turns a completed draft into a small set of in-memory post-draft outputs. When the user finalizes a non-empty draft, Freehand snapshots the current plain text, locks the editor read-only, opens a right sidebar, and asks Mastra agents running in the Electron main process to extract TODOs, goals, and reflective questions through OpenRouter.

## User-facing behavior

- `Finalize` is available from the bottom toolbar when the draft contains non-whitespace text.
- Cmd/Ctrl+Shift+Enter also finalizes a non-empty draft.
- Finalizing locks the draft editor read-only.
- The right sidebar opens immediately.
- The bottom toolbar and top mode/timer pill are hidden after finalization.
- The sidebar stays open until the draft is scrapped.
- TODO, goals, and reflective questions extraction run in parallel against the same finalized snapshot.
- Each sidebar section has its own loading, error, empty, and retry state.
- Scrap clears the draft, closes the sidebar, resets extracted output state and writing mode selection, and unlocks a fresh editor.

## Sidebar sections

The sidebar stacks three sections:

1. TODOs
2. Goals
3. Reflective Questions

### TODO item behavior

Each extracted TODO is a simple line item with a checkbox and short task text.

Users can:

- reject an item, removing it from the visible in-memory list
- check an item done
- uncheck a done item
- drag active rows to reprioritize them

Done items move below active items. Completed items are not draggable.

TODO extraction returns at most 8 items.

### Goals behavior

Goals are read-only reflection outputs. Each extracted goal includes:

- concise goal text
- brief rationale for why the agent inferred that goal from the draft

Goals extraction returns at most 3 items.

### Reflective questions behavior

Reflective questions are read-only prompts for thinking after the draft is finalized. They are not TODOs, clarification requests, or implementation tasks.

Reflective questions extraction returns at most 3 prompts.

## Backend boundary

Finalized output extraction runs through Electron IPC:

- Renderer calls `window.freehand.extractTodos(...)`, `window.freehand.extractGoals(...)`, and `window.freehand.extractReflectionQuestions(...)`.
- Preload forwards requests through dedicated IPC channels.
- Main process validates each request and calls the corresponding Mastra extraction service.
- Mastra uses OpenRouter for inference.

IPC channels:

- `todo:extract`
- `goals:extract`
- `reflection-questions:extract`

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
- TODO extraction status and extracted TODO items
- active item order
- completed item order
- rejected item removals
- goals extraction status and extracted goals
- reflective questions extraction status and extracted questions

No finalized draft or extracted output state is persisted.

## Related code

- `src/main/todoExtraction.ts`
- `src/main/reflectionExtraction.ts`
- `src/main/openRouterExtraction.ts`
- `src/main/registerTodoIpc.ts`
- `src/main/registerReflectionIpc.ts`
- `src/preload/index.ts`
- `src/shared/ipcChannels.ts`
- `src/shared/todos.ts`
- `src/shared/reflections.ts`
- `src/renderer/src/App.tsx`
- `src/renderer/src/todos/TodoSidebar.tsx`
- `src/renderer/src/todos/SortableTodoItem.tsx`
- `src/renderer/src/editor/WritingEditor.tsx`
- `src/renderer/src/editor/Toolbar.tsx`

## Related features

- `ephemeral-state.md`
- `electron-shell.md`
- `forward-only-editing.md`
- `scrap-flow.md`
- `toolbar.md`
