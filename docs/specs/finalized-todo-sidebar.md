# Finalized Todo Sidebar Spec

## Overview

Add a finalization flow to Freehand. Once the writer has non-empty draft content, they can trigger `Finalize` from the toolbar or keyboard. Finalizing snapshots the current draft, locks the editor read-only, opens a right sidebar immediately, and starts a backend agent job that extracts TODO items from the finalized text.

The sidebar shows a simple in-memory todo list. Items can be rejected, marked done/undone, and drag-reordered to reprioritize active work. The feature uses Mastra in the Electron backend boundary and OpenRouter for inference. The renderer remains isolated from Node APIs and talks to the backend only through a minimal preload IPC bridge.

## Goals

- Let users turn a finished draft into a small prioritized TODO list.
- Make `Finalize` a clear lifecycle transition: draft editing stops and TODO extraction begins.
- Keep the TODO list simple and task-focused.
- Keep all feature state in memory only.
- Keep OpenRouter credentials out of the renderer.
- Use Mastra for the extraction agent and OpenRouter for inference.
- Use `@dnd-kit/react` for todo drag-and-drop reordering.

## Non-goals

- No persistence of finalized drafts, extracted todos, rejected todos, or completed state.
- No editing extracted todo text.
- No adding manual todos in this feature.
- No deletion, cut, undo, redo, or selected-text replacement in the draft editor.
- No continuous/background extraction while the user is still drafting.
- No automatic re-extraction after finalization.
- No model selector UI.
- No file export/import or document management.

## User-facing behavior

### Finalize action

- The toolbar gains a `Finalize` action.
- The action is disabled until the draft contains non-whitespace text.
- The keyboard shortcut for finalization is Cmd/Ctrl+Shift+Enter.
- If the scrap confirmation modal is open, existing modal keyboard behavior takes precedence and finalization should not fire.
- Clicking `Finalize` or using the shortcut:
  - snapshots the current editor text,
  - locks the editor read-only,
  - opens the right sidebar immediately,
  - shows a loading state in the sidebar,
  - starts TODO extraction in the background.

### Finalized editor state

- After finalization, the draft editor is read-only.
- The finalized draft remains visible on the left.
- The bottom toolbar and elapsed draft timer are hidden after finalization.
- Cmd/Ctrl+N remains available to clear/reset the finalized draft and sidebar state through the existing Scrap flow.
- The UI should make the finalized state visible enough that users understand typing is no longer available.

### Sidebar behavior

- The sidebar appears on the right after finalization and stays open.
- It opens immediately with a loading state while extraction is running.
- If extraction succeeds:
  - show the extracted todo list,
  - show an empty state if no actionable todos are found.
- If extraction fails:
  - show an error state and a `Retry` action,
  - keep the draft finalized and locked,
  - retry against the same finalized snapshot.

### Todo list behavior

Each todo item displays as a simple line item with:

- a checkbox,
- short task text,
- a small reject control.

Supported item actions:

- Reject removes the item from the visible list for the current in-memory session.
- Checking an item marks it done, moves it to the bottom, and displays it as completed.
- Unchecking a done item returns it to the active area, preserving its previous active priority when practical; otherwise it can return at the end of active items.
- Dragging the row reprioritizes active items.

Initial extracted todos are agent-ranked by likely priority. Extraction returns at most 8 todos.

## Design decisions made

- Finalization locks the editor read-only.
- Finalization has both a toolbar button and a keyboard shortcut.
- Finalize is disabled for empty drafts.
- Shortcut: Cmd/Ctrl+Shift+Enter.
- Sidebar opens immediately and stays open after finalization.
- Toolbar and elapsed draft timer are hidden after finalization.
- Mastra/OpenRouter code runs in the Electron main process behind minimal preload IPC.
- OpenRouter API key comes from `OPENROUTER_API_KEY`.
- OpenRouter model is configurable through `OPENROUTER_MODEL` with a documented default.
- Extraction should identify explicit and clearly implied actionable items, but avoid vague ideas.
- Agent output must be strict structured JSON and validated before rendering.
- TODO item display is a simple checkbox line item with task text.
- Initial TODO order is agent-ranked priority.
- Maximum extracted TODO count is 8.
- Rejected items are removed from the visible list.
- Completed items move to the bottom.

