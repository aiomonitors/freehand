# Elapsed Draft Timer

## Summary

Elapsed draft time is shown inside the top-center mode/timer pill once the user starts meaningful writing.

It is a passive status value, not a writing goal or productivity tracker. The same top pill is interactive for writing mode selection and mode status.

## Start trigger

The timer starts when the editor first contains non-whitespace text.

This means:

- selecting a writing mode does not start it
- typing only spaces does not start it
- formatting-only changes do not start it
- pasted non-whitespace text starts it

## Display

Before a writing mode is selected, the top pill shows only:

- `Freewrite`
- `Edit`

After a mode is selected, the pill shows the active mode. Once the timer has started, it also shows elapsed draft time. The pill width transitions smoothly as its contents change.

After either mode is selected, unavailable mode choices are hidden.

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

The top mode/timer pill hides when the draft is finalized.

The timer resets and disappears when the draft is scrapped. Scrap also resets writing mode selection, so the pill returns to showing `Freewrite` and `Edit` choices.

If the user cancels the Scrap modal, the timer and current writing mode continue unchanged.

## Non-goals

- No countdown timer.
- No pause/resume.
- No active-writing or idle detection.
- No persistence.
- No analytics or session history.
- No timer controls in the toolbar.
- No keyboard shortcuts for selecting modes.

## Related code

- `src/renderer/src/ModeTimerPill.tsx`
- `src/renderer/src/App.tsx`
- `src/renderer/src/styles.css`

## Related features

- `writing-modes.md`
- `scrap-flow.md`
