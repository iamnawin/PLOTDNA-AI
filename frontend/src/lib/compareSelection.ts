export const DEFAULT_COMPARE_AREAS = ['adibatla', 'tukkuguda', 'kokapet']

export function parseCompareAreaParams(value: string | null, availableSlugs: string[]) {
  const available = new Set(availableSlugs)
  const desired = value?.split(',').map(slug => slug.trim()).filter(Boolean) ?? []
  const selected: string[] = []

  for (const slug of [...desired, ...DEFAULT_COMPARE_AREAS, ...availableSlugs]) {
    if (selected.length === 3) break
    if (!available.has(slug) || selected.includes(slug)) continue
    selected.push(slug)
  }

  return selected
}

export function getSelectableCompareSlugs(
  selectedSlugs: string[],
  currentIndex: number,
  availableSlugs: string[],
) {
  const takenByOtherSelectors = new Set(
    selectedSlugs.filter((_, index) => index !== currentIndex),
  )
  const currentSlug = selectedSlugs[currentIndex]

  return availableSlugs.filter(slug => slug === currentSlug || !takenByOtherSelectors.has(slug))
}
