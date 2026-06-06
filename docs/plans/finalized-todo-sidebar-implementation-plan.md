# Finalized Todo Sidebar Implementation Plan

Source spec: `docs/specs/finalized-todo-sidebar.md`

## Implementation principles

- Keep draft and todo state in memory only.
- Preserve the forward-only editing model before finalization.
- Treat `Finalize` as a draft lifecycle transition: editable draft → locked finalized draft + sidebar extraction.
- Keep OpenRouter keys and all Mastra calls out of the renderer.
- Expose only one minimal preload API for todo extraction.
- Prefer simple React state and typed plain objects over global state libraries.
- Use strict structured output validation before rendering extracted todos.
- Do not add persistence, manual todo creation, todo editing, model picker UI, export/import, undo/redo, or selected-text replacement behavior.

## Phase 1 — Dependencies and shared types

### 1. Add dependencies

Install runtime dependencies with PNPM:

```sh
pnpm add @mastra/core @dnd-kit/react zod
```

Notes:

- `@mastra/core` provides the backend agent.
- Mastra can route OpenRouter models by model id, using `OPENROUTER_API_KEY`.
- `zod` is used for structured output schemas and runtime validation.
- `@dnd-kit/react` is used only in the renderer sidebar.

### 2. Add shared todo types

Create:

```text
src/shared/todos.ts
```

Define renderer/main-safe types with no Node imports:

```ts
export type ExtractedTodo = {
  id: string
  text: string
}

export type ExtractTodosRequest = {
  draftText: string
}

export type ExtractTodosResponse = {
  todos: ExtractedTodo[]
}
```

Guidelines:

- `id` should be generated in main after validating model output.
- The model should not be trusted to provide stable ids.
- Keep these shared types serializable and bridge-safe.

### 3. Include shared files in TypeScript configs

Update both TypeScript configs to include shared code:

- `tsconfig.node.json`
- `tsconfig.web.json`

Add:

```json
"src/shared/**/*.ts"
```

Manual check:

- `pnpm run typecheck` can see shared types from main, preload, and renderer.

## Phase 2 — Main-process Mastra extraction service

### 1. Create extraction service

Create:

```text
src/main/todoExtraction.ts
```

Responsibilities:

- Read `OPENROUTER_API_KEY` from the environment indirectly through Mastra/OpenRouter routing.
- Read `OPENROUTER_MODEL` from the environment.
- Use documented default model when `OPENROUTER_MODEL` is missing.
- Create and call a Mastra `Agent`.
- Request strict structured output.
- Validate and normalize the result.
- Return at most 8 todos.

Use this default model unless implementation discovers a compatibility issue:

```ts
const DEFAULT_OPENROUTER_MODEL = 'openrouter/google/gemini-2.5-flash'
```

### 2. Define structured output schema

Use Zod in `src/main/todoExtraction.ts`:

```ts
const extractedTodoSchema = z.object({
  text: z.string().trim().min(1).max(180),
})

const extractionSchema = z.object({
  todos: z.array(extractedTodoSchema).max(8),
})
```

Validation/normalization requirements:

- Trim task text.
- Drop empty items if defensive post-processing is needed.
- Clamp final result to 8 items even though schema also caps it.
- Generate ids after validation, e.g. `crypto.randomUUID()` in the main process.

### 3. Create agent instructions

Agent behavior requirements:

- Extract explicit and clearly implied actionable TODOs.
- Avoid vague ideas, observations, summaries, or non-actions.
- Rank todos by likely priority/usefulness.
- Return no more than 8 items.
- Each todo should be short and imperative where possible.
- The output should contain simple task text only.
- Return an empty list when no actionable items exist.

Implementation shape:

```ts
const todoExtractionAgent = new Agent({
  id: 'todo-extraction-agent',
  name: 'Todo Extraction Agent',
  instructions: '...',
  model: process.env.OPENROUTER_MODEL ?? DEFAULT_OPENROUTER_MODEL,
})
```

Call shape:

```ts
const response = await todoExtractionAgent.generate(prompt, {
  structuredOutput: {
    schema: extractionSchema,
    errorStrategy: 'strict',
  },
})
```

OpenRouter compatibility note:

- If the selected OpenRouter model rejects native structured output/`response_format`, add a retry or configuration using `jsonPromptInjection: true` inside `structuredOutput`.
- Still validate with Zod and treat schema failure as extraction failure.

### 4. Handle missing/invalid input

Service behavior:

