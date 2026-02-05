import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TemplateForm } from '@/components/features/templates/builder/TemplateForm'

export default async function NewTemplatePage() {
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

  if (profile?.role !== 'admin') {
    redirect('/')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create New Template</h1>
        <p className="text-muted-foreground">
          Build a custom sitemap template for an industry
        </p>
      </div>
      
      <TemplateForm mode="create" />
    </div>
  )
}
