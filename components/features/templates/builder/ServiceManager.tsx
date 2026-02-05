'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { X, Plus } from 'lucide-react'
import type { TemplateService } from '@/types/database'

interface ServiceManagerProps {
  services: TemplateService[]
  onChange: (services: TemplateService[]) => void
}

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export function ServiceManager({ services, onChange }: ServiceManagerProps) {
  const [newServiceName, setNewServiceName] = useState('')
  const [newServiceCategory, setNewServiceCategory] = useState('')

  const handleAdd = () => {
    if (!newServiceName.trim()) return

    const newService: TemplateService = {
      id: toSlug(newServiceName),
      name: newServiceName.trim(),
      url_slug: toSlug(newServiceName),
      category: newServiceCategory.trim() || undefined
    }

    onChange([...services, newService])
    setNewServiceName('')
    setNewServiceCategory('')
  }

  const handleRemove = (id: string) => {
    onChange(services.filter(s => s.id !== id))
  }

  const handleUpdate = (id: string, field: keyof TemplateService, value: string) => {
    onChange(services.map(s => 
      s.id === id 
        ? { ...s, [field]: value, ...(field === 'name' ? { url_slug: toSlug(value) } : {}) }
        : s
    ))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Services</CardTitle>
        <CardDescription>
          Define the services that will be available in this template ({services.length} services)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing services */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {services.map((service) => (
            <div key={service.id} className="flex items-center gap-2 p-3 border rounded-md bg-muted/50">
              <div className="flex-1 grid grid-cols-3 gap-2">
                <div>
                  <Input
                    value={service.name}
                    onChange={(e) => handleUpdate(service.id, 'name', e.target.value)}
                    className="text-sm"
                    placeholder="Service name"
                  />
                </div>
                <div>
                  <Input
                    value={service.url_slug}
                    onChange={(e) => handleUpdate(service.id, 'url_slug', e.target.value)}
                    className="text-sm font-mono"
                    placeholder="url-slug"
                  />
                </div>
                <div>
                  <Input
                    value={service.category || ''}
                    onChange={(e) => handleUpdate(service.id, 'category', e.target.value)}
                    className="text-sm"
                    placeholder="Category (optional)"
                  />
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemove(service.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        {/* Add new service */}
        <div className="pt-4 border-t">
          <Label className="text-sm font-medium mb-2 block">Add New Service</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Service name (e.g., Water Damage Restoration)"
              value={newServiceName}
              onChange={(e) => setNewServiceName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <Input
              placeholder="Category (optional)"
              value={newServiceCategory}
              onChange={(e) => setNewServiceCategory(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              className="w-40"
            />
            <Button onClick={handleAdd} disabled={!newServiceName.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
