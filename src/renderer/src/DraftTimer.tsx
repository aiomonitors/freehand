import { useEffect, useState } from 'react'

type DraftTimerProps = {
  startedAt: number
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

export function DraftTimer({ startedAt }: DraftTimerProps): React.JSX.Element {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(Date.now())
    }, 1000)

    return () => window.clearInterval(intervalId)
  }, [startedAt])

  return (
    <div className="draft-timer" aria-label="Elapsed draft time">
      {formatElapsedTime(now - startedAt)}
    </div>
  )
}
