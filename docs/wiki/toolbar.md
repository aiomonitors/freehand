# Toolbar

## Summary

The toolbar is a compact fixed pill at the bottom center of the window. It provides the main app actions without making the editor feel boxed or heavy.

## Contents

The toolbar contains:

- `Scrap`
- `Finalize`
- current font name
- bold
- italic
- underline
- strikethrough
- heading
- bullet list
- numbered list
- blockquote

## Behavior

- Toolbar buttons use accessible `button` elements.
- Finalize is disabled until the editor has non-whitespace content.
- Formatting buttons are disabled until the editor instance is ready.
- The toolbar is hidden after the draft is finalized.
- Active formatting states are visually distinguishable.
- Hover states are visible for every toolbar item.
- Formatting actions should refocus or preserve focus in the editor.

## Positioning

- Fixed at bottom center.
- Stays visible during resize.
- Uses extra editor bottom padding so it does not cover active writing.
- Uses a translucent pill treatment with border, blur, and subtle shadow.

## Constraints

The toolbar should remain small. It should not become a ribbon, sidebar, or full formatting palette.

## Related features

- `scrap-flow.md`
- `finalized-todo-sidebar.md`
- `fonts-and-typography.md`
- `rich-text-formatting.md`

## Related code

- `src/renderer/src/editor/Toolbar.tsx`
- `src/renderer/src/styles.css`
