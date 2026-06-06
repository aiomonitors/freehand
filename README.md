# Freehand

Freehand is a desktop writing app for forward-only drafting. It gives you a full-page rich-text editor and intentionally blocks destructive editing actions so you can keep writing instead of revising in-place.

## Features

- Electron desktop app built with React, TypeScript, and electron-vite.
- Tiptap rich-text writing surface.
- Forward-only editing rules:
  - Backspace and Delete are blocked.
  - Cut is blocked.
  - Undo and redo are blocked.
  - Typing or pasting over selected text inserts after the selection instead of replacing it.
  - Drops and unsupported pasted media are blocked.
- Rich-text controls:
  - Bold
  - Italic
  - Underline
  - Strikethrough
  - Heading
  - Bullet list
  - Numbered list
  - Blockquote
- Font cycling between Inter, Space Grotesk, and Geist.
- Bottom-center floating toolbar.
- Scrap flow for clearing the current draft, with confirmation when content exists.
- Finalize flow that locks a draft, hides drafting controls, and extracts TODOs into a right sidebar via Mastra + OpenRouter.
- Simple checkbox TODO line items with reject, done/undone, and whole-row drag-reorder for active items.
- In-memory only: no persistence, saving, import, or export in v1.

## Stack

- Electron
- React
- TypeScript
- electron-vite
- Tiptap / ProseMirror
- Mastra + OpenRouter for TODO extraction
- @dnd-kit/react for TODO drag-and-drop
- PNPM
- ESLint flat config
- Prettier

## Requirements

- Node.js
- PNPM

## Install

```sh
pnpm install
```

If Electron's binary is missing after install, run:

```sh
pnpm exec electron --version
```

or:

```sh
pnpm rebuild electron
```

## AI TODO extraction configuration

Finalized TODO extraction requires an OpenRouter API key:

```sh
export OPENROUTER_API_KEY=your-openrouter-key
```

Optional model override:

```sh
export OPENROUTER_MODEL=openrouter/google/gemini-2.5-flash
```

Default model: `openrouter/google/gemini-2.5-flash`.

## Run in development

```sh
pnpm run dev
```

## Build

```sh
pnpm run build
```

## Preview production build

```sh
pnpm run preview
```

## Quality checks

```sh
pnpm run format:check
pnpm run lint
pnpm run typecheck
```

To format the project:

```sh
pnpm run format
```

## Keyboard shortcuts

- Cmd/Ctrl+B: bold
- Cmd/Ctrl+I: italic
- Cmd/Ctrl+U: underline
- Cmd/Ctrl+Shift+F: cycle font
- Cmd/Ctrl+Shift+Enter: finalize draft
- Cmd/Ctrl+N: scrap draft
- Cmd/Ctrl+Enter: confirm scrap dialog when open

Blocked shortcuts/actions:

- Backspace
- Delete
- Cmd/Ctrl+X
- Cmd/Ctrl+Z
- Cmd/Ctrl+Y
- Cmd/Ctrl+Shift+Z

## Project structure

```text
src/
  main/          Electron main process and TODO extraction backend
  preload/       Secure preload boundary
  shared/        Serializable shared IPC/types
  renderer/      React renderer app
    src/editor/  Tiptap editor, toolbar, modal, extensions
    src/todos/   Finalized TODO sidebar
```

## Notes

This app is intentionally ephemeral. Draft content and extracted TODOs live only in memory and are lost when the app quits or the draft is scrapped.
