import { NextResponse } from 'next/server'

export function apiResponse<T>(data: T, status = 200) {
  return NextResponse.json({
    success: true,
    data,
    meta: { timestamp: new Date().toISOString() }
  }, { status })
}

export function apiError(code: string, message: string, status = 400) {
  return NextResponse.json({
    success: false,
    data: null,
    error: { code, message }
  }, { status })
}
