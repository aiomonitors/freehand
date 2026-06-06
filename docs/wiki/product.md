# Freehand Product Wiki

Freehand is a desktop writing app for forward-only drafting. It provides a calm rich-text writing surface while deliberately preventing destructive editing actions such as deleting, cutting, replacing selected text, undoing, and redoing.

The app is intentionally ephemeral: it supports one document at a time, stores draft state only in renderer memory, and does not save or restore content across app quits.

## Product purpose

Freehand is designed for drafting without revision loops. It helps writers keep moving forward by removing common edit-back affordances while still allowing basic rich-text expression.

The experience should feel like typing directly onto a page rather than filling out a boxed input.

## Core principles

- Forward-only writing is the central constraint.
- The document is temporary and in-memory only.
- The interface should stay minimal and light.
- Rich-text formatting is allowed when it does not delete content.
- Scrapping the draft is explicit and destructive.
- App features should avoid becoming a full document editor, notes app, or writing analytics tool.

## Feature map

### Writing surface

See `writing-surface.md`.

The app opens to a full-page borderless editor with an off-white background, off-black text, and a subtle placeholder. The editor content is centered with a readable max width.

### Forward-only editing

See `forward-only-editing.md`.

The editor blocks destructive edits broadly, including Backspace, Delete, cut, undo, redo, selected-text replacement, and unsupported drag/drop or paste behavior.

### Rich-text formatting

See `rich-text-formatting.md`.

The app supports basic writing formatting: bold, italic, underline, strikethrough, headings, bullet lists, ordered lists, and blockquotes. Formatting selected text is allowed because it does not remove content.

### Toolbar

See `toolbar.md`.

A compact pill toolbar sits fixed at the bottom center. It contains Scrap, Finalize, font cycling, and rich-text controls.

### Scrap flow

See `scrap-flow.md`.

The Scrap action clears the draft. If the editor contains non-whitespace text, the user must confirm in a custom destructive modal. Empty drafts clear immediately.

### Fonts and typography

See `fonts-and-typography.md`.

The app provides three global document font choices: Inter, Space Grotesk, and Geist. Font changes apply to the whole document presentation.

### Elapsed draft timer

See `elapsed-draft-timer.md`.

Once the user begins meaningful writing, a subtle top-center timer appears and counts elapsed draft time. It hides when the draft is finalized and resets when the draft is scrapped.

### Finalized TODO sidebar

See `finalized-todo-sidebar.md`.

A non-empty draft can be finalized with the toolbar or Cmd/Ctrl+Shift+Enter. Finalizing locks the editor, hides the toolbar and timer, opens a right sidebar, and extracts simple checkbox TODO line items through a main-process Mastra/OpenRouter agent. TODO state remains in memory only.

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
- Unit tests for the initial version.

## State model

Freehand keeps document and presentation state in the renderer:

- editor document content
- selected global font
- scrap modal state
- non-whitespace content detection
- elapsed timer start timestamp
- finalized draft state
- extracted TODO sidebar state

No app-level persistence is expected. Quitting the app loses the draft.

## Important shortcuts

- Cmd/Ctrl+B: bold
- Cmd/Ctrl+I: italic
- Cmd/Ctrl+U: underline
- Cmd/Ctrl+Shift+F: cycle font
- Cmd/Ctrl+Shift+Enter: finalize draft
- Cmd/Ctrl+N: request Scrap
- Cmd/Ctrl+Enter: confirm Scrap only when the modal is open

Blocked actions include:

- Backspace
- Delete
- Cmd/Ctrl+X
- Cmd/Ctrl+Z
- Cmd/Ctrl+Y
- Cmd/Ctrl+Shift+Z

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
