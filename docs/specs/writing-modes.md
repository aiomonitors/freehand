# Writing Modes Spec

## Overview

Add two writing modes to Freehand: `Freewrite` and `Edit`.

`Freewrite` is the current forward-only/no-editing experience. It blocks destructive editing paths and keeps the writer moving forward. `Edit` is a normal rich-text editing mode where deletion, cut, undo/redo, selected-text replacement, and ordinary editing behavior are allowed.

Before writing, the top-center pill shows two mode choices: `Freewrite` and `Edit`. The user can choose explicitly. If they begin typing or paste before choosing, the app automatically selects `Freewrite`.

Mode selection is locked for the duration of a draft:

- No selected mode → `Freewrite` or `Edit`.
- `Edit` → `Freewrite` is not allowed.
- `Freewrite` → `Edit` is not allowed.
- Scrapping the draft resets mode selection back to no selected mode.

The top timer pill should evolve into an interactive mode/status pill that can show mode choices, elapsed time, and current mode.

## Goals

- Support both forward-only writing and normal editable drafting in the same app.
- Preserve Freehand's current no-edit behavior as `Freewrite` mode.
- Lock the selected writing mode for the duration of the draft.
- Keep the mode UI minimal by expanding the existing top timer pill concept.
- Keep all mode state in renderer memory only.

## Non-goals

- No persistence of the selected mode across app launches.
- No per-paragraph or per-selection mode changes.
- No ability to switch modes within the same draft after a mode has been selected.
- No settings screen for default mode.
- No changes to finalized TODO extraction behavior beyond hiding the top pill after finalization.
- No file save/open/export/import behavior.

## User-facing behavior

### Pre-writing state

- On a fresh empty draft, no writing mode is selected.
- The top-center pill is visible before the timer starts.
- Before writing, the pill shows only two buttons:
  - `Freewrite`
  - `Edit`
- The editor is ready to receive focus/input.
- If the user explicitly clicks `Freewrite`, the draft enters forward-only mode.
- If the user explicitly clicks `Edit`, the draft enters normal editable mode.
- If the user types or pastes before choosing a mode, the app automatically selects `Freewrite`.
- Auto-selection happens on any typing or paste, including whitespace.

### Freewrite mode

`Freewrite` mode preserves the app's current behavior:

- Backspace is blocked.
- Delete is blocked.
- Cut is blocked.
- Cmd/Ctrl+X is blocked.
- Undo/redo shortcuts are blocked.
- Selected text is not replaced by typing or paste; new input is inserted after the selection.
- Unsupported dropped/pasted media remains blocked or stripped.
- Formatting selected text remains allowed.

Once `Freewrite` is active, `Edit` is not available for the current draft. The unavailable `Edit` option should be hidden rather than shown disabled.

### Edit mode

`Edit` mode behaves like a normal rich-text editor:

- Backspace and Delete work.
- Cut works.
- Cmd/Ctrl+X works.
- Undo/redo shortcuts work.
- Typing or pasting over selected text replaces the selection.
- Normal compatible rich-text paste behavior is allowed.
- Existing formatting toolbar controls continue to work.

The app is still in-memory only. `Edit` mode does not add persistence, import/export, or multi-document behavior.

### Top mode/timer pill

The existing top timer pill becomes an interactive mode/status pill.

Before writing:

- Shows only `Freewrite` and `Edit` choices.
- Does not show `00:00`.

After mode selection and while drafting:

- Shows elapsed draft time once the timer has started.
- Shows the active mode as a compact chip/status.
- Does not show unavailable mode-switch actions after a mode has been selected.

After finalization:

- The top mode/timer pill is hidden.
- Existing finalized behavior remains: the toolbar is hidden, the draft is locked, and the TODO sidebar opens.

### Scrap behavior

Scrapping the draft resets:

- editor content,
- timer state,
- finalization/TODO sidebar state,
- writing mode selection.

After Scrap, the app returns to the fresh pre-writing state with no selected mode and the top pill showing `Freewrite` / `Edit` choices.

## Design decisions made

- Mode names: `Freewrite` and `Edit`.
- Initial state: no selected mode.
- If the user types or pastes before choosing, auto-select `Freewrite`.
- Auto-select `Freewrite` on any typing or paste, including whitespace.
- `Edit` mode should restore normal rich-text editing behavior, including delete, cut, undo/redo, and selected replacement.
- Mode selection is locked after choosing either `Freewrite` or `Edit`.
- `Edit` → `Freewrite` is not allowed in the same draft.
- `Freewrite` → `Edit` is not allowed in the same draft.
- Scrap resets to no selected mode.
- Before the timer starts, the top pill shows only mode options.
- After mode selection/writing starts, the top pill shows timer plus active mode chip/status.
- Unavailable mode options are hidden once either mode is active.
- The top pill hides after finalization.