- If `draftText.trim()` is empty, return `{ todos: [] }` without calling the model.
- If `OPENROUTER_API_KEY` is missing, throw a clear error message for the renderer error state, e.g. `OPENROUTER_API_KEY is not configured.`
- Do not log draft text by default.
- Do not persist draft text or extracted todos.

Manual check:

- Missing API key produces a controlled error.
- Empty/whitespace input returns no todos without an API call.
- Valid input produces a typed list or a controlled error.

## Phase 3 — IPC and preload bridge

### 1. Add IPC channel constants

Create a small main/preload-safe constant near the service or shared module, e.g. in:

```text
src/shared/ipcChannels.ts
```

Define:

```ts
export const TODO_EXTRACT_CHANNEL = 'todo:extract'
```

### 2. Register main-process handler

In `src/main/index.ts` or a new helper file such as `src/main/registerTodoIpc.ts`:

- Import `ipcMain` from `electron`.
- Register `ipcMain.handle(TODO_EXTRACT_CHANNEL, async (_event, request) => ...)`.
- Validate the request shape before passing to the extraction service.
- Return `ExtractTodosResponse`.
- Convert thrown errors into safe, human-readable errors.

Guidelines:

- Register the handler once during app startup before/around `createWindow()`.
- Do not expose the OpenRouter key.
- Do not return stack traces to the renderer.

### 3. Expose minimal preload API

Update:

```text
src/preload/index.ts
```

Expose only:

```ts
window.freehand.extractTodos(request: ExtractTodosRequest): Promise<ExtractTodosResponse>
```

Implementation shape:

```ts
contextBridge.exposeInMainWorld('freehand', {
  extractTodos: (request: ExtractTodosRequest) =>
    ipcRenderer.invoke(TODO_EXTRACT_CHANNEL, request),
})
```

### 4. Add renderer global typing

Create:

```text
src/renderer/src/preload.d.ts
```

Declare:

```ts
declare global {
  interface Window {
    freehand: {
      extractTodos: (
        request: ExtractTodosRequest,
      ) => Promise<ExtractTodosResponse>
    }
  }
}
```

Manual check:

- Renderer can call `window.freehand.extractTodos` with full type checking.
- Renderer still has no direct Node access.
- Main process owns all OpenRouter/Mastra execution.

## Phase 4 — Finalized editor state

### 1. Add editable/finalized prop to editor component

Update:

```text
src/renderer/src/editor/ForwardOnlyEditor.tsx
```

Add prop:

```ts
type ForwardOnlyEditorProps = {
  ...
  isFinalized: boolean
}
```

Use Tiptap editability:

- Configure initial `editable: !isFinalized` if supported in the installed Tiptap version.
- Add an effect that calls `editor.setEditable(!isFinalized)` when `isFinalized` changes.
- Keep the existing no-deletion extension for drafting mode.

Manual check:

- Before finalization: typing and formatting work as before.
- After finalization: typing does not insert text.
- The finalized draft remains visible.

### 2. Add finalized styling hooks

Add a class/data attribute to the editor shell when finalized, e.g.:

```tsx
<section className="editor-shell" data-finalized={isFinalized || undefined}>
```

Style requirements:

- Subtle read-only cue, not a heavy disabled treatment.
- Avoid reducing readability.
- Possible options:
  - slightly narrower editor area when sidebar is present,
  - muted caret/selection treatment,
  - small `Finalized` badge near top of editor area.

Manual check:

- User can visually tell the draft is finalized/read-only.
- The finalized draft still feels readable.

## Phase 5 — Renderer state machine and finalization flow

### 1. Add todo UI state types

In `src/renderer/src/App.tsx` or a new sidebar module, define:

```ts
type TodoItem = ExtractedTodo & {
  completed: boolean
  lastActiveIndex?: number
}

type ExtractionStatus = 'idle' | 'loading' | 'ready' | 'error'
```

Suggested App state:

```ts
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
const [activeExtractionId, setActiveExtractionId] = useState<string | null>(
  null,
)
```

Rationale:

- Separate active/completed id arrays make done-bottom behavior straightforward.
- `lastActiveIndex` supports restoring undone items near prior active priority.
- `activeExtractionId` prevents stale async results from applying after Scrap/reset.

### 2. Implement `finalizeDraft`

In `App.tsx`, add a callback that:

- No-ops if editor is missing.
- No-ops if `hasContent` is false.
- No-ops if already finalized.
- Reads `editor.getText().trim()` as the finalized snapshot.
- Sets finalized state to true.
- Stores `finalizedDraftText`.
- Opens sidebar implicitly through `isFinalized`.
- Sets extraction status to `loading`.
- Clears previous extraction error and todo arrays.
- Starts extraction.

