import { useEffect, useRef, useState } from 'react'

import type { WritingModeSelection } from './writingModes'

type ModeTimerPillProps = {
  writingMode: WritingModeSelection
  timerStartedAt: number | null
  onSelectFreewrite: () => void
  onSelectEdit: () => void
}

function formatTwoDigits(value: number): string {
  return value.toString().padStart(2, '0')
}

function formatElapsedTime(elapsedMs: number): string {
  const totalSeconds = Math.floor(Math.max(0, elapsedMs) / 1000)
  const seconds = totalSeconds % 60
  const totalMinutes = Math.floor(totalSeconds / 60)
  const minutes = totalMinutes % 60
  const hours = Math.floor(totalMinutes / 60)

  if (hours > 0) {
    return `${hours}:${formatTwoDigits(minutes)}:${formatTwoDigits(seconds)}`
  }

  return `${formatTwoDigits(minutes)}:${formatTwoDigits(seconds)}`
}

function getModeLabel(
  writingMode: Exclude<WritingModeSelection, null>,
): string {
  return writingMode === 'freewrite' ? 'Freewrite' : 'Edit'
}

export function ModeTimerPill({
  writingMode,
  timerStartedAt,
  onSelectFreewrite,
  onSelectEdit,
}: ModeTimerPillProps): React.JSX.Element {
  const [now, setNow] = useState(() => Date.now())
  const [pillWidth, setPillWidth] = useState<number | null>(null)
  const [timerSlotWidth, setTimerSlotWidth] = useState<number | null>(null)
  const contentRef = useRef<HTMLDivElement | null>(null)
  const timerContentRef = useRef<HTMLSpanElement | null>(null)

  useEffect(() => {
    if (timerStartedAt === null) {
      return
    }

    const intervalId = window.setInterval(() => {
      setNow(Date.now())
    }, 1000)

    return () => window.clearInterval(intervalId)
  }, [timerStartedAt])

  useEffect(() => {
    const contentElement = contentRef.current

    if (!contentElement) {
      return
    }

    let animationFrameId: number | null = null

    const updateWidth = (): void => {
      const nextWidth = Math.ceil(contentElement.offsetWidth) + 12
      setPillWidth((currentWidth) =>
        currentWidth === nextWidth ? currentWidth : nextWidth,
      )
    }

    const scheduleUpdate = (): void => {
      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId)
      }

      animationFrameId = window.requestAnimationFrame(() => {
        animationFrameId = null
        updateWidth()
      })
    }

    scheduleUpdate()

    const resizeObserver = new ResizeObserver(scheduleUpdate)
    resizeObserver.observe(contentElement)

    return () => {
      resizeObserver.disconnect()

      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId)
      }
    }
  }, [writingMode, timerStartedAt])

  useEffect(() => {
    const timerContentElement = timerContentRef.current

    if (!timerContentElement) {
      return
    }

    let animationFrameId: number | null = null

    const updateWidth = (): void => {
      const nextWidth = Math.ceil(timerContentElement.offsetWidth)
      setTimerSlotWidth((currentWidth) =>
        currentWidth === nextWidth ? currentWidth : nextWidth,
      )
    }

    const scheduleUpdate = (): void => {
      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId)
      }

      animationFrameId = window.requestAnimationFrame(() => {
        animationFrameId = null
        updateWidth()
      })
    }

    scheduleUpdate()

    const resizeObserver = new ResizeObserver(scheduleUpdate)
    resizeObserver.observe(timerContentElement)

    return () => {
      resizeObserver.disconnect()

      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId)
      }
    }
  }, [writingMode])

  const hasVisibleTimer = timerStartedAt !== null
  const timerLabel = hasVisibleTimer
    ? formatElapsedTime(now - timerStartedAt)
    : '00:00'

  const pillLabel =
    writingMode === null
      ? 'Choose writing mode'
      : 'Writing mode and elapsed draft time'

  return (
    <div
      className="mode-timer-pill"
      aria-label={pillLabel}
      style={pillWidth === null ? undefined : { width: pillWidth }}
    >
      <div ref={contentRef} className="mode-timer-pill__content">
        {writingMode === null ? (
          <>
            <button
              className="mode-timer-pill__button"
              type="button"
              aria-label="Choose Freewrite mode"
              onClick={onSelectFreewrite}
            >
              Freewrite
            </button>
            <button
              className="mode-timer-pill__button"
              type="button"
              aria-label="Choose Edit mode"
              onClick={onSelectEdit}
            >
              Edit
            </button>
          </>
        ) : (
          <>
            <span className="mode-timer-pill__chip">
              {getModeLabel(writingMode)}
            </span>
            <span
              className="mode-timer-pill__timer-clip"
              data-visible={hasVisibleTimer || undefined}
              style={{
                width:
                  hasVisibleTimer && timerSlotWidth !== null
                    ? timerSlotWidth
                    : 0,
              }}
            >
              <span
                ref={timerContentRef}
                className="mode-timer-pill__timer-content"
              >
                <span className="mode-timer-pill__divider" aria-hidden="true" />
                <span
                  className="mode-timer-pill__time"
                  aria-label="Elapsed draft time"
                >
                  {timerLabel}
                </span>
              </span>
            </span>
          </>
        )}
      </div>
    </div>
  )
}
