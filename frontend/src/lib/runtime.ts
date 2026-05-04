import { Capacitor } from '@capacitor/core'

const MOBILE_DEFAULT_API_URL = 'https://plotdna-api.onrender.com'
const WEB_DEFAULT_API_URL = 'http://localhost:8000'

export const IS_NATIVE_APP = Capacitor.isNativePlatform()

export const API_BASE_URL = (
  import.meta.env.VITE_API_URL ??
  (IS_NATIVE_APP ? MOBILE_DEFAULT_API_URL : WEB_DEFAULT_API_URL)
).replace(/\/$/, '')
