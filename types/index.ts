// Re-export all types from database.ts
export * from './database'

// Additional utility types for API responses
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: unknown
  }
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number
    per_page: number
    total: number
    total_pages: number
  }
}
