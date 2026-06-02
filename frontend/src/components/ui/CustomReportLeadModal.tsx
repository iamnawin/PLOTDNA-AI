import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { FileText, X } from 'lucide-react'
import { submitCustomReportLead } from '@/lib/api'
import type { CustomReportLeadPayload } from '@/lib/api'
import type { BuyerBriefInput } from '@/lib/customBuyerBrief'

interface Props {
  open: boolean
  areaName: string
  cityName: string
  payloadBase: Pick<CustomReportLeadPayload, 'citySlug' | 'cityName' | 'areaSlug' | 'areaName' | 'source'>
  packageInterest?: string
  paymentRequired?: boolean
  paymentAvailable?: boolean
  canGenerateBrief?: boolean
  onProceedToPayment?: () => void
  onGenerateBrief?: (input: BuyerBriefInput) => void
  onClose: () => void
  onSubmitted: (leadId: string, input: BuyerBriefInput) => void
}

const BUDGET_OPTIONS = ['', 'Under Rs 50L', 'Rs 50L-1Cr', 'Rs 1Cr-2Cr', 'Rs 2Cr+']
const TIMELINE_OPTIONS = ['', '0-3 months', '3-6 months', '6-12 months', 'Just researching']

export default function CustomReportLeadModal({
  open,
  areaName,
  cityName,
  payloadBase,
  packageInterest,
  paymentRequired = true,
  paymentAvailable = false,
  canGenerateBrief = false,
  onProceedToPayment,
  onGenerateBrief,
  onClose,
  onSubmitted,
}: Props) {
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [budgetRange, setBudgetRange] = useState('')
  const [timeline, setTimeline] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [submittedLeadId, setSubmittedLeadId] = useState('')
  const [submittedInput, setSubmittedInput] = useState<BuyerBriefInput | null>(null)
  const isCustomReport = packageInterest === 'custom_due_diligence_499'
  const isManualFallback = paymentRequired && !paymentAvailable
  const packageLabel = isCustomReport ? 'Rs 499 buyer brief' : 'Rs 99 screening PDF'
  const title = isCustomReport
    ? 'Request custom buyer verification brief'
    : paymentAvailable ? 'Get instant screening PDF' : 'Request instant PDF payment link'
  const description = isCustomReport
    ? `Share your buying context for ${areaName}, ${cityName}. PlotDNA will use this to prioritize RERA, access, approvals, pricing, seller questions, and risk checks.`
    : paymentAvailable
      ? `The instant PDF for ${areaName}, ${cityName} should normally open through Razorpay. Leave your contact only if checkout is unavailable and we need to send the PDF link manually.`
      : `Razorpay checkout is temporarily unavailable for ${areaName}, ${cityName}. Leave your contact and we will send the payment link or PDF link manually.`
  const submittedMessage = paymentAvailable
    ? 'Contact captured. Continue to Razorpay payment to complete this request.'
    : canGenerateBrief
      ? 'Contact captured. Download the custom buyer verification brief for testing or admin fulfilment.'
    : isCustomReport
      ? 'Contact captured. We will follow up with the custom report payment link and next verification steps.'
      : 'Contact captured. We will follow up with the PDF payment link or report link.'
  const submitLabel = isCustomReport
    ? canGenerateBrief ? 'Generate preview brief' : paymentAvailable ? 'Request report' : 'Request payment link'
    : paymentAvailable ? 'Send PDF link' : 'Request PDF link'

  useEffect(() => {
    if (open) return
    setSubmittedLeadId('')
    setSubmittedInput(null)
    setError('')
  }, [open])

  async function handleSubmit() {
    setError('')
    if (!name.trim()) {
      setError('Enter your name so we can prepare the buyer brief.')
      return
    }
    if (!contact.trim()) {
      setError('Enter an email or phone number so we can send the report or payment link.')
      return
    }
    setSubmitting(true)
    try {
      const leadInput: BuyerBriefInput = {
        name,
        contact,
        budgetRange: budgetRange || undefined,
        timeline: timeline || undefined,
        notes: notes || undefined,
      }
      const result = await submitCustomReportLead({
        ...payloadBase,
        ...leadInput,
        name,
        contact,
        packageInterest,
      })
      setSubmittedLeadId(result.leadId)
      setSubmittedInput(leadInput)
      onSubmitted(result.leadId, leadInput)
      if (isCustomReport && canGenerateBrief && onGenerateBrief) {
        onGenerateBrief(leadInput)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit request. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  function handleClose() {
    setError('')
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[3000] flex items-center justify-center px-4 py-4"
          style={{ background: 'rgba(4,4,10,0.84)', backdropFilter: 'blur(18px)' }}
        >
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="max-h-[calc(100vh-2rem)] w-full max-w-lg overflow-y-auto rounded-3xl p-5"
            style={{
              background: 'linear-gradient(180deg, rgba(10,10,22,0.98), rgba(6,6,14,0.98))',
              border: '1px solid rgba(16,185,129,0.22)',
              boxShadow: '0 24px 80px rgba(0,0,0,0.55)',
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div
                  className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl"
                  style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.24)' }}
                >
                  <FileText size={16} className="text-emerald-400" />
                </div>
                <h2 className="font-display text-lg font-bold text-slate-100">{title}</h2>
                <p className="mt-2 text-sm font-sans leading-relaxed text-slate-400">
                  {description}
                </p>
                {packageInterest && (
                  <p className="mt-2 inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-sans font-bold uppercase tracking-[0.12em] text-emerald-300">
                    {packageLabel}
                  </p>
                )}
                {isManualFallback && (
                  <p className="mt-2 inline-flex rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-1 text-[10px] font-sans font-bold uppercase tracking-[0.12em] text-amber-300">
                    Manual checkout fallback
                  </p>
                )}
              </div>
              <button
                onClick={handleClose}
                className="rounded-xl p-2 text-slate-500 transition-colors hover:text-slate-100"
                aria-label="Close custom report request"
              >
                <X size={14} />
              </button>
            </div>

            {submittedLeadId ? (
              <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                <p className="font-sans text-sm font-bold text-emerald-300">
                  {canGenerateBrief ? 'Preview generated' : paymentAvailable ? 'Contact saved' : 'Manual request received'}
                </p>
                <p className="mt-2 text-xs font-sans leading-relaxed text-slate-300">
                  Lead ID {submittedLeadId}. {submittedMessage}
                </p>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <button
                    onClick={handleClose}
                    className="flex-1 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-sans text-slate-300"
                  >
                    Close
                  </button>
                  {paymentAvailable && onProceedToPayment && (
                    <button
                      onClick={onProceedToPayment}
                      className="flex-1 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-sans font-bold text-[#04110b]"
                    >
                      Continue to payment
                    </button>
                  )}
                  {isCustomReport && canGenerateBrief && onGenerateBrief && submittedInput && (
                    <button
                      onClick={() => onGenerateBrief(submittedInput)}
                      className="flex-1 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-sans font-bold text-[#04110b]"
                    >
                      Download custom brief
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label>
                    <span className="mb-2 block text-[10px] font-sans font-bold uppercase tracking-[0.14em] text-slate-500">
                      Name
                    </span>
                    <input
                      value={name}
                      onChange={(event) => { setName(event.target.value); setError('') }}
                      placeholder="Your name"
                      className="w-full rounded-2xl border border-white/10 bg-transparent px-4 py-3 font-sans text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-emerald-500/40"
                    />
                  </label>
                  <label>
                    <span className="mb-2 block text-[10px] font-sans font-bold uppercase tracking-[0.14em] text-slate-500">
                      Email or phone
                    </span>
                    <input
                      value={contact}
                      onChange={(event) => { setContact(event.target.value); setError('') }}
                      placeholder="you@example.com"
                      className="w-full rounded-2xl border border-white/10 bg-transparent px-4 py-3 font-sans text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-emerald-500/40"
                    />
                  </label>
                  {isCustomReport && (
                    <label>
                      <span className="mb-2 block text-[10px] font-sans font-bold uppercase tracking-[0.14em] text-slate-500">
                        Budget
                      </span>
                      <select
                        value={budgetRange}
                        onChange={(event) => setBudgetRange(event.target.value)}
                        className="w-full rounded-2xl border border-white/10 bg-[#080a16] px-4 py-3 font-sans text-sm text-slate-100 outline-none focus:border-emerald-500/40"
                      >
                        {BUDGET_OPTIONS.map(option => (
                          <option key={option || 'empty'} value={option}>{option || 'Select budget'}</option>
                        ))}
                      </select>
                    </label>
                  )}
                  {isCustomReport && (
                    <label>
                      <span className="mb-2 block text-[10px] font-sans font-bold uppercase tracking-[0.14em] text-slate-500">
                        Timeline
                      </span>
                      <select
                        value={timeline}
                        onChange={(event) => setTimeline(event.target.value)}
                        className="w-full rounded-2xl border border-white/10 bg-[#080a16] px-4 py-3 font-sans text-sm text-slate-100 outline-none focus:border-emerald-500/40"
                      >
                        {TIMELINE_OPTIONS.map(option => (
                          <option key={option || 'empty'} value={option}>{option || 'Select timeline'}</option>
                        ))}
                      </select>
                    </label>
                  )}
                </div>

                {isCustomReport && (
                  <label className="mt-3 block">
                    <span className="mb-2 block text-[10px] font-sans font-bold uppercase tracking-[0.14em] text-slate-500">
                      Notes
                    </span>
                    <textarea
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                      placeholder="Project name, survey number, broker quote, or checks needed"
                      rows={3}
                      className="w-full resize-none rounded-2xl border border-white/10 bg-transparent px-4 py-3 font-sans text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-emerald-500/40"
                    />
                  </label>
                )}

                {error && <p className="mt-3 text-[11px] font-sans text-red-400">{error}</p>}

                <div className="mt-5 flex gap-3">
                  <button
                    onClick={handleClose}
                    className="flex-1 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-sans text-slate-400"
                  >
                    Later
                  </button>
                  <button
                    onClick={() => void handleSubmit()}
                    disabled={submitting}
                    className="flex-1 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-sans font-bold text-[#04110b] disabled:opacity-60"
                  >
                    {submitting ? 'Submitting...' : submitLabel}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
