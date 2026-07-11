import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'

const host = '127.0.0.1'
const port = 4176
const baseUrl = `http://${host}:${port}`
const pnpmCli = process.env.npm_execpath
const paymentUrl = 'https://rzp.io/rzp/plotdna-founder-pass-test'
const env = { ...process.env, VITE_RAZORPAY_PDF_LINK: paymentUrl }

function spawnPnpm(args, options = {}) {
  if (pnpmCli) return spawn(process.execPath, [pnpmCli, ...args], options)
  return spawn(process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm', args, { shell: process.platform === 'win32', ...options })
}

function runPnpm(args) {
  return new Promise((resolve, reject) => {
    const child = spawnPnpm(args, { env, stdio: 'inherit' })
    child.on('exit', code => code === 0 ? resolve() : reject(new Error(`pnpm ${args.join(' ')} exited with ${code}`)))
  })
}

async function waitForPreview() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      if ((await fetch(baseUrl)).ok) return
    } catch {
      await delay(500)
    }
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

await runPnpm(['run', 'build'])
const preview = spawnPnpm(['exec', 'vite', 'preview', '--host', host, '--port', String(port), '--strictPort'], {
  env,
  stdio: 'ignore',
  detached: process.platform !== 'win32',
})

let browser
try {
  await waitForPreview()
  browser = await chromium.launch()
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, acceptDownloads: true, isMobile: true })
  const page = await context.newPage()

  await page.goto(`${baseUrl}/area/beeramguda/pass`, { waitUntil: 'domcontentloaded' })
  for (const label of ['Share Link', 'Download PNG', 'Download Buyer Report', 'Copy URL', 'Unlock Founder Pass']) {
    await page.getByText(label, { exact: false }).first().waitFor({ state: 'visible' })
  }
  assert.equal(await page.getByRole('link', { name: /Unlock Founder Pass/i }).getAttribute('href'), paymentUrl)
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: /Download Buyer Report/i }).click()
  const download = await downloadPromise
  assert.equal(download.suggestedFilename(), 'plotdna-buyer-report-HYD-BXX-064.pdf')

  await page.goto(`${baseUrl}/area/beeramguda/details`, { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: /Download Buyer Report/i }).waitFor({ state: 'visible' })
  await page.getByRole('link', { name: /Compare Areas/i }).waitFor({ state: 'visible' })
  await page.getByRole('link', { name: /Generate Area Pass/i }).waitFor({ state: 'visible' })

  await page.goto(`${baseUrl}/area/beeramguda/verdict`, { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: /Download Buyer Report/i }).waitFor({ state: 'visible' })
  await page.getByRole('link', { name: /Compare Areas/i }).waitFor({ state: 'visible' })
  await page.getByRole('link', { name: /Generate Area Pass/i }).waitFor({ state: 'visible' })

  await context.close()
  console.log('Buyer Report and Founder Pass mobile flow checks passed.')
} finally {
  if (browser) await browser.close()
  await stopPreview(preview)
}
