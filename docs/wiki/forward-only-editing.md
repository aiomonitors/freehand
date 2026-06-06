# Forward-Only Editing

## Summary

Forward-only editing is the behavior of `Freewrite` mode. The user can add content and format content, but destructive editing paths are blocked.

`Edit` mode is different: it allows ordinary rich-text editing, including deletion, cut, undo/redo, and selected-text replacement.

## Goals

In `Freewrite` mode:

- Keep the writer moving forward.
- Prevent deleting existing content through common keyboard and clipboard actions.
- Prevent replacing selected content with typed or pasted input.
- Disable undo and redo so previous writing cannot be removed indirectly.

## Blocked actions in Freewrite

The app blocks:

- Backspace
- Delete
- Cut
- Cmd/Ctrl+X
- Cmd/Ctrl+Z
- Cmd/Ctrl+Y
- Cmd/Ctrl+Shift+Z
- destructive `beforeinput` events
- unsupported drop behavior

## Selected text behavior

Selecting text should not make it vulnerable to replacement in `Freewrite`.

When text is selected and the user types:

- the selected text remains
- the new text is inserted after the selection

When text is selected and the user pastes:

- the selected text remains
- pasted content is inserted after the selection

## Allowed behavior

Formatting selected text is allowed because formatting changes appearance without removing the selected content.

Examples:

- making selected text bold
- applying italic
- underlining selected text
- turning text into a blockquote

## Paste behavior

Pasted rich text is allowed when compatible with the supported schema.

Unsupported content is stripped or blocked, including:

- images
- media embeds
- tables
- external scripts/styles

## Mode relationship

A fresh draft has no selected mode. If the user types or pastes before choosing, Freehand automatically selects `Freewrite`, including for whitespace input.

Once `Freewrite` is active, the draft cannot switch to `Edit`. Likewise, an `Edit` draft cannot switch into `Freewrite`. The only way back to no selected mode is Scrap.

## Non-goals

- No undo/redo exceptions for formatting in `Freewrite`.
- No selective deletion mode inside `Freewrite`.
- No temporary unlock mode inside `Freewrite`.
- No hidden recovery history.

## Related code

- `src/renderer/src/editor/extensions/WritingModeGuardExtension.ts`
- `src/renderer/src/editor/WritingEditor.tsx`
- `src/renderer/src/writingModes.ts`

## Related features

- `writing-modes.md`
- `rich-text-formatting.md`
