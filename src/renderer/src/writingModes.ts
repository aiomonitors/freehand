export type WritingMode = 'freewrite' | 'edit'
export type WritingModeSelection = WritingMode | null

export function canSelectWritingMode(
  currentMode: WritingModeSelection,
  nextMode: WritingMode,
): boolean {
  return currentMode === null || currentMode === nextMode
}
