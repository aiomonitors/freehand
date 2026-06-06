# Fonts and Typography

## Summary

Freehand supports three global font choices. Font selection is presentation state, not document content.

## Supported fonts

- Inter
- Space Grotesk
- Geist

Fonts are loaded from Google Fonts for v1, with system fallbacks.

## Behavior

- The toolbar shows the current font name.
- Clicking the font control cycles through the fonts.
- Cmd/Ctrl+Shift+F also cycles the font.
- Font changes apply globally to the whole editor document.
- Font changes are not limited to the current selection or future input.
- The selected font remains after Scrap.
- Font choice is not persisted across app quits.

## Cycle order

1. Inter
2. Space Grotesk
3. Geist
4. Inter

## Typography direction

The app uses large comfortable writing text, generous line height, and responsive sizing. The writing surface should feel spacious, calm, and page-like.

## Related code

- `src/renderer/src/App.tsx`
- `src/renderer/src/editor/ForwardOnlyEditor.tsx`
- `src/renderer/src/editor/Toolbar.tsx`
- `src/renderer/src/styles.css`
