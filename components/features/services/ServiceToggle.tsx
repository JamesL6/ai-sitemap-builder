'use client'

import { Checkbox } from '@/components/ui/checkbox'
import type { TemplateService, ServiceConfig } from '@/types/database'

interface ServiceToggleProps {
  service: TemplateService
  isEnabled: boolean
  onToggle: (serviceId: string, enabled: boolean) => void
}

export function ServiceToggle({ service, isEnabled, onToggle }: ServiceToggleProps) {
  return (
    <div className="flex items-center space-x-3 py-2">
      <Checkbox
        id={service.id}
        checked={isEnabled}
        onCheckedChange={(checked) => onToggle(service.id, checked as boolean)}
      />
      <label
        htmlFor={service.id}
        className="flex-1 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
      >
        {service.name}
        {service.category && (
          <span className="ml-2 text-xs text-muted-foreground">({service.category})</span>
        )}
      </label>
    </div>
  )
}
