'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CrawlForm } from '@/components/features/crawler/CrawlForm'
import { LocationInput } from '@/components/features/locations/LocationInput'
import { SitemapViewer } from '@/components/features/sitemap/SitemapViewer'
import { SitemapToolbar } from '@/components/features/sitemap/SitemapToolbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, CheckCircle } from 'lucide-react'
import { matrixToSitemapNodes, generateMatrixFromStructure, calculateMatrixSizeFromStructure, validateMatrixFromStructure } from '@/lib/utils/matrix'
import { extractAllPages, extractMultiplyPages } from '@/lib/utils/template-helpers'
import type { Project, Template, TemplateStructure, Location } from '@/types/database'

interface ProjectEditorProps {
  project: Project & { template: Template | null }
}

export function ProjectEditor({ project: initialProject }: ProjectEditorProps) {
  const router = useRouter()
  const [project, setProject] = useState(initialProject)
  const [locations, setLocations] = useState<Location[]>(project.locations as Location[] || [])
  const [isComparing, setIsComparing] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [comparisonDone, setComparisonDone] = useState(!!project.comparison_result)
  const [nodeCount, setNodeCount] = useState(0)
  const [refreshKey, setRefreshKey] = useState(0)

  const template = project.template
  const templateStructure = template?.structure as TemplateStructure || { pages: [] }
  const multiplyPages = extractMultiplyPages(templateStructure)

  // Handle AI comparison
  const handleCompare = async () => {
    if (!template || !project.crawl_data) {
      alert('Please crawl a website first')
      return
    }

    setIsComparing(true)
    try {
      const crawlData = project.crawl_data as any
      const templatePages = extractAllPages(templateStructure)
      
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
    // Use new structure-based validation
    const validation = validateMatrixFromStructure(locations, templateStructure)
    if (!validation.valid) {
      alert(validation.error)
      return
    }

    const matrixSize = calculateMatrixSizeFromStructure(locations, templateStructure)
    if (!confirm(`This will generate ${matrixSize} location-based pages. Continue?`)) {
      return
    }

    setIsGenerating(true)
    try {
      // Generate matrix using new structure-based approach
      const urlPattern = template?.url_patterns?.service_location as string || '/{location_slug}-{page_slug}'
      const matrixNodes = generateMatrixFromStructure(locations, templateStructure, urlPattern)
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

      // Update project with locations
      await fetch(`/api/projects/${project.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locations: locations,
          status: 'finalized'
        })
      })

      alert(`Successfully generated ${result.data.created} sitemap pages!`)
      setRefreshKey(prev => prev + 1)
      router.refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to generate sitemap')
    } finally {
      setIsGenerating(false)
    }
  }

  // Handle node count update from viewer
  const handleNodeCountUpdate = (count: number) => {
    setNodeCount(count)
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

  const matrixSize = calculateMatrixSizeFromStructure(locations, templateStructure)
  const canGenerate = locations.length > 0

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
        <TabsTrigger value="view">5. View & Export</TabsTrigger>
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
                  Ready to compare {extractAllPages(templateStructure).length} template pages
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
        <Card>
          <CardHeader>
            <CardTitle>Pages Marked for Location Multiplication</CardTitle>
            <CardDescription>
              These pages from your template will be multiplied by each location
            </CardDescription>
          </CardHeader>
          <CardContent>
            {multiplyPages.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No pages are marked to multiply. Edit your template to mark pages with "Multiply by locations".
              </p>
            ) : (
              <div className="space-y-2">
                {multiplyPages.map((page) => (
                  <div key={page.id} className="p-2 border rounded-md bg-blue-50">
                    <p className="text-sm font-medium">{page.title}</p>
                    {page.path.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {page.path.join(' > ')} {'>'} {page.title}
                      </p>
                    )}
                    <p className="text-xs text-blue-600 mt-1">{page.url_pattern}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
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
                    {locations.length} location{locations.length !== 1 ? 's' : ''} × pages marked for multiplication = {matrixSize} total pages
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Each page marked "Multiply by locations" in the template will generate {locations.length} location variant{locations.length !== 1 ? 's' : ''}
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

      <TabsContent value="view" className="space-y-4">
        <SitemapToolbar projectId={project.id} nodeCount={nodeCount} />
        <SitemapViewer projectId={project.id} key={refreshKey} onNodeCountUpdate={handleNodeCountUpdate} />
      </TabsContent>
    </Tabs>
  )
}
