import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'

const host = '127.0.0.1'
const port = 4178
const baseUrl = `http://${host}:${port}`
const pnpmCli = process.env.npm_execpath

function spawnPnpm(args, options = {}) {
  if (pnpmCli) return spawn(process.execPath, [pnpmCli, ...args], options)
  return spawn(process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm', args, { shell: process.platform === 'win32', ...options })
}

async function waitForPreview() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try { if ((await fetch(baseUrl)).ok) return } catch { await delay(400) }
  }
  throw new Error('Preview did not start')
}

async function stopPreview(preview) {
  if (preview.exitCode !== null) return
  if (process.platform === 'win32') {
    await new Promise(resolve => {
      const killer = spawn('taskkill', ['/pid', String(preview.pid), '/t', '/f'], { stdio: 'ignore' })
      killer.on('exit', resolve)
      killer.on('error', resolve)
    })
    return
  }
  process.kill(-preview.pid, 'SIGTERM')
}

const preview = spawnPnpm(['exec', 'vite', 'preview', '--host', host, '--port', String(port), '--strictPort'], {
  stdio: 'ignore',
  detached: process.platform !== 'win32',
})

let browser
try {
  await waitForPreview()
  browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    geolocation: { latitude: 17.515245, longitude: 78.291823 },
    permissions: ['geolocation'],
  })

  const areaPage = await context.newPage()
  await areaPage.goto(baseUrl)
  await areaPage.getByPlaceholder(/Search area/i).fill('Beeramguda')
  await areaPage.getByRole('button', { name: /Beeramguda/i }).click()
  await areaPage.waitForURL(/\/area\/beeramguda\/verdict/)
  assert.match(areaPage.url(), /\/area\/beeramguda\/verdict/)

  const locatePage = await context.newPage()
  await locatePage.route('**/api/utils/resolve', route => route.abort())
  await locatePage.goto(baseUrl)
  await locatePage.getByRole('button', { name: /Locate me/i }).click()
  await locatePage.waitForURL(/\/area\/beeramguda\/verdict/, { timeout: 10_000 })
  assert.match(locatePage.url(), /\/area\/beeramguda\/verdict/)

  await context.close()
  console.log('One-tap buyer navigation browser checks passed.')
} finally {
  if (browser) await browser.close()
  await stopPreview(preview)
}
