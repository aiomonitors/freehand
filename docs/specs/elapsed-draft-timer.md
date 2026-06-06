# Elapsed Draft Timer Spec

## Overview

Add a minimal elapsed-time timer to Freehand. The timer appears only after the user begins a meaningful draft and counts up from the moment the first non-whitespace text appears. It sits at the top center of the window as a subtle status element, separate from the bottom toolbar.

The timer supports the forward-only writing experience by making the writing session feel intentional without introducing controls, goals, persistence, or pressure.

## Goals

- Show an elapsed draft timer after writing begins.
- Start the timer when the editor first contains non-whitespace text.
- Keep the timer hidden before meaningful writing starts.
- Display the timer at the top center of the app.
- Use compact adaptive formatting:
  - `MM:SS` before one hour, e.g. `00:01`, `12:34`.
  - `H:MM:SS` after one hour, e.g. `1:00:00`, `2:13:09`.
- Reset the timer when the draft is scrapped.
- Keep timer state in renderer memory only.
- Preserve the current no-persistence model.

## Non-goals

- No countdown mode.
- No configurable duration or target writing goal.
- No pause/resume controls.
- No idle-aware active-writing measurement.
- No persistence across app quits.
- No history, analytics, logs, or statistics.
- No toolbar control for the timer in this iteration.

## User-facing behavior

### Initial empty state

- When the app opens to an empty editor, no timer is shown.
- Formatting toolbar behavior remains unchanged.

### Timer start

- The timer starts when the editor first contains non-whitespace text.
- Accidental whitespace alone does not start the timer.
- Formatting-only changes do not start the timer unless non-whitespace text already exists.
- Pasted non-whitespace text starts the timer, because it creates meaningful draft content.

### Timer display

- Once started, the timer appears at the top center of the window.
- The display is subtle and visually consistent with the existing light/off-white design.
- Recommended visual treatment:
  - small pill or soft text badge
  - muted text color
  - translucent light background or no visible background depending on polish
  - fixed position so it remains visible while writing
- The timer should avoid the macOS traffic-light controls on the top left.

### Timer counting

- The timer counts elapsed wall-clock time from the start timestamp.
- It updates roughly once per second.
- It should derive displayed time from the stored start timestamp and `Date.now()`, not from incrementing a counter, so it remains accurate if renders are delayed.

### Scrap/reset behavior

- If the user scraps the draft, the timer resets and disappears with the empty editor.
- If the user cancels the scrap confirmation modal, the timer continues from the original start time.
- If the app quits, timer state is lost with the rest of the draft state.

## Design decisions made

- Timer type: elapsed draft time.
- Placement: top center.
- Format: adaptive `MM:SS` before one hour, `H:MM:SS` after one hour.
- Start trigger: first non-whitespace text appears.
- Reset trigger: confirmed Scrap or immediate Scrap on empty state.
- Persistence: no persistence; renderer memory only.
- Controls: no timer controls for this iteration.

## Relevant existing code/infrastructure

- `src/renderer/src/App.tsx`
  - Owns app-level state such as selected font, scrap modal state, editor reference, and `hasContent`.
  - Receives content-state updates from the editor via `onContentStateChange`.
  - Implements Scrap behavior through `scrapDraft()` and `requestScrap()`.
  - Is the natural place to own timer state because the timer depends on draft/content lifecycle.

- `src/renderer/src/editor/ForwardOnlyEditor.tsx`
  - Configures Tiptap.
  - Calls `onContentStateChange(hasNonWhitespaceText(editor))` on create/update.
  - Already computes the same non-whitespace condition needed to start the timer.

- `src/renderer/src/editor/editorUtils.ts`
  - Provides `hasNonWhitespaceText(editor)`.
  - Can remain unchanged unless additional timer-specific utilities are desired.

- `src/renderer/src/styles.css`
  - Defines app colors, fixed toolbar styling, and modal styling.
  - Should receive timer styling using existing tokens such as `--color-muted`, `--color-pill`, and `--color-pill-border`.

## High-level technical approach

Add timer state to `App.tsx`:

- Store a nullable `timerStartedAt` timestamp in renderer memory.
- When editor content changes from no meaningful content to meaningful content, set `timerStartedAt` if it is currently null.
- When `scrapDraft()` runs, clear `timerStartedAt`.
- Render a small `DraftTimer` component only when `timerStartedAt` is set.

Add a timer display component:

- Create a renderer component such as `src/renderer/src/DraftTimer.tsx` or `src/renderer/src/editor/DraftTimer.tsx`.
- Use an interval to refresh display approximately every second.
- Compute elapsed milliseconds from `Date.now() - timerStartedAt`.
- Format elapsed time with the adaptive format.
- Add accessible labeling, such as `aria-label="Elapsed draft time"`.

Styling:

- Add top-center fixed positioning in `styles.css`.
- Ensure the timer does not interfere with the hidden titlebar/native macOS window controls.
- Keep visual treatment subtle and non-interactive.

## Important specific code changes

- Update `src/renderer/src/App.tsx` to:
  - track `timerStartedAt: number | null`.
  - wrap content-state updates so the first `true` starts the timer.
  - clear timer state when scrapping the draft.
  - render the timer component when active.

- Add a timer component for formatting and ticking.

- Update `src/renderer/src/styles.css` with timer positioning and styling.

## Risks and tradeoffs

- Using non-whitespace text as the start trigger means typing only spaces will not show the timer. This is intentional and aligns with the existing dirty/scrap behavior.
- A wall-clock timer may jump after system sleep. This is acceptable for elapsed draft time and avoids inaccurate interval-based counters.
- A fixed top-center timer could visually compete with the writing surface if styled too strongly. Keep it small and muted.
- The app currently has native macOS traffic-light controls with hidden titlebar; top-center placement should avoid overlap.

## Open questions

None for this iteration.
