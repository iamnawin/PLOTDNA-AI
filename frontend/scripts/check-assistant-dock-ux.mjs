import fs from 'node:fs'
import path from 'node:path'

const dockPath = path.join(process.cwd(), 'src', 'components', 'ui', 'AssistantDock.tsx')
const dock = fs.readFileSync(dockPath, 'utf8')

function assert(condition, message) {
  if (!condition) {
    console.error(`Assistant dock UX check failed: ${message}`)
    process.exit(1)
  }
}

assert(dock.includes('const PANEL_MARGIN'), 'assistant dock must define stable viewport margins')
assert(dock.includes('useEffect(() => {') && dock.includes('visualViewport'), 'assistant dock must react to viewport changes')
assert(dock.includes('drag={open}') && dock.includes('dragListener={false}'), 'assistant launcher must not be accidentally dragged when closed')
assert(dock.includes('dragControls'), 'assistant panel drag must be handled from a clear header grip')
assert(dock.includes('overflow-y-auto') && dock.includes('overscrollBehavior: \'contain\''), 'assistant messages must scroll inside the panel')
assert(dock.includes('minHeight: 0'), 'assistant message list must be allowed to shrink inside the fixed-height panel')
assert(dock.includes('height: panelHeight'), 'assistant open panel must have a bounded height')
assert(dock.includes("resize: viewport.width >= 768 ? 'both' : 'none'"), 'assistant panel must be user-resizable on desktop')
assert(dock.includes('Ask about this area, risk, or nearby zones'), 'assistant input placeholder must guide better questions')

console.log('Assistant dock UX check passed.')
