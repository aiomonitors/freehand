# Finalized Reflection Extraction Implementation Plan

Source spec: `docs/specs/finalized-reflection-extraction.md`

## Constraints

- Use PNPM for package commands.
- Keep renderer isolated from Node APIs.
- Keep OpenRouter credentials in the Electron main process.
- Keep all draft, TODO, goal, and reflection-question state in renderer memory only.
- Preserve the existing forward-only editing model and finalization lifecycle.
- Do not add persistence, manual goal/question editing, or new document management behavior.

## Phase 1 — Shared IPC types and channels

1. Add shared serializable types for finalized reflection outputs.
   - Goals request/response.
   - Extracted goal shape: `id`, `text`, `rationale`.
   - Reflective questions request/response.
   - Extracted question shape: `id`, `text`.
2. Add IPC channel constants for:
   - goals extraction,
   - reflective questions extraction.
3. Keep the existing TODO types and channel unchanged.

## Phase 2 — Main-process extraction services

1. Add a main-process goals extraction service.
   - Use Mastra `Agent` with OpenRouter model config.
   - Validate structured output with Zod.
   - Return at most 3 goals.
   - Each goal must include concise text and a brief rationale.
   - Empty/whitespace draft returns no goals without calling the model.
2. Add a main-process reflective questions extraction service.
   - Use Mastra `Agent` with OpenRouter model config.
   - Validate structured output with Zod.
   - Return at most 3 reflective questions.
   - Questions should invite reflection and avoid TODO/action framing.
   - Empty/whitespace draft returns no questions without calling the model.
3. Reuse the existing OpenRouter environment convention:
   - `OPENROUTER_API_KEY` required.
   - `OPENROUTER_MODEL` optional.
4. Preserve the structured-output compatibility fallback pattern used by TODO extraction.

## Phase 3 — IPC handlers and preload bridge

1. Add IPC handlers for goals and reflective questions.
   - Validate request shape with Zod.
   - Call the corresponding main-process extraction service.
   - Return safe serializable errors.
2. Register the new handlers from `src/main/index.ts`.
3. Extend `src/preload/index.ts` with narrow typed methods:
   - `window.freehand.extractGoals(...)`
   - `window.freehand.extractReflectionQuestions(...)`
4. Extend renderer preload global typings.

## Phase 4 — Renderer state and finalization flow

1. Add renderer state for goals extraction:
   - status,
   - error,
   - extracted goals,
   - active request id ref.
2. Add renderer state for reflective questions extraction:
   - status,
   - error,
   - extracted questions,
   - active request id ref.
3. On finalization, start TODO, goals, and reflective questions extraction in parallel against the same finalized text snapshot.
4. Keep each request guarded against stale results after Scrap or retry.
5. Add independent retry handlers for goals and reflective questions.
6. Reset all new extraction state and request guards on Scrap.

## Phase 5 — Finalized sidebar UI

1. Extend the existing finalized sidebar into a stacked finalized-output sidebar.
2. Keep the TODO section behavior intact.
3. Add a Goals section:
   - independent loading/error/empty states,
   - read-only goal text,
   - brief rationale.
4. Add a Reflective Questions section:
   - independent loading/error/empty states,
   - read-only question prompts.
5. Add styles for stacked sections and read-only reflection cards.

## Phase 6 — Documentation

1. Update `README.md` to describe finalized reflection extraction.
2. Update `docs/wiki/finalized-todo-sidebar.md` to document the broader finalized sidebar behavior.
3. Update `docs/wiki/electron-shell.md` for the expanded preload IPC surface.
4. Update `docs/wiki/ephemeral-state.md` and `docs/wiki/product.md` for goals/questions state.

## Verification

Run before handoff:

```sh
pnpm run format:check
pnpm run lint
pnpm run typecheck
pnpm run build
```

If formatting fails because new files need formatting, run `pnpm run format`, then rerun the required checks.
