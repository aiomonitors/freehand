# No-Backspace Editor Implementation Plan

Source spec: `docs/specs/no-backspace-editor.md`

## Implementation principles

- Build the app from scratch in the currently empty repository.
- Use Electron + React + TypeScript with `electron-vite`.
- Keep all document state in renderer memory only.
- Prefer simple, explicit React state over global state libraries.
- Use Tiptap for rich text and implement forward-only behavior through custom editor extensions/plugins plus renderer-level shortcut handling.
- Do not add unit tests for v1, per spec. Include manual validation steps instead.

## Phase 1 — Bootstrap project foundation

### 1. Create package and dependency setup

Create `package.json` with scripts:

- `dev`: run electron-vite dev server.
- `build`: typecheck and build Electron bundles.
- `preview`: preview built Electron app if supported by electron-vite.
- `typecheck`: run TypeScript checks.
- `lint`: run ESLint.
- `format`: run Prettier write.
- `format:check`: run Prettier check.

Install/runtime dependencies:

- `@electron-toolkit/preload`
- `@electron-toolkit/utils`
- `@tiptap/extension-placeholder`
- `@tiptap/extension-underline`
- `@tiptap/pm`
- `@tiptap/react`
- `@tiptap/starter-kit`
- `electron`
- `react`
- `react-dom`

Install/dev dependencies:

- `@eslint/js`
- `@types/node`
- `@types/react`
- `@types/react-dom`
- `@vitejs/plugin-react`
- `electron-vite`
- `eslint`
- `eslint-config-prettier`
- `eslint-plugin-react-hooks`
- `eslint-plugin-react-refresh`
- `globals`
- `prettier`
- `typescript`
- `typescript-eslint`
- `vite`

### 2. Add build/config files

Create:

- `electron.vite.config.ts`
- `tsconfig.json`
- `tsconfig.node.json`
- `tsconfig.web.json`
- `eslint.config.mjs`
- `prettier.config.mjs`
- `.gitignore`

Config requirements:

- Electron main and preload compile for Node/Electron context.
- Renderer compiles for browser/React context.
- ESLint uses flat config.
- `eslint-config-prettier` appears last.
- React hooks lint rules are enabled.
- Renderer avoids Node globals.

### 3. Create electron-vite directory structure

Create:

```text
src/
  main/
    index.ts
  preload/
    index.ts
  renderer/
    index.html
    src/
      main.tsx
      App.tsx
      styles.css
```

## Phase 2 — Electron shell

### 1. Implement main process window

In `src/main/index.ts`:

- Initialize Electron app.
- Create a `BrowserWindow` with:
  - Width: `1200`
  - Height: `900`
  - Minimum width: `800`
  - Minimum height: `600`
  - Light background color matching renderer background.
  - `contextIsolation: true`
  - `nodeIntegration: false`
  - Preload script configured.
- Load dev URL in development and renderer file in production.
- Handle macOS activate behavior.
- Quit on all windows closed except macOS.

### 2. Keep preload minimal

In `src/preload/index.ts`:

- Expose no app APIs for v1 unless needed.
- Keep the file present for Electron security posture and future bridge work.

### 3. Decide app menu behavior

For v1, implement shortcuts in renderer instead of app menu items unless platform behavior requires menu integration.

Manual check:

- App opens in a large window.
- No Node APIs are available in renderer.
- Dev and build modes launch successfully.

## Phase 3 — Renderer app skeleton

### 1. Mount React app

In `src/renderer/src/main.tsx`:

- Use `createRoot` from `react-dom/client`.
- Render `<App />`.
- Import global CSS.

### 2. Add app-level state

In `App.tsx`, track:

- `fontIndex` / selected font.
- Whether the scrap confirmation modal is open.
- Editor instance reference or callbacks from the editor component.
- Whether editor text contains non-whitespace content.

Create constants:

```ts
const FONTS = [
  { label: 'Inter', cssFamily: 'Inter, system-ui, sans-serif' },
  { label: 'Space Grotesk', cssFamily: 'Space Grotesk, system-ui, sans-serif' },
  { label: 'Geist', cssFamily: 'Geist, system-ui, sans-serif' },
]
```

### 3. Add global layout CSS

In `styles.css`:

