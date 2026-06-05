import {
  getSelectableCompareSlugs,
  parseCompareAreaParams,
} from '../src/lib/compareSelection.ts'

function assert(condition, message) {
  if (!condition) {
    console.error(`Compare selector dedupe check failed: ${message}`)
    process.exit(1)
  }
}

const availableSlugs = ['adibatla', 'tukkuguda', 'kokapet', 'tellapur', 'lb-nagar']

const parsed = parseCompareAreaParams('tukkuguda,adibatla,tukkuguda', availableSlugs)

assert(parsed.length === 3, 'compare page must always resolve three areas')
assert(parsed.join(',') === 'tukkuguda,adibatla,kokapet', 'duplicate URL areas must be replaced by the next default area')

const areaTwoOptions = getSelectableCompareSlugs(parsed, 1, availableSlugs)

assert(areaTwoOptions.includes('adibatla'), 'the current selector value must stay selectable')
assert(!areaTwoOptions.includes('tukkuguda'), 'area 2 selector must not offer area 1 value')
assert(!areaTwoOptions.includes('kokapet'), 'area 2 selector must not offer area 3 value')
assert(areaTwoOptions.includes('tellapur'), 'unused areas must stay selectable')

console.log('Compare selector dedupe check passed.')
