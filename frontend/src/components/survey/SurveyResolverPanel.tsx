import { useState } from 'react'
import { X } from 'lucide-react'
import {
  resolveSurveyFromUserInput,
  validateSurveyLandDetail,
  type SurveyResolverResult,
} from '@/lib/landIdentity/surveyResolver'
import type { LocationIntelligence } from '@/lib/landIdentity/types'

interface Props {
  open: boolean
  onClose?: () => void
  locationIntelligence?: LocationIntelligence | null
  onSurveyResult?: (result: SurveyResolverResult) => void
}

const DETAIL_TYPES = [
  'Survey number',
  'Plot number',
  'Land number',
  'Khata / passbook number',
  'Layout / venture name',
  'Document reference',
]

export default function SurveyResolverPanel({ open, onClose, locationIntelligence, onSurveyResult }: Props) {
  const [selectedType, setSelectedType] = useState('Survey number')
  const [landDetail, setLandDetail] = useState('')
  const [localityNote, setLocalityNote] = useState('')
  const [result, setResult] = useState<SurveyResolverResult | null>(null)
  const [error, setError] = useState('')

  if (!open) return null

  const lat = locationIntelligence?.lat
  const lng = locationIntelligence?.lng
  const hasPin = typeof lat === 'number' && typeof lng === 'number'
  const detailValidation = validateSurveyLandDetail(selectedType, landDetail)
  const canSubmit = detailValidation.valid || localityNote.trim().length > 0 || hasPin

  function selectType(type: string) {
    setSelectedType(type)
    setResult(null)
    setError('')
  }

  function handleSubmit() {
    if (landDetail.trim() && !detailValidation.valid) {
      setError(detailValidation.message)
      return
    }

    if (!detailValidation.valid && !localityNote.trim() && !hasPin) {
      setError(detailValidation.message)
      return
    }

    const nextResult = resolveSurveyFromUserInput({
      mode: 'known_survey_number',
      surveyNumber: landDetail,
      village: localityNote,
      lat,
      lng,
      documentIds: detailValidation.valid ? [selectedType] : undefined,
    })
    setResult(nextResult)
    onSurveyResult?.(nextResult)
  }

  return (
    <aside
      aria-label="Survey Resolver"
      className="fixed inset-x-0 bottom-0 z-[1300] max-h-[76dvh] overflow-y-auto rounded-t-2xl border border-white/10 bg-[#070910]/95 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] text-slate-100 shadow-2xl backdrop-blur-xl sm:inset-x-auto sm:bottom-4 sm:left-4 sm:max-h-[calc(100dvh-2rem)] sm:w-[min(420px,calc(100vw-2rem))] sm:rounded-2xl sm:p-5"
    >
      <div className="sticky top-0 z-10 -mx-4 -mt-4 mb-3 flex items-start justify-between gap-3 border-b border-white/10 bg-[#070910]/95 px-4 py-4 backdrop-blur-xl sm:static sm:m-0 sm:mb-4 sm:border-b-0 sm:bg-transparent sm:p-0">
        <div>
          <p className="text-[10px] font-sans font-bold uppercase tracking-[0.18em] text-cyan-300">Survey Resolver</p>
          <h2 className="mt-1 text-lg font-display font-bold">What land detail do you have?</h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">Capture one clue. Official verification is still required.</p>
        </div>
        {onClose && (
          <button
            type="button"
            aria-label="Close Survey Resolver"
            onClick={onClose}
            className="rounded-lg border border-white/10 p-2 text-slate-400 transition-colors hover:text-slate-100"
          >
            <X size={15} />
          </button>
        )}
      </div>

      <section className="space-y-3">
        <div>
          <p className="text-xs font-sans font-bold text-slate-400">Select what this number/detail is</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {DETAIL_TYPES.map(type => {
              const checked = selectedType === type
              return (
                <label
                  key={type}
                  className="flex min-h-11 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-sans font-bold transition-colors"
                  style={{
                    background: checked ? 'rgba(6, 182, 212, 0.12)' : 'rgba(255,255,255,0.03)',
                    borderColor: checked ? 'rgba(103, 232, 249, 0.35)' : 'rgba(255,255,255,0.1)',
                    color: checked ? '#a5f3fc' : '#cbd5e1',
                  }}
                  >
                  <input
                    type="radio"
                    name="survey-resolver-detail-type"
                    checked={checked}
                    onChange={() => selectType(type)}
                    className="h-3.5 w-3.5 accent-cyan-300"
                  />
                  <span>{type}</span>
                </label>
              )
            })}
          </div>
        </div>

        <TextField
          label="Enter number or name"
          placeholder="Example: 5442, 12/A, plot 38, layout name"
          value={landDetail}
          onChange={(value) => {
            setLandDetail(value)
            setResult(null)
            setError('')
          }}
        />
        {error && (
          <p className="rounded-lg border border-amber-300/25 bg-amber-300/[0.08] px-3 py-2 text-xs leading-5 text-amber-100">
            {error}
          </p>
        )}

        <TextField
          label="Area / village / mandal, optional"
          placeholder="Add nearby locality if known"
          value={localityNote}
          onChange={(value) => {
            setLocalityNote(value)
            setResult(null)
            setError('')
          }}
        />

        {hasPin && (
          <p className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs leading-5 text-slate-400">
            Pin captured: {lat.toFixed(6)}, {lng.toFixed(6)}
          </p>
        )}

        <div className="sticky bottom-0 -mx-4 bg-[#070910]/95 px-4 pb-1 pt-3 backdrop-blur-xl sm:static sm:mx-0 sm:bg-transparent sm:p-0">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full rounded-xl bg-cyan-300 px-4 py-3 text-sm font-sans font-black text-slate-950 transition-colors hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-45"
          >
            Mark verification required
          </button>
        </div>
      </section>

      {result && (
        <section className="mt-4 rounded-xl border border-cyan-300/20 bg-cyan-300/[0.06] p-3">
          <p className="text-[11px] font-sans font-bold uppercase tracking-[0.12em] text-cyan-200">
            Manual verification required
          </p>
          <ul className="mt-2 space-y-1.5 text-xs leading-5 text-slate-300">
            {result.notes.map(note => <li key={note}>{note}</li>)}
          </ul>
        </section>
      )}

      <p className="mt-4 text-xs leading-5 text-slate-500">
        PlotDNA does not certify title or legal ownership. Treat this as a land-intelligence workflow, not a legal certificate.
      </p>
    </aside>
  )
}

function TextField({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string
  placeholder?: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="block">
      <span className="text-xs font-sans font-bold text-slate-400">{label}</span>
      <input
        value={value}
        placeholder={placeholder}
        onChange={event => onChange(event.target.value)}
        className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-slate-100 outline-none transition-colors placeholder:text-slate-600 focus:border-cyan-300/50"
      />
    </label>
  )
}
