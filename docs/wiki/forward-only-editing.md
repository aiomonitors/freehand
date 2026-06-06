# Forward-Only Editing

## Summary

Forward-only editing is Freehand's defining product behavior. The user can add content and format content, but destructive editing paths are blocked.

## Goals

- Keep the writer moving forward.
- Prevent deleting existing content through common keyboard and clipboard actions.
- Prevent replacing selected content with typed or pasted input.
- Disable undo and redo so previous writing cannot be removed indirectly.

## Blocked actions

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

Selecting text should not make it vulnerable to replacement.

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

## Non-goals

- No undo/redo exceptions for formatting.
- No selective deletion mode.
- No temporary unlock mode.
- No hidden recovery history.

## Related code

- `src/renderer/src/editor/extensions/NoDeletionExtension.ts`
- `src/renderer/src/editor/ForwardOnlyEditor.tsx`
