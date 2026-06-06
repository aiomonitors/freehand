# Finalized Reflection Extraction Spec

## Overview

Extend Freehand's existing finalization flow with two additional post-finalization extraction agents:

- a Goals Extraction Agent
- a Reflective Questions Extraction Agent

When the user clicks `Finalize` or uses the existing finalization shortcut, Freehand already snapshots the finalized draft, locks the editor, opens the right sidebar, and starts TODO extraction. This feature adds goals and reflective follow-up questions to that same finalized sidebar. All three extraction jobs run against the same finalized plain-text snapshot.

The new outputs are read-only reflection aids. Goals help the writer see what the draft appears to be trying to accomplish. Follow-up questions help the writer reflect more deeply after finishing the draft. They are not editable, checkable, persisted, or treated as additional TODOs.

## Goals

- Add two post-finalization agents that run after the draft is finalized.
- Extract up to 3 goals from the finalized draft, each with a brief rationale.
- Extract up to 3 reflective follow-up questions from the finalized draft.
- Show goals and reflective questions in the same right sidebar as TODOs, as stacked sections.
- Run TODO, goals, and questions extraction in parallel with independent loading/error/empty states.
- Allow failed goals/questions sections to be retried independently against the same finalized snapshot.
- Keep all extracted state ephemeral and renderer-owned.
- Keep OpenRouter credentials and Mastra agent execution in the Electron main process.

## Non-goals

- No persistence of extracted goals or questions.
- No editing, rejecting, checking, reordering, or manually adding goals/questions.
- No replacement of the existing TODO extraction behavior.
- No automatic re-extraction after successful finalization except explicit retry for failed sections.
- No model selector UI.
- No changes to the forward-only editing model before finalization.
- No changes to draft finalization semantics: finalization still locks the editor and requires scrapping to start over.

## User-facing behavior

### Finalization

The existing finalization trigger remains unchanged:

- The user clicks `Finalize`, or
- The user presses Cmd/Ctrl+Shift+Enter.

After finalization:

- the draft text is snapshotted,
- the editor becomes read-only,
- the bottom toolbar and top mode/timer pill remain hidden,
- the right sidebar opens,
- TODO, goals, and reflective questions extraction start in parallel.

### Sidebar layout

The existing right sidebar becomes a stacked finalized-output sidebar with sections for:

1. TODOs
2. Goals
3. Reflective Questions

The TODO section preserves existing behavior: loading, error/retry, empty, active TODOs, completed TODOs, reject, checkbox, and active-item drag reordering.

The Goals section displays read-only goal cards or rows. Each goal includes:

- concise goal text,
- a brief rationale explaining why the agent inferred that goal from the draft.

The Reflective Questions section displays read-only prompts. Each prompt should be phrased as a question that invites reflection rather than as an action item.

### Independent loading, error, and empty states

Each section owns its own extraction status:

- `loading`: the section shows a localized loading message.
- `ready` with results: the section shows its extracted items.
- `ready` with no results: the section shows a compact empty state.
- `error`: the section shows an error message and a section-specific Retry button.

If one extraction fails, successful sections remain visible and usable. Retrying Goals does not rerun or overwrite TODOs or Questions. Retrying Questions does not rerun or overwrite TODOs or Goals.

### Output limits

- TODO extraction remains capped at 8 items.
- Goals extraction returns at most 3 goals.
- Reflective Questions extraction returns at most 3 questions.

## Design decisions made

- Goals and reflective questions appear in the same finalized right sidebar as TODOs.
- The sidebar uses stacked sections rather than tabs or a separate reflection panel.
- TODO, goals, and questions extraction run in parallel after finalization.
- Each section has independent loading, error, empty, and retry behavior.
- Goals are read-only and include a brief rationale.
- Reflective questions are read-only prompts optimized for reflection, not clarification tasks or TODOs.
- Goals and reflective questions each have a strict maximum of 3 items.
- All extracted outputs remain in memory only and reset on Scrap.
- Main-process Mastra/OpenRouter execution remains behind minimal preload IPC.

## Relevant existing code/infrastructure

- `src/renderer/src/App.tsx`
  - Owns finalization state, finalized draft snapshot, extraction status, TODO state, stale-result guards, retry behavior, and Scrap reset behavior.
  - Natural home for adding goals/questions state and independent request guards.
