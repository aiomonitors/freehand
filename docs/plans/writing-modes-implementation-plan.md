# Writing Modes Implementation Plan

Source spec: `docs/specs/writing-modes.md`

## Implementation principles

- Keep all writing mode state in renderer memory only.
- Preserve the existing forward-only behavior as `Freewrite`.
- Add `Edit` without adding persistence, file APIs, IPC, or global state.
- Treat writing mode as draft lifecycle state owned by `App.tsx`.
- Lock mode selection within a draft:
  - no selected mode → `freewrite` or `edit`
  - never `edit` → `freewrite`
  - never `freewrite` → `edit`
- Avoid editor teardown/recreation during mode changes if possible; prefer a mode-aware ProseMirror plugin that reads current mode from a ref.
- Keep the top pill minimal and interactive, replacing the current passive timer display.
- Update `docs/wiki/` after implementation so the wiki reflects the new product model.

## Current implementation snapshot

Relevant current files:

- `src/renderer/src/App.tsx`
  - Owns draft lifecycle, editor reference, timer state, finalization, TODO sidebar state, Scrap reset, and global shortcuts.
  - Currently renders `DraftTimer` only after `timerStartedAt !== null` and before finalization.
- `src/renderer/src/DraftTimer.tsx`
  - Passive elapsed-time pill with local formatter and ticking state.
- `src/renderer/src/editor/ForwardOnlyEditor.tsx`
  - Always configures `StarterKit` with `undoRedo: false`.
  - Always installs `NoDeletionExtension`.
- `src/renderer/src/editor/extensions/NoDeletionExtension.ts`
  - Blocks deletion, cut, undo/redo, selected-text replacement, and drop.
  - Sanitizes paste and inserts pasted content after selected text.
- `src/renderer/src/styles.css`
  - `.draft-timer` is fixed top-center and currently has `pointer-events: none`.

## Phase 1 — Add writing mode domain type

### 1. Add shared renderer type

Create:

```text
src/renderer/src/writingModes.ts
```

Add:

```ts
export type WritingMode = 'freewrite' | 'edit'
export type WritingModeSelection = WritingMode | null
```

Optional helpers:

```ts
export function canSelectWritingMode(
  currentMode: WritingModeSelection,
  nextMode: WritingMode,
): boolean
```

Rules:

- `null` can become either mode.
- After either mode is selected, it cannot change to the other mode.
- Selecting the current mode is allowed as a no-op.

Manual check:

- TypeScript makes nullable mode explicit in every consumer.
- No stringly-typed mode literals are duplicated unnecessarily.

## Phase 2 — Add mode lifecycle state in `App.tsx`

### 1. Add state

In `src/renderer/src/App.tsx`, add:

```ts
const [writingMode, setWritingMode] = useState<WritingModeSelection>(null)
const writingModeRef = useRef<WritingModeSelection>(null)
```

Keep the ref synchronized:

```ts
useEffect(() => {
  writingModeRef.current = writingMode
}, [writingMode])
```

Rationale:

- React state drives UI.
- The ref gives ProseMirror plugin callbacks access to the latest mode without recreating the editor.

### 2. Add transition callbacks

Add callbacks with explicit locked-mode rules:

```ts
const selectWritingMode = useCallback(
  (nextMode: WritingMode) => {
    setWritingMode((currentMode) => {
      if (currentMode === 'freewrite' && nextMode === 'edit') {
        return currentMode
      }

      if (currentMode === nextMode) {
        return currentMode
      }

      return nextMode
    })

    window.requestAnimationFrame(() => {
      editor?.commands.focus('end')
    })
  },
  [editor],
)
```

Add a specific implicit callback for first input/paste:

```ts
const autoSelectFreewrite = useCallback(() => {
  setWritingMode((currentMode) => currentMode ?? 'freewrite')
}, [])
```

Behavior:

