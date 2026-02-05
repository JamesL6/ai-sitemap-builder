import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TemplateList } from '@/components/features/templates/TemplateList'

export default async function TemplatesPage() {
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Templates</h1>
        <p className="text-muted-foreground">
          {isAdmin 
            ? 'Manage sitemap templates for different industries' 
            : 'Browse available sitemap templates'}
        </p>
      </div>
      
      <TemplateList isAdmin={isAdmin} />
    </div>
  )
}
