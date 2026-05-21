'use client'

import { useEffect } from 'react'
import { useStore } from '@/lib/store'

export function AppProvider({ children }: { children: React.ReactNode }) {
  const initialize = useStore((s) => s.initialize)

  useEffect(() => {
    void initialize()
  }, [initialize])

  return <>{children}</>
}
