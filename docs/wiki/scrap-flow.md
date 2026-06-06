# Scrap Flow

## Summary

Scrap is the destructive action that clears the current draft and returns the editor to an empty state.

Because Freehand has no persistence or undo, scrapping meaningful content requires explicit confirmation.

## User behavior

- The toolbar contains a `Scrap` button.
- Cmd/Ctrl+N triggers the same Scrap request.
- If the editor has no non-whitespace text, Scrap clears immediately.
- If the editor has non-whitespace text, a custom confirmation modal opens.

## Confirmation modal

The modal includes:

- title: `Scrap this draft?`
- body: `This will clear everything on the page. This cannot be undone.`
- cancel button: `Keep writing`
- destructive button: `Scrap draft`

## Keyboard behavior

- Escape cancels the modal.
- Cmd/Ctrl+Enter confirms only while the modal is open.
- Cmd/Ctrl+N should not repeatedly confirm an open modal.
- Enter alone should not be treated as the global confirmation shortcut.

## Reset behavior

When Scrap is confirmed:

- editor content is cleared
- content/dirty state becomes false
- Scrap modal closes
- elapsed draft timer resets
- editor is refocused
- selected font remains unchanged

## Related features

- `elapsed-draft-timer.md`
- `toolbar.md`
- `fonts-and-typography.md`

## Related code

- `src/renderer/src/App.tsx`
- `src/renderer/src/editor/ScrapConfirmModal.tsx`
