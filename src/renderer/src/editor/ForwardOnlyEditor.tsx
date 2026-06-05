import { useEffect } from 'react'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import type { Editor } from '@tiptap/core'

import { hasNonWhitespaceText } from './editorUtils'
import { NoDeletionExtension } from './extensions/NoDeletionExtension'

type ForwardOnlyEditorProps = {
  fontFamily: string
  onContentStateChange: (hasContent: boolean) => void
  onEditorReady: (editor: Editor | null) => void
  onEditorStateChange: () => void
}

export function ForwardOnlyEditor({
  fontFamily,
  onContentStateChange,
  onEditorReady,
  onEditorStateChange,
}: ForwardOnlyEditorProps): React.JSX.Element {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        undoRedo: false,
        heading: {
          levels: [1, 2],
        },
      }),
      Underline,
      Placeholder.configure({
        placeholder: 'Start writing…',
      }),
      NoDeletionExtension,
    ],
    content: '',
    autofocus: 'end',
    enableInputRules: false,
    enablePasteRules: false,
    editorProps: {
      attributes: {
        'aria-label': 'Forward-only rich text editor',
        class: 'editor-content__surface',
      },
    },
    onCreate({ editor: createdEditor }) {
      onContentStateChange(hasNonWhitespaceText(createdEditor))
      onEditorStateChange()

      window.requestAnimationFrame(() => {
        createdEditor.commands.focus('end')
      })
    },
    onUpdate({ editor: updatedEditor }) {
      onContentStateChange(hasNonWhitespaceText(updatedEditor))
      onEditorStateChange()
    },
    onSelectionUpdate() {
      onEditorStateChange()
    },
    onTransaction() {
      onEditorStateChange()
    },
    onFocus() {
      onEditorStateChange()
    },
    onBlur() {
      onEditorStateChange()
    },
  })

  useEffect(() => {
    onEditorReady(editor)

    return () => onEditorReady(null)
  }, [editor, onEditorReady])

  return (
    <section className="editor-shell" style={{ fontFamily }}>
      <div className="editor-content">
        <EditorContent editor={editor} />
      </div>
    </section>
  )
}
