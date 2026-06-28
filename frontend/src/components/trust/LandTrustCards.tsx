import type { LandTrustSignals } from '@/lib/landIdentity/types'

interface Props {
  signals: LandTrustSignals | null
}

const FALLBACK_NOTES = {
  layoutApproval: 'Approval signal not checked yet.',
  surveyIdentity: 'Survey number not confirmed from current map data.',
  infrastructure: 'Infrastructure readiness has not been checked.',
  ownershipDocumentation: 'Documentation confidence requires verified records.',
  developmentHistory: 'Development history has not been checked.',
}

export default function LandTrustCards({ signals }: Props) {
  const cards = [
    {
      title: 'Layout Approval',
      status: signals?.layoutApproval.status ?? 'not_checked',
      confidence: signals?.layoutApproval.confidence ?? 'unknown',
      notes: signals?.layoutApproval.notes ?? [FALLBACK_NOTES.layoutApproval],
    },
    {
      title: 'Survey Identity',
      status: signals?.surveyIdentity.status ?? 'not_checked',
      confidence: signals?.surveyIdentity.confidence ?? 'unknown',
      notes: signals?.surveyIdentity.notes ?? [FALLBACK_NOTES.surveyIdentity],
    },
    {
      title: 'Infrastructure Readiness',
      status: signals?.infrastructure.status ?? 'not_checked',
      confidence: 'unknown',
      notes: signals?.infrastructure.notes ?? [FALLBACK_NOTES.infrastructure],
    },
    {
      title: 'Ownership & Documentation',
      status: signals?.ownershipDocumentation.status ?? 'manual_verification_required',
      confidence: signals?.ownershipDocumentation.confidence ?? 'unknown',
      notes: signals?.ownershipDocumentation.notes ?? [FALLBACK_NOTES.ownershipDocumentation],
    },
    {
      title: 'Development History',
      status: signals?.developmentHistory.status ?? 'not_checked',
      confidence: signals?.developmentHistory.confidence ?? 'unknown',
      notes: signals?.developmentHistory.notes ?? [FALLBACK_NOTES.developmentHistory],
    },
  ]

  return (
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
      {cards.map(card => (
        <article key={card.title} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-slate-100">
          <h3 className="text-sm font-display font-bold">{card.title}</h3>
          <p className="mt-2 text-xs font-mono uppercase tracking-[0.12em] text-slate-500">
            {card.status.replaceAll('_', ' ')} · {card.confidence}
          </p>
          <ul className="mt-3 space-y-1 text-xs leading-5 text-slate-400">
            {card.notes.map(note => <li key={note}>{note}</li>)}
          </ul>
        </article>
      ))}
    </section>
  )
}
