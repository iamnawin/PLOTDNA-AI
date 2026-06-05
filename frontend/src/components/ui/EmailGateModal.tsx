import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { KeyRound, Mail, X } from 'lucide-react'
import { requestEmailOtp, verifyEmailOtp, type EntitlementsResponse } from '@/lib/entitlements'

interface Props {
  open: boolean
  entitlements: EntitlementsResponse | null
  onClose: () => void
  onUnlocked: (entitlements: EntitlementsResponse) => void
  title?: string
  description?: string
  primaryLabel?: string
}

export default function EmailGateModal({
  open,
  entitlements,
  onClose,
  onUnlocked,
  title = 'Unlock more searches',
  description,
  primaryLabel = 'Continue',
}: Props) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [debugOtp, setDebugOtp] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const searchesLabel = useMemo(() => {
    if (!entitlements) return 'your free searches'
    return `${entitlements.free_limit} free searches`
  }, [entitlements])

  async function handleRequestCode() {
    setError('')
    setSubmitting(true)
    const result = await requestEmailOtp(name.trim(), email.trim())
    setSubmitting(false)

    if (result.status === 'error') {
      setError(result.message)
      return
    }

    setEmail(result.otp.email)
    setDebugOtp(result.otp.debugOtp ?? null)
    setStep('otp')
  }

  async function handleVerifyCode() {
    setError('')
    setSubmitting(true)
    const result = await verifyEmailOtp(email.trim(), otp.trim())
    setSubmitting(false)

    if (result.status === 'error') {
      setError(result.message)
      return
    }

    setEmail('')
    setName('')
    setOtp('')
    setDebugOtp(null)
    setStep('email')
    onUnlocked(result.verification.entitlements)
  }

  function handleClose() {
    setError('')
    onClose()
  }

  function handlePrimaryAction() {
    if (step === 'otp') {
      void handleVerifyCode()
      return
    }
    void handleRequestCode()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[3000] flex items-center justify-center px-4"
          style={{ background: 'rgba(4,4,10,0.84)', backdropFilter: 'blur(18px)' }}
        >
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="w-full max-w-md rounded-3xl p-5"
            style={{
              background: 'linear-gradient(180deg, rgba(10,10,22,0.98), rgba(6,6,14,0.98))',
              border: '1px solid rgba(0,230,118,0.18)',
              boxShadow: '0 24px 80px rgba(0,0,0,0.55)',
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div
                  className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl"
                  style={{
                    background: 'rgba(0,230,118,0.12)',
                    border: '1px solid rgba(0,230,118,0.24)',
                  }}
                >
                  {step === 'otp'
                    ? <KeyRound size={16} className="text-[#00e676]" />
                    : <Mail size={16} className="text-[#00e676]" />}
                </div>
                <h2 className="font-display text-lg font-bold text-[#f4f4fb]">{title}</h2>
                <p className="mt-2 text-sm font-mono text-[#7d7d92]">
                  {step === 'otp'
                    ? `Enter verification code sent to ${email}.`
                    : description ?? `You've used ${searchesLabel}. Add your email to keep searching in PlotDNA.`}
                </p>
              </div>
              <button
                onClick={handleClose}
                className="rounded-xl p-2 text-[#666680] transition-colors hover:text-[#e8e8f0]"
              >
                <X size={14} />
              </button>
            </div>

            <div className="mt-5">
              {step === 'email' ? (
                <>
                  <label className="mb-2 block text-[10px] font-mono uppercase tracking-[0.16em] text-[#444455]">
                    Full name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => { setName(e.target.value); setError('') }}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !submitting) void handleRequestCode() }}
                    placeholder="Your name"
                    className="mb-4 w-full rounded-2xl border bg-transparent px-4 py-3 font-mono text-sm text-[#e8e8f0] outline-none placeholder:text-[#3a3a52]"
                    style={{ borderColor: 'rgba(255,255,255,0.09)' }}
                  />
                  <label className="mb-2 block text-[10px] font-mono uppercase tracking-[0.16em] text-[#444455]">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError('') }}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !submitting) void handleRequestCode() }}
                    placeholder="you@example.com"
                    className="w-full rounded-2xl border bg-transparent px-4 py-3 font-mono text-sm text-[#e8e8f0] outline-none placeholder:text-[#3a3a52]"
                    style={{ borderColor: 'rgba(255,255,255,0.09)' }}
                  />
                </>
              ) : (
                <>
                  <label className="mb-2 block text-[10px] font-mono uppercase tracking-[0.16em] text-[#444455]">
                    Verification code
                  </label>
                  <input
                    inputMode="numeric"
                    value={otp}
                    onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setError('') }}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !submitting) void handleVerifyCode() }}
                    placeholder="Enter verification code"
                    className="w-full rounded-2xl border bg-transparent px-4 py-3 font-mono text-sm text-[#e8e8f0] outline-none placeholder:text-[#3a3a52]"
                    style={{ borderColor: 'rgba(255,255,255,0.09)' }}
                  />
                  {debugOtp && (
                    <p className="mt-2 text-[11px] font-mono text-[#7d7d92]">Dev code: {debugOtp}</p>
                  )}
                  <button
                    type="button"
                    onClick={() => { setStep('email'); setOtp(''); setError('') }}
                    className="mt-3 text-[11px] font-mono text-[#00e676]"
                  >
                    Change email
                  </button>
                </>
              )}
              {error && (
                <p className="mt-2 text-[11px] font-mono text-[#ef4444]">{error}</p>
              )}
            </div>

            <div className="mt-5 flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 rounded-2xl px-4 py-3 text-sm font-mono text-[#888899]"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                Later
              </button>
              <button
                onClick={handlePrimaryAction}
                disabled={submitting}
                className="flex-1 rounded-2xl px-4 py-3 text-sm font-mono font-semibold text-black disabled:opacity-60"
                style={{
                  background: 'linear-gradient(135deg, #00e676 0%, #00b36b 100%)',
                  boxShadow: '0 0 24px rgba(0,230,118,0.18)',
                }}
              >
                {submitting ? 'Working...' : step === 'otp' ? 'Verify code' : primaryLabel === 'Continue' ? 'Send code' : primaryLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
