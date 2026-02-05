'use client'

import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import type { Location } from '@/types/database'

interface LocationListProps {
  locations: Location[]
  onRemove: (id: string) => void
}

export function LocationList({ locations, onRemove }: LocationListProps) {
  if (locations.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        No locations added yet. Paste a list above to get started.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {locations.map(location => (
        <div
          key={location.id}
          className="flex items-center justify-between p-2 border rounded-md bg-muted/50"
        >
          <div>
            <p className="text-sm font-medium">{location.name}</p>
            <p className="text-xs text-muted-foreground">/{location.url_slug}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(location.id)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  )
}
