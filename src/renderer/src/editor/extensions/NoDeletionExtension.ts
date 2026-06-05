import { Extension } from '@tiptap/core'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import { Fragment, Slice } from '@tiptap/pm/model'
import { Plugin, Selection } from '@tiptap/pm/state'

const UNSUPPORTED_PASTE_NODES = new Set([
  'image',
  'video',
  'audio',
  'iframe',
  'embed',
  'table',
  'tableRow',
  'tableCell',
  'tableHeader',
])

function isModKey(event: KeyboardEvent): boolean {
  return event.metaKey || event.ctrlKey
}

function isBlockedShortcut(event: KeyboardEvent): boolean {
  const key = event.key.toLowerCase()

  return isModKey(event) && (key === 'z' || key === 'y' || key === 'x')
}

function sanitizeFragment(fragment: Fragment): Fragment {
  const nodes: ProseMirrorNode[] = []

  fragment.forEach((node) => {
    if (UNSUPPORTED_PASTE_NODES.has(node.type.name)) {
      return
    }

    if (node.isLeaf) {
      nodes.push(node)
      return
    }

    nodes.push(node.copy(sanitizeFragment(node.content)))
  })

  return Fragment.fromArray(nodes)
}

function sanitizeSlice(slice: Slice): Slice {
  const content = sanitizeFragment(slice.content)

  if (content.size === 0) {
    return Slice.empty
  }

  return Slice.maxOpen(content)
}

export const NoDeletionExtension = Extension.create({
  name: 'noDeletion',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          handleKeyDown(_view, event) {
            if (
              event.key === 'Backspace' ||
              event.key === 'Delete' ||
              isBlockedShortcut(event)
            ) {
              event.preventDefault()
              return true
            }

            return false
          },

          handleTextInput(view, from, to, text) {
            if (view.composing || from === to) {
              return false
            }

            const { doc } = view.state
            const selection = Selection.near(doc.resolve(to), 1)
            const tr = view.state.tr
              .setSelection(selection)
              .insertText(text, selection.from, selection.to)

            view.dispatch(tr.scrollIntoView())
            return true
          },

          handlePaste(view, event, slice) {
            event.preventDefault()

            const { doc, selection } = view.state
            const insertAt = selection.empty ? selection.from : selection.to
            const safeSelection = Selection.near(doc.resolve(insertAt), 1)
            const sanitizedSlice = sanitizeSlice(slice)
            const tr = view.state.tr
              .setSelection(safeSelection)
              .replaceSelection(sanitizedSlice)

            view.dispatch(tr.scrollIntoView())
            return true
          },

          handleDrop(_view, event) {
            event.preventDefault()
            return true
          },

          handleDOMEvents: {
            beforeinput(_view, event) {
              const inputType = (event as InputEvent).inputType ?? ''

              if (
                inputType.startsWith('delete') ||
                inputType === 'historyUndo' ||
                inputType === 'historyRedo'
              ) {
                event.preventDefault()
                return true
              }

              return false
            },

            cut(_view, event) {
              event.preventDefault()
              return true
            },

            drop(_view, event) {
              event.preventDefault()
              return true
            },
          },
        },
      }),
    ]
  },
})
