import type { CSSProperties } from 'react'
import type { Editor } from '@tiptap/core'

type ToolbarProps = {
  editor: Editor | null
  fontLabel: string
  onCycleFont: () => void
  onScrap: () => void
  style?: CSSProperties
}

type ToolbarButtonProps = {
  label: string
  ariaLabel: string
  onClick: () => void
  active?: boolean
  disabled?: boolean
  destructive?: boolean
  title?: string
}

function ToolbarButton({
  label,
  ariaLabel,
  onClick,
  active = false,
  disabled = false,
  destructive = false,
  title,
}: ToolbarButtonProps): React.JSX.Element {
  return (
    <button
      type="button"
      className="toolbar-button"
      aria-label={ariaLabel}
      aria-pressed={active || undefined}
      data-active={active || undefined}
      data-destructive={destructive || undefined}
      disabled={disabled}
      title={title ?? ariaLabel}
      onClick={onClick}
    >
      {label}
    </button>
  )
}

export function Toolbar({
  editor,
  fontLabel,
  onCycleFont,
  onScrap,
  style,
}: ToolbarProps): React.JSX.Element {
  const disabled = !editor

  return (
    <div className="toolbar-wrap" aria-label="Editor toolbar" style={style}>
      <div
        className="toolbar-pill"
        role="toolbar"
        aria-label="Writing controls"
      >
        <ToolbarButton
          label="Scrap"
          ariaLabel="Scrap draft"
          onClick={onScrap}
          destructive
        />
        <span className="toolbar-divider" aria-hidden="true" />
        <ToolbarButton
          label={fontLabel}
          ariaLabel="Cycle document font"
          onClick={onCycleFont}
          title="Cycle font (Cmd/Ctrl+Shift+F)"
        />
        <span className="toolbar-divider" aria-hidden="true" />
        <ToolbarButton
          label="B"
          ariaLabel="Bold"
          active={editor?.isActive('bold') ?? false}
          disabled={disabled}
          onClick={() => editor?.chain().focus().toggleBold().run()}
          title="Bold (Cmd/Ctrl+B)"
        />
        <ToolbarButton
          label="I"
          ariaLabel="Italic"
          active={editor?.isActive('italic') ?? false}
          disabled={disabled}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          title="Italic (Cmd/Ctrl+I)"
        />
        <ToolbarButton
          label="U"
          ariaLabel="Underline"
          active={editor?.isActive('underline') ?? false}
          disabled={disabled}
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
          title="Underline (Cmd/Ctrl+U)"
        />
        <ToolbarButton
          label="S"
          ariaLabel="Strikethrough"
          active={editor?.isActive('strike') ?? false}
          disabled={disabled}
          onClick={() => editor?.chain().focus().toggleStrike().run()}
        />
        <ToolbarButton
          label="H"
          ariaLabel="Heading"
          active={editor?.isActive('heading') ?? false}
          disabled={disabled}
          onClick={() =>
            editor?.chain().focus().toggleHeading({ level: 1 }).run()
          }
        />
        <ToolbarButton
          label="•"
          ariaLabel="Bullet list"
          active={editor?.isActive('bulletList') ?? false}
          disabled={disabled}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        />
        <ToolbarButton
          label="1."
          ariaLabel="Numbered list"
          active={editor?.isActive('orderedList') ?? false}
          disabled={disabled}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        />
        <ToolbarButton
          label="“”"
          ariaLabel="Blockquote"
          active={editor?.isActive('blockquote') ?? false}
          disabled={disabled}
          onClick={() => editor?.chain().focus().toggleBlockquote().run()}
        />
      </div>
    </div>
  )
}
