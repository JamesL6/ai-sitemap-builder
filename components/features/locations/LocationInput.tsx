'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LocationList } from './LocationList'
import type { Location } from '@/types/database'

interface LocationInputProps {
  locations: Location[]
  onChange: (locations: Location[]) => void
}

/**
 * Convert location name to URL slug
 */
function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
}

/**
 * Generate unique ID for location
 */
function generateId(name: string): string {
  return toSlug(name) + '-' + Math.random().toString(36).substr(2, 9)
}

/**
 * Parse pasted location list
 */
function parseLocations(text: string): Location[] {
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(name => ({
      id: generateId(name),
      name,
      url_slug: toSlug(name)
    }))
}

export function LocationInput({ locations, onChange }: LocationInputProps) {
  const [input, setInput] = useState('')

  const handleParse = () => {
    if (!input.trim()) return

    const parsed = parseLocations(input)
    
    // Merge with existing locations (avoid duplicates by slug)
    const existingSlugs = new Set(locations.map(loc => loc.url_slug))
    const newLocations = parsed.filter(loc => !existingSlugs.has(loc.url_slug))
    
    onChange([...locations, ...newLocations])
    setInput('')
  }

  const handleRemove = (id: string) => {
    onChange(locations.filter(loc => loc.id !== id))
  }

  const handleClear = () => {
    onChange([])
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Service Area Locations</CardTitle>
        <CardDescription>
          Add cities or regions where this client provides services. {locations.length} location{locations.length !== 1 ? 's' : ''} added.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="locations">Paste Location List</Label>
          <Textarea
            id="locations"
            placeholder="Miami&#10;Fort Lauderdale&#10;Boca Raton&#10;West Palm Beach"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={5}
          />
          <p className="text-xs text-muted-foreground">
            Enter one location per line. They will be automatically converted to URL-friendly slugs.
          </p>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleParse} disabled={!input.trim()}>
            Add Locations
          </Button>
          {locations.length > 0 && (
            <Button variant="outline" onClick={handleClear}>
              Clear All
            </Button>
          )}
        </div>

        <LocationList locations={locations} onRemove={handleRemove} />
      </CardContent>
    </Card>
  )
}
