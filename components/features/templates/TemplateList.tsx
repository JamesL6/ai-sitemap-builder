'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { TemplateCard } from './TemplateCard'
import { Button } from '@/components/ui/button'
import type { Template } from '@/types/database'

interface TemplateListProps {
  isAdmin?: boolean
  onSelect?: (templateId: string) => void
  selectionMode?: boolean
}

type TemplateListItem = Pick<Template, 'id' | 'name' | 'description' | 'services' | 'is_active' | 'created_at'>

export function TemplateList({ isAdmin = false, onSelect, selectionMode = false }: TemplateListProps) {
  const router = useRouter()
  const [templates, setTemplates] = useState<TemplateListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchTemplates()
  }, [isAdmin])

  const fetchTemplates = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const url = isAdmin ? '/api/templates?include_inactive=true' : '/api/templates'
      const response = await fetch(url)
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch templates')
      }
      
      setTemplates(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (id: string) => {
    router.push(`/templates/${id}`)
  }

  const handleSelect = (id: string) => {
    if (onSelect) {
      onSelect(id)
    }
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={fetchTemplates} variant="outline">
          Try Again
        </Button>
      </div>
    )
  }

  if (templates.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed rounded-lg">
        <p className="text-muted-foreground mb-4">No templates available</p>
        {isAdmin && (
          <Button onClick={() => router.push('/templates/new')}>
            Create Template
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {isAdmin && !selectionMode && (
        <div className="flex justify-end">
          <Button onClick={() => router.push('/templates/new')}>
            Create Template
          </Button>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            onEdit={isAdmin && !selectionMode ? handleEdit : undefined}
            onSelect={selectionMode || onSelect ? handleSelect : undefined}
            isAdmin={isAdmin && !selectionMode}
          />
        ))}
      </div>
    </div>
  )
}
