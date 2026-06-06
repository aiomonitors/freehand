import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Editor } from '@tiptap/core'

import { DraftTimer } from './DraftTimer'
import { ForwardOnlyEditor } from './editor/ForwardOnlyEditor'
import { ScrapConfirmModal } from './editor/ScrapConfirmModal'
import { Toolbar } from './editor/Toolbar'

const FONTS = [
  { label: 'Inter', cssFamily: 'Inter, system-ui, sans-serif' },
  { label: 'Space Grotesk', cssFamily: 'Space Grotesk, system-ui, sans-serif' },
  { label: 'Geist', cssFamily: 'Geist, system-ui, sans-serif' },
]

function isCommandOrControl(event: KeyboardEvent): boolean {
  return event.metaKey || event.ctrlKey
}

export default function App(): React.JSX.Element {
  const [fontIndex, setFontIndex] = useState(0)
  const [isScrapConfirmOpen, setIsScrapConfirmOpen] = useState(false)
  const [editor, setEditor] = useState<Editor | null>(null)
  const [hasContent, setHasContent] = useState(false)
  const [timerStartedAt, setTimerStartedAt] = useState<number | null>(null)
  const [, setEditorRenderTick] = useState(0)

  const selectedFont = FONTS[fontIndex]

  const cycleFont = useCallback(() => {
    setFontIndex((current) => (current + 1) % FONTS.length)
    editor?.commands.focus('end')
  }, [editor])

  const scrapDraft = useCallback(() => {
    editor?.commands.clearContent()
    setHasContent(false)
    setTimerStartedAt(null)
    setIsScrapConfirmOpen(false)

    window.requestAnimationFrame(() => {
      editor?.commands.focus('end')
    })
  }, [editor])

  const requestScrap = useCallback(() => {
    if (hasContent) {
      setIsScrapConfirmOpen(true)
      return
    }

    scrapDraft()
  }, [hasContent, scrapDraft])

  const closeScrapConfirm = useCallback(() => {
    setIsScrapConfirmOpen(false)
    editor?.commands.focus('end')
  }, [editor])

  const refreshEditorControls = useCallback(() => {
    setEditorRenderTick((tick) => tick + 1)
  }, [])

  const handleContentStateChange = useCallback((nextHasContent: boolean) => {
    setHasContent(nextHasContent)

    if (nextHasContent) {
      setTimerStartedAt((current) => current ?? Date.now())
    }
  }, [])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if (!isCommandOrControl(event)) {
        return
      }

      const key = event.key.toLowerCase()

      if (key === 'f' && event.shiftKey) {
        event.preventDefault()
        cycleFont()
        return
      }

      if (key === 'n' && !event.shiftKey) {
        event.preventDefault()

        if (!isScrapConfirmOpen) {
          requestScrap()
        }

        return
      }

      if (key === 'enter' && isScrapConfirmOpen) {
        event.preventDefault()
        scrapDraft()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [cycleFont, isScrapConfirmOpen, requestScrap, scrapDraft])

  const editorStyle = useMemo(
    () => ({ fontFamily: selectedFont.cssFamily }),
    [selectedFont.cssFamily],
  )

  return (
    <main className="app-shell">
      {timerStartedAt !== null ? (
        <DraftTimer startedAt={timerStartedAt} />
      ) : null}

      <ForwardOnlyEditor
        fontFamily={selectedFont.cssFamily}
        onContentStateChange={handleContentStateChange}
        onEditorReady={setEditor}
        onEditorStateChange={refreshEditorControls}
      />

      <Toolbar
        editor={editor}
        fontLabel={selectedFont.label}
        onCycleFont={cycleFont}
        onScrap={requestScrap}
        style={editorStyle}
      />

      <ScrapConfirmModal
        isOpen={isScrapConfirmOpen}
        onCancel={closeScrapConfirm}
        onConfirm={scrapDraft}
      />
    </main>
  )
}
