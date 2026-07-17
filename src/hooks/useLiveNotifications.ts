import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import { useNotifications } from '@/hooks/useNotifications'

export function useLiveNotifications() {
  const navigate = useNavigate()
  const { notifications } = useNotifications()
  const lastNotificationIds = useRef<Set<string>>(new Set())
  const hasInitialized = useRef(false)

  // 1. Initialise permissions and action listeners
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    async function init() {
      try {
        const perm = await LocalNotifications.checkPermissions()
        if (perm.display !== 'granted') {
          await LocalNotifications.requestPermissions()
        }

        // Create the high-importance notification channel for "pop-up" heads-up notifications
        await LocalNotifications.createChannel({
          id: 'pop_notifications',
          name: 'Pop Notifications',
          description: 'Pop-up notifications for important updates',
          importance: 5, // 5 = IMPORTANCE_HIGH (displays heads-up banner)
          visibility: 1, // 1 = VISIBILITY_PUBLIC
          vibration: true,
        })

        // Add action listener to handle notification taps
        await LocalNotifications.addListener(
          'localNotificationActionPerformed',
          (action) => {
            const path = action.notification.extra?.path
            if (path) {
              navigate(path)
            }
          }
        )
      } catch (err) {
        console.error('Failed to initialize local notifications:', err)
      }
    }

    init()

    return () => {
      if (Capacitor.isNativePlatform()) {
        LocalNotifications.removeAllListeners()
      }
    }
  }, [navigate])

  // 2. Listen for new unread notifications and trigger local notifications
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    if (notifications.length === 0) return

    // On first load, we populate the last seen list so we don't trigger notifications
    // for all existing historical records.
    if (!hasInitialized.current) {
      const ids = notifications.map(n => n.id)
      lastNotificationIds.current = new Set(ids)
      hasInitialized.current = true
      return
    }

    // Check for any new unread notification that we haven't seen in this session
    const currentUnread = notifications.filter(n => !n.read)
    
    currentUnread.forEach((n) => {
      if (!lastNotificationIds.current.has(n.id)) {
        // Mark as seen so we don't trigger it again
        lastNotificationIds.current.add(n.id)

        // Trigger native notification
        LocalNotifications.schedule({
          notifications: [
            {
              id: Math.floor(Math.random() * 1000000),
              title: n.title,
              body: n.body,
              schedule: { at: new Date(Date.now() + 500) },
              extra: { path: n.path },
              sound: 'default',
              channelId: 'pop_notifications'
            }
          ]
        }).catch(err => console.error('Failed to trigger local notification:', err))
      }
    })

    // Clean up IDs of notifications that are no longer present
    const allIds = new Set(notifications.map(n => n.id))
    lastNotificationIds.current.forEach((id) => {
      if (!allIds.has(id)) {
        lastNotificationIds.current.delete(id)
      }
    })

  }, [notifications])
}
