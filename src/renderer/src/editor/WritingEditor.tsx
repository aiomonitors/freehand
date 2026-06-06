import { useEffect } from 'react'
import type { CSSProperties } from 'react'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import type { Editor } from '@tiptap/core'

import type { WritingModeSelection } from '../writingModes'
import { hasNonWhitespaceText } from './editorUtils'
import { WritingModeGuardExtension } from './extensions/WritingModeGuardExtension'

type WritingEditorProps = {
  fontFamily: string
  fontSize: string
  isFinalized: boolean
  getWritingMode: () => WritingModeSelection
  onAutoSelectFreewrite: () => void
  onContentStateChange: (hasContent: boolean) => void
  onEditorReady: (editor: Editor | null) => void
  onEditorStateChange: () => void
}

export function WritingEditor({
  fontFamily,
  fontSize,
  isFinalized,
  getWritingMode,
  onAutoSelectFreewrite,
  onContentStateChange,
  onEditorReady,
  onEditorStateChange,
}: WritingEditorProps): React.JSX.Element {
  const editorStyle = {
    fontFamily,
    '--editor-font-size': fontSize,
  } as CSSProperties

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2],
        },
      }),
      Underline,
      Placeholder.configure({
        placeholder: 'Start writing…',
      }),
      WritingModeGuardExtension.configure({
        getWritingMode,
        autoSelectFreewrite: onAutoSelectFreewrite,
      }),
    ],
    content: '',
    editable: !isFinalized,
    autofocus: 'end',
    enableInputRules: false,
    enablePasteRules: false,
    editorProps: {
      attributes: {
        'aria-label': 'Rich text draft editor',
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

  useEffect(() => {
    editor?.setEditable(!isFinalized)
  }, [editor, isFinalized])

  return (
    <section
      className="editor-shell"
      data-finalized={isFinalized || undefined}
      style={editorStyle}
    >
      <div className="editor-content">
        <EditorContent editor={editor} />
      </div>
    </section>
  )
}
