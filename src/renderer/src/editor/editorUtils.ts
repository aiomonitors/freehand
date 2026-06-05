import type { Editor } from '@tiptap/core'

export function hasNonWhitespaceText(editor: Editor | null): boolean {
  return Boolean(editor?.getText().trim())
}
