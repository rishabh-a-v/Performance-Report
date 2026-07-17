import { Capacitor } from '@capacitor/core'

const DEV_PREVIEW_KEY = '__dev_mobile_preview'

export function useIsNativeApp() {
  if (Capacitor.isNativePlatform()) return true
  if (!import.meta.env.DEV) return false
  // Dev-only escape hatch to preview the mobile app shell in a desktop browser (?mobile=1 / ?mobile=0).
  // Persisted in localStorage so it survives the login redirect, which otherwise strips the query string.
  const params = new URLSearchParams(window.location.search)
  if (params.get('mobile') === '1') localStorage.setItem(DEV_PREVIEW_KEY, '1')
  if (params.get('mobile') === '0') localStorage.removeItem(DEV_PREVIEW_KEY)
  return localStorage.getItem(DEV_PREVIEW_KEY) === '1'
}
