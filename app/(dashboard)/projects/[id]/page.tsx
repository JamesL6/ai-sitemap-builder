import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { ProjectEditor } from '@/components/features/projects/ProjectEditor'

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

  // Fetch project with template
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select(`
      *,
      template:templates(*)
    `)
    .eq('id', id)
    .eq('created_by', user.id)
    .single()

  if (projectError || !project) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
        <p className="text-muted-foreground">
          {project.client_url || 'No client URL set'}
        </p>
      </div>

      <ProjectEditor project={project} />
    </div>
  )
}
