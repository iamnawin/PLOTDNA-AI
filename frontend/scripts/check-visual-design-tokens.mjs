import fs from 'node:fs'
import path from 'node:path'

const indexCss = fs.readFileSync(path.join(process.cwd(), 'src', 'index.css'), 'utf8')
const indexHtml = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf8')
const rainbowButton = fs.readFileSync(path.join(process.cwd(), 'src', 'components', 'ui', 'rainbow-borders-button.tsx'), 'utf8')

function assert(condition, message) {
  if (!condition) {
    console.error(`Visual design token check failed: ${message}`)
    process.exit(1)
  }
}

assert(indexCss.includes("--font-display: 'Manrope'"), 'display typography should use Manrope for a cleaner product UI')
assert(indexCss.includes("--font-sans: 'Inter'"), 'body typography should continue using Inter for readability')
assert(indexCss.includes('--bg-main: #050711'), 'main background should use the refined neutral ink token')
assert(indexCss.includes('--surface-strong: rgba(9, 14, 27, 0.82)'), 'surface depth should be tokenized')
assert(indexCss.includes('--accent-cyan: #22d3ee'), 'palette should include cyan as a secondary accent')
assert(indexCss.includes('--accent-amber: #fbbf24'), 'palette should include amber as a caution/value accent')
assert(indexCss.includes('linear-gradient(135deg, rgba(5, 7, 17, 0.98) 0%'), 'body background should use a directional premium wash')
assert(indexCss.includes('linear-gradient(rgba(148, 163, 184, 0.025) 1px'), 'body background should include a subtle grid texture')
assert(!indexCss.includes('radial-gradient(at 0% 0%'), 'body background must not use visible decorative radial blobs')
assert(indexCss.includes('letter-spacing: 0;'), 'global text rendering should avoid negative letter-spacing drift')
assert(indexHtml.includes('theme-color" content="#050711"'), 'mobile browser chrome should match the refined background')
assert(rainbowButton.includes('background: rgba(5, 7, 17, 0.96);'), 'rainbow CTA should use the refined neutral button fill')
assert(!rainbowButton.includes('cta-reflection-sheen'), 'rainbow CTA must stay free of the previous white reflection sweep')

console.log('Visual design token check passed.')