- Explicit `Freewrite` from no selected mode selects `freewrite`.
- Explicit `Edit` from no selected mode selects `edit`.
- `Edit` → `Freewrite` is ignored defensively, and the UI should not expose it.
- `Freewrite` → `Edit` is ignored defensively, and the UI should not expose it.
- Auto-selection only changes `null` to `freewrite`; it must not change `edit` to `freewrite` during normal edit input.

### 3. Reset mode on Scrap

In `scrapDraft()` add:

```ts
setWritingMode(null)
writingModeRef.current = null
```

Reset alongside existing state:

- editor content
- content state
- timer
- finalization state
- TODO sidebar state
- Scrap modal state

Manual check:

- Opening app starts with `writingMode === null`.
- Choosing `Edit` changes mode to `edit`.
- Choosing `Freewrite` changes mode to `freewrite`.
- `Edit` never changes to `freewrite` without Scrap.
- `Freewrite` never changes to `edit` without Scrap.
- Scrap resets mode to `null`.

## Phase 3 — Make the editor mode-aware

### 1. Rename editor component for clarity

Rename:

```text
src/renderer/src/editor/ForwardOnlyEditor.tsx
```

to:

```text
src/renderer/src/editor/WritingEditor.tsx
```

Update imports in `App.tsx`.

Rationale:

- The component will support both `Freewrite` and `Edit`.
- The forward-only behavior remains, but it is now mode-specific.

If a low-risk implementation prefers not to rename during feature work, keep the file name temporarily and update wiki references later. The product-facing behavior is more important than the rename.

### 2. Add mode props

Update editor props:

```ts
type WritingEditorProps = {
  fontFamily: string
  isFinalized: boolean
  writingModeRef: React.MutableRefObject<WritingModeSelection>
  onAutoSelectFreewrite: () => void
  onContentStateChange: (hasContent: boolean) => void
  onEditorReady: (editor: Editor | null) => void
  onEditorStateChange: () => void
}
```

Pass these from `App.tsx`.

### 3. Restore undo/redo infrastructure for Edit mode

Change `StarterKit` config from:

```ts
StarterKit.configure({
  undoRedo: false,
  heading: { levels: [1, 2] },
})
```

to either default undo/redo or explicit enabled undo/redo, depending on the installed Tiptap API:

```ts
StarterKit.configure({
  heading: { levels: [1, 2] },
})
```

Rationale:

- `Edit` needs normal undo/redo behavior.
- `Freewrite` can still block undo/redo through the mode-aware no-deletion plugin.
- Keeping the history plugin installed is fine because mode changes after selection are not allowed.

Manual check:

- In `Edit`, Cmd/Ctrl+Z and redo shortcuts work.
- In `Freewrite`, Cmd/Ctrl+Z, Cmd/Ctrl+Y, and Cmd/Ctrl+Shift+Z are blocked.

### 4. Replace always-on no-deletion extension with mode-aware guard

Option A, preferred: rename the extension to reflect broader responsibility:

```text
src/renderer/src/editor/extensions/WritingModeGuardExtension.ts
```

Option B: keep `NoDeletionExtension.ts` but make it configurable.

Configure it with:

```ts
WritingModeGuardExtension.configure({
  getWritingMode: () => writingModeRef.current,
  autoSelectFreewrite: onAutoSelectFreewrite,
})
```

Implementation shape:

```ts
type WritingModeGuardOptions = {
  getWritingMode: () => WritingModeSelection
  autoSelectFreewrite: () => void
}
```

Add helpers inside the extension:

```ts
function isFreewriteActive(options: WritingModeGuardOptions): boolean {
  return options.getWritingMode() === 'freewrite'
}

function activateImplicitFreewrite(options: WritingModeGuardOptions): void {
  if (options.getWritingMode() === null) {
    options.autoSelectFreewrite()
  }
}
```

Important: for typing and paste when mode is `null`, the extension must treat the current event as `Freewrite` immediately after calling `autoSelectFreewrite()`. Do not wait for React state to commit before enforcing selected-text/paste behavior.

### 5. Mode-specific behavior in plugin handlers

Update plugin handlers to follow this matrix:

| Handler/action            | `null` mode                                                         | `freewrite` mode                                | `edit` mode                                                         |
| ------------------------- | ------------------------------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------- |
| `handleTextInput`         | auto-select `freewrite`; enforce Freewrite insertion behavior       | enforce selected-text insertion-after-selection | return `false` for normal replacement                               |
| `handlePaste`             | auto-select `freewrite`; sanitize and insert after selection        | sanitize and insert after selection             | return `false` for normal rich-text paste                           |
| `Backspace` / `Delete`    | return `false` unless there is a reason to block empty-editor noise | prevent/block                                   | return `false`                                                      |
| cut / Cmd/Ctrl+X          | return `false`                                                      | prevent/block                                   | return `false`                                                      |
| undo/redo shortcuts       | return `false`                                                      | prevent/block                                   | return `false`                                                      |
| destructive `beforeinput` | return `false`                                                      | prevent/block                                   | return `false`                                                      |
| drop                      | conservative: block unsupported media; see below                    | block/drop-prevent as today                     | allow normal compatible text drop or keep unsupported media blocked |

Paste requirements:

- In `Freewrite`, preserve existing sanitized paste behavior.
- In `Edit`, allow normal compatible rich-text paste by returning `false` from `handlePaste`.
- If unsupported media can enter through default Edit paste, add a schema-safe `transformPasted` filter that strips unsupported nodes without changing replacement semantics.

Drop requirements:

- Keep unsupported media blocked in all modes for schema safety.
- For `Edit`, restoring normal text drag/drop is acceptable if it does not allow unsupported nodes.
- For `Freewrite`, preserve current block/drop-prevent behavior.

Manual check:

- `Freewrite` matches current forward-only behavior.
- `Edit` behaves like a normal rich-text editor.
- Initial typing or paste with no selected mode selects `Freewrite` and applies Freewrite rules to that same input event.
- Formatting selected text works in both modes.

### 6. Update editor accessibility copy

Change editor ARIA label from forward-only-specific copy to mode-neutral copy, for example:

```ts
'aria-label': 'Rich text draft editor'
```

Optional: add `data-writing-mode={writingMode ?? 'unselected'}` to the editor shell if useful for styling/debugging.

## Phase 4 — Replace `DraftTimer` with top mode/timer pill

### 1. Evolve or replace component

Replace `DraftTimer.tsx` with a mode-aware component, or create a new component and delete/deprecate `DraftTimer`.

Recommended file:

```text
src/renderer/src/ModeTimerPill.tsx
```

Props:

```ts
type ModeTimerPillProps = {
  writingMode: WritingModeSelection
  timerStartedAt: number | null
  onSelectFreewrite: () => void
  onSelectEdit: () => void
}
```

Keep the existing elapsed time formatter and interval behavior from `DraftTimer.tsx`.

### 2. Render states

Render behavior:

#### No selected mode

- Show only two buttons:
  - `Freewrite`
  - `Edit`
- Do not show `00:00`.
- Buttons call the explicit mode callbacks.

#### Freewrite mode

- Show active mode chip/status: `Freewrite`.
- Show elapsed timer only when `timerStartedAt !== null`.
- Hide `Edit` entirely.
- Do not show a disabled `Edit` control.

#### Edit mode

- Show active mode chip/status: `Edit`.
- Show elapsed timer only when `timerStartedAt !== null`.
- Do not show mode-switch actions after `Edit` has been selected.

#### Finalized

- Do not render the component from `App.tsx` when `isFinalized` is true.

Important display nuance:

- Explicitly selecting a mode before content should not start the timer.
- Typing whitespace before choosing mode auto-selects `Freewrite` but should not start the timer; the pill should show `Freewrite` without elapsed time until non-whitespace content exists.

### 3. Accessibility

Use semantic buttons for actions:

- `type="button"`
- `aria-label="Choose Freewrite mode"`
- `aria-label="Choose Edit mode"`

Use accessible status text for timer/mode, for example:

- `aria-label="Writing mode and elapsed draft time"` on the pill container.
- `aria-label="Elapsed draft time"` on the timer value.

Manual check:

- Buttons are keyboard-focusable.
- Focus ring is visible.
- Clicking a mode returns focus to the editor.
- Timer does not jitter because numeric display remains tabular.

## Phase 5 — Wire top pill into `App.tsx`

### 1. Import and render component

Replace current render:

```tsx
{
  timerStartedAt !== null && !isFinalized ? (
    <DraftTimer startedAt={timerStartedAt} />
  ) : null
}
```

with:

```tsx
{
  !isFinalized ? (
    <ModeTimerPill
      writingMode={writingMode}
      timerStartedAt={timerStartedAt}
      onSelectFreewrite={() => selectWritingMode('freewrite')}
      onSelectEdit={() => selectWritingMode('edit')}
    />
  ) : null
}
```

Use memoized callbacks if needed to avoid lint warnings or unnecessary renders.

### 2. Preserve timer lifecycle

Keep `handleContentStateChange()` behavior:

- Start the timer only on first non-whitespace content.
- Do not start timer merely because a mode was selected.
- Do not reset timer except through Scrap.

Manual check:

- Fresh app shows mode choices immediately.
- Selecting a mode does not show `00:00`.
- First non-whitespace content shows elapsed time.
- Finalizing hides the top pill.
- Scrap returns to mode choices.

## Phase 6 — Styling changes

### 1. Replace passive timer CSS

In `src/renderer/src/styles.css`, replace or evolve `.draft-timer` styles into `.mode-timer-pill` styles.

Requirements:

- Fixed top-center position, consistent with current timer placement.
- Subtle pill background, border, blur, and shadow.
- `pointer-events` must allow interaction; remove `pointer-events: none`.
- Keep `user-select: none` for the pill shell.
- Use `font-variant-numeric: tabular-nums` for timer values.
- Keep z-index above editor content and below modal.

Suggested structure:

```css
.mode-timer-pill {
  position: fixed;
  z-index: 15;
  top: 18px;
  left: 50%;
  transform: translateX(-50%);
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px;
  border: 1px solid var(--color-pill-border);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.56);
  box-shadow: 0 8px 28px rgba(31, 31, 29, 0.08);
  backdrop-filter: blur(14px) saturate(1.12);
  -webkit-backdrop-filter: blur(14px) saturate(1.12);
  user-select: none;
}
```

Add child classes:

```css
.mode-timer-pill__button
.mode-timer-pill__chip
.mode-timer-pill__time
.mode-timer-pill__divider
```

Styling notes:

- Buttons should visually align with toolbar buttons but be smaller.
- Active mode chip should look like status, not a primary CTA.
- Avoid wrapping at normal window sizes.

Manual check:

- Top pill is visually centered.
- Pill does not clash with macOS traffic-light controls.
- Buttons are clickable.
- Focus styles are visible.
- Pill remains hidden after finalization.

## Phase 7 — Finalization, toolbar, and shortcut integration

### 1. Finalization

No behavioral changes beyond hiding the top pill.

Verify:

- Finalize still requires non-whitespace content.
- Finalize still locks the editor.
- Finalize still hides toolbar.
- Finalize now also hides the mode/timer pill.
- TODO sidebar behavior is unchanged.

### 2. Toolbar

No toolbar controls are required for mode switching.

Verify:

- Existing formatting controls work in both modes.
- In `Edit`, toolbar formatting and normal edit operations can both modify selected content.
- In `Freewrite`, toolbar formatting selected text remains allowed.

### 3. Global shortcuts

No new mode-selection shortcuts for this iteration.

Verify existing shortcuts:

- Cmd/Ctrl+Shift+F cycles font in both modes.
- Cmd/Ctrl+N requests Scrap in both modes.
- Cmd/Ctrl+Shift+Enter finalizes in both modes when allowed.
- Cmd/Ctrl+Enter confirms Scrap only when modal is open.

## Phase 8 — Documentation/wiki updates

After implementation, update `docs/wiki/` in the same change set.

### 1. Add dedicated writing modes wiki page

Create:

```text
docs/wiki/writing-modes.md
```