## Relevant existing code/infrastructure

- `src/renderer/src/App.tsx`
  - Owns top-level renderer state for editor, content, timer, toolbar, and scrap modal.
  - Natural home for finalized state, sidebar state, extraction loading/error state, and todo list state.
- `src/renderer/src/editor/ForwardOnlyEditor.tsx`
  - Creates the Tiptap editor.
  - Can support a read-only/finalized mode by controlling editor editability.
- `src/renderer/src/editor/Toolbar.tsx`
  - Existing compact bottom toolbar.
  - Natural place for the `Finalize` control.
- `src/renderer/src/editor/editorUtils.ts`
  - Existing `hasNonWhitespaceText` helper supports enabling/disabling Finalize.
- `src/renderer/src/editor/extensions/NoDeletionExtension.ts`
  - Preserves forward-only draft behavior before finalization.
  - Existing editor drop blocking should not prevent sidebar drag-and-drop if DnD is scoped to sidebar elements.
- `src/main/index.ts`
  - Minimal Electron main process.
  - New backend extraction service and IPC handler should live in/near this boundary.
- `src/preload/index.ts`
  - Currently exposes no app APIs.
  - This feature requires a minimal bridge for TODO extraction requests.
- `docs/wiki/ephemeral-state.md`
  - Establishes that document state is in memory only.
- `docs/wiki/electron-shell.md`
  - Establishes renderer isolation and no direct Node access.

## Extremely high-level technical approach

Add a finalized-draft state machine in the renderer: drafting, finalized/extracting, finalized/ready, and finalized/error. When the user finalizes, the renderer snapshots `editor.getText()`, makes the Tiptap editor read-only, opens the sidebar, and calls a minimal preload API to request TODO extraction.

The preload bridge forwards the request to an Electron main-process IPC handler. The main process invokes a Mastra agent configured with an OpenRouter model. The agent is instructed to return strict JSON containing up to 8 prioritized todos, each with task text. The main process validates and returns typed results to the renderer. The renderer owns all todo UI state in memory: current ordering, done/undone status, and rejected removals.

Use `@dnd-kit/react` in the sidebar todo list to reorder active todos by dragging rows, keeping drag/drop behavior separate from the Tiptap editor surface.

## Important specific code changes expected

- Add Mastra/OpenRouter dependencies for backend inference, including `@mastra/core`.
- Add `@dnd-kit/react` for sidebar drag-and-drop.
- Add typed preload API surface for extracting todos from a finalized draft snapshot.
- Add Electron main-process IPC handler/service for Mastra TODO extraction.
- Add renderer state for finalized mode, extraction status, extracted todos, and sidebar display.
- Add `Finalize` control to the toolbar and Cmd/Ctrl+Shift+Enter handling.
- Add read-only finalized behavior to the Tiptap editor.
- Add a right sidebar component for loading, error/retry, empty, and todo-list states.
- Add strict validation for agent output before the renderer displays todos.
- Update documentation/wiki pages as needed after implementation to reflect the finalized sidebar feature and new backend IPC boundary.

## Architectural / infrastructure changes

- Introduce the first minimal Electron preload bridge API.
- Introduce a backend service in the Electron main process for agentic extraction.
- Keep the renderer isolated from Node and secrets.
- Keep all document and todo state ephemeral/in-memory.
- Use environment configuration:
  - `OPENROUTER_API_KEY` is required for extraction.
  - `OPENROUTER_MODEL` can override the documented default model.

## Open questions

- Exact default `OPENROUTER_MODEL` value to document during implementation.
- Exact sidebar loading/error/empty copy.
- Exact visual treatment for finalized/read-only editor state.

## Risks and tradeoffs

- This feature adds a backend/IPC boundary to an app that currently has no renderer bridge APIs.
- Mastra/OpenRouter integration introduces network latency, API-key setup, rate limits, and inference failures.
- LLM extraction can miss tasks or infer questionable tasks; strict instructions and JSON validation reduce but do not eliminate this risk.
- Locking the draft after finalization makes the lifecycle clear, but users must scrap and start over if they finalize too early.
- Hiding source excerpts keeps the todo list minimal but provides less evidence for why each task was extracted.
- Done items moving to the bottom can conflict with manual priority ordering, but it keeps active tasks prominent.
