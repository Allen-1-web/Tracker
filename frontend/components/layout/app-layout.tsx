'use client'

import { useState } from 'react'
import { Dialog, DrawerContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Sidebar, MobileSidebarPanel } from './sidebar'
import { MutationErrorBanner } from './mutation-error-banner'
import { Topbar } from './topbar'

interface AppLayoutProps {
  children: React.ReactNode
  title: string
}

export function AppLayout({ children, title }: AppLayoutProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Sidebar />
      <Dialog open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <DrawerContent>
          <DialogTitle className="sr-only">Навигация по разделам</DialogTitle>
          <DialogDescription className="sr-only">Переход к разделам приложения</DialogDescription>
          <MobileSidebarPanel onNavigate={() => setMobileNavOpen(false)} />
        </DrawerContent>
      </Dialog>
      <div className="flex min-h-screen w-full min-w-0 flex-col md:ml-64">
        <Topbar title={title} onOpenMobileNav={() => setMobileNavOpen(true)} />
        <main className="min-w-0 flex-1 p-3 sm:p-5">
          <MutationErrorBanner />
          {children}
        </main>
      </div>
    </div>
  )
}