- Import Google Fonts for Inter, Space Grotesk, Geist.
- Define CSS tokens for:
  - Background.
  - Text.
  - Muted text.
  - Toolbar background/border/shadow.
  - Hover state.
  - Active state.
  - Destructive red.
- Set `html`, `body`, `#root` to full height.
- Disable dark-mode overrides.
- Use off-white page background and off-black text.

Initial suggested tokens:

```css
--color-bg: #f7f4ee;
--color-text: #1f1f1d;
--color-muted: #8a857c;
--color-pill: rgba(255, 255, 255, 0.78);
--color-pill-border: rgba(31, 31, 29, 0.12);
--color-hover: rgba(31, 31, 29, 0.08);
--color-active: rgba(31, 31, 29, 0.12);
--color-danger: #d92d20;
--color-danger-hover: #b42318;
```

Manual check:

- React renders.
- Fonts load when network is available.
- Page uses the intended light theme.

## Phase 4 — Tiptap editor implementation

### 1. Create editor module structure

Create:

```text
src/renderer/src/editor/
  ForwardOnlyEditor.tsx
  Toolbar.tsx
  ScrapConfirmModal.tsx
  extensions/
    NoDeletionExtension.ts
  editorUtils.ts
```

### 2. Configure Tiptap editor

In `ForwardOnlyEditor.tsx`:

- Use `useEditor` and `EditorContent` from `@tiptap/react`.
- Configure extensions:
  - `StarterKit` with history disabled.
  - `Underline`.
  - `Placeholder` with subtle copy, default: `Start writing…`.
  - Custom `NoDeletionExtension`.
- Set initial content to an empty document.
- Add `onUpdate` callback to compute non-whitespace text content and report it to `App`.
- Apply selected font to the editor wrapper/container so the entire document updates globally.
- Ensure editor auto-focuses on app load.

StarterKit note:

- Configure history/undo-redo off. If the installed Tiptap version exposes `history: false`, use that. Otherwise omit/import history separately in a way that excludes undo-redo behavior.

### 3. Implement formatting API

Expose editor actions to toolbar:

- `toggleBold()`
- `toggleItalic()`
- `toggleUnderline()`
- `toggleStrike()`
- `toggleHeading()` between paragraph and heading level 1 or 2.
- `toggleBulletList()`
- `toggleOrderedList()`
- `toggleBlockquote()`

Expose active states:

- `editor.isActive('bold')`
- `editor.isActive('italic')`
- etc.

Manual check:

- Editor accepts text input.
- Placeholder appears only when empty.
- Formatting buttons and shortcuts work.
- Formatting selected text does not count as deletion.

## Phase 5 — Forward-only/no-deletion behavior

### 1. Block destructive keys

In `NoDeletionExtension.ts`, add ProseMirror plugin behavior to intercept keyboard events:

- Block `Backspace`.
- Block `Delete`.
- Block undo/redo shortcuts:
  - Cmd/Ctrl+Z.
  - Cmd/Ctrl+Shift+Z.
  - Cmd/Ctrl+Y.
- Block cut shortcut:
  - Cmd/Ctrl+X.

Return handled/prevented for these actions.

### 2. Block cut events

Handle DOM `cut` events:

- `preventDefault()`.
- Do not mutate the document.

### 3. Prevent selected-text replacement

When text is selected and the user types:

- Detect non-empty selection before text insertion.
- Move the selection/cursor to the end of the current selection.
- Insert the typed input there instead of replacing selection.

Implementation approach:

- In ProseMirror plugin `handleTextInput`, if `from !== to`:
  - Create a transaction that sets selection to `to`.
  - Insert the incoming text at `to`.
  - Dispatch the transaction.
  - Return `true` to prevent default replacement.

### 4. Prevent selected paste replacement

When text is selected and the user pastes:

- Move cursor to the end of the selection.
- Insert sanitized pasted content after the selected content.
- Return handled so default replacement does not occur.

Implementation approach:

- Use ProseMirror paste hooks such as `handlePaste` or `transformPasted` depending on which gives cleanest behavior with Tiptap.
- Strip unsupported nodes such as images from pasted slices.
- Preserve supported basic marks/lists where possible.

### 5. Sanitize paste

Sanitized rich paste should:

- Preserve basic text formatting if compatible:
  - Bold.
  - Italic.
  - Underline.
  - Strike.
  - Paragraphs.
  - Headings.
  - Bullet/ordered lists.
  - Blockquotes.
- Drop unsupported content:
  - Images.
  - Media embeds.
  - Tables unless StarterKit support makes them safe, but v1 should not expose tables.
  - External scripts/styles.

Implementation approach:

- Rely on Tiptap/ProseMirror schema to reject unsupported nodes.
- Add explicit filtering for image/media nodes if they appear in pasted slices.
- If rich paste proves fragile, fallback to sanitized text-only paste as an implementation fallback, but keep the intended behavior documented.

### 6. Consider drag/drop

To avoid accidental replacement or unsupported content insertion:

- Disable/drop-prevent file/image drag-drop into the editor.
- Either block all drops or handle text drops using the same insertion-after-selection policy.

Manual no-deletion validation matrix:

- Backspace does nothing.
- Delete does nothing.
- Cmd/Ctrl+X does nothing and text remains.
- Context-menu cut does not remove text.
- Cmd/Ctrl+Z does nothing.
- Cmd/Ctrl+Y / Cmd/Ctrl+Shift+Z does nothing.
- Select text and type: selected text remains; new text appears after selection.
- Select text and paste: selected text remains; pasted content appears after selection.
- Paste image/media: unsupported content is not inserted.
- Formatting selected text still works.

## Phase 6 — Toolbar

### 1. Build bottom-center pill

In `Toolbar.tsx`:

- Fixed position at bottom center.
- Horizontal flex layout.
- Pill background, border, subtle shadow/backdrop blur.
- Mixed controls:
  - `Scrap`
  - Font name button.
  - Bold `B`
  - Italic `I`
  - Underline `U`
  - Strike `S`
  - Heading `H`
  - Bullet list `•`
  - Numbered list `1.`
  - Quote `“”`
- Use `button` elements with accessible labels.
- Add hover and active states.

### 2. Wire toolbar actions

- `Scrap` calls `requestScrap()` from `App`.
- Font button calls `cycleFont()` from `App`.
- Formatting buttons call Tiptap chain commands.
- Disable formatting buttons until editor instance is ready.

Manual check:

- Toolbar stays bottom-center during resize.
- Hover states are visible.
- Active formatting states are visible.
- Buttons do not steal focus permanently from editor; after action, editor remains focused or refocuses.

## Phase 7 — Scrap confirmation modal

### 1. Implement modal component

In `ScrapConfirmModal.tsx`:

- Render only when confirmation is needed.
- Use a backdrop and centered dialog.
- Include copy:
  - Title: `Scrap this draft?`
  - Body: `This will clear everything on the page. This cannot be undone.`
  - Cancel button: `Keep writing`
  - Destructive button: `Scrap draft`
- Style destructive button red.
- Trap basic focus within modal if straightforward; at minimum, focus the cancel button or modal on open.
- Escape closes/cancels.

### 2. Confirmation shortcut behavior

While modal is open:

- Cmd/Ctrl+Enter confirms.
- Cmd/Ctrl+N should not confirm and should not repeatedly trigger new state.
- Enter alone should not confirm unless intentionally implemented for focused button behavior.

### 3. Scrap action

When confirmed:

- Reset Tiptap content to an empty document.
- Clear confirmation modal state.
- Set dirty/content state to false.
- Refocus editor.
- Keep the currently selected font unless implementation discovers a strong reason to reset it. Font choice is presentation state, not document content.

Manual check:

- Empty editor: Scrap clears immediately and no modal appears.
- Non-empty editor: Scrap opens modal.
- Red destructive button clears content.
- Cancel preserves content.
- Cmd/Ctrl+Enter confirms only while modal is open.
- Cmd/Ctrl+N does not mindlessly confirm the modal.

## Phase 8 — Keyboard shortcuts

### 1. Rich text shortcuts

Rely on Tiptap/default browser behavior where safe for:

- Cmd/Ctrl+B.
- Cmd/Ctrl+I.
- Cmd/Ctrl+U.

Ensure these shortcuts do not conflict with no-deletion plugin behavior.

### 2. App shortcuts in renderer

