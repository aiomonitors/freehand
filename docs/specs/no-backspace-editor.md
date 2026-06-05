# No-Backspace Editor Spec

## Overview

Build a desktop Electron app for forward-only writing: a full-page rich-text editor that prevents users from deleting existing content. The app is intentionally ephemeral: it supports one document at a time, does not persist work across quits, and lets the user scrap the current document after confirmation when content exists.

The experience should feel almost like typing directly onto a page rather than into a visible input. The editor sits centered on a light off-white background, with slightly off-black text and a compact pill-shaped control bar fixed at the bottom center.

## Goals

- Create a TypeScript + React + Electron desktop app.
- Provide a full-page, focused rich-text writing surface.
- Prevent destructive editing broadly, not only literal Backspace presses.
- Support standard rich-text formatting controls and shortcuts.
- Provide three app fonts: Inter, Space Grotesk, and Geist.
- Allow the user to cycle the font globally for the entire document.
- Allow the user to scrap/start over, with confirmation only when non-whitespace content exists.
- Keep the app visually minimal, light-mode only, and distraction-free.
- Use Prettier for formatting and ESLint 9 flat config for linting with TypeScript, React, and Electron-aware rules/presets.

## Non-goals

- No persistence across app quits.
- No multi-document support.
- No images or advanced embedded media.
- No collaboration, cloud sync, export, import, or file-system save/open behavior.
- No unit tests required for the initial build.
- No markdown/source editing mode.

## User-facing behavior

### Writing surface

- The app opens to a single empty editor.
- The editor has a subtle placeholder, such as `Start writing…`, which disappears once content is entered.
- The editor spans the available page visually, but its readable content width is capped at `1240px` and centered.
- The editor should look borderless and native to the page, not like a boxed text area.
- Light mode only:
  - Background: slightly off-white.
  - Text: slightly off-black.

### Forward-only editing rules

The app should prevent destructive edits broadly:

- Block Backspace.
- Block Delete.
- Block Cut.
- Prevent selected text from being replaced/deleted by typing or pasting.
- If the user types while text is selected, insertion should happen after the selection without removing the selected content.
- If the user pastes while text is selected, insertion should happen after the selection without removing the selected content.
- Formatting selected text is allowed.
- Sanitized rich paste is allowed, preserving basic supported formatting and lists while stripping unsupported content such as images.

Undo/redo should be disabled entirely for v1. This keeps the forward-only constraint conceptually strict and avoids users deleting prior additions via undo.

### Rich text controls

V1 supports the standard writing control set:

- Bold.
- Italic.
- Underline.
- Strikethrough.
- Heading/body toggle.
- Bullet list.
- Numbered list.
- Blockquote.

Shortcuts should use cross-platform `CommandOrControl` semantics:

- Cmd/Ctrl+B: bold.
- Cmd/Ctrl+I: italic.
- Cmd/Ctrl+U: underline.
- Additional standard shortcuts may be supported where provided by the editor foundation, as long as they do not violate the no-deletion policy.
- Cmd/Ctrl+Shift+F: cycle document font.
- Cmd/Ctrl+N: scrap/start fresh.
- Cmd/Ctrl+Enter: confirm the scrap/start-fresh dialog when it is open.

### Toolbar

- The toolbar is a compact pill fixed at the bottom center of the window.
- Shape should be ovular/pill-like, not a fully round floating button.
- It uses mixed labels and icons:
  - `Scrap` as a short text action.
  - Current font name as a text action: `Inter`, `Space Grotesk`, or `Geist`.
  - Formatting controls as compact icon-like buttons.
- Every toolbar item has a visible hover state.
- Active formatting states should be visually distinguishable.

### Scrap/start-fresh behavior

- The destructive fresh-document control is labeled `Scrap`.
- Cmd/Ctrl+N triggers the same behavior.
- If the editor contains no non-whitespace text, Scrap immediately clears/reset the editor.
- If the editor contains non-whitespace text, show a custom React modal confirmation.
- The modal must include:
  - A non-destructive cancel option.
  - A destructive confirmation button styled red.
  - Cmd/Ctrl+Enter as the confirm shortcut while the modal is open.
- The modal should avoid accidental confirmation from repeated Cmd/Ctrl+N presses.

### Fonts

- The app includes three selectable fonts:
  - Inter.
  - Space Grotesk.
  - Geist.
- Fonts will be loaded from Google Fonts for v1.
- The font control cycles through the fonts.
- Font changes apply globally to the entire editor/document, not only future input or the current selection.
- The toolbar font control displays the current font name.

## Design decisions made

- App stack: Electron + React + TypeScript.
- Build tooling: electron-vite is the preferred foundation because it matches Electron's main/preload/renderer split while using Vite for fast TypeScript/React development.
- React editor foundation: Tiptap.
- Formatting scope: standard writing controls, not expanded document/editor controls.
- Deletion policy: strict broad prevention of destructive edits.
- Shortcut scheme: cross-platform `CommandOrControl` semantics.
- Font-cycle shortcut: Cmd/Ctrl+Shift+F.
- Placeholder: subtle placeholder.
- Toolbar: mixed labels/icons, fixed bottom-center.
- New document label: `Scrap`.
- Confirmation: custom React modal, not native Electron dialog, to guarantee the red destructive state and exact keyboard behavior.
- Dirty/content detection: any non-whitespace text requires confirmation.
- Font source: Google Fonts.
- Font control display: show current font name.
- Undo/redo: disabled entirely.
- Selected typing/paste behavior: insert after selection without deleting selected content.
- Paste policy: allow sanitized rich paste.
- Window default: large window, approximately 1200×900 with reasonable minimum size.