Cover:

- Summary of `Freewrite` and `Edit`.
- Initial no-selected-mode state.
- Explicit mode choice behavior.
- Auto-select `Freewrite` on first typing or paste, including whitespace.
- Locked mode selection:
  - no selected mode → either mode
  - never `Edit` → `Freewrite`
  - never `Freewrite` → `Edit`
- Scrap reset to no selected mode.
- Top mode/timer pill behavior.
- Relationship to finalization.
- Related code links.

Keep it feature-oriented, not implementation-step-oriented, per `docs/wiki/AGENTS.md`.

### 2. Update `docs/wiki/product.md`

Update the product overview to reflect that Freehand now supports two modes:

- `Freewrite` remains the defining/default-forward mode.
- `Edit` is available as an explicit normal rich-text editing mode.
- The product is still ephemeral and single-document.

Update feature map:

- Add `Writing modes` entry pointing to `writing-modes.md`.
- Adjust `Forward-only editing` wording to clarify it applies to `Freewrite` mode.
- Adjust blocked shortcut section so it is mode-specific, not globally true.
- Add writing mode state to the state model.

### 3. Update `docs/wiki/forward-only-editing.md`

Revise copy so it describes `Freewrite` mode specifically:

- Rename summary language from always-global behavior to `Freewrite` behavior.
- State that `Edit` mode allows normal editing.
- Keep existing blocked/selected-text/paste behavior as the Freewrite contract.
- Update related code references if files were renamed.
- Link to `writing-modes.md`.

### 4. Update `docs/wiki/elapsed-draft-timer.md`

Revise timer page into mode/timer pill behavior:

- The top pill is now interactive before/while drafting.
- Before mode selection, it shows `Freewrite` and `Edit` choices.
- Timer still starts only on first non-whitespace content.
- Selecting a mode alone does not start timer.
- The pill hides after finalization.
- Scrap resets both timer and mode selection.
- Update related code references from `DraftTimer.tsx` to `ModeTimerPill.tsx` if renamed.

### 5. Update `docs/wiki/scrap-flow.md`

Add writing mode reset to Scrap reset behavior:

- confirmed Scrap clears selected writing mode
- the app returns to no selected mode
- top pill shows `Freewrite` / `Edit` choices again

### 6. Update `docs/wiki/ephemeral-state.md`

Add writing mode selection to renderer-owned state and not-persisted state.

Clarify:

- mode is not persisted across launches
- mode resets on Scrap
- mode does not imply save/open/export/import behavior

### 7. Update related pages if needed

Review and update these pages only if current wording becomes inaccurate:

- `docs/wiki/rich-text-formatting.md`
- `docs/wiki/toolbar.md`
- `docs/wiki/writing-surface.md`
- `docs/wiki/finalized-todo-sidebar.md`

Do not over-expand wiki pages. Keep each feature page focused and under the folder guidance limit.

Manual documentation check:

- Wiki no longer claims destructive editing is globally blocked in all modes.
- Product page clearly states `Freewrite` remains first-class.
- Timer page no longer describes the top pill as non-interactive.
- Scrap and ephemeral state pages mention mode reset/no persistence.

## Phase 9 — Quality checks

Run, in order:

```sh
pnpm run format:check
pnpm run lint
pnpm run typecheck
pnpm run build
```

Fix all reported issues.

If formatting check fails only because of changed files, run:

```sh
pnpm run format
```

Then rerun the full quality sequence.

## Manual QA checklist

### Initial state

- Fresh app opens with an empty editor.
- Top pill is visible immediately.
- Top pill shows only `Freewrite` and `Edit` buttons.
- Top pill does not show `00:00`.
- Toolbar remains visible.
- Editor can receive focus/input before choosing a mode.

### Explicit Freewrite selection

