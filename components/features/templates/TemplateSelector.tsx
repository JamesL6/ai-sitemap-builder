'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { Template, TemplateService } from '@/types/database'

interface TemplateSelectorProps {
  selectedId: string | null
  onSelect: (templateId: string | null) => void
}

type TemplateListItem = Pick<Template, 'id' | 'name' | 'description' | 'services'>

export function TemplateSelector({ selectedId, onSelect }: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<TemplateListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/templates')
      const result = await response.json()
      
      if (result.success) {
        setTemplates(result.data)
      }
    } catch (err) {
      console.error('Failed to fetch templates:', err)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {templates.map((template) => {
          const services = template.services as TemplateService[]
          const isSelected = selectedId === template.id
          
          return (
            <Card 
              key={template.id}
              className={`cursor-pointer transition-all ${
                isSelected 
                  ? 'ring-2 ring-blue-500 bg-blue-50' 
                  : 'hover:shadow-md'
              }`}
              onClick={() => onSelect(isSelected ? null : template.id)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{template.name}</CardTitle>
                  {isSelected && (
                    <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded">
                      Selected
                    </span>
                  )}
                </div>
                <CardDescription className="text-xs line-clamp-1">
                  {template.description || 'No description'}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-muted-foreground">
                  {services.length} services available
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>
      
      {selectedId && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => onSelect(null)}
          className="text-muted-foreground"
        >
          Clear selection (start without template)
        </Button>
      )}
      
      {!selectedId && templates.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Select a template to start with a pre-built sitemap structure, or skip to create from scratch.
        </p>
      )}
    </div>
  )
}
