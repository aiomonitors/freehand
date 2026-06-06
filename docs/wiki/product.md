# Freehand Product Wiki

Freehand is a desktop writing app for focused drafting. It supports a forward-only `Freewrite` mode and a normal rich-text `Edit` mode in the same ephemeral, single-document app.

The app stores draft state only in renderer memory and does not save or restore content across app quits.

## Product purpose

Freehand is designed for drafting without turning into a document manager. `Freewrite` helps writers keep moving forward by blocking destructive edit-back affordances. `Edit` supports ordinary rich-text drafting when the writer explicitly chooses a more flexible mode.

The experience should feel like typing directly onto a page rather than filling out a boxed input.

## Core principles

- `Freewrite` remains a first-class drafting constraint.
- `Edit` is explicit and normal, but still in-memory only.
- The document is temporary and single-draft.
- The interface should stay minimal and light.
- Rich-text formatting is allowed in both modes.
- Scrapping the draft is explicit and destructive.
- App features should avoid becoming a notes app, document manager, or writing analytics tool.

## Feature map

### Writing surface

See `writing-surface.md`.

The app opens to a full-page borderless editor with an off-white background, off-black text, and a subtle placeholder. The editor content is centered with a readable max width.

### Writing modes

See `writing-modes.md`.

A fresh draft starts with no selected mode. The top pill lets the user choose `Freewrite` or `Edit`; typing or pasting before choosing automatically selects `Freewrite`. Once either mode is selected, the mode is locked until the draft is scrapped.

### Forward-only editing

See `forward-only-editing.md`.

In `Freewrite` mode, the editor blocks destructive edits broadly, including Backspace, Delete, cut, undo, redo, selected-text replacement, and unsupported drag/drop or paste behavior.

### Rich-text formatting

See `rich-text-formatting.md`.

The app supports basic writing formatting: bold, italic, underline, strikethrough, headings, bullet lists, ordered lists, and blockquotes. Formatting selected text is allowed in both modes.

### Toolbar

See `toolbar.md`.

A compact pill toolbar sits fixed at the bottom center. It contains Scrap, Finalize, font cycling, and rich-text controls.

### Scrap flow

See `scrap-flow.md`.

The Scrap action clears the draft. If the editor contains non-whitespace text, the user must confirm in a custom destructive modal. Empty drafts clear immediately. Scrap resets writing mode selection.

### Fonts and typography

See `fonts-and-typography.md`.

The app provides three global document font choices and three text sizes. Font and size changes apply to the whole document presentation.

### Top mode/timer pill

See `elapsed-draft-timer.md` and `writing-modes.md`.

The top-center pill shows mode choices before drafting, active mode while drafting, and elapsed draft time once meaningful writing starts. It hides when the draft is finalized and resets when the draft is scrapped.

### Finalized TODO sidebar

See `finalized-todo-sidebar.md`.

A non-empty draft can be finalized with the toolbar or Cmd/Ctrl+Shift+Enter. Finalizing locks the editor, hides the toolbar and top pill, opens a right sidebar, and extracts simple checkbox TODO line items through a main-process Mastra/OpenRouter agent. TODO state remains in memory only.

### Electron shell

See `electron-shell.md`.

The app runs as a secure Electron desktop app with an isolated renderer, minimal preload, a hidden titlebar on macOS, and no file-system document APIs for v1.

## Current non-goals

- Persistence across app quits.
- Multiple documents.
- Save/open/export/import.
- Images, tables, or advanced embeds.
- Collaboration.
- Cloud sync.
- Markdown/source editing mode.
- Writing analytics or history.
- Persisted task management.
- Keyboard shortcuts for selecting writing modes.
- Unit tests for the initial version.

## State model

Freehand keeps document and presentation state in the renderer:

- editor document content
- selected writing mode
- selected global font
- selected global text size
- scrap modal state
- non-whitespace content detection
- elapsed timer start timestamp
- finalized draft state
- extracted TODO sidebar state

No app-level persistence is expected. Quitting the app loses the draft and selected writing mode.

## Important shortcuts

Available in both modes:

- Cmd/Ctrl+B: bold
- Cmd/Ctrl+I: italic
- Cmd/Ctrl+U: underline
- Cmd/Ctrl+Shift+F: cycle font
- Cmd/Ctrl+Shift+Enter: finalize draft
- Cmd/Ctrl+N: request Scrap
- Cmd/Ctrl+Enter: confirm Scrap only when the modal is open

Blocked in `Freewrite` mode:

- Backspace
- Delete
- Cmd/Ctrl+X
- Cmd/Ctrl+Z
- Cmd/Ctrl+Y
- Cmd/Ctrl+Shift+Z

Allowed normally in `Edit` mode:

- deletion
- cut
- undo/redo
- selected-text replacement

## Design tone

The UI should feel:

- calm
- minimal
- page-like
- light-mode only
- intentional
- less like a productivity dashboard and more like a focused drafting sheet

## Source-of-truth relationship

This wiki is the quick navigation layer for agents and humans. For deeper feature rationale, read `docs/specs/`. For implementation sequencing, read `docs/plans/`.
