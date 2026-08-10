import { ArrowRight, Building2, MapPinned } from 'lucide-react'
import { Link } from 'react-router-dom'
import { featureFlags } from '@/lib/features'

export default function PropertyEntry() {
  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-[#050711] px-4 text-slate-50 sm:px-6">
      <div aria-hidden="true" className="pointer-events-none absolute -left-32 top-20 h-80 w-80 rounded-full border border-emerald-300/10 sm:-left-20 sm:h-[28rem] sm:w-[28rem]" />
      <div aria-hidden="true" className="pointer-events-none absolute -left-16 top-36 h-52 w-52 rounded-full border border-cyan-300/10 sm:left-8 sm:h-72 sm:w-72" />

      <header className="relative mx-auto flex h-16 max-w-5xl items-center border-b border-slate-300/10 sm:h-[4.5rem]">
        <p className="font-display text-lg font-extrabold tracking-[-0.03em] sm:text-xl">
          Property<span className="text-emerald-300">DNA</span>
        </p>
      </header>

      <section className="relative mx-auto flex max-w-5xl flex-col justify-center py-10 sm:min-h-[calc(100dvh-4.5rem)] sm:py-12">
        <div className="max-w-3xl">
          <h1 className="text-balance font-display text-[2.15rem] font-extrabold leading-[1.08] tracking-[-0.035em] text-slate-50 sm:text-5xl lg:text-[3.5rem]">
            Know what you&apos;re buying before you pay token.
          </h1>
          <p className="mt-5 text-lg font-medium text-slate-300 sm:mt-6 sm:text-xl">
            What are you checking?
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:mt-8 md:grid-cols-2">
          <Link
            to="/plot"
            className="group flex min-h-64 flex-col rounded-2xl border border-emerald-300/45 bg-[#0a1620] p-5 transition-colors hover:border-emerald-200/70 hover:bg-[#0c1b25] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-300 active:translate-y-px sm:p-6"
            aria-label="Open the PlotDNA plot and land check"
          >
            <div className="flex items-start justify-between gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-300 text-slate-950">
                <MapPinned size={25} strokeWidth={1.8} />
              </span>
              <span className="text-sm font-semibold text-emerald-200">Opens PlotDNA</span>
            </div>
            <div className="mt-8">
              <h2 className="font-display text-2xl font-extrabold tracking-[-0.025em]">PLOT / LAND</h2>
              <p className="mt-2 max-w-sm text-base leading-6 text-slate-300">
                Check location, price, approvals and risk
              </p>
            </div>
            <span className="mt-auto flex min-h-12 items-center justify-between rounded-xl bg-emerald-300 px-4 font-bold text-slate-950 transition-colors group-hover:bg-emerald-200">
              Check a Plot
              <ArrowRight size={19} strokeWidth={2} />
            </span>
          </Link>

          {featureFlags.enableFlatDna ? (
            <Link
              to="/flat"
              className="group flex min-h-64 flex-col rounded-2xl border border-cyan-300/35 bg-[#0a121e] p-5 transition-colors hover:border-cyan-200/65 hover:bg-[#0c1724] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300 active:translate-y-px sm:p-6"
              aria-label="Open the FlatDNA apartment project search"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-300 text-slate-950">
                  <Building2 size={25} strokeWidth={1.8} />
                </span>
                <span className="text-sm font-semibold text-cyan-200">Opens FlatDNA</span>
              </div>
              <div className="mt-8">
                <h2 className="font-display text-2xl font-extrabold tracking-[-0.025em]">FLAT / APARTMENT</h2>
                <p className="mt-2 max-w-sm text-base leading-6 text-slate-300">
                  Find the exact project before checking the property
                </p>
              </div>
              <span className="mt-auto flex min-h-12 items-center justify-between rounded-xl bg-cyan-300 px-4 font-bold text-slate-950 transition-colors group-hover:bg-cyan-200">
                Check a Flat
                <ArrowRight size={19} strokeWidth={2} />
              </span>
            </Link>
          ) : (
            <section
              aria-disabled="true"
              className="flex min-h-64 flex-col rounded-2xl border border-slate-400/20 bg-[#0a111b] p-5 opacity-75 sm:p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-700 text-slate-300">
                  <Building2 size={25} strokeWidth={1.8} />
                </span>
                <span className="text-sm font-semibold text-slate-400">FlatDNA unavailable</span>
              </div>
              <div className="mt-8">
                <h2 className="font-display text-2xl font-extrabold tracking-[-0.025em] text-slate-200">FLAT / APARTMENT</h2>
                <p className="mt-2 max-w-sm text-base leading-6 text-slate-400">
                  Find the exact project before checking the property
                </p>
              </div>
              <span className="mt-auto flex min-h-12 items-center justify-between rounded-xl bg-slate-800 px-4 font-bold text-slate-400">
                Check a Flat
                <ArrowRight size={19} strokeWidth={2} />
              </span>
            </section>
          )}
        </div>
      </section>
    </main>
  )
}
