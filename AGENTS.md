# AGENTS.md

Guidance for coding agents working in this repo.

- Use PNPM for all package commands.
- Keep the app Electron + React + TypeScript with electron-vite.
- Keep document state in renderer memory only; do not add persistence unless explicitly requested.
- Preserve the forward-only editing model: do not introduce deletion, cut, undo, redo, or selected-text replacement behavior.
- Prefer simple React state over global state libraries.
- Keep renderer code isolated from Node APIs. Add preload IPC only when necessary and keep exposed APIs minimal.
- Run these before handing off changes:

```sh
pnpm run format:check
pnpm run lint
pnpm run typecheck
pnpm run build
```

- Use Conventional Commits for commit messages, for example `feat(editor): add formatting control`.
