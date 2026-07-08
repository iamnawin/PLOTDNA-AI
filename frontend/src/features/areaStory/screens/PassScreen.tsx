import type { MicroMarket } from '@/types'
import type { CityEntry } from '@/data/cities'

export default function PassScreen({ area, city }: { area: MicroMarket; city: CityEntry }) {
  return <div className="text-slate-400">Pass placeholder for {area.name} in {city.meta.name}</div>
}
