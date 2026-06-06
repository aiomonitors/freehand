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
- preload is present but exposes no app APIs for current behavior

The renderer should not access Node APIs directly.

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
- `electron.vite.config.ts`
