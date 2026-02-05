'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageBuilder } from './PageBuilder'
import { Loader2 } from 'lucide-react'
import type { Template, TemplatePage } from '@/types/database'

interface TemplateFormProps {
  initialTemplate?: Template
  mode: 'create' | 'edit'
}

export function TemplateForm({ initialTemplate, mode }: TemplateFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState(initialTemplate?.name || '')
  const [description, setDescription] = useState(initialTemplate?.description || '')
  const [isActive, setIsActive] = useState(initialTemplate?.is_active ?? true)
  const [pages, setPages] = useState<TemplatePage[]>(
    (initialTemplate?.structure as any)?.pages || []
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Template name is required')
      return
    }

    if (pages.length === 0) {
      setError('At least one page is required')
      return
    }

    setIsSubmitting(true)
    try {
      const templateData = {
        name: name.trim(),
        description: description.trim() || null,
        structure: { pages },
        services: [], // Keep empty for backward compatibility
        url_patterns: {
          service: '/{service_slug}',
          location: '/service-areas/{location_slug}',
          service_location: '/{location_slug}-{page_slug}'
        },
        is_active: isActive
      }

      const url = mode === 'create' 
        ? '/api/templates'
        : `/api/templates/${initialTemplate?.id}`
      
      const method = mode === 'create' ? 'POST' : 'PUT'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateData)
      })

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error?.message || `Failed to ${mode} template`)
      }

      if (mode === 'create') {
        // Navigate to templates list after creating
        router.push('/templates')
        router.refresh()
      } else {
        // Stay on edit page, just refresh data silently
        router.refresh()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Template Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Template Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Restoration Company"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe what this template is for..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              checked={isActive}
              onCheckedChange={(checked) => setIsActive(checked as boolean)}
              disabled={isSubmitting}
            />
            <label htmlFor="isActive" className="text-sm cursor-pointer">
              Template is active and available for selection
            </label>
          </div>
        </CardContent>
      </Card>

      <PageBuilder pages={pages} onChange={setPages} />

      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {mode === 'create' ? 'Creating...' : 'Saving...'}
            </>
          ) : (
            mode === 'create' ? 'Create Template' : 'Save Changes'
          )}
        </Button>
      </div>
    </form>
  )
}