- `src/renderer/src/todos/TodoSidebar.tsx`
  - Current finalized right sidebar component.
  - Should evolve into a finalized-output sidebar or compose TODO, Goals, and Questions sections.
- `src/renderer/src/todos/todoTypes.ts`
  - Existing renderer TODO state types.
  - Goals/questions should use separate types because they are read-only reflection outputs, not TODO items.
- `src/main/todoExtraction.ts`
  - Existing Mastra/OpenRouter structured-output extraction service.
  - Provides the pattern for agent creation, prompt construction, Zod schemas, structured output fallback, normalization, and API-key handling.
- `src/main/registerTodoIpc.ts`
  - Existing IPC handler pattern for validating renderer requests and returning safe errors.
- `src/preload/index.ts`
  - Current minimal preload bridge exposes `window.freehand.extractTodos(...)`.
  - New APIs should remain narrow and typed.
- `src/shared/ipcChannels.ts`
  - Existing shared IPC channel constants.
- `src/shared/todos.ts`
  - Existing shared TODO request/response types.
  - New shared types should be added for goals and reflective questions, either in dedicated files or a broader finalized extraction shared module.
- `docs/wiki/finalized-todo-sidebar.md`
  - Documents the current finalized sidebar behavior and should be updated after implementation.
- `docs/wiki/ephemeral-state.md`
  - Establishes that finalized output state is in memory only.
- `docs/wiki/electron-shell.md`
  - Establishes renderer isolation and the IPC boundary.

## Extremely high-level technical approach

Extend the finalized extraction pipeline from a single TODO extraction request into three independent finalized-output requests. On finalization, the renderer snapshots the plain text once and starts three parallel requests through the preload bridge:

- extract TODOs,
- extract goals,
- extract reflective questions.

Each request has its own renderer status, error, result state, and active request id so stale results can be ignored after Scrap or retry. The existing TODO state and interactions remain unchanged. Goals and questions are stored as simple read-only arrays in renderer memory.

In the Electron main process, add two Mastra/OpenRouter extraction services following the existing TODO extraction pattern. Each service should use a strict Zod schema, structured output, bounded result counts, normalization, and safe error propagation through IPC. The services should share common model/API-key behavior where practical, while keeping agent instructions and output schemas specific to goals or reflective questions.

The preload API should expose minimal methods for the two new extraction requests. The renderer should not gain direct access to Node APIs, environment variables, Mastra, or OpenRouter credentials.

## Important specific code changes expected

- Add shared request/response types for goals extraction.
- Add shared request/response types for reflective questions extraction.
- Add IPC channel constants for the two new extraction requests.
- Add typed preload methods, likely `extractGoals(...)` and `extractReflectionQuestions(...)`.
- Add main-process IPC handlers for goals and reflective questions extraction.
- Add main-process Mastra extraction services for goals and reflective questions.
- Add renderer state for goals and questions results, statuses, errors, and active request guards.
- Start all three extraction requests when finalization succeeds.
- Add independent retry handlers for goals and reflective questions.
- Reset goals/questions state and pending request guards on Scrap.
- Update the finalized sidebar UI to render stacked TODOs, Goals, and Reflective Questions sections.
- Update docs/wiki pages after implementation to reflect the broader finalized-output sidebar.

## Architectural / infrastructure changes

- The finalized extraction backend expands from one agent to three agents.
- The preload bridge expands from one extraction method to three narrow extraction methods.
- Finalized sidebar state expands from TODO-only state to multiple independent finalized-output states.
- All new state remains ephemeral and in memory.
- OpenRouter configuration remains shared:
  - `OPENROUTER_API_KEY` is required.
  - `OPENROUTER_MODEL` can continue to override the default model.

## Open questions

- Exact visual styling and section order details inside the stacked sidebar.
- Exact empty-state and loading copy for Goals and Reflective Questions.
- Whether shared extraction helpers should be introduced immediately or deferred until implementation reveals enough duplication.

## Risks and tradeoffs

- Running three agents in parallel increases network/API usage and can make finalization feel heavier, though independent section states keep partial results useful.
- Stacked sections can make the sidebar taller and more visually dense than the current TODO-only sidebar.
- Goals with rationale may imply more certainty than the model actually has; concise copy and strict prompts should keep them framed as inferred aids.
- Reflective questions may drift into TODOs or critique unless agent instructions clearly separate reflection prompts from action extraction.
- More IPC methods and renderer states increase surface area; narrow typed APIs and shared patterns should keep the boundary understandable.