Add a renderer-level keydown listener in `App` or a dedicated hook:

- Cmd/Ctrl+Shift+F: cycle font.
- Cmd/Ctrl+N: request scrap.
- Cmd/Ctrl+Enter: confirm scrap only if modal is open.

Implementation detail:

- Use a helper to detect `event.metaKey || event.ctrlKey`.
- Call `preventDefault()` for handled app shortcuts.
- Avoid registering duplicate listeners across renders.

Manual check:

- Shortcuts work on macOS with Cmd.
- Shortcuts work on Windows/Linux semantics with Ctrl when applicable.
- Shortcut actions do not violate no-deletion rules.

## Phase 9 — Styling and polish

### 1. Editor page styling

In `styles.css`:

- Editor viewport has generous padding and bottom padding so toolbar does not cover text.
- Content area max-width: `1240px`.
- Content area centered.
- Borderless editor.
- Comfortable line-height.
- Responsive font size with sensible minimum/maximum.
- Remove default focus outline from editor content only if replaced with a subtle accessible focus style.

Suggested editor values:

```css
.editor-shell {
  min-height: 100vh;
  padding: 8vh clamp(24px, 6vw, 96px) 120px;
}

.editor-content {
  max-width: 1240px;
  margin: 0 auto;
  font-size: clamp(1.4rem, 2vw, 2.25rem);
  line-height: 1.45;
}
```

### 2. Rich content styling

Style Tiptap content for:

- Paragraph spacing.
- Headings.
- Lists.
- Blockquotes.
- Placeholder.
- Selected text.

### 3. Modal styling

- Keep modal visually consistent with page.
- Ensure red destructive button is unmistakable.
- Keep backdrop subtle.

Manual check:

- App feels like writing on the page, not in a box.
- Toolbar does not obscure active typing area.
- Layout works at minimum window size and large screen sizes.

## Phase 10 — Lint, typecheck, build, and manual QA

### 1. Run quality commands

Run:

```sh
npm run format:check
npm run lint
npm run typecheck
npm run build
```

Fix all reported issues.

### 2. Manual QA checklist

Application shell:

- App launches in dev.
- App builds successfully.
- App opens a 1200×900-ish window.
- Renderer is isolated from Node.

Writing:

- Placeholder appears on empty doc.
- Typing works.
- Rich text controls work.
- Rich text shortcuts work.
- Pasted rich text is accepted when supported.
- Pasted unsupported content is stripped/blocked.

Forward-only rules:

- Backspace blocked.
- Delete blocked.
- Cut blocked.
- Undo/redo blocked.
- Selected typing inserts after selection.
- Selected paste inserts after selection.
- Formatting selected text still works.

Toolbar:

- Bottom-center pill position.
- Hover states on all items.
- Active states for formatting.
- Font button cycles Inter → Space Grotesk → Geist → Inter.
- Font change affects whole document.

Scrap flow:

- Empty Scrap resets without modal.
- Non-empty Scrap opens modal.
- Cancel preserves content.
- Red destructive confirm clears content.
- Cmd/Ctrl+N opens modal for non-empty content.
- Cmd/Ctrl+Enter confirms only with modal open.

Visual:

- Light off-white background.
- Slightly off-black text.
- Editor max width `1240px` and centered.
- Editor does not look boxed.

## Implementation order summary

1. Bootstrap package/config/project structure.
2. Implement Electron main/preload shell.
3. Mount React renderer and global styles.
4. Add Tiptap editor with basic rich-text support.
5. Add toolbar and formatting actions.
6. Add font cycling and global font application.
7. Add no-deletion extension and selected insertion behavior.
8. Add scrap confirmation modal.
9. Add renderer app shortcuts.
10. Polish styling.
11. Run lint/typecheck/build and manual QA.

## Known implementation risks

- Tiptap/ProseMirror paste handling may need iteration to preserve rich text while preventing selected replacement.
- Undo/redo disabling depends on correct StarterKit/history configuration and shortcut interception.
- IME/composition behavior may need manual validation; do not break composition input when implementing `handleTextInput`.
- Native browser context-menu cut may require explicit DOM event prevention in addition to keyboard shortcut blocking.
- Google Fonts require network access; fallback stacks should be acceptable when offline.
