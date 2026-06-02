import fs from 'node:fs'
import path from 'node:path'

const tagline = "Don't buy on broker claims. Buy with PlotDNA."

const files = {
  landing: fs.readFileSync(path.join(process.cwd(), 'src', 'pages', 'Landing.tsx'), 'utf8'),
  areaDetail: fs.readFileSync(path.join(process.cwd(), 'src', 'pages', 'AreaDetail.tsx'), 'utf8'),
  modal: fs.readFileSync(path.join(process.cwd(), 'src', 'components', 'ui', 'CustomReportLeadModal.tsx'), 'utf8'),
}

function assert(condition, message) {
  if (!condition) {
    console.error(`Brand tagline check failed: ${message}`)
    process.exit(1)
  }
}

assert(files.landing.includes(tagline), 'landing page must surface the broker-claims tagline')
assert(files.areaDetail.includes(tagline), 'area detail must surface the broker-claims tagline')
assert(files.modal.includes(tagline), 'buyer brief modal must surface the broker-claims tagline')
assert((files.areaDetail.match(new RegExp(tagline.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) ?? []).length >= 3, 'area detail must include tagline in UI and both PDF footers')

console.log('Brand tagline check passed.')
