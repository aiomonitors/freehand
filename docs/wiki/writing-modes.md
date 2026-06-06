# Writing Modes

## Summary

Freehand supports two writing modes for the current in-memory draft:

- `Freewrite`: the forward-only/no-editing experience.
- `Edit`: a normal rich-text editing experience.

A fresh draft starts with no selected mode.

## Choosing a mode

Before writing, the top-center mode pill shows two choices:

- `Freewrite`
- `Edit`

The editor can still receive focus before a mode is chosen.

If the user types or pastes before choosing a mode, Freehand automatically selects `Freewrite`. This includes whitespace input.

## Freewrite mode

`Freewrite` preserves the forward-only behavior:

- deletion is blocked
- cut is blocked
- undo and redo are blocked
- typing over selected text inserts after the selection instead of replacing it
- pasting over selected text inserts after the selection instead of replacing it
- unsupported pasted or dropped media remains blocked or stripped

Formatting selected text remains allowed.

## Edit mode

`Edit` behaves like a normal rich-text editor:

- Backspace and Delete work
- cut works
- undo and redo work
- typing or pasting over selected text replaces it
- compatible rich-text paste works normally
- toolbar formatting controls continue to work

`Edit` does not add persistence, file APIs, multiple documents, or save/open/export behavior.

## Mode lock

Mode selection is locked during a draft:

- no selected mode → `Freewrite` or `Edit`
- never `Edit` → `Freewrite`
- never `Freewrite` → `Edit`

Scrapping the draft resets mode selection back to no selected mode.

## Top mode/timer pill

The top-center pill owns mode choice and draft status:

- Before mode selection, it shows only `Freewrite` and `Edit`.
- After mode selection, it shows the active mode.
- Once meaningful writing starts, it also shows elapsed draft time.
- After either mode is selected, unavailable mode choices are hidden.
- After finalization, it is hidden.

Selecting a mode alone does not start the timer. The timer starts only when the editor first contains non-whitespace text.

## Related code

- `src/renderer/src/App.tsx`
- `src/renderer/src/ModeTimerPill.tsx`
- `src/renderer/src/writingModes.ts`
- `src/renderer/src/editor/WritingEditor.tsx`
- `src/renderer/src/editor/extensions/WritingModeGuardExtension.ts`

## Related features

- `forward-only-editing.md`
- `elapsed-draft-timer.md`
- `scrap-flow.md`
- `ephemeral-state.md`
