# Elapsed Draft Timer Implementation Plan

Source spec: `docs/specs/elapsed-draft-timer.md`

## Implementation principles

- Keep timer state in renderer memory only.
- Treat the timer as draft lifecycle state owned by `App.tsx`.
- Start the timer only when the editor first reports non-whitespace content.
- Reset the timer when the draft is scrapped.
- Keep the timer visual-only and non-interactive for this iteration.
- Do not add persistence, settings, pause/resume, analytics, or tests for this feature.

## Phase 1 — Add timer component

### 1. Create `DraftTimer` component

Create:

```text
src/renderer/src/DraftTimer.tsx
```

Component props:

```ts
type DraftTimerProps = {
  startedAt: number
}
```

Behavior:

- Render elapsed time from `startedAt` to current wall-clock time.
- Update display roughly once per second.
- Derive elapsed time using `Date.now() - startedAt` instead of incrementing a local counter.
- Clear the interval on unmount.
- Include accessible text/label, e.g. `aria-label="Elapsed draft time"`.

### 2. Add elapsed time formatter

Implement a small local helper in `DraftTimer.tsx`:

```ts
function formatElapsedTime(elapsedMs: number): string
```

Formatting requirements:

- Before one hour: `MM:SS`
  - `00:01`
  - `12:34`
- At/after one hour: `H:MM:SS`
  - `1:00:00`
  - `2:13:09`
- Clamp negative elapsed time to `0` for safety.

Manual check:

- Timer displays `00:00` or `00:01` immediately after first content depending on tick timing.
- Timer increments once per second.
- Formatter handles hour boundary correctly.

## Phase 2 — Wire timer lifecycle into `App.tsx`

### 1. Add timer state

In `src/renderer/src/App.tsx`, add:

```ts
const [timerStartedAt, setTimerStartedAt] = useState<number | null>(null)
```

### 2. Replace direct content-state setter

Currently `ForwardOnlyEditor` receives:

```tsx
onContentStateChange = { setHasContent }
```

Replace with a callback that:

- updates `hasContent`.
- starts the timer when `hasContent` becomes `true` and `timerStartedAt` is still `null`.
- does not stop/reset the timer if content somehow becomes false outside scrap behavior.

Implementation shape:

```ts
const handleContentStateChange = useCallback((nextHasContent: boolean) => {
  setHasContent(nextHasContent)

  if (nextHasContent) {
    setTimerStartedAt((current) => current ?? Date.now())
  }
}, [])
```

Then pass:

```tsx
onContentStateChange = { handleContentStateChange }
```

Rationale:

- First non-whitespace content starts the timer.
- Existing no-deletion rules mean content normally cannot become empty except through Scrap.
- Resetting remains centralized in `scrapDraft()`.

### 3. Reset timer on scrap

In `scrapDraft()`:

- Clear the editor content as currently implemented.
- Set `hasContent` to false as currently implemented.
- Add `setTimerStartedAt(null)`.
- Keep existing focus behavior.

Manual check:

- Opening app: no timer.
- Typing only spaces: no timer.
- Typing a letter: timer appears.
- Pasting non-whitespace content: timer appears.
- Scrap confirmed: timer disappears and resets.
- Cancel Scrap: timer remains and continues.

## Phase 3 — Render timer

### 1. Import component

In `src/renderer/src/App.tsx`:

```ts
import { DraftTimer } from './DraftTimer'
```

### 2. Render conditionally

Render near the top of `<main>` before the editor:

```tsx
{
  timerStartedAt !== null ? <DraftTimer startedAt={timerStartedAt} /> : null
}
```

Rationale:

- Keeps timer mounted only while active.
- Keeps DraftTimer responsible only for display/ticking, not lifecycle.

Manual check:

- Timer is absent from DOM before meaningful writing starts.
- Timer appears after first non-whitespace content.
- Timer remains visible while writing and while Scrap modal is open.

## Phase 4 — Style top-center timer

### 1. Add CSS classes

In `src/renderer/src/styles.css`, add styles for:

```css
.draft-timer {
  position: fixed;
  z-index: 15;
  top: 18px;
  left: 50%;
  transform: translateX(-50%);
  ...
}
```

Suggested styling:

```css
.draft-timer {
  position: fixed;
  z-index: 15;
  top: 18px;
  left: 50%;
  transform: translateX(-50%);
  padding: 6px 11px;
  border: 1px solid var(--color-pill-border);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.52);
  color: var(--color-muted);
  font-size: 0.78rem;
  font-weight: 650;
  line-height: 1;
  letter-spacing: 0.04em;
  font-variant-numeric: tabular-nums;
  box-shadow: 0 8px 28px rgba(31, 31, 29, 0.08);
  backdrop-filter: blur(14px) saturate(1.12);
  -webkit-backdrop-filter: blur(14px) saturate(1.12);
  pointer-events: none;
  user-select: none;
}
```

Styling requirements:

- Top center.
- Subtle and non-interactive.
- Does not overlap the native macOS traffic-light controls on the top left.
- Uses existing color tokens.
- `pointer-events: none` so it does not interfere with editor/window interactions.
- `font-variant-numeric: tabular-nums` to prevent width jitter as digits change.

Manual check:

- Timer is visually centered at top.
- Timer does not clash with titlebar traffic lights.
- Timer does not obscure the editor placeholder or first line.
- Timer remains visible above editor content but below modal if modal is open.

## Phase 5 — Quality checks

Run:

```sh
pnpm run format:check
pnpm run lint
pnpm run typecheck
pnpm run build
```

Fix all reported issues.

## Manual QA checklist

Timer lifecycle:

- Empty app load shows no timer.
- Typing only whitespace does not show timer.
- Typing first non-whitespace character shows timer.
- Pasting non-whitespace text shows timer.
- Timer counts upward once visible.
- Timer uses `MM:SS` before one hour.
- Timer uses `H:MM:SS` after one hour if manually tested or temporarily simulated.
- Canceling Scrap keeps timer running.
- Confirming Scrap clears editor and hides timer.
- Scrapping empty editor keeps timer hidden.
- Starting a new draft after Scrap starts timer from zero again.

Integration:

- Existing no-deletion behavior still works.
- Toolbar still works.
- Font cycling still works.
- Scrap modal still works.
- Cmd/Ctrl+N and Cmd/Ctrl+Enter behavior is unchanged except timer reset on confirmed Scrap.
- Build succeeds.

## Implementation order summary

1. Add `DraftTimer.tsx` with formatter and ticking behavior.
2. Add `timerStartedAt` state in `App.tsx`.
3. Wrap editor content-state updates to start timer on first non-whitespace content.
4. Reset timer in `scrapDraft()`.
5. Conditionally render `DraftTimer`.
6. Add top-center timer CSS.
7. Run quality checks and manual QA.

## Known implementation risks

- The initial displayed value may be `00:00` for up to one second, which is acceptable unless product direction requires immediately showing `00:01`.
- Wall-clock elapsed time may jump after system sleep; this is acceptable for elapsed draft time.
- Top-center placement may need slight vertical adjustment if it visually competes with the first writing line on small windows.