## Relevant existing code/infrastructure

- `src/renderer/src/App.tsx`
  - Owns draft lifecycle state, timer state, finalization state, toolbar visibility, and Scrap reset behavior.
  - Natural home for `writingMode` state and allowed mode transition callbacks.
- `src/renderer/src/DraftTimer.tsx`
  - Current top-center elapsed timer component.
  - Should be replaced or wrapped by a mode/timer pill component that can render mode choices and elapsed time.
- `src/renderer/src/editor/ForwardOnlyEditor.tsx`
  - Current Tiptap editor component.
  - Always installs `NoDeletionExtension` and disables undo/redo today.
  - Needs mode-aware editor configuration.
- `src/renderer/src/editor/extensions/NoDeletionExtension.ts`
  - Implements Freewrite/no-edit behavior.
  - Should only be active or blocking when `Freewrite` mode is active.
- `src/renderer/src/editor/Toolbar.tsx`
  - Existing formatting toolbar remains at bottom and continues to work while drafting.
  - Toolbar is hidden after finalization; this remains unchanged.
- `src/renderer/src/styles.css`
  - Contains existing `.draft-timer` top pill styling.
  - Needs interactive top-pill styles because current timer is non-interactive and uses `pointer-events: none`.
- `docs/wiki/forward-only-editing.md`
  - Documents the existing behavior that becomes `Freewrite` mode.
- `docs/wiki/elapsed-draft-timer.md`
  - Documents current timer behavior that will become part of the mode/status pill.

## Extremely high-level technical approach

Add renderer-owned writing mode state with three possible values: no selected mode, `freewrite`, and `edit`. The editor receives the current mode and applies different Tiptap behavior based on it.

For `Freewrite`, keep the current no-deletion extension behavior and continue disabling undo/redo. For `Edit`, configure the editor for normal editing: do not block destructive keys, allow selected replacement, allow cut, and restore undo/redo support.

Replace the standalone `DraftTimer` display with a top mode/status pill that can render pre-writing mode buttons, current mode, and the elapsed timer. Keep timer lifecycle state in `App.tsx`, but hide the top pill after finalization.

Scrap resets writing mode state along with the existing draft/timer/finalization/sidebar state.

## Important specific code changes expected

- Add a writing mode type such as `type WritingMode = 'freewrite' | 'edit'` plus nullable/no-selected state.
- Add mode state and mode transition callbacks in `App.tsx`.
- Reset mode state in `scrapDraft()`.
- Auto-select `Freewrite` when typing or paste happens before mode selection.
- Make the editor mode-aware:
  - Freewrite uses no-deletion behavior.
  - Edit uses normal editing behavior.
- Restore undo/redo behavior in Edit mode while keeping it blocked in Freewrite mode.
- Replace or evolve `DraftTimer` into a component that renders the top mode/timer pill.
- Update top pill CSS to be interactive and visually aligned with the existing timer style.
- Update docs/wiki pages after implementation to describe writing modes.

## Architectural / infrastructure changes

- No backend or IPC changes are required.
- No persistence changes are required.
- This is a renderer-only feature.
- The existing no-deletion extension may need to become configurable by mode, or the editor component may need to conditionally include different extension sets.
- The current `ForwardOnlyEditor` name may become misleading; implementation may either rename it or keep the component and make its mode-aware behavior explicit.

## Open questions

- Exact microcopy/title text for the top pill controls beyond `Freewrite` and `Edit`.
- Whether a keyboard shortcut should exist for choosing/switching modes. No shortcut is specified for this iteration.
- Whether normal drag/drop into the editor should be restored in `Edit` mode or remain conservative. The default expectation is normal rich-text editing, but implementation may keep unsupported media blocking if needed for schema safety.

## Risks and tradeoffs

- Tiptap extension configuration may not be trivial to change at runtime; implementation may need a mode-aware plugin or editor reconfiguration strategy.
- Restoring undo/redo only in Edit mode requires careful configuration because undo/redo is currently disabled globally through `StarterKit` and blocked by the no-deletion extension.
- Auto-selecting Freewrite on any whitespace input can lock a user into no-edit mode from an accidental space; this is intentional per decision but may surprise users.
- Hiding unavailable mode options keeps the UI minimal but makes the locked-mode rule less explicit after selection.
- Introducing Edit mode weakens the product's original forward-only identity, so UI language should keep Freewrite as a first-class/default-feeling mode.
