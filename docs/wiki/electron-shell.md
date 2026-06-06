# Electron Shell

## Summary

Freehand is a desktop Electron app using electron-vite. The shell exists to host the renderer securely and minimally.

## Window behavior

- Default size is approximately `1200x900`.
- Minimum size is `800x600`.
- The window background matches the renderer off-white color.
- On macOS, the titlebar is hidden while native traffic-light controls remain available.
- The app reopens a window on macOS activate if no windows are open.
- The app quits on all windows closed except on macOS.

## Security posture

Renderer security is intentionally restrictive:

- `contextIsolation: true`
- `nodeIntegration: false`
- preload exposes only minimal `window.freehand.extractTodos(...)`, `window.freehand.extractGoals(...)`, and `window.freehand.extractReflectionQuestions(...)` APIs for finalized output extraction

The renderer should not access Node APIs directly. OpenRouter credentials remain in the main-process/backend boundary.

## Backend IPC

The finalized output sidebar uses dedicated IPC channels to ask the main process to extract TODOs, goals, and reflective questions from a finalized text snapshot. The main process validates each request, runs the corresponding Mastra/OpenRouter extraction service, and returns serializable data.

IPC channels:

- `todo:extract`
- `goals:extract`
- `reflection-questions:extract`

Required environment variable:

- `OPENROUTER_API_KEY`

Optional environment variable:

- `OPENROUTER_MODEL`

## Persistence and file access

The shell does not provide document file APIs.

Current non-goals include:

- save
- open
- export
- import
- restore on launch
- filesystem-backed document state

## App menu

Current app-specific shortcuts live in the renderer rather than custom Electron menu items.

## Related code

- `src/main/index.ts`
- `src/preload/index.ts`
- `src/main/registerTodoIpc.ts`
- `src/main/registerReflectionIpc.ts`
- `src/main/todoExtraction.ts`
- `src/main/reflectionExtraction.ts`
- `src/main/openRouterExtraction.ts`
- `electron.vite.config.ts`
