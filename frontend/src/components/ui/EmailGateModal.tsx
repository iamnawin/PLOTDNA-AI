import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Mail, X } from 'lucide-react'
import { attachEmail, type EntitlementsResponse } from '@/lib/entitlements'

interface Props {
  open: boolean
  entitlements: EntitlementsResponse | null
  onClose: () => void
  onUnlocked: (entitlements: EntitlementsResponse) => void
}

export default function EmailGateModal({ open, entitlements, onClose, onUnlocked }: Props) {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const searchesLabel = useMemo(() => {
    if (!entitlements) return 'your free searches'
    return `${entitlements.free_limit} free searches`
  }, [entitlements])

  async function handleSubmit() {
    setError('')
    setSubmitting(true)
    const result = await attachEmail(email.trim())
    setSubmitting(false)

    if (result.status === 'error') {
      setError(result.message)
      return
    }

    setEmail('')
    onUnlocked(result.entitlements)
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
                  <Mail size={16} className="text-[#00e676]" />
                </div>
                <h2 className="font-display text-lg font-bold text-[#f4f4fb]">Unlock more searches</h2>
                <p className="mt-2 text-sm font-mono text-[#7d7d92]">
                  You’ve used {searchesLabel}. Add your email to keep searching in PlotDNA.
                </p>
              </div>
              <button
                onClick={onClose}
                className="rounded-xl p-2 text-[#666680] transition-colors hover:text-[#e8e8f0]"
              >
                <X size={14} />
              </button>
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-[10px] font-mono uppercase tracking-[0.16em] text-[#444455]">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError('') }}
                onKeyDown={(e) => { if (e.key === 'Enter' && !submitting) void handleSubmit() }}
                placeholder="you@example.com"
                className="w-full rounded-2xl border bg-transparent px-4 py-3 font-mono text-sm text-[#e8e8f0] outline-none placeholder:text-[#3a3a52]"
                style={{ borderColor: 'rgba(255,255,255,0.09)' }}
              />
              {error && (
                <p className="mt-2 text-[11px] font-mono text-[#ef4444]">{error}</p>
              )}
            </div>

            <div className="mt-5 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 rounded-2xl px-4 py-3 text-sm font-mono text-[#888899]"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                Later
              </button>
              <button
                onClick={() => void handleSubmit()}
                disabled={submitting}
                className="flex-1 rounded-2xl px-4 py-3 text-sm font-mono font-semibold text-black disabled:opacity-60"
                style={{
                  background: 'linear-gradient(135deg, #00e676 0%, #00b36b 100%)',
                  boxShadow: '0 0 24px rgba(0,230,118,0.18)',
                }}
              >
                {submitting ? 'Saving…' : 'Continue'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
