// components/notification.tsx
"use client"

import { useEffect, useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Bell, X, CheckCircle, AlertCircle, Info } from "lucide-react"

interface Notification {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  title: string
  message: string
  timestamp: Date
  autoHide?: boolean
  duration?: number
}

interface NotificationProviderProps {
  children: React.ReactNode
}

const NotificationContext = React.createContext<{
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void
  removeNotification: (id: string) => void
  clearAll: () => void
}>({
  notifications: [],
  addNotification: () => {},
  removeNotification: () => {},
  clearAll: () => {}
})

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      autoHide: notification.autoHide ?? true,
      duration: notification.duration ?? 5000
    }

    setNotifications(prev => [...prev, newNotification])

    // Auto remove if specified
    if (newNotification.autoHide) {
      setTimeout(() => {
        removeNotification(newNotification.id)
      }, newNotification.duration)
    }
  }

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const clearAll = () => {
    setNotifications([])
  }

  return (
    <NotificationContext.Provider value={{
      notifications,
      addNotification,
      removeNotification,
      clearAll
    }}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  )
}

function NotificationContainer() {
  const { notifications, removeNotification } = useNotification()

  if (notifications.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map((notification) => (
        <NotificationCard
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  )
}

function NotificationCard({ 
  notification, 
  onClose 
}: { 
  notification: Notification
  onClose: () => void 
}) {
  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-orange-600" />
      default:
        return <Info className="h-4 w-4 text-blue-600" />
    }
  }

  const getVariant = () => {
    switch (notification.type) {
      case 'error':
        return 'destructive' as const
      default:
        return 'default' as const
    }
  }

  return (
    <Alert variant={getVariant()} className="shadow-lg border animate-in slide-in-from-right-full">
      {getIcon()}
      <div className="flex-1">
        {notification.title && (
          <div className="font-semibold mb-1">{notification.title}</div>
        )}
        <AlertDescription>{notification.message}</AlertDescription>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0"
        onClick={onClose}
      >
        <X className="h-4 w-4" />
      </Button>
    </Alert>
  )
}

export function useNotification() {
  const context = React.useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider')
  }
  return context
}

// Notification hook for admin actions
export function useAdminNotifications() {
  const { addNotification } = useNotification()

  const notifyValidationSuccess = (studentName: string) => {
    addNotification({
      type: 'success',
      title: 'Validasi Berhasil',
      message: `QR code ${studentName} telah divalidasi`
    })
  }

  const notifyValidationError = (error: string) => {
    addNotification({
      type: 'error',
      title: 'Validasi Gagal',
      message: error
    })
  }

  const notifyNewPendingSession = (studentName: string) => {
    addNotification({
      type: 'info',
      title: 'Session Baru',
      message: `${studentName} telah generate QR code`,
      autoHide: false
    })
  }

  return {
    notifyValidationSuccess,
    notifyValidationError,
    notifyNewPendingSession
  }
}