# Writing Surface

## Summary

Freehand opens to a single full-page rich-text editor. The editor should feel like writing directly on a page, not like typing inside a boxed form field.

## User experience

- The app starts with one empty editor and no selected writing mode.
- Empty editor copy uses the placeholder `Start writing…`.
- The page uses a light off-white background.
- Text uses a slightly off-black color.
- The editor is borderless.
- The writing area is centered.
- Readable content width is capped at `1240px`.
- The page has generous padding and extra bottom padding so the toolbar does not cover text.

## Visual constraints

The editor should not look like:

- a textarea
- a card
- a form
- a document with visible page chrome
- a dashboard panel

It should look like a focused writing surface.

## Behavior

- The editor auto-focuses on app load.
- The placeholder appears only while the document is empty.
- Typing creates rich-text document content in renderer memory and auto-selects `Freewrite` if no mode was chosen.
- The writing surface should remain usable at the minimum window size.

## Related features

- `writing-modes.md`
- `forward-only-editing.md`
- `rich-text-formatting.md`
- `toolbar.md`
- `fonts-and-typography.md`
