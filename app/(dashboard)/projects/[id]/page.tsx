import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect('/login')
  }

  // Fetch project
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select(`
      *,
      template:templates(id, name, structure, services)
    `)
    .eq('id', id)
    .eq('created_by', user.id)
    .single()

  if (projectError || !project) {
    notFound()
  }

  const statusLabels: Record<string, string> = {
    draft: 'Draft',
    crawled: 'Crawled',
    compared: 'Compared',
    finalized: 'Finalized',
    archived: 'Archived',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
          <p className="text-muted-foreground">
            {project.client_url || 'No client URL set'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm bg-gray-100 px-3 py-1 rounded-full">
            {statusLabels[project.status] || project.status}
          </span>
          <Button variant="outline" asChild>
            <Link href="/">Back to Projects</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
            <CardDescription>Basic project information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Template</p>
              <p className="text-sm">{project.template?.name || 'None selected'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <p className="text-sm">{statusLabels[project.status]}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Created</p>
              <p className="text-sm">
                {new Date(project.created_at).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>Services and locations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Services</p>
              <p className="text-sm">
                {project.services_config?.length || 0} services configured
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Locations</p>
              <p className="text-sm">
                {project.locations?.length || 0} locations added
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Next Steps</CardTitle>
          <CardDescription>
            Complete these steps to build your sitemap
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Phase 3 features coming soon:</strong> This project detail page will include:
            </p>
            <ul className="text-sm text-blue-700 mt-2 ml-4 list-disc">
              <li>Website crawler to import existing pages</li>
              <li>AI-powered page matching</li>
              <li>Service and location configuration</li>
              <li>Visual sitemap builder</li>
              <li>CSV/JSON export</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
