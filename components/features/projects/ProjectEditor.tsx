'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CrawlForm } from '@/components/features/crawler/CrawlForm'
import { LocationInput } from '@/components/features/locations/LocationInput'
import { SitemapViewer } from '@/components/features/sitemap/SitemapViewer'
import { SitemapToolbar } from '@/components/features/sitemap/SitemapToolbar'
import { WireframeTree } from '@/components/features/sitemap/WireframeTree'
import { ComparisonWireframe } from '@/components/features/sitemap/ComparisonWireframe'
import { MergePanel } from '@/components/features/sitemap/MergePanel'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, CheckCircle, ArrowRight, List, GitBranch } from 'lucide-react'
import { matrixToSitemapNodes, generateMatrixFromStructure, calculateMatrixSizeFromStructure, validateMatrixFromStructure } from '@/lib/utils/matrix'
import { extractAllPages, extractAllPagesWithUrls, extractMultiplyPages } from '@/lib/utils/template-helpers'
import type { Project, Template, TemplateStructure, Location, SitemapNode, ComparisonResult } from '@/types/database'

interface CrawledPage {
  url: string
  title: string
  lastModified?: string
}

interface ProjectEditorProps {
  project: Project & { template: Template | null }
}

export function ProjectEditor({ project: initialProject }: ProjectEditorProps) {
  const [project, setProject] = useState(initialProject)
  const [locations, setLocations] = useState<Location[]>(project.locations as Location[] || [])
  const [isComparing, setIsComparing] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [comparisonDone, setComparisonDone] = useState(!!project.comparison_result)
  const [nodeCount, setNodeCount] = useState(0)
  const [refreshKey, setRefreshKey] = useState(0)
  const [activeTab, setActiveTab] = useState('crawl')
  const [crawlCompleted, setCrawlCompleted] = useState(!!project.crawl_data)
  const [generationDone, setGenerationDone] = useState(project.status === 'finalized')
  const [viewMode, setViewMode] = useState<'list' | 'tree'>('list')
  const [sitemapNodes, setSitemapNodes] = useState<SitemapNode[]>([])
  const [isLoadingNodes, setIsLoadingNodes] = useState(false)

  const template = project.template
  const templateStructure = template?.structure as TemplateStructure || { pages: [] }
  const multiplyPages = extractMultiplyPages(templateStructure)
  const comparisonResult = project.comparison_result as ComparisonResult | null

  // Fetch sitemap nodes for tree view
  const fetchSitemapNodes = async () => {
    setIsLoadingNodes(true)
    try {
      const response = await fetch(`/api/projects/${project.id}/nodes`)
      const result = await response.json()
      if (result.success) {
        setSitemapNodes(result.data)
      }
    } catch (err) {
      console.error('Failed to fetch nodes:', err)
    } finally {
      setIsLoadingNodes(false)
    }
  }

  // Fetch nodes when view tab is active or after generation
  useEffect(() => {
    if (activeTab === 'view' || generationDone) {
      fetchSitemapNodes()
    }
  }, [activeTab, generationDone, refreshKey])

  // Handle when a client page is added from merge panel
  const handleClientPageAdded = () => {
    fetchSitemapNodes()
    setRefreshKey(prev => prev + 1)
  }

  // Handle successful crawl - update local state and enable next step
  const handleCrawlSuccess = (pages: CrawledPage[]) => {
    setCrawlCompleted(true)
    // Update local project state with crawl data
    setProject(prev => ({
      ...prev,
      crawl_data: { pages },
      status: 'crawled' as const
    }))
  }

  // Navigate to next tab
  const goToNextTab = (currentTab: string) => {
    const tabOrder = ['crawl', 'compare', 'configure', 'generate', 'view']
    const currentIndex = tabOrder.indexOf(currentTab)
    if (currentIndex < tabOrder.length - 1) {
      setActiveTab(tabOrder[currentIndex + 1])
    }
  }

  // Handle AI comparison
  const handleCompare = async () => {
    if (!template || !project.crawl_data) {
      alert('Please crawl a website first')
      return
    }

    setIsComparing(true)
    try {
      const crawlData = project.crawl_data as any
      const templatePages = extractAllPagesWithUrls(templateStructure)
      
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
      setProject(prev => ({
        ...prev,
        comparison_result: result.data,
        status: 'compared' as const
      }))
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

      setGenerationDone(true)
      setRefreshKey(prev => prev + 1)
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
  const crawlData = project.crawl_data as { pages?: CrawledPage[] } | null

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
      <TabsList>
        <TabsTrigger value="crawl">
          1. Crawl Website
          {crawlCompleted && <CheckCircle className="ml-2 h-4 w-4 text-green-600" />}
        </TabsTrigger>
        <TabsTrigger value="compare">
          2. AI Comparison
          {comparisonDone && <CheckCircle className="ml-2 h-4 w-4 text-green-600" />}
        </TabsTrigger>
        <TabsTrigger value="configure">
          3. Configure
          {locations.length > 0 && <CheckCircle className="ml-2 h-4 w-4 text-green-600" />}
        </TabsTrigger>
        <TabsTrigger value="generate">
          4. Generate
          {generationDone && <CheckCircle className="ml-2 h-4 w-4 text-green-600" />}
        </TabsTrigger>
        <TabsTrigger value="view">5. View & Export</TabsTrigger>
      </TabsList>

      {/* Step 1: Crawl Website */}
      <TabsContent value="crawl" className="space-y-4">
        <CrawlForm 
          projectId={project.id} 
          initialUrl={project.client_url || ''} 
          onSuccess={handleCrawlSuccess}
        />
        
        {crawlCompleted && (
          <>
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-800">
                      Crawl complete! Found {crawlData?.pages?.length || 0} pages.
                    </span>
                  </div>
                  <Button onClick={() => goToNextTab('crawl')} className="gap-2">
                    Continue to AI Comparison
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Show crawled pages list */}
            {crawlData?.pages && crawlData.pages.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Crawled Pages</CardTitle>
                  <CardDescription>
                    {crawlData.pages.length} pages discovered from the client website
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {crawlData.pages.map((page, index) => (
                      <div
                        key={index}
                        className="flex items-start justify-between p-2 border rounded-md hover:bg-muted/50"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{page.title || 'Untitled'}</p>
                          <a
                            href={page.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-muted-foreground hover:text-blue-600 truncate block"
                          >
                            {page.url}
                          </a>
                        </div>
                        {page.lastModified && (
                          <span className="text-xs text-muted-foreground ml-2 shrink-0">
                            {new Date(page.lastModified).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </TabsContent>

      {/* Step 2: AI Comparison */}
      <TabsContent value="compare" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>AI-Powered Page Matching</CardTitle>
            <CardDescription>
              Use Claude AI to intelligently match client pages with template pages
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!crawlCompleted ? (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-4">
                  Please crawl the client website first
                </p>
                <Button variant="outline" onClick={() => setActiveTab('crawl')}>
                  Go to Crawl Step
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-900">Ready to Compare</p>
                  <p className="text-sm text-blue-700 mt-1">
                    {extractAllPagesWithUrls(templateStructure).length} template pages vs {crawlData?.pages?.length || 0} crawled pages
                  </p>
                </div>
                <Button onClick={handleCompare} disabled={isComparing} className="w-full">
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

        {comparisonDone && comparisonResult && (
          <>
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-800">
                      AI Comparison complete!
                    </span>
                  </div>
                  <Button onClick={() => goToNextTab('compare')} className="gap-2">
                    Continue to Configure
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Comparison Results Visualization */}
            <ComparisonWireframe
              templateStructure={templateStructure}
              comparisonResult={comparisonResult}
            />

            {/* Merge Panel for Client-Only Pages */}
            {comparisonResult.client_only.length > 0 && (
              <MergePanel
                projectId={project.id}
                comparisonResult={comparisonResult}
                existingNodes={sitemapNodes}
                onPageAdded={handleClientPageAdded}
                onBulkAdd={handleClientPageAdded}
              />
            )}
          </>
        )}
      </TabsContent>

      {/* Step 3: Configure Locations */}
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
                No pages are marked to multiply. Edit your template to mark pages with &quot;Multiply by locations&quot;.
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

        {locations.length > 0 && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-800">
                    {locations.length} location{locations.length !== 1 ? 's' : ''} configured
                  </span>
                </div>
                <Button onClick={() => goToNextTab('configure')} className="gap-2">
                  Continue to Generate
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      {/* Step 4: Generate Sitemap */}
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
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-4">
                  Please add locations first
                </p>
                <Button variant="outline" onClick={() => setActiveTab('configure')}>
                  Go to Configure Step
                </Button>
              </div>
            ) : (
              <>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-900">Matrix Preview</p>
                  <p className="text-sm text-blue-700 mt-1">
                    {locations.length} location{locations.length !== 1 ? 's' : ''} × {multiplyPages.length} page{multiplyPages.length !== 1 ? 's' : ''} = {matrixSize} total pages
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Each page marked &quot;Multiply by locations&quot; will generate {locations.length} location variant{locations.length !== 1 ? 's' : ''}
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

        {generationDone && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-800">
                    Sitemap generated successfully!
                  </span>
                </div>
                <Button onClick={() => goToNextTab('generate')} className="gap-2">
                  View & Export
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      {/* Step 5: View & Export */}
      <TabsContent value="view" className="space-y-4">
        <div className="flex items-center justify-between">
          <SitemapToolbar projectId={project.id} nodeCount={nodeCount} />
          
          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="gap-2"
            >
              <List className="h-4 w-4" />
              List
            </Button>
            <Button
              variant={viewMode === 'tree' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('tree')}
              className="gap-2"
            >
              <GitBranch className="h-4 w-4" />
              Tree
            </Button>
          </div>
        </div>

        {viewMode === 'list' ? (
          <SitemapViewer 
            projectId={project.id} 
            key={refreshKey} 
            onNodeCountUpdate={handleNodeCountUpdate} 
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Sitemap Tree View</CardTitle>
              <CardDescription>
                Visual wireframe representation of your sitemap structure
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingNodes ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <WireframeTree
                  nodes={sitemapNodes}
                  comparisonResult={comparisonResult}
                  onNodeClick={(node) => console.log('Node clicked:', node)}
                />
              )}
            </CardContent>
          </Card>
        )}
      </TabsContent>
    </Tabs>
  )
}
