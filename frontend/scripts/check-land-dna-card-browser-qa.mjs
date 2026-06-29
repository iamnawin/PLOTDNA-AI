import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'

const host = '127.0.0.1'
const port = 4174
const baseUrl = `http://${host}:${port}`
const pnpmCli = process.env.npm_execpath

const qaEnv = {
  ...process.env,
  VITE_ENABLE_GROWTH_FORECAST_CARD: 'true',
  VITE_ENABLE_LAND_DNA_CARD: 'true',
  VITE_ENABLE_FOUNDER_PASS_GATING: 'true',
}

const routeCases = [
  {
    path: '/card/HYD-PXX-070',
    name: 'Peerzadiguda',
    score: '70 / 100',
    hidden: ['Not available yet', 'requires historical data', 'N/A'],
  },
  {
    path: '/card/HYD-YXX-060',
    name: 'Yapral',
    score: '60 / 100',
    hidden: ['Not available yet', 'requires historical data', 'N/A'],
  },
  { path: '/card/HYD-AXX-075', name: 'Ameenpur', score: '75 / 100' },
  { path: '/card/HYD-BXX-064', name: 'Beeramguda', score: '64 / 100' },
  { path: '/card/peerzadiguda', name: 'Peerzadiguda', score: '70 / 100' },
  { path: '/c/HYD-PXX-070', name: 'Peerzadiguda', score: '70 / 100' },
]

const viewports = [
  { label: 'desktop', width: 1280, height: 900, isMobile: false },
  { label: 'mobile', width: 390, height: 844, isMobile: true },
]

function spawnPnpm(args, options = {}) {
  if (pnpmCli) {
    return spawn(process.execPath, [pnpmCli, ...args], options)
  }
  return spawn(process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm', args, {
    shell: process.platform === 'win32',
    ...options,
  })
}

function runPnpm(args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawnPnpm(args, {
      stdio: 'inherit',
      ...options,
    })
    child.on('exit', code => {
      if (code === 0) {
        resolve()
        return
      }
      reject(new Error(`pnpm ${args.join(' ')} exited with ${code}`))
    })
  })
}

async function waitForPreview() {
  const deadline = Date.now() + 30_000
  while (Date.now() < deadline) {
    try {
      const response = await fetch(baseUrl)
      if (response.ok) return
    } catch {
      await delay(500)
    }
  }
  throw new Error(`Vite preview did not start at ${baseUrl}`)
}

function startPreview() {
  return spawnPnpm(['exec', 'vite', 'preview', '--host', host, '--port', String(port), '--strictPort'], {
    env: qaEnv,
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: process.platform !== 'win32',
  })
}

async function stopPreview(preview) {
  if (preview.exitCode !== null) return
  if (process.platform === 'win32') {
    await new Promise(resolve => {
      const killer = spawn('taskkill', ['/pid', String(preview.pid), '/t', '/f'], {
        stdio: 'ignore',
      })
      killer.on('exit', resolve)
      killer.on('error', resolve)
    })
    return
  }
  process.kill(-preview.pid, 'SIGTERM')
}

async function expectVisibleText(page, text, context) {
  const locator = page.getByText(text, { exact: false }).first()
  try {
    await locator.waitFor({ state: 'visible' })
  } catch {
    throw new Error(`${context}: expected visible text "${text}"`)
  }
}

async function expectHiddenText(page, text, context) {
  const count = await page.getByText(text, { exact: false }).count()
  if (count > 0) {
    throw new Error(`${context}: unexpected unavailable placeholder "${text}"`)
  }
}

async function runBrowserQa() {
  console.log('Building frontend with Phase 3 flags enabled for browser QA...')
  await runPnpm(['run', 'build'], { env: qaEnv })

  const preview = startPreview()
  const previewLogs = []
  preview.stdout.on('data', chunk => previewLogs.push(chunk.toString()))
  preview.stderr.on('data', chunk => previewLogs.push(chunk.toString()))

  let browser
  try {
    try {
      await waitForPreview()
    } catch (error) {
      throw new Error(`${error.message}\nPreview output:\n${previewLogs.join('')}`)
    }
    browser = await chromium.launch()

    for (const viewport of viewports) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        isMobile: viewport.isMobile,
      })
      const page = await context.newPage()
      page.setDefaultTimeout(10_000)
      page.setDefaultNavigationTimeout(15_000)

      for (const route of routeCases) {
        const label = `${viewport.label} ${route.path}`
        console.log(`Checking ${label}`)
        await page.goto(`${baseUrl}${route.path}`, { waitUntil: 'domcontentloaded' })
        await expectVisibleText(page, route.name, label)
        await expectVisibleText(page, 'Hyderabad', label)
        await expectVisibleText(page, route.score, label)
        await expectVisibleText(page, 'Infrastructure Readiness', label)
        await expectVisibleText(page, 'Connectivity Signal', label)
        await expectVisibleText(page, 'PlotDNA provides location intelligence signals', label)

        for (const hiddenText of route.hidden ?? []) {
          await expectHiddenText(page, hiddenText, label)
        }
      }

      await context.close()
    }
  } finally {
    if (browser) await browser.close()
    await stopPreview(preview)
  }

  console.log('Land DNA Card browser QA findings')
  console.table(routeCases.map(route => ({ route: route.path, area: route.name, score: route.score })))
  console.log('Result: Area Pass routes render in desktop and mobile preview with unavailable forecast placeholders hidden.')
  if (previewLogs.length === 0) return
}

runBrowserQa().catch(error => {
  console.error(`Land DNA Card browser QA failed: ${error.message}`)
  process.exit(1)
})
