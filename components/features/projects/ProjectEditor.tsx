'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CrawlForm } from '@/components/features/crawler/CrawlForm'
import { ServiceConfig } from '@/components/features/services/ServiceConfig'
import { LocationInput } from '@/components/features/locations/LocationInput'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, CheckCircle } from 'lucide-react'
import { calculateMatrixSize, validateMatrixInputs, generateMatrix, matrixToSitemapNodes } from '@/lib/utils/matrix'
import { extractTemplatePages } from '@/lib/claude/compare'
import type { Project, Template, TemplateStructure, TemplateService, ServiceConfig as ServiceConfigType, Location } from '@/types/database'

interface ProjectEditorProps {
  project: Project & { template: Template | null }
}

export function ProjectEditor({ project: initialProject }: ProjectEditorProps) {
  const router = useRouter()
  const [project, setProject] = useState(initialProject)
  const [servicesConfig, setServicesConfig] = useState<ServiceConfigType[]>(project.services_config as ServiceConfigType[] || [])
  const [locations, setLocations] = useState<Location[]>(project.locations as Location[] || [])
  const [isComparing, setIsComparing] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [comparisonDone, setComparisonDone] = useState(!!project.comparison_result)

  const template = project.template
  const templateServices = template?.services as TemplateService[] || []
  const templateStructure = template?.structure as TemplateStructure || { pages: [] }

  // Handle AI comparison
  const handleCompare = async () => {
    if (!template || !project.crawl_data) {
      alert('Please crawl a website first')
      return
    }

    setIsComparing(true)
    try {
      const crawlData = project.crawl_data as any
      const templatePages = extractTemplatePages(templateStructure)
      
      const response = await fetch('/api/ai/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: project.id,
          template_pages: templatePages,
          client_pages: crawlData.pages
        })
      })

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to compare pages')
      }

      setComparisonDone(true)
      alert(`AI Comparison complete! Found ${result.data.matches.length} matches`)
      router.refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to compare pages')
    } finally {
      setIsComparing(false)
    }
  }

  // Handle matrix generation
  const handleGenerateMatrix = async () => {
    const validation = validateMatrixInputs(locations, servicesConfig)
    if (!validation.valid) {
      alert(validation.error)
      return
    }

    const matrixSize = calculateMatrixSize(locations, servicesConfig)
    if (!confirm(`This will generate ${matrixSize} pages. Continue?`)) {
      return
    }

    setIsGenerating(true)
    try {
      // Generate matrix
      const urlPattern = template?.url_patterns?.service_location as string || '/{location_slug}-{service_slug}'
      const matrixNodes = generateMatrix(locations, servicesConfig, templateServices, urlPattern)
      const sitemapNodes = matrixToSitemapNodes(matrixNodes, project.id)

      // Save to database
      const response = await fetch(`/api/projects/${project.id}/nodes/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes: sitemapNodes })
      })

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to generate sitemap')
      }

      // Update project with services/locations
      await fetch(`/api/projects/${project.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          services_config: servicesConfig,
          locations: locations,
          status: 'finalized'
        })
      })

      alert(`Successfully generated ${result.data.created} sitemap pages!`)
      router.refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to generate sitemap')
    } finally {
      setIsGenerating(false)
    }
  }

  // Handle services config change
  const handleServicesChange = async (newConfig: ServiceConfigType[]) => {
    setServicesConfig(newConfig)
    
    // Auto-save to project
    await fetch(`/api/projects/${project.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ services_config: newConfig })
    })
  }

  // Handle locations change
  const handleLocationsChange = async (newLocations: Location[]) => {
    setLocations(newLocations)
    
    // Auto-save to project
    await fetch(`/api/projects/${project.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locations: newLocations })
    })
  }

  if (!template) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Template Selected</CardTitle>
          <CardDescription>
            This project doesn&apos;t have a template. Please select one to continue.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const matrixSize = calculateMatrixSize(locations, servicesConfig)
  const canGenerate = locations.length > 0 && servicesConfig.some(c => c.enabled)

  return (
    <Tabs defaultValue="crawl" className="space-y-4">
      <TabsList>
        <TabsTrigger value="crawl">
          1. Crawl Website
          {project.status !== 'draft' && <CheckCircle className="ml-2 h-4 w-4 text-green-600" />}
        </TabsTrigger>
        <TabsTrigger value="compare">
          2. AI Comparison
          {comparisonDone && <CheckCircle className="ml-2 h-4 w-4 text-green-600" />}
        </TabsTrigger>
        <TabsTrigger value="configure">3. Configure</TabsTrigger>
        <TabsTrigger value="generate">4. Generate</TabsTrigger>
      </TabsList>

      <TabsContent value="crawl" className="space-y-4">
        <CrawlForm projectId={project.id} initialUrl={project.client_url || ''} />
      </TabsContent>

      <TabsContent value="compare" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>AI-Powered Page Matching</CardTitle>
            <CardDescription>
              Use Claude AI to intelligently match client pages with template pages
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!project.crawl_data ? (
              <p className="text-sm text-muted-foreground">
                Please crawl the client website first
              </p>
            ) : (
              <div className="space-y-4">
                <p className="text-sm">
                  Ready to compare {extractTemplatePages(templateStructure).length} template pages
                  with {(project.crawl_data as any).pages?.length || 0} crawled pages
                </p>
                <Button onClick={handleCompare} disabled={isComparing}>
                  {isComparing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Comparing with AI...
                    </>
                  ) : (
                    'Run AI Comparison'
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="configure" className="space-y-4">
        <ServiceConfig
          templateServices={templateServices}
          initialConfig={servicesConfig}
          onChange={handleServicesChange}
        />
        <LocationInput
          locations={locations}
          onChange={handleLocationsChange}
        />
      </TabsContent>

      <TabsContent value="generate" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Generate Sitemap</CardTitle>
            <CardDescription>
              Create location × service matrix and finalize your sitemap
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!canGenerate ? (
              <p className="text-sm text-muted-foreground">
                Please add locations and enable at least one service first
              </p>
            ) : (
              <>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-900">Matrix Preview</p>
                  <p className="text-sm text-blue-700 mt-1">
                    {locations.length} location{locations.length !== 1 ? 's' : ''} ×{' '}
                    {servicesConfig.filter(c => c.enabled).length} service{servicesConfig.filter(c => c.enabled).length !== 1 ? 's' : ''} = {matrixSize} pages
                  </p>
                </div>

                <Button onClick={handleGenerateMatrix} disabled={isGenerating} className="w-full">
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    `Generate ${matrixSize} Pages`
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
