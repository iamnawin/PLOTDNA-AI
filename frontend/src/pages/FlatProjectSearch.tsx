import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight, Building2, ExternalLink, MapPin, Search, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  fetchFlatProjectDetail,
  searchFlatProjects,
  type FlatProjectDetail,
  type FlatProjectIdentity,
  type FlatProjectSearchResponse,
} from '@/lib/api'

const minimumSearchLength = 3
const searchDebounceMs = 300
const searchPageSize = 20

function formatSlug(value: string) {
  return value
    .split('-')
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function formatSourceClass(value: string) {
  return formatSlug(value.toLowerCase().replaceAll('_', '-'))
}

function formatReviewedDate(value: string) {
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(value))
}

function ProjectDetails({ project }: { project: FlatProjectIdentity }) {
  return (
    <div className="min-w-0">
      <h2 className="font-display text-xl font-extrabold tracking-[-0.025em] text-slate-50 sm:text-2xl">
        {project.canonical_name}
      </h2>
      <p className="mt-1 text-base font-medium text-slate-300">{project.developer_name}</p>
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-300">
        <span className="flex items-center gap-2">
          <MapPin size={16} className="text-emerald-300" />
          {formatSlug(project.locality_slug)}
        </span>
        <span className="flex items-center gap-2">
          <Building2 size={16} className="text-cyan-300" />
          {formatSlug(project.city_slug)}
        </span>
      </div>
      {project.rera_registration_numbers.length > 0 && (
        <p className="mt-3 text-sm text-slate-400">
          RERA {project.rera_registration_numbers.join(', ')}
        </p>
      )}
    </div>
  )
}

