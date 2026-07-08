import type { MicroMarket } from '@/types'
import type { CityEntry } from '@/data/cities'

export default function VerdictScreen({ area, city }: { area: MicroMarket; city: CityEntry }) {
  return <div className="text-slate-400">Verdict placeholder for {area.name} in {city.meta.name}</div>
}
