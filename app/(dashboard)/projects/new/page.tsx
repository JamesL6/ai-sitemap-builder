import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CreateProjectForm } from '@/components/features/projects/CreateProjectForm'

export default async function NewProjectPage() {
  const supabase = await createClient()
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect('/login')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create New Project</h1>
        <p className="text-muted-foreground">
          Set up a new sitemap project for your client
        </p>
      </div>
      
      <CreateProjectForm />
    </div>
  )
}
