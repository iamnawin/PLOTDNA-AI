import { useEffect } from 'react'
import { Navigate, useLocation, useParams } from 'react-router-dom'
import { getAllAreas, getCityForArea } from '@/data/cities'
import { useAppStore } from '@/store'
import { isAreaStoryStep, buildAreaStoryPath, fallbackContextFromQuery } from './areaStoryNav'
import AreaStoryTabBar from './AreaStoryTabBar'
import VerdictScreen from './screens/VerdictScreen'
import MoneyScreen from './screens/MoneyScreen'
import MapProofScreen from './screens/MapProofScreen'
import AreaDetailsScreen from './screens/AreaDetailsScreen'
import CompareScreen from './screens/CompareScreen'
import PassScreen from './screens/PassScreen'

export default function AreaStoryShell() {
  const { slug, step } = useParams<{ slug: string; step: string }>()
  const location = useLocation()
  const setSelectedArea = useAppStore(state => state.setSelectedArea)

  useEffect(() => {
    return () => setSelectedArea(null)
  }, [setSelectedArea])

  if (!slug) return <Navigate to="/map" replace />

  const area = getAllAreas().find(candidate => candidate.slug === slug)
  const city = getCityForArea(slug)

  if (!area || !city) return <Navigate to="/map" replace />

  if (!isAreaStoryStep(step) || step === 'check') {
    return <Navigate to={buildAreaStoryPath(slug, 'verdict')} replace />
  }

  const fallbackContext = fallbackContextFromQuery(location.search)

  return (
    <div className="area-story-shell h-[100dvh] overflow-y-auto body text-slate-100">
      <main className="area-story-content mx-auto max-w-4xl px-4 pt-5 sm:px-6 sm:py-6">
        {step === 'verdict' && <VerdictScreen area={area} city={city} fallbackContext={fallbackContext} />}
        {step === 'money' && <MoneyScreen area={area} />}
        {step === 'map' && <MapProofScreen area={area} />}
        {step === 'details' && <AreaDetailsScreen area={area} />}
        {step === 'compare' && <CompareScreen area={area} />}
        {step === 'pass' && <PassScreen area={area} city={city} />}
        <div className="area-story-nav-spacer" aria-hidden="true" />
      </main>
      <AreaStoryTabBar slug={slug} activeStep={step} />
    </div>
  )
}