## Rich text editor research summary

### Tiptap — selected

Tiptap is a React-friendly, headless rich-text editor built on ProseMirror. It provides a strong balance between bundled functionality and customizability.

Pros:

- Strong React integration.
- StarterKit covers common rich-text behavior.
- Extension system supports custom keyboard and paste behavior.
- Toolbar state/actions are straightforward through editor commands.
- Mature ecosystem and documentation.

Cons:

- ProseMirror concepts can add complexity beneath the Tiptap API.
- Strict no-deletion behavior will require custom extensions/plugins rather than only config.

Integration details:

- Use `@tiptap/react` for the editor component/hook.
- Use `@tiptap/starter-kit` for common nodes/marks, configured to disable undo/history behavior.
- Add underline support if not included in the chosen starter configuration.
- Add custom no-deletion behavior via Tiptap extension / ProseMirror plugin hooks for keyboard, clipboard, paste, and selection replacement behavior.
- Use editor commands for toolbar controls.

### Lexical

Pros:

- Meta-backed and performant.
- Command-driven architecture is well suited to intercepting keyboard behavior.
- Strong React plugin model.

Cons:

- More editor/plugin assembly work for the same v1 behavior.
- Toolbar and rich-text setup are less immediately bundled than Tiptap StarterKit.

Fit:

- A strong alternative if the project later needs deeper command-level control or a larger editor platform.

### Slate

Pros:

- Maximum control over document model and rendering.
- React-native mental model.

Cons:

- More custom implementation required for common rich-text behavior.
- Higher risk around selection, paste, and editing edge cases.

Fit:

- Too much custom editor work for this focused v1.

### Quill / ReactQuill

Pros:

- Quick basic WYSIWYG setup.
- Bundled toolbar behavior.

Cons:

- Older ecosystem and less ideal for deeply custom behavior.
- Less attractive for strict no-deletion semantics and a custom minimalist UI.

Fit:

- Not recommended for this project.

### Markdown/MDX editors

Pros:

- Good for markdown-first workflows and persisted plain-text documents.

Cons:

- The product asks for rich text, not markdown/source editing.
- Markdown semantics do not directly help with the no-backspace app concept.

Fit:

- Not recommended for v1.

## Relevant existing code/infrastructure

The repository is currently empty. The project will need to create all application code, configuration, and documentation from scratch.

Expected project structure should follow electron-vite conventions:

- `src/main/` for Electron main process code.
- `src/preload/` for any safe renderer bridge code.
- `src/renderer/` for the React app.
- Root-level Electron/Vite, TypeScript, ESLint, and Prettier config.

## Extremely high-level technical approach

Use electron-vite to scaffold/build the app. The Electron main process creates a large light-themed browser window and loads the React renderer. The renderer hosts a Tiptap editor with StarterKit-based rich text support, a custom no-deletion extension, a custom bottom-center toolbar, global font state, and a custom confirmation modal for scrapping non-empty work.

The document state remains in memory only. Scrapping resets the Tiptap document to an empty initial state and clears transient formatting state as appropriate. App quit does not save or restore content.

## Important specific code changes expected

Because the repository is empty, implementation will create the baseline project files, including but not limited to:

- `package.json` with Electron, React, TypeScript, Tiptap, electron-vite, ESLint, and Prettier dependencies/scripts.
- `electron.vite.config.ts` for main/preload/renderer bundling.
- TypeScript configs for Electron and React code.
- `eslint.config.mjs` using ESLint flat config, `typescript-eslint`, React-related lint rules, Electron/main-process globals, and `eslint-config-prettier` last.
- Prettier configuration.
- `src/main/index.ts` for window creation and app lifecycle.
- `src/preload/index.ts` for any future-safe bridge; likely minimal in v1.
- `src/renderer/src/App.tsx` for top-level editor UI and modal state.
- `src/renderer/src/editor/` for the Tiptap editor setup, toolbar, no-deletion extension, and formatting controls.
- `src/renderer/src/styles.css` for global layout, light-mode colors, editor typography, toolbar pill, hover states, and modal styling.

## Architectural / infrastructure decisions

- Use Tiptap as the rich-text abstraction rather than building directly on `contenteditable`.
- Keep Electron renderer isolated from Node APIs where possible.
- Prefer a custom React modal over Electron native dialogs for consistent styling and keyboard behavior.
- Treat font choice as app-level presentation state applied to the editor container/document root.
- Keep document data in renderer memory only.
- Use Google Fonts in v1 despite network dependency, with CSS fallback font stacks.

## Risks and tradeoffs

- Strict no-deletion behavior is nonstandard and may require careful handling of edge cases such as IME composition, paste, drag/drop, browser editing commands, and selected-text replacement.
- Disabling undo/redo may frustrate users who expect to undo accidental formatting or accidental inserted content, but it supports the forward-only writing concept.
- Loading fonts from Google Fonts means first-run/offline rendering may fall back to system fonts.
- Tiptap/ProseMirror supports rich editing well, but custom prevention of destructive edits must be tested manually against keyboard, mouse, paste, and selection flows.
- Bottom-center toolbar differs from the initial bottom-left request, but this was selected during brainstorming.

## Open questions

- Exact placeholder copy.
- Exact modal copy.
- Exact color tokens for off-white background, off-black text, toolbar, hover, active, and destructive states.
- Exact icon set or whether to use text glyphs for formatting buttons.
- Whether app menu items should mirror keyboard shortcuts, or whether shortcuts live only inside the renderer for v1.
