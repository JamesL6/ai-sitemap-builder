import { createClient } from '@/lib/supabase/server'
import { apiResponse, apiError } from '@/lib/utils/api-response'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get the authenticated user from Supabase Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return apiError('AUTH_REQUIRED', 'Authentication required', 401)
    }

    // Get the user profile from our users table
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, email, full_name, role, created_at')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Profile fetch error:', profileError)
      // If profile doesn't exist yet, return basic auth info
      return apiResponse({
        id: user.id,
        email: user.email,
        full_name: null,
        role: 'user',
        created_at: user.created_at
      })
    }

    return apiResponse(profile)
  } catch (error) {
    console.error('API Error:', error)
    return apiError('SYS_INTERNAL', 'Internal server error', 500)
  }
}
