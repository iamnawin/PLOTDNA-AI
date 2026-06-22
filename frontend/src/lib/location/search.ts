import hyderabadAliasesJson from '../../../../data/cities/hyderabad/aliases.json'
import type { MicroMarket } from '@/types'


type AliasIndex = Record<string, string[]>

const hyderabadAliases = hyderabadAliasesJson as AliasIndex

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function similarity(left: string, right: string): number {
  if (left === right) return 1
  if (!left.length || !right.length) return 0
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index)
  for (let row = 1; row <= left.length; row += 1) {
    const current = [row]
    for (let column = 1; column <= right.length; column += 1) {
      current[column] = Math.min(
        current[column - 1] + 1,
        previous[column] + 1,
        previous[column - 1] + (left[row - 1] === right[column - 1] ? 0 : 1),
      )
    }
    previous.splice(0, previous.length, ...current)
  }
  return 1 - previous[right.length] / Math.max(left.length, right.length)
}

export function searchLocalAreas(
  query: string,
  areas: MicroMarket[],
  citySlug: string,
): MicroMarket[] {
  const normalizedQuery = normalize(query)
  if (!normalizedQuery || /\d/.test(query) || query.includes(',')) return []

  return areas
    .map(area => {
      const aliases = new Set([
        normalize(area.name),
        normalize(area.slug.replace(/-/g, ' ')),
        ...(citySlug === 'hyderabad' ? (hyderabadAliases[area.slug] ?? []).map(normalize) : []),
      ])
      let rank = 99
      for (const alias of aliases) {
        if (alias === normalizedQuery) rank = Math.min(rank, 0)
        else if (alias.startsWith(normalizedQuery)) rank = Math.min(rank, 1)
        else if (alias.includes(normalizedQuery)) rank = Math.min(rank, 2)
        else if (normalizedQuery.length >= 4 && similarity(normalizedQuery, alias) >= 0.72) rank = Math.min(rank, 3)
      }
      return { area, rank }
    })
    .filter(result => result.rank < 99)
    .sort((left, right) => left.rank - right.rank || right.area.score - left.area.score || left.area.name.localeCompare(right.area.name))
    .map(result => result.area)
}