Important:

- Use plain-text extraction for this feature.
- Do not send HTML or ProseMirror JSON unless a future spec requests richer context.

### 3. Implement extraction request helper

Add a helper callback, e.g. `extractTodosForSnapshot(draftText: string, extractionId: string)`:

- Calls `window.freehand.extractTodos({ draftText })`.
- On success:
  - ignore if `activeExtractionId` no longer matches,
  - normalize response into `todosById`, `activeTodoIds`, and empty `completedTodoIds`,
  - set status to `ready`.
- On failure:
  - ignore if stale,
  - set a human-readable error,
  - set status to `error`,
  - keep `isFinalized` true.

Stale-result handling:

- If the user scraps while extraction is pending, reset `activeExtractionId` and ignore the pending result when it resolves.

### 4. Implement retry

Retry behavior:

- Requires `finalizedDraftText`.
- Generates a new `activeExtractionId`.
- Sets status back to `loading`.
- Clears error.
- Calls extraction again against the same finalized snapshot.

Manual check:

- Finalize opens sidebar immediately.
- Loading appears before results.
- Error state keeps editor locked.
- Retry uses the same text and does not unlock the editor.
- Scrapping during loading prevents stale results from reappearing.

## Phase 6 — Toolbar finalization controls and shortcuts

### 1. Add Finalize button to toolbar

Update:

```text
src/renderer/src/editor/Toolbar.tsx
```

Add props:

```ts
onFinalize: () => void
canFinalize: boolean
isFinalized: boolean
```

Toolbar behavior:

- Add `Finalize` as a text button near `Scrap`, likely after `Scrap` and before the font control.
- Disable `Finalize` when:
  - editor is missing,
  - draft has no non-whitespace content,
  - draft is already finalized.
- Hide the toolbar and elapsed draft timer once the draft is finalized.
- Cmd/Ctrl+N remains available for the Scrap/reset flow after finalization.

Manual check:

- Empty draft: Finalize disabled.
- Non-empty draft: Finalize enabled.
- After finalization: toolbar and timer are hidden; Cmd/Ctrl+N still opens Scrap/reset flow.

### 2. Add keyboard shortcut

In `App.tsx` keydown handler:

- Cmd/Ctrl+Shift+Enter triggers `finalizeDraft()`.
- Do not fire when scrap confirmation modal is open.
- Do not fire when `hasContent` is false.
- Do not fire when already finalized.
- Call `preventDefault()` only when handling the shortcut.

Manual check:

- Cmd/Ctrl+Shift+Enter finalizes non-empty draft.
- Cmd/Ctrl+Shift+Enter does nothing on empty draft.
- Existing Cmd/Ctrl+Enter scrap-confirm behavior still works while modal is open.
- Cmd/Ctrl+N scrap behavior still works.

## Phase 7 — Sidebar component

### 1. Create sidebar module structure

Create:

```text
src/renderer/src/todos/TodoSidebar.tsx
src/renderer/src/todos/SortableTodoItem.tsx
```

Optional helper:

```text
src/renderer/src/todos/todoReorder.ts
```

### 2. TodoSidebar props

Suggested props:

```ts
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
```

Behavior:

- Render nothing unless `isFinalized` is true at the App level.
- Loading state copy: `Extracting TODOs…`
- Empty state copy: `No clear TODOs found.`
- Error state copy: `Could not extract TODOs.` plus the safe error message and `Retry` button.
- Ready state:
  - active todo list first,
  - completed todo list below or visually separated at bottom,
  - active count may be shown but is optional.

### 3. Layout and accessibility

Sidebar requirements:

- Use `<aside>` with an accessible label, e.g. `aria-label="Extracted TODOs"`.
- Fixed or sticky right side within the app shell.
- Width around `320px–380px` on large screens.
- On smaller widths, use a narrower right panel or stack below only if needed for minimum window support.
- Do not cover the bottom toolbar in a way that blocks controls.
- Keep sidebar always open after finalization.

Manual check:

- Sidebar opens on the right.
- It remains visible through loading, error, empty, and ready states.
- It is readable at minimum app window size.

## Phase 8 — Todo actions and ordering

### 1. Reject item

In `App.tsx`, implement:

- Remove id from `activeTodoIds`.
- Remove id from `completedTodoIds`.
- Remove id from `todosById` or leave it unreachable; prefer deleting from map for simplicity.

Manual check:

- Reject removes active item.
- Reject removes completed item.
- Rejected item does not reappear unless extraction is retried.

### 2. Mark done

Behavior:

- If id is active:
  - store its current active index as `lastActiveIndex`,
  - remove from `activeTodoIds`,
  - append to `completedTodoIds`,
  - set `completed: true`.
- If id is already completed, no-op.

Manual check:

- Done item moves below active items.
- Done item is visually muted/checked.

### 3. Mark undone

Behavior:

- If id is completed:
  - remove from `completedTodoIds`,
  - insert into `activeTodoIds` at `lastActiveIndex` clamped to active list length,
  - set `completed: false`.
- If `lastActiveIndex` is missing, append to active list.

Manual check:

- Undone item returns to active area.
- If possible, it returns near its former priority.

### 4. Reorder active todos

Implement a pure helper:

```ts
function reorderIds(ids: string[], fromIndex: number, toIndex: number): string[]
```

Requirements:

- Ignore invalid indices.
- Return original array when no movement is needed.
- Only reorder `activeTodoIds`.
- Completed items are not draggable in this iteration.

Manual check:

- Dragging active items changes priority order.
- Completed items stay at bottom.
- Done/undone still works after reorder.

## Phase 9 — Drag and drop with `@dnd-kit/react`

### 1. Implement sortable active items

Use `DragDropProvider` from `@dnd-kit/react` and `useSortable` from `@dnd-kit/react/sortable`.

Implementation approach:

- Wrap only the active todo list in `DragDropProvider`.
- Each active todo item uses `useSortable({ id, index, group: 'active-todos', data: { index } })`.
- Make the whole active row draggable; do not render a separate drag icon.
- On drag end:
  - ignore canceled events,
  - require source and target,
  - read source/target indices from operation data,
  - call `onReorderActive(sourceIndex, targetIndex)`.

### 2. Completed items are non-sortable

Completed todo items:

- Render with the same visual card structure.
- Do not use `useSortable`.
- Keep only reject and undone actions.

Manual check:

- Dragging the row works.
- Checkbox and reject controls remain usable inside draggable rows.
- Dragging in sidebar does not interact with the editor's drop-blocking extension.
- Keyboard/mouse focus remains usable after drag.

## Phase 10 — Styling

### 1. App shell layout with sidebar

Update `src/renderer/src/styles.css`:

- Add app-shell finalized/sidebar layout styles.
- When finalized, reserve right-side space for the sidebar so it does not obscure editor content.
- Preserve generous editor padding and bottom toolbar clearance.

Suggested shape:

```css
.app-shell[data-finalized='true'] .editor-shell {
  padding-right: clamp(360px, 34vw, 440px);
}

.todo-sidebar {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: min(380px, 34vw);
  padding: 72px 20px 116px;
  border-left: 1px solid var(--color-pill-border);
  background: rgba(255, 255, 255, 0.68);
  backdrop-filter: blur(18px) saturate(1.12);
  -webkit-backdrop-filter: blur(18px) saturate(1.12);
  overflow-y: auto;
}
```

Adjust for small windows:

- At minimum width, use a narrower panel if needed.
- Ensure toolbar remains clickable.
- Avoid horizontal overflow.

### 2. Todo visual states

Add styles for:

- Sidebar title/header.
- Loading state.
- Error message + retry button.
- Empty state.
- Todo card.
- Source excerpt.
- Done/completed item muted styling.
- Reject button.
- Done/undone button.
- Whole-row draggable state.
- Dragging/drop-target states.

Requirements:

- Buttons are accessible and have visible focus states.
- Reject is visually secondary/destructive enough to understand but not as prominent as Scrap.
- Done state is clear via checkbox/check label and muted item styling.

Manual check:

- Sidebar feels consistent with existing light/pill visual language.
- Todo list remains simple.
- Source excerpts are readable but visually secondary.

## Phase 11 — Scrap/reset integration

### 1. Reset finalized and todo state on Scrap

Update `scrapDraft()` in `App.tsx` to also reset:

- `isFinalized` → false.
- `finalizedDraftText` → null.
- `extractionStatus` → `idle`.
- `extractionError` → null.
- `todosById` → `{}`.
- `activeTodoIds` → `[]`.
- `completedTodoIds` → `[]`.
- `activeExtractionId` → null.

Keep existing behavior:

- clear editor content,
- reset `hasContent`,
- reset timer,
- close scrap modal,
- focus editor after reset.

### 2. Ensure editor becomes editable again

After Scrap:

- `ForwardOnlyEditor` receives `isFinalized={false}`.
- Tiptap `editor.setEditable(true)` runs.
- Empty editor can be typed into again.

Manual check:

