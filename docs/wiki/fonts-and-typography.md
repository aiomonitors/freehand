# Fonts and Typography

## Summary

Freehand supports global font family and text-size controls. These choices are presentation state, not document content.

## Supported fonts

- Inter
- Space Grotesk
- Geist

Fonts are loaded from Google Fonts for v1, with system fallbacks.

## Behavior

- The toolbar shows the current font name.
- Clicking the font control cycles through the fonts.
- Cmd/Ctrl+Shift+F also cycles the font.
- The toolbar also shows a text-size control: `Size S`, `Size M`, or `Size L`.
- Clicking the text-size control cycles the editor text size.
- Font and text-size changes apply globally to the whole editor document.
- Font and text-size changes are not limited to the current selection or future input.
- The selected font and text size remain after Scrap.
- Font choice and text size are not persisted across app quits.

## Font cycle order

1. Inter
2. Space Grotesk
3. Geist
4. Inter

## Text size cycle order

1. Size S
2. Size M
3. Size L
4. Size S

## Typography direction

The app uses large comfortable writing text, generous line height, and responsive sizing. The writing surface should feel spacious, calm, and page-like.

## Related code

- `src/renderer/src/App.tsx`
- `src/renderer/src/editor/WritingEditor.tsx`
- `src/renderer/src/editor/Toolbar.tsx`
- `src/renderer/src/styles.css`
