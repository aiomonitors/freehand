export function reorderIds(
  ids: string[],
  fromIndex: number,
  toIndex: number,
): string[] {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= ids.length ||
    toIndex >= ids.length
  ) {
    return ids
  }

  const nextIds = [...ids]
  const [movedId] = nextIds.splice(fromIndex, 1)

  if (movedId === undefined) {
    return ids
  }

  nextIds.splice(toIndex, 0, movedId)
  return nextIds
}
