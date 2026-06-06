import { Extension } from '@tiptap/core'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import { Fragment, Slice } from '@tiptap/pm/model'
import { Plugin, Selection } from '@tiptap/pm/state'

import type { WritingModeSelection } from '../../writingModes'

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

type WritingModeGuardOptions = {
  getWritingMode: () => WritingModeSelection
  autoSelectFreewrite: () => void
}

function isModKey(event: KeyboardEvent): boolean {
  return event.metaKey || event.ctrlKey
}

function isBlockedShortcut(event: KeyboardEvent): boolean {
  const key = event.key.toLowerCase()

  return isModKey(event) && (key === 'z' || key === 'y' || key === 'x')
}

function isPlainEnter(event: KeyboardEvent): boolean {
  return event.key === 'Enter' && !isModKey(event) && !event.altKey
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

function isFreewriteMode(options: WritingModeGuardOptions): boolean {
  return options.getWritingMode() === 'freewrite'
}

function shouldTreatInputAsFreewrite(
  options: WritingModeGuardOptions,
): boolean {
  const mode = options.getWritingMode()

  if (mode === 'freewrite') {
    return true
  }

  if (mode === null) {
    options.autoSelectFreewrite()
    return true
  }

  return false
}

function eventHasUnsupportedDropPayload(event: DragEvent): boolean {
  const dataTransfer = event.dataTransfer

  if (!dataTransfer) {
    return false
  }

  if (dataTransfer.files.length > 0) {
    return true
  }

  return Array.from(dataTransfer.items).some((item) => {
    if (item.kind === 'file') {
      return true
    }

    return (
      item.type.startsWith('image/') ||
      item.type.startsWith('video/') ||
      item.type.startsWith('audio/')
    )
  })
}

export const WritingModeGuardExtension =
  Extension.create<WritingModeGuardOptions>({
    name: 'writingModeGuard',

    addOptions() {
      return {
        getWritingMode: () => null,
        autoSelectFreewrite: () => undefined,
      }
    },

    addProseMirrorPlugins() {
      const options = this.options

      return [
        new Plugin({
          props: {
            handleKeyDown(view, event) {
              if (isPlainEnter(event) && shouldTreatInputAsFreewrite(options)) {
                const { selection } = view.state

                if (!selection.empty) {
                  const safeSelection = Selection.near(
                    view.state.doc.resolve(selection.to),
                    1,
                  )
                  view.dispatch(view.state.tr.setSelection(safeSelection))
                }

                return false
              }

              if (
                isFreewriteMode(options) &&
                (event.key === 'Backspace' ||
                  event.key === 'Delete' ||
                  isBlockedShortcut(event))
              ) {
                event.preventDefault()
                return true
              }

              return false
            },

            handleTextInput(view, from, to, text) {
              if (view.composing || !shouldTreatInputAsFreewrite(options)) {
                return false
              }

              if (from === to) {
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
              if (!shouldTreatInputAsFreewrite(options)) {
                return false
              }

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

            transformPasted(slice) {
              return sanitizeSlice(slice)
            },

            handleDrop(_view, event) {
              if (
                isFreewriteMode(options) ||
                eventHasUnsupportedDropPayload(event)
              ) {
                event.preventDefault()
                return true
              }

              return false
            },

            handleDOMEvents: {
              beforeinput(_view, event) {
                if (!isFreewriteMode(options)) {
                  return false
                }

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
                if (!isFreewriteMode(options)) {
                  return false
                }

                event.preventDefault()
                return true
              },

              drop(_view, event) {
                if (
                  isFreewriteMode(options) ||
                  eventHasUnsupportedDropPayload(event as DragEvent)
                ) {
                  event.preventDefault()
                  return true
                }

                return false
              },
            },
          },
        }),
      ]
    },
  })
