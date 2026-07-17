import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import { App as CapApp } from '@capacitor/app'
import { StatusBar, Style } from '@capacitor/status-bar'
import { SplashScreen } from '@capacitor/splash-screen'

// Bottom-nav root screens: hardware back from any of these should minimize the
// app (Android convention) instead of walking browser history.
const ROOT_PATHS = new Set(['/tasks', '/login', '/job-directions', '/calendar', '/more'])

/**
 * One-time native chrome setup + Android hardware back button handling.
 * No-ops entirely on the web build.
 */
export function useNativeAppSetup() {
  const navigate = useNavigate()

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    // App-like feel: no tap highlight / long-press callouts / stray text selection,
    // but keep selection inside form fields (handled in index.css via this class).
    document.documentElement.classList.add('native-app')

    // Lock pinch-zoom on native only, so web accessibility is untouched.
    document.querySelector('meta[name="viewport"]')?.setAttribute(
      'content',
      'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover',
    )

    // Overlays setup
    StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {})

    // The splash also auto-hides via config; this just ends it as soon as React is up.
    SplashScreen.hide().catch(() => {})
  }, [])

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    const listener = CapApp.addListener('backButton', ({ canGoBack }) => {
      if (ROOT_PATHS.has(window.location.pathname) || !canGoBack) {
        CapApp.minimizeApp()
      } else {
        navigate(-1)
      }
    })
    return () => { listener.then((l) => l.remove()) }
  }, [navigate])
}
