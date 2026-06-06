# Elapsed Draft Timer

## Summary

The elapsed draft timer appears once the user starts meaningful writing and counts upward from that moment.

It is a passive status element, not a writing goal or productivity tracker.

## Start trigger

The timer starts when the editor first contains non-whitespace text.

This means:

- typing only spaces does not start it
- formatting-only changes do not start it
- pasted non-whitespace text starts it

## Display

- The timer is fixed at the top center of the window.
- It is subtle and non-interactive.
- It uses muted styling consistent with the rest of the app.
- It stays visible while writing and while the Scrap modal is open.

## Format

Before one hour:

- `MM:SS`
- example: `00:01`
- example: `12:34`

At or after one hour:

- `H:MM:SS`
- example: `1:00:00`
- example: `2:13:09`

## Reset behavior

The timer resets and disappears when the draft is scrapped.

If the user cancels the Scrap modal, the timer continues from the original start time.

## Non-goals

- No countdown timer.
- No pause/resume.
- No active-writing or idle detection.
- No persistence.
- No analytics or session history.
- No timer controls in the toolbar.

## Related code

- `src/renderer/src/DraftTimer.tsx`
- `src/renderer/src/App.tsx`
- `src/renderer/src/styles.css`
