import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { TemplateForm } from '@/components/features/templates/builder/TemplateForm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import type { TemplateStructure, TemplatePage, TemplateService } from '@/types/database'

interface PageProps {
  params: Promise<{ id: string }>
}

function renderPageTree(pages: TemplatePage[], depth = 0): React.ReactNode {
  return pages.map((page) => (
    <div key={page.id} style={{ marginLeft: `${depth * 20}px` }} className="py-1">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{page.title}</span>
        <span className="text-xs text-muted-foreground">{page.url_pattern}</span>
        {page.is_service && (
          <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
            Service
          </span>
        )}
        {page.is_location_parent && (
          <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
            Locations
          </span>
        )}
      </div>
      {page.children && page.children.length > 0 && renderPageTree(page.children, depth + 1)}
    </div>
  ))
}

export default async function TemplateDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect('/login')
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin'

  // Fetch template
  const { data: template, error: templateError } = await supabase
    .from('templates')
    .select('*')
    .eq('id', id)
    .single()

  if (templateError || !template) {
    notFound()
  }

  // Non-admins can't see inactive templates
  if (!template.is_active && !isAdmin) {
    notFound()
  }

  // If admin, show editor
  if (isAdmin) {
    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Edit Template</h1>
            <p className="text-muted-foreground">{template.name}</p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/templates">Back to Templates</Link>
          </Button>
        </div>
        
        <TemplateForm initialTemplate={template} mode="edit" />
      </div>
    )
  }

  // Non-admin view (read-only)
  const structure = template.structure as TemplateStructure
  const services = template.services as TemplateService[]

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{template.name}</h1>
          <p className="text-muted-foreground">
            {template.description || 'No description'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/templates">Back to Templates</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Page Structure</CardTitle>
            <CardDescription>
              {structure.pages?.length || 0} top-level pages
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto">
              {structure.pages && structure.pages.length > 0 ? (
                renderPageTree(structure.pages)
              ) : (
                <p className="text-sm text-muted-foreground">No pages defined</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Available Services</CardTitle>
            <CardDescription>
              {services.length} services in this template
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {services.length > 0 ? (
                services.map((service) => (
                  <div 
                    key={service.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium">{service.name}</p>
                      <p className="text-xs text-muted-foreground">/{service.url_slug}</p>
                    </div>
                    {service.category && (
                      <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                        {service.category}
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No services defined</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
