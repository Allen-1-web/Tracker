import { describe, it, expect } from 'vitest'
import { checkSlidingWindow } from '@/lib/rate-limit/sliding-window'

describe('checkSlidingWindow', () => {
  it('allows requests under the limit', () => {
    const key = `test-allow-${Date.now()}`
    const windowMs = 60_000

    expect(checkSlidingWindow(key, 3, windowMs)).toEqual({ allowed: true })
    expect(checkSlidingWindow(key, 3, windowMs)).toEqual({ allowed: true })
    expect(checkSlidingWindow(key, 3, windowMs)).toEqual({ allowed: true })
  })

  it('blocks when the limit is exceeded', () => {
    const key = `test-block-${Date.now()}`
    const windowMs = 60_000

    checkSlidingWindow(key, 2, windowMs)
    checkSlidingWindow(key, 2, windowMs)

    const blocked = checkSlidingWindow(key, 2, windowMs)
    expect(blocked.allowed).toBe(false)
    if (!blocked.allowed) {
      expect(blocked.retryAfterSec).toBeGreaterThan(0)
    }
  })
})
