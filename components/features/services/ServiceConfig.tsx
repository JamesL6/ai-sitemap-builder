'use client'

import { useState, useEffect } from 'react'
import { ServiceToggle } from './ServiceToggle'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { TemplateService, ServiceConfig as ServiceConfigType } from '@/types/database'

interface ServiceConfigProps {
  templateServices: TemplateService[]
  initialConfig?: ServiceConfigType[]
  onChange: (config: ServiceConfigType[]) => void
}

export function ServiceConfig({ templateServices, initialConfig = [], onChange }: ServiceConfigProps) {
  const [config, setConfig] = useState<ServiceConfigType[]>(initialConfig)

  // Initialize config with all services if empty
  useEffect(() => {
    if (config.length === 0 && templateServices.length > 0) {
      const defaultConfig: ServiceConfigType[] = templateServices.map(service => ({
        service_id: service.id,
        enabled: true,
        custom_name: null
      }))
      setConfig(defaultConfig)
      onChange(defaultConfig)
    }
  }, [templateServices, config.length, onChange])

  const handleToggle = (serviceId: string, enabled: boolean) => {
    const newConfig = [...config]
    const existing = newConfig.find(c => c.service_id === serviceId)
    
    if (existing) {
      existing.enabled = enabled
    } else {
      newConfig.push({
        service_id: serviceId,
        enabled,
        custom_name: null
      })
    }
    
    setConfig(newConfig)
    onChange(newConfig)
  }

  const isServiceEnabled = (serviceId: string): boolean => {
    const serviceConfig = config.find(c => c.service_id === serviceId)
    return serviceConfig?.enabled ?? true
  }

  const enabledCount = config.filter(c => c.enabled).length
  const totalCount = templateServices.length

  const selectAll = () => {
    const newConfig = templateServices.map(service => ({
      service_id: service.id,
      enabled: true,
      custom_name: null
    }))
    setConfig(newConfig)
    onChange(newConfig)
  }

  const selectNone = () => {
    const newConfig = templateServices.map(service => ({
      service_id: service.id,
      enabled: false,
      custom_name: null
    }))
    setConfig(newConfig)
    onChange(newConfig)
  }

  if (templateServices.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Service Configuration</CardTitle>
          <CardDescription>No services available in this template</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Service Configuration</CardTitle>
            <CardDescription>
              Select services relevant to this client ({enabledCount}/{totalCount} selected)
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={selectAll}>
              Select All
            </Button>
            <Button variant="outline" size="sm" onClick={selectNone}>
              Select None
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {templateServices.map(service => (
            <ServiceToggle
              key={service.id}
              service={service}
              isEnabled={isServiceEnabled(service.id)}
              onToggle={handleToggle}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
