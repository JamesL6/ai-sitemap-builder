import { createClient } from '@/lib/supabase/server'
import { apiResponse, apiError } from '@/lib/utils/api-response'
import { NextRequest } from 'next/server'
import { crawlSitemap } from '@/lib/crawler/sitemap'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return apiError('AUTH_REQUIRED', 'Authentication required', 401)
    }

    // Parse request body
    const body = await request.json()
    
    // Validate required fields
    if (!body.url || typeof body.url !== 'string') {
      return apiError('VAL_INVALID_INPUT', 'Website URL is required', 400)
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

    // Crawl the sitemap
    const result = await crawlSitemap(body.url)

    if (!result.success) {
      // Determine appropriate error code
      let errorCode = 'CRAWL_SITE_ERROR'
      if (result.error?.includes('timeout')) {
        errorCode = 'CRAWL_TIMEOUT'
      } else if (result.error?.includes('No sitemap')) {
        errorCode = 'CRAWL_NO_SITEMAP'
      } else if (result.error?.includes('Invalid URL')) {
        errorCode = 'CRAWL_INVALID_URL'
      }

      return apiError(errorCode, result.error || 'Failed to crawl site', 422)
    }

    // If project_id provided, update the project with crawl data
    if (projectId) {
      await supabase
        .from('projects')
        .update({
          crawl_data: {
            pages: result.pages,
            sitemap_url: result.sitemapUrl,
            crawled_at: new Date().toISOString()
          },
          status: 'crawled'
        })
        .eq('id', projectId)
        .eq('created_by', user.id)
    }

    // Return crawl results
    return apiResponse({
      pages_found: result.pagesFound,
      pages: result.pages,
      sitemap_url: result.sitemapUrl,
      crawled_at: new Date().toISOString()
    })
  } catch (error) {
    console.error('Crawl API Error:', error)
    return apiError('SYS_INTERNAL', 'Internal server error', 500)
  }
}
