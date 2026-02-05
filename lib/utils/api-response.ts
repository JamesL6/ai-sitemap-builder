import { NextResponse } from 'next/server'

interface PaginationMeta {
  total: number
  limit: number
  offset: number
}

export function apiResponse<T>(data: T, status = 200, pagination?: PaginationMeta) {
  return NextResponse.json({
    success: true,
    data,
    meta: { 
      timestamp: new Date().toISOString(),
      ...(pagination && {
        total: pagination.total,
        limit: pagination.limit,
        offset: pagination.offset
      })
    }
  }, { status })
}

export function apiError(code: string, message: string, status = 400) {
  return NextResponse.json({
    success: false,
    data: null,
    error: { code, message }
  }, { status })
}