- Click `Freewrite`.
- Pill shows active `Freewrite` status.
- `Edit` option is hidden.
- Timer is not visible until non-whitespace content exists.
- Typing whitespace keeps timer hidden but mode remains `Freewrite`.
- Typing non-whitespace starts timer.
- Backspace/Delete are blocked.
- Cut is blocked.
- Cmd/Ctrl+X is blocked.
- Undo/redo shortcuts are blocked.
- Selecting text and typing inserts after the selection.
- Selecting text and pasting inserts after the selection.
- Formatting selected text still works.

### Explicit Edit selection

- Click `Edit` on a fresh draft.
- Pill shows active `Edit` status.
- Timer is not visible until non-whitespace content exists.
- Backspace/Delete work normally.
- Cut works normally.
- Cmd/Ctrl+X works normally.
- Cmd/Ctrl+Z and redo work normally.
- Selecting text and typing replaces the selection.
- Selecting text and pasting replaces the selection.
- Compatible rich-text paste works.
- Formatting toolbar still works.

### Auto-select Freewrite

- On a fresh draft, type a visible character before choosing a mode.
- Mode becomes `Freewrite`.
- Timer starts.
- `Edit` option is hidden.
- On a fresh draft, type whitespace before choosing a mode.
- Mode becomes `Freewrite`.
- Timer remains hidden until non-whitespace content is entered.
- On a fresh draft, paste before choosing a mode.
- Mode becomes `Freewrite`.
- Pasted content is inserted with Freewrite paste semantics.

### Locked mode behavior

- Start in `Edit`.
- Type content and make at least one normal edit.
- The top pill shows `Edit` only; it does not expose a `Freewrite` action.
- There is no way to switch to `Freewrite` without Scrap.
- Start in `Freewrite`.
- The top pill shows `Freewrite` only; it does not expose an `Edit` action.
- There is no way to switch to `Edit` without Scrap.

### Scrap reset

- In no-selected mode with empty content, Scrap keeps/returns no selected mode.
- In `Freewrite`, Scrap resets content, timer, finalization/sidebar state, and mode.
- In `Edit`, Scrap resets content, timer, finalization/sidebar state, and mode.
- After confirmed Scrap, top pill shows `Freewrite` / `Edit` choices.
- Canceling Scrap preserves the current mode and timer.

### Finalization

- Finalize works in `Freewrite` with non-whitespace content.
- Finalize works in `Edit` with non-whitespace content.
- Finalization locks the draft.
- Toolbar is hidden.
- Top mode/timer pill is hidden.
- TODO sidebar behavior is unchanged.
- Scrap after finalization resets mode and returns to fresh pre-writing state.

### Regression checks

- Font cycling still works.
- Rich-text toolbar active states still update.
- Placeholder behavior remains correct.
- Unsupported media paste/drop remains schema-safe.
- Modal z-index remains above top pill.
- Renderer remains isolated from Node APIs.

## Implementation order summary

1. Add `WritingMode` / nullable mode types.
2. Add `writingMode` state, mode ref, locked selection callbacks, and Scrap reset in `App.tsx`.
3. Rename or update the editor component to be mode-aware.
4. Restore Tiptap undo/redo infrastructure for normal `Edit` behavior.
5. Make the no-deletion extension mode-aware and add implicit Freewrite activation on typing/paste.
6. Replace `DraftTimer` with `ModeTimerPill` while preserving elapsed-time formatting/ticking.
7. Wire `ModeTimerPill` into `App.tsx` and hide it after finalization.
8. Update CSS for an interactive top pill.
9. Update `docs/wiki/` pages listed in Phase 8.
10. Run quality checks and complete manual QA.

## Known implementation risks

- Tiptap extension options may not update after editor creation; use stable callbacks/refs so plugin handlers can read current mode.
- Enabling undo/redo for `Edit` while blocking it in `Freewrite` requires careful shortcut and `beforeinput` handling.
- Auto-selecting `Freewrite` on whitespace is intentionally strict and may be surprising; QA should verify it is implemented exactly.
- Default Edit paste/drop may allow unsupported nodes if schema filtering is not conservative enough.
- The top pill changes from passive to interactive; CSS must remove `pointer-events: none` and provide accessible focus states.
- If the editor component is renamed, update all imports and wiki related-code references in the same change.
