# Ephemeral State

## Summary

Freehand is intentionally in-memory and single-document. Drafts are temporary.

## State stored in renderer memory

The renderer owns:

- Tiptap document content
- selected font
- editor readiness/reference
- non-whitespace content state
- Scrap modal state
- elapsed draft timer start timestamp
- finalized draft state
- finalized text snapshot
- extracted TODO items
- active/completed TODO ordering

## What is not persisted

The app does not persist:

- draft content
- font choice
- timer state
- finalized draft state
- extracted TODO items
- rejected/completed TODO state
- formatting history
- undo/redo history
- window-specific document data

Quitting the app loses the current draft.

## Why this matters

The no-persistence model keeps the app focused on drafting and avoids turning Freehand into a document manager.

It also keeps the Scrap action conceptually clear: Scrap clears the only current draft state, including any finalized TODO sidebar state.

## Constraints for future work

Any future persistence feature would be a major product direction change and should receive its own spec.

Persistence would need to answer:

- what is saved
- when it is saved
- whether forward-only history is preserved
- whether saved drafts can be edited later
- how Scrap interacts with saved content

## Related features

- `scrap-flow.md`
- `elapsed-draft-timer.md`
- `finalized-todo-sidebar.md`
- `electron-shell.md`