function ProjectSnapshot({ project, onChange }: { project: FlatProjectDetail; onChange: () => void }) {
  const coordinates = project.latitude !== null && project.longitude !== null
    ? `${project.latitude.toFixed(6)}, ${project.longitude.toFixed(6)}`
    : 'Not available'

  return (
    <section className="rounded-2xl border border-emerald-300/45 bg-[#091720] p-5 sm:p-7">
      <div className="flex items-center gap-2 text-sm font-bold text-emerald-300">
        <ShieldCheck size={19} />
        Verified project snapshot
      </div>
      <div className="mt-5">
        <ProjectDetails project={project} />
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-300/15 bg-slate-950/35 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">RERA reference</p>
          {project.rera_references.length > 0 ? project.rera_references.map(reference => (
            <div key={`${reference.authority_code}-${reference.registration_number}`} className="mt-3">
              <p className="font-bold text-slate-100">{reference.registration_number}</p>
              <p className="mt-1 text-sm text-slate-300">
                {reference.authority_code} · {formatSlug(reference.reference_status.toLowerCase())}
              </p>
            </div>
          )) : (
            <p className="mt-3 text-sm text-slate-300">No active reviewed reference.</p>
          )}
        </div>

        <div className="rounded-xl border border-slate-300/15 bg-slate-950/35 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Reviewed location</p>
          <p className="mt-3 font-bold text-slate-100">{formatSlug(project.locality_slug)}</p>
          <p className="mt-1 text-sm text-slate-300">{coordinates}</p>
          <p className="mt-1 text-xs text-slate-400">{formatSlug(project.location_precision.toLowerCase())}</p>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-amber-300/25 bg-amber-300/[0.05] p-4 text-sm leading-6 text-slate-300">
        <strong className="text-amber-200">This snapshot does not verify</strong> unit ownership, title,
        approvals, current price, construction progress, or legal due diligence.
        <p className="mt-2">Current developer availability is not verified.</p>
      </div>

      <section className="mt-6" aria-labelledby="flatdna-evidence-heading">
        <h3 id="flatdna-evidence-heading" className="font-display text-lg font-extrabold text-slate-50">
          Evidence and freshness
        </h3>
        <div className="mt-3 overflow-hidden rounded-xl border border-slate-300/15 bg-slate-950/25">
          {project.sources.length > 0 ? project.sources.map(source => (
            <div key={`${source.source_class}-${source.publisher}-${source.retrieved_at}-${source.url ?? ''}`} className="border-b border-slate-300/10 p-4 last:border-b-0">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-bold text-slate-100">{source.publisher}</p>
                  <p className="mt-1 text-sm text-slate-400">
                    {formatSourceClass(source.source_class)}. Reviewed {formatReviewedDate(source.retrieved_at)}
                  </p>
                </div>
                {source.url && (
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Open ${source.publisher} source`}
                    className="flex min-h-11 shrink-0 items-center gap-2 rounded-xl border border-slate-400/30 px-3 text-sm font-semibold text-slate-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
                  >
                    Source
                    <ExternalLink size={16} />
                  </a>
                )}
              </div>
            </div>
          )) : (
            <p className="p-4 text-sm leading-6 text-slate-300">No public evidence link is available for this pilot record.</p>
          )}
        </div>
      </section>

      <button
        type="button"
        onClick={onChange}
        className="mt-5 min-h-11 rounded-xl border border-slate-400/30 px-4 font-semibold text-slate-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300"
      >
        Check another project
      </button>
    </section>
  )
}

export default function FlatProjectSearch() {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<FlatProjectSearchResponse | null>(null)
  const [selectedProject, setSelectedProject] = useState<FlatProjectIdentity | null>(null)
  const [loading, setLoading] = useState(false)
  const [unavailable, setUnavailable] = useState(false)
  const [projectDetail, setProjectDetail] = useState<FlatProjectDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailUnavailable, setDetailUnavailable] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<number | null>(null)
  const latestSearchRef = useRef(0)
  const latestDetailRef = useRef(0)

  const loadSearch = useCallback(async (trimmedQuery: string, offset = 0) => {
    if (trimmedQuery.length < minimumSearchLength) return

    const searchId = ++latestSearchRef.current
    setLoading(true)
    setUnavailable(false)
    setResult(null)
    setSelectedProject(null)
    setProjectDetail(null)
    setDetailUnavailable(false)
    try {
      const nextResult = await searchFlatProjects(trimmedQuery, offset, searchPageSize)
      if (searchId === latestSearchRef.current) setResult(nextResult)
    } catch {
      if (searchId === latestSearchRef.current) setUnavailable(true)
    } finally {
      if (searchId === latestSearchRef.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    const trimmedQuery = query.trim()
    if (trimmedQuery.length < minimumSearchLength) return

    debounceRef.current = window.setTimeout(() => {
      void loadSearch(trimmedQuery)
    }, searchDebounceMs)

    return () => {
      if (debounceRef.current !== null) window.clearTimeout(debounceRef.current)
    }
  }, [loadSearch, query])

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (debounceRef.current !== null) window.clearTimeout(debounceRef.current)
    await loadSearch(query.trim())
  }

  function changeSearch() {
    latestSearchRef.current += 1
    latestDetailRef.current += 1
    setLoading(false)
    setDetailLoading(false)
    setQuery('')
    setResult(null)
    setSelectedProject(null)
    setUnavailable(false)
    setProjectDetail(null)
    setDetailUnavailable(false)
    inputRef.current?.focus()
  }

  async function continueToProject(project: FlatProjectIdentity) {
    if (detailLoading) return
    const detailId = ++latestDetailRef.current
    setDetailLoading(true)
    setDetailUnavailable(false)
    try {
      const nextProjectDetail = await fetchFlatProjectDetail(project.project_id)
      if (detailId === latestDetailRef.current) setProjectDetail(nextProjectDetail)
    } catch {
      if (detailId === latestDetailRef.current) setDetailUnavailable(true)
    } finally {
      if (detailId === latestDetailRef.current) setDetailLoading(false)
    }
  }

  return (
    <main className="min-h-[100dvh] bg-[#050711] px-4 pb-12 text-slate-50 sm:px-6">
      <header className="mx-auto flex h-16 max-w-4xl items-center justify-between border-b border-slate-300/10 sm:h-[4.5rem]">
        <p className="font-display text-lg font-extrabold tracking-[-0.03em] sm:text-xl">
          Flat<span className="text-cyan-300">DNA</span>
        </p>
        <Link
          to="/"
          className="flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-cyan-200 transition-colors hover:bg-cyan-300/10 hover:text-cyan-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
        >
          <ArrowLeft size={17} />
          Back to PropertyDNA
        </Link>
      </header>

      <section className="mx-auto max-w-4xl pt-10 sm:pt-14">
        <div className="max-w-2xl">
          <h1 className="text-balance font-display text-3xl font-extrabold leading-tight tracking-[-0.035em] text-slate-50 sm:text-5xl">
            Which apartment are you checking?
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Limited Hyderabad pilot. FlatDNA currently covers 14 reviewed projects and is not a complete market directory.
          </p>
        </div>

        <form onSubmit={handleSearch} className="mt-8 max-w-3xl sm:mt-10">
          <label htmlFor="flat-project-search" className="block text-sm font-semibold text-slate-200">
            Project, builder, locality or RERA number
          </label>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <div className="flex min-h-12 flex-1 items-center gap-3 rounded-xl border border-slate-400/30 bg-[#0b1421] px-4 focus-within:border-cyan-300/70 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-cyan-300/40">
              <Search size={19} className="shrink-0 text-slate-400" />
              <input
                ref={inputRef}
                id="flat-project-search"
                value={query}
                onChange={event => {
                  latestSearchRef.current += 1
                  latestDetailRef.current += 1
                  setLoading(false)
                  setDetailLoading(false)
                  setQuery(event.target.value)
                  setResult(null)
                  setSelectedProject(null)
                  setUnavailable(false)
                  setProjectDetail(null)
                  setDetailUnavailable(false)
                }}
                maxLength={160}
                autoComplete="off"
                aria-describedby="flat-project-search-help"
                placeholder="Search project, builder, locality or RERA"
                className="min-w-0 flex-1 bg-transparent py-3 text-base text-slate-50 outline-none placeholder:text-slate-400"
              />
            </div>
            <button
              type="submit"
              disabled={query.trim().length < minimumSearchLength || loading}
              className="min-h-12 rounded-xl bg-emerald-300 px-6 font-bold text-slate-950 transition-colors hover:bg-emerald-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-300 active:translate-y-px disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
          <p id="flat-project-search-help" className="mt-3 text-sm text-slate-400">
            {query.trim().length > 0 && query.trim().length < minimumSearchLength
              ? `Type ${minimumSearchLength - query.trim().length} more ${minimumSearchLength - query.trim().length === 1 ? 'character' : 'characters'} to see matches.`
              : 'Matches appear automatically after 3 characters.'}
          </p>
        </form>

        <section aria-live="polite" aria-busy={loading} className="mt-8 max-w-3xl sm:mt-10">
          {loading && (
            <div className="rounded-2xl border border-slate-400/20 bg-[#0a121e] p-5 sm:p-6">
              <p className="font-semibold text-slate-200">Finding verified project matches...</p>
              <div className="mt-5 h-5 w-2/3 animate-pulse rounded bg-slate-700 motion-reduce:animate-none" />
              <div className="mt-3 h-4 w-1/3 animate-pulse rounded bg-slate-800 motion-reduce:animate-none" />
            </div>
          )}

          {unavailable && (
            <div className="rounded-2xl border border-amber-300/35 bg-amber-300/[0.06] p-5 sm:p-6">
              <h2 className="font-display text-xl font-extrabold text-slate-50">Project search is temporarily unavailable.</h2>
              <p className="mt-2 max-w-xl leading-6 text-slate-300">Please try again shortly. Your search has not been submitted.</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <button type="button" onClick={changeSearch} className="min-h-11 rounded-xl bg-emerald-300 px-4 font-bold text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-300">
                  Change search
                </button>
                <Link to="/" className="flex min-h-11 items-center rounded-xl border border-slate-400/30 px-4 font-semibold text-slate-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300">
                  Back home
                </Link>
              </div>
            </div>
          )}

          {!projectDetail && result?.outcome === 'MATCHED' && (
            <div className="rounded-2xl border border-emerald-300/50 bg-[#0a1820] p-5 sm:p-6">
              <p className="mb-4 text-sm font-bold text-emerald-300">MATCHED</p>
              <ProjectDetails project={result.project} />
              <button
                type="button"
                onClick={() => void continueToProject(result.project)}
                disabled={detailLoading}
                className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-300 px-5 font-bold text-slate-950 transition-colors hover:bg-emerald-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-300 active:translate-y-px disabled:cursor-default disabled:bg-emerald-200 sm:w-auto"
              >
                {detailLoading ? 'Loading snapshot...' : 'Continue'}
                <ArrowRight size={18} />
              </button>
            </div>
          )}

          {!projectDetail && result?.outcome === 'AMBIGUOUS' && (
            <div>
              <h2 className="font-display text-xl font-extrabold text-slate-50">Choose the project you mean</h2>
              <p className="mt-2 text-slate-300">We found more than one verified match.</p>
              <div className="mt-5 grid gap-3">
                {result.candidates.map(candidate => {
                  const selected = selectedProject?.project_id === candidate.project_id
                  return (
                    <button
                      key={candidate.project_id}
                      type="button"
                      onClick={() => {
                        setSelectedProject(candidate)
                        setProjectDetail(null)
                        setDetailUnavailable(false)
                      }}
                      aria-pressed={selected}
                      className={`rounded-2xl border p-5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300 ${selected ? 'border-cyan-300 bg-cyan-300/[0.08]' : 'border-slate-400/25 bg-[#0a121e] hover:border-cyan-300/50'}`}
                    >
                      <ProjectDetails project={candidate} />
                      <span className={`mt-4 inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-bold ${selected ? 'bg-cyan-300 text-slate-950' : 'border border-slate-400/30 text-slate-200'}`}>
                        {selected ? 'Project selected' : 'Choose project'}
                      </span>
                    </button>
                  )
                })}
              </div>
              <button
                type="button"
                onClick={() => selectedProject && void continueToProject(selectedProject)}
                disabled={!selectedProject || detailLoading}
                className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-300 px-5 font-bold text-slate-950 transition-colors hover:bg-emerald-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-300 active:translate-y-px disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 sm:w-auto"
              >
                {detailLoading ? 'Loading snapshot...' : 'Continue'}
                <ArrowRight size={18} />
              </button>
            </div>
          )}

          {!projectDetail && result?.outcome === 'RESULTS' && (
            <div>
              <h2 className="font-display text-xl font-extrabold text-slate-50">
                {result.total} indexed {result.total === 1 ? 'project' : 'projects'} found
              </h2>
              <p className="mt-2 text-slate-300">
                Results matched by {result.query_type.toLowerCase()}. Choose the exact project and phase.
              </p>
              <p className="mt-2 text-sm text-slate-400">
                Showing {result.offset + 1} to {Math.min(result.offset + result.candidates.length, result.total)} of {result.total}
              </p>
              <div className="mt-5 grid gap-3">
                {result.candidates.map(candidate => {
                  const selected = selectedProject?.project_id === candidate.project_id
                  return (
                    <button
                      key={candidate.project_id}
                      type="button"
                      onClick={() => {
                        setSelectedProject(candidate)
                        setProjectDetail(null)
                        setDetailUnavailable(false)
                      }}
                      aria-pressed={selected}
                      className={`rounded-2xl border p-5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300 ${selected ? 'border-cyan-300 bg-cyan-300/[0.08]' : 'border-slate-400/25 bg-[#0a121e] hover:border-cyan-300/50'}`}
                    >
                      <ProjectDetails project={candidate} />
                      <span className={`mt-4 inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-bold ${selected ? 'bg-cyan-300 text-slate-950' : 'border border-slate-400/30 text-slate-200'}`}>
                        {selected ? 'Project selected' : 'Choose project'}
                      </span>
                    </button>
                  )
                })}
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                {result.offset > 0 && (
                  <button
                    type="button"
                    onClick={() => void loadSearch(query.trim(), Math.max(0, result.offset - result.limit))}
                    className="min-h-11 rounded-xl border border-slate-400/30 px-4 font-semibold text-slate-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300"
                  >
                    Previous results
                  </button>
                )}
                {result.offset + result.candidates.length < result.total && (
                  <button
                    type="button"
                    onClick={() => void loadSearch(query.trim(), result.offset + result.limit)}
                    className="min-h-11 rounded-xl border border-slate-400/30 px-4 font-semibold text-slate-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300"
                  >
                    Next results
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => selectedProject && void continueToProject(selectedProject)}
                disabled={!selectedProject || detailLoading}
                className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-300 px-5 font-bold text-slate-950 transition-colors hover:bg-emerald-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-300 active:translate-y-px disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 sm:w-auto"
              >
                {detailLoading ? 'Loading snapshot...' : 'Continue'}
                <ArrowRight size={18} />
              </button>
            </div>
          )}

          {result?.outcome === 'NOT_FOUND' && (
            <div className="rounded-2xl border border-slate-400/25 bg-[#0a121e] p-5 sm:p-6">
              <h2 className="font-display text-xl font-extrabold leading-7 text-slate-50">
                We don&apos;t have enough verified information for this project yet.
              </h2>
              <p className="mt-2 text-slate-300">Try another project name or return to PropertyDNA.</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <button type="button" onClick={changeSearch} className="min-h-11 rounded-xl bg-emerald-300 px-4 font-bold text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-300">
                  Change search
                </button>
                <Link to="/" className="flex min-h-11 items-center rounded-xl border border-slate-400/30 px-4 font-semibold text-slate-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300">
                  Back home
                </Link>
              </div>
            </div>
          )}

          {detailUnavailable && (
            <div className="mt-4 rounded-xl border border-amber-300/35 bg-amber-300/[0.06] p-4 text-sm leading-6 text-slate-200">
              <strong className="text-amber-200">The verified snapshot is temporarily unavailable.</strong>{' '}
              Your project selection is unchanged. Please try Continue again.
            </div>
          )}

          {projectDetail && (
            <div className="mt-6">
              <ProjectSnapshot project={projectDetail} onChange={changeSearch} />
            </div>
          )}
        </section>
      </section>
    </main>
  )
}
