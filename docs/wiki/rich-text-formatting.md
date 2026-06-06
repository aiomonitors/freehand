# Rich-Text Formatting

## Summary

Freehand supports a small standard rich-text formatting set so drafts can have structure without becoming a full document editor.

## Supported controls

- Bold
- Italic
- Underline
- Strikethrough
- Heading
- Bullet list
- Numbered list
- Blockquote

## Shortcuts

Supported rich-text shortcuts include:

- Cmd/Ctrl+B: bold
- Cmd/Ctrl+I: italic
- Cmd/Ctrl+U: underline

Other editor-provided shortcuts may work normally in `Edit` mode, but must not violate `Freewrite` behavior.

## Heading behavior

The toolbar heading control toggles heading formatting for the active block. The implementation currently uses Tiptap heading support with levels 1 and 2 available in configuration.

## Selection behavior

Formatting selected text is allowed in both writing modes. In `Freewrite`, this is an explicit exception to the no-editing feel because it does not delete or replace content.

## Constraints

Formatting must not:

- bypass `Freewrite` deletion rules
- bypass `Freewrite` selected-text replacement rules
- require persistence
- add complex document structures like tables

## Related code

- `src/renderer/src/editor/Toolbar.tsx`
- `src/renderer/src/editor/WritingEditor.tsx`