- Scrap after finalization removes sidebar and unlocks editor.
- Starting a new draft after Scrap behaves exactly like initial app load.
- Pending extraction result after Scrap is ignored.

## Phase 12 — Documentation updates

After implementation, update docs to reflect the new feature:

Create:

```text
docs/wiki/finalized-todo-sidebar.md
```

Update as needed:

- `docs/wiki/product.md`
- `docs/wiki/ephemeral-state.md`
- `docs/wiki/electron-shell.md`
- `docs/wiki/toolbar.md`
- `README.md`

Documentation should mention:

- Finalize locks the draft.
- Sidebar todo state is in memory only.
- Mastra/OpenRouter run behind the Electron main-process IPC boundary.
- Required env var: `OPENROUTER_API_KEY`.
- Optional env var: `OPENROUTER_MODEL`, defaulting to `openrouter/google/gemini-2.5-flash` unless implementation changes it.
- Shortcut: Cmd/Ctrl+Shift+Enter.

## Phase 13 — Quality checks

Run, per repo guidance:

```sh
pnpm run format:check
pnpm run lint
pnpm run typecheck
pnpm run build
```

Fix all reported issues.

If dependencies were added, ensure `pnpm-lock.yaml` is updated.

## Manual QA checklist

Finalization lifecycle:

- App loads with no sidebar.
- Empty draft has disabled Finalize button.
- Typing non-whitespace content enables Finalize.
- Cmd/Ctrl+Shift+Enter finalizes a non-empty draft.
- Finalize button finalizes a non-empty draft.
- Finalized draft is read-only.
- Toolbar and timer are hidden after finalization.
- Cmd/Ctrl+N remains available after finalization for Scrap/reset.
- Scrap after finalization removes sidebar and unlocks a fresh empty editor.

Extraction:

- Sidebar opens immediately with loading state.
- Missing `OPENROUTER_API_KEY` shows error + Retry.
- Retry keeps draft locked and calls extraction again.
- Valid extraction shows up to 8 todos.
- Draft with no actionable items shows empty state.
- Stale extraction results do not apply after Scrap.

Todo behavior:

- Todo displays as a simple checkbox line item with task text.
- Reject removes an active item.
- Reject removes a completed item.
- Mark done moves item to bottom and shows completed styling.
- Mark undone returns item to active list.
- Active todo drag-and-drop reprioritizes items.
- Completed items are not draggable.
- Whole-row dragging does not prevent checkbox/reject interactions.

Existing behavior regression:

- Forward-only editing still blocks Backspace.
- Delete remains blocked.
- Cut remains blocked.
- Undo/redo remain blocked.
- Selected typing inserts after selection before finalization.
- Selected paste inserts after selection before finalization.
- Scrap modal behavior still works.
- Cmd/Ctrl+N still requests Scrap.
- Cmd/Ctrl+Enter still confirms Scrap only while modal is open.
- Timer still starts on first non-whitespace content and resets on Scrap.

Security/infrastructure:

- Renderer cannot access Node APIs directly.
- Renderer does not receive OpenRouter API key.
- Main process does not log draft text by default.
- No draft/todo persistence is introduced.

## Implementation order summary

1. Add dependencies and shared serializable types.
2. Add main-process Mastra extraction service with Zod structured output validation.
3. Add IPC channel and preload bridge.
4. Add renderer global typing for `window.freehand.extractTodos`.
5. Add finalized/read-only prop support to `ForwardOnlyEditor`.
6. Add finalized/extraction/todo state to `App.tsx`.
7. Implement `finalizeDraft`, extraction request handling, retry, and stale result protection.
8. Add Finalize toolbar button and Cmd/Ctrl+Shift+Enter shortcut.
9. Add `TodoSidebar` and todo item components.
10. Implement reject, done/undone, and active reorder state updates.
11. Wire `@dnd-kit/react` sortable behavior for active todos.
12. Add sidebar/finalized/todo styling.
13. Reset all finalized/todo state on Scrap.
14. Update docs/wiki/README.
15. Run format, lint, typecheck, build, and manual QA.

## Known implementation risks

- OpenRouter model support for native structured output can vary; `jsonPromptInjection: true` may be needed for some models.
- Mastra/OpenRouter dependency versions may require small API adjustments during implementation.
- Electron preload typing must be kept renderer-safe and not leak Node APIs.
- Async extraction can resolve after reset; stale result guards are required.
- Sidebar layout may need responsive tuning to avoid crowding the editor at the minimum window size.
- Drag-and-drop interactions need manual validation because the editor intentionally blocks drop events in its own surface.
