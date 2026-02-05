'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { Template, TemplateService } from '@/types/database'

interface TemplateCardProps {
  template: Pick<Template, 'id' | 'name' | 'description' | 'services' | 'is_active' | 'created_at'>
  onEdit?: (id: string) => void
  onSelect?: (id: string) => void
  isAdmin?: boolean
}

export function TemplateCard({ template, onEdit, onSelect, isAdmin }: TemplateCardProps) {
  const services = template.services as TemplateService[]
  
  return (
    <Card className={`relative ${!template.is_active ? 'opacity-60' : ''}`}>
      {!template.is_active && (
        <div className="absolute top-2 right-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
          Inactive
        </div>
      )}
      <CardHeader>
        <CardTitle className="text-lg">{template.name}</CardTitle>
        <CardDescription className="line-clamp-2">
          {template.description || 'No description provided'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Services ({services.length})</p>
            <div className="flex flex-wrap gap-1">
              {services.slice(0, 4).map((service) => (
                <span 
                  key={service.id}
                  className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded"
                >
                  {service.name}
                </span>
              ))}
              {services.length > 4 && (
                <span className="text-xs text-muted-foreground">
                  +{services.length - 4} more
                </span>
              )}
            </div>
          </div>
          
          <div className="flex gap-2 pt-2">
            {onSelect && (
              <Button 
                variant="default" 
                size="sm" 
                className="flex-1"
                onClick={() => onSelect(template.id)}
              >
                Use Template
              </Button>
            )}
            {isAdmin && onEdit && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onEdit(template.id)}
              >
                Edit
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
