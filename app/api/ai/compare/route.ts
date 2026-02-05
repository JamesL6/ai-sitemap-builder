import { createClient } from '@/lib/supabase/server'
import { apiResponse, apiError } from '@/lib/utils/api-response'
import { NextRequest } from 'next/server'
import { comparePages } from '@/lib/claude/compare'
import { isClaudeConfigured } from '@/lib/claude/client'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return apiError('AUTH_REQUIRED', 'Authentication required', 401)
    }

    // Check if Claude API is configured
    if (!isClaudeConfigured()) {
      return apiError('AI_UNAVAILABLE', 'Claude API is not configured', 503)
    }

    // Parse request body
    const body = await request.json()
    
    // Validate required fields
    if (!body.template_pages || !Array.isArray(body.template_pages)) {
      return apiError('VAL_INVALID_INPUT', 'template_pages array is required', 400)
    }

    if (!body.client_pages || !Array.isArray(body.client_pages)) {
      return apiError('VAL_INVALID_INPUT', 'client_pages array is required', 400)
    }

    const projectId = body.project_id as string | undefined

    // If project_id provided, verify ownership
    if (projectId) {
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('id')
        .eq('id', projectId)
        .eq('created_by', user.id)
        .single()

      if (projectError || !project) {
        return apiError('RES_NOT_FOUND', 'Project not found or access denied', 404)
      }
    }

    // Perform AI comparison
    const result = await comparePages(
      body.template_pages,
      body.client_pages
    )

    // If project_id provided, save comparison result to project
    if (projectId) {
      await supabase
        .from('projects')
        .update({
          comparison_result: {
            matches: result.matches,
            template_only: result.templateOnly,
            client_only: result.clientOnly,
            uncertain: result.uncertain,
            compared_at: new Date().toISOString(),
            tokens_used: result.tokensUsed
          },
          status: 'compared'
        })
        .eq('id', projectId)
        .eq('created_by', user.id)
    }

    // Return comparison results
    return apiResponse({
      matches: result.matches,
      template_only: result.templateOnly,
      client_only: result.clientOnly,
      uncertain: result.uncertain,
      tokens_used: result.tokensUsed
    })
  } catch (error) {
    console.error('AI Compare API Error:', error)
    
    // Check for specific AI errors
    if (error instanceof Error) {
      if (error.message.includes('AI_RATE_LIMITED')) {
        return apiError('AI_RATE_LIMITED', 'Too many AI requests. Please try again later.', 429)
      }
      if (error.message.includes('AI_API_ERROR')) {
        return apiError('AI_API_ERROR', error.message.replace('AI_API_ERROR: ', ''), 500)
      }
    }
    
    return apiError('SYS_INTERNAL', 'Internal server error', 500)
  }
}
