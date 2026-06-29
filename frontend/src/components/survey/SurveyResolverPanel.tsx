import { useState } from 'react'
import { X } from 'lucide-react'
import {
  resolveSurveyFromUserInput,
  type SurveyResolverMode,
  type SurveyResolverResult,
} from '@/lib/landIdentity/surveyResolver'
import type { LocationIntelligence } from '@/lib/landIdentity/types'

interface Props {
  open: boolean
  onClose?: () => void
  locationIntelligence?: LocationIntelligence | null
  onSurveyResult?: (result: SurveyResolverResult) => void
}

const MODES: Array<{ value: SurveyResolverMode; label: string }> = [
  { value: 'known_survey_number', label: 'I know the survey number' },
  { value: 'known_village_mandal', label: 'I know the village / mandal' },
  { value: 'pin_only', label: 'I only know this pin' },
  { value: 'layout_or_venture_name', label: 'I know venture/layout name' },
  { value: 'document_upload', label: 'I have documents' },
]

const DOCUMENTS = [
  'Sale deed',
  'Link documents',
  'Encumbrance certificate',
  'Pattadar passbook / title record',
  'Mutation record',
  'Layout approval letter',
  'Approved layout plan',
  'RERA certificate if applicable',
  'NALA / land conversion order',
  'Tax receipts',
]

export default function SurveyResolverPanel({ open, onClose, locationIntelligence, onSurveyResult }: Props) {
  const [mode, setMode] = useState<SurveyResolverMode>('known_survey_number')
  const [state, setState] = useState('Telangana')
  const [district, setDistrict] = useState('')
  const [mandal, setMandal] = useState('')
  const [village, setVillage] = useState('')
  const [surveyNumber, setSurveyNumber] = useState('')
  const [subdivisionNumber, setSubdivisionNumber] = useState('')
  const [nearbyArea, setNearbyArea] = useState('')
  const [layoutName, setLayoutName] = useState('')
  const [result, setResult] = useState<SurveyResolverResult | null>(null)

  if (!open) return null

  const lat = locationIntelligence?.lat
  const lng = locationIntelligence?.lng
  const matchedArea = locationIntelligence?.matchedMicroZone?.name ?? locationIntelligence?.nearestLocality

  function handleSubmit() {
    const nextResult = resolveSurveyFromUserInput({
      mode,
      state,
      district,
      mandal,
      village,
      surveyNumber,
      subdivisionNumber,
      lat,
      lng,
      layoutName,
    })
    setResult(nextResult)
    onSurveyResult?.(nextResult)
  }

  return (
    <aside
      aria-label="Survey Resolver"
      className="fixed bottom-4 left-4 z-[1200] max-h-[calc(100dvh-2rem)] w-[min(460px,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-white/10 bg-[#070910]/95 p-5 text-slate-100 shadow-2xl backdrop-blur-xl"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-sans font-bold uppercase tracking-[0.18em] text-cyan-300">Survey Resolver</p>
          <h2 className="mt-1 text-xl font-display font-bold">How do you want to identify the land?</h2>
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

      <div className="space-y-2">
        {MODES.map(option => (
          <button
            key={option.value}
            type="button"
            onClick={() => {
              setMode(option.value)
              setResult(null)
            }}
            className="w-full rounded-xl border px-4 py-3 text-left text-sm font-sans font-bold transition-colors"
            style={{
              background: mode === option.value ? 'rgba(6, 182, 212, 0.12)' : 'rgba(255,255,255,0.03)',
              borderColor: mode === option.value ? 'rgba(103, 232, 249, 0.35)' : 'rgba(255,255,255,0.1)',
              color: mode === option.value ? '#a5f3fc' : '#e2e8f0',
            }}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
        {(mode === 'known_survey_number' || mode === 'known_village_mandal') && (
          <>
            <TextField label="State" value={state} onChange={setState} />
            <TextField label="District" value={district} onChange={setDistrict} />
            <TextField label="Mandal" value={mandal} onChange={setMandal} />
            <TextField label="Village / Revenue Village" value={village} onChange={setVillage} />
          </>
        )}

        {mode === 'known_survey_number' && (
          <>
            <TextField label="Survey Number" value={surveyNumber} onChange={setSurveyNumber} />
            <TextField label="Subdivision Number, optional" value={subdivisionNumber} onChange={setSubdivisionNumber} />
          </>
        )}

        {mode === 'known_village_mandal' && (
          <TextField label="Nearby area/locality, optional" value={nearbyArea} onChange={setNearbyArea} />
        )}

        {mode === 'pin_only' && (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
            <p>Lat/Lng: {typeof lat === 'number' && typeof lng === 'number' ? `${lat.toFixed(6)}, ${lng.toFixed(6)}` : 'Exact pin not available.'}</p>
            <p className="mt-2">Matched area/micro-zone: {matchedArea ?? 'Not matched yet.'}</p>
            <p className="mt-3 text-slate-500">This pin gives location context, but survey identity requires cadastral or official land-record verification.</p>
          </div>
        )}

        {mode === 'layout_or_venture_name' && (
          <>
            <TextField label="Layout / Venture / Project Name" value={layoutName} onChange={setLayoutName} />
            <TextField label="Area / Locality" value={nearbyArea} onChange={setNearbyArea} />
            <TextField label="Village / Mandal, optional" value={mandal} onChange={setMandal} />
          </>
        )}

        {mode === 'document_upload' && (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-sm text-slate-300">Document upload and extraction will be added in a later phase.</p>
            <ul className="mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
              {DOCUMENTS.map(document => <li key={document}>{document}</li>)}
            </ul>
          </div>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          className="w-full rounded-xl bg-cyan-300 px-4 py-3 text-sm font-sans font-black text-slate-950 transition-colors hover:bg-cyan-200"
        >
          Mark verification required
        </button>
      </div>

      {result && (
        <section className="mt-4 rounded-xl border border-cyan-300/20 bg-cyan-300/[0.06] p-4">
          <p className="text-xs font-sans font-bold uppercase tracking-[0.14em] text-cyan-200">
            {result.status.replaceAll('_', ' ')} · {result.confidence} confidence
          </p>
          <ul className="mt-3 space-y-2 text-xs leading-5 text-slate-300">
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

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="text-xs font-sans font-bold text-slate-400">{label}</span>
      <input
        value={value}
        onChange={event => onChange(event.target.value)}
        className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-100 outline-none transition-colors focus:border-cyan-300/50"
      />
    </label>
  )
}
