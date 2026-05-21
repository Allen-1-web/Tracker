'use client'

import * as React from 'react'
import * as ProgressPrimitive from '@radix-ui/react-progress'
import { cn } from '@/lib/utils'

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & { indicatorColor?: string }
>(({ className, value, indicatorColor, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      'relative h-2.5 w-full overflow-hidden rounded-full bg-[var(--secondary)] motion-safe:transition-colors motion-safe:duration-300',
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 rounded-full motion-safe:transition-[transform,background-color] motion-safe:duration-700 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
      style={{
        transform: `translateX(-${100 - (value || 0)}%)`,
        backgroundColor: indicatorColor ?? 'var(--primary)',
      }}
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
