import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const entitlements = fs.readFileSync(path.join(root, 'src/lib/entitlements.ts'), 'utf8')
const emailGate = fs.readFileSync(path.join(root, 'src/components/ui/EmailGateModal.tsx'), 'utf8')

const requiredEntitlementExports = [
  'export async function requestEmailOtp',
  'export async function verifyEmailOtp',
  'export async function trackUserEvent',
]

for (const needle of requiredEntitlementExports) {
  if (!entitlements.includes(needle)) {
    throw new Error(`Missing entitlements contract: ${needle}`)
  }
}

const requiredUiSignals = [
  'Enter verification code',
  'Send code',
  'Verify code',
  'setStep',
]

for (const needle of requiredUiSignals) {
  if (!emailGate.includes(needle)) {
    throw new Error(`Missing email OTP UI signal: ${needle}`)
  }
}

console.log('Email OTP frontend contract is present.')
