import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { parseApiJsonBody } from '@/lib/validation/api-body'
import { HttpStatus } from '@/lib/errors/api-error'

const sampleSchema = z.object({
  email: z.string().email('Введите корректный email'),
  name: z.string().min(2, 'Минимум 2 символа'),
})

describe('parseApiJsonBody', () => {
  it('returns parsed data on success', () => {
    const result = parseApiJsonBody(sampleSchema, {
      email: 'user@example.com',
      name: 'Dmitry',
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual({
        email: 'user@example.com',
        name: 'Dmitry',
      })
    }
  })

  it('returns 400 with field errors on validation failure', async () => {
    const result = parseApiJsonBody(sampleSchema, {
      email: 'not-an-email',
      name: 'x',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.response.status).toBe(HttpStatus.BAD_REQUEST)

      const body = (await result.response.json()) as {
        status: number
        message: string
        code?: string
        errors?: Record<string, string[]>
      }

      expect(body.status).toBe(HttpStatus.BAD_REQUEST)
      expect(body.code).toBe('validation_error')
      expect(body.errors?.email?.length).toBeGreaterThan(0)
      expect(body.errors?.name?.length).toBeGreaterThan(0)
      expect(typeof body.message).toBe('string')
    }
  })
})
