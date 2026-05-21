import { NextResponse } from 'next/server'
import type { ApiErrorResponse } from '@/lib/errors/api-error'
import { apiError, HttpStatus } from '@/lib/errors/api-error'

/** Ответ API с JSON-телом ошибки (для будущих route handlers). */
export function jsonError(
  status: typeof HttpStatus.BAD_REQUEST | typeof HttpStatus.FORBIDDEN | number,
  message: string,
  extra?: Pick<ApiErrorResponse, 'code' | 'errors'>
) {
  const body = apiError(status, message, extra)
  return NextResponse.json(body, { status: body.status })
}

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status })
}

export function jsonFromApiError(error: ApiErrorResponse) {
  return NextResponse.json(error, { status: error.status })
}
