/**
 * Location × Service matrix generator
 * Generates all combinations of locations and services for sitemap
 */

import type { Location, ServiceConfig, SitemapNodeInsert } from '@/types/database'

export interface MatrixNode {
  title: string
  url: string
  page_type: 'service_location'
  source: 'template'
  position: number
  metadata: {
    location_id: string
    service_id: string
    location_name: string
    service_name: string
  }
}

/**
 * Generate location × service matrix nodes
 */
export function generateMatrix(
  locations: Location[],
  servicesConfig: ServiceConfig[],
  availableServices: Array<{ id: string; name: string; url_slug: string }>,
  urlPattern: string = '/{location_slug}-{service_slug}'
): MatrixNode[] {
  const nodes: MatrixNode[] = []
  
  // Filter to only enabled services
  const enabledServices = servicesConfig
    .filter(config => config.enabled)
    .map(config => {
      const service = availableServices.find(s => s.id === config.service_id)
      return service
    })
    .filter(Boolean) as Array<{ id: string; name: string; url_slug: string }>

  // Generate all combinations
  let position = 0
  for (const location of locations) {
    for (const service of enabledServices) {
      const url = urlPattern
        .replace('{location_slug}', location.url_slug)
        .replace('{service_slug}', service.url_slug)
      
      const title = `${location.name} ${service.name}`

      nodes.push({
        title,
        url,
        page_type: 'service_location',
        source: 'template',
        position: position++,
        metadata: {
          location_id: location.id,
          service_id: service.id,
          location_name: location.name,
          service_name: service.name
        }
      })
    }
  }

  return nodes
}

/**
 * Convert matrix nodes to sitemap node inserts
 */
export function matrixToSitemapNodes(
  matrixNodes: MatrixNode[],
  projectId: string,
  parentId?: string
): SitemapNodeInsert[] {
  return matrixNodes.map(node => ({
    project_id: projectId,
    title: node.title,
    url: node.url,
    page_type: node.page_type,
    parent_id: parentId || null,
    source: node.source,
    client_original_url: null,
    position: node.position,
    metadata: node.metadata
  }))
}

/**
 * Calculate how many pages the matrix will generate
 */
export function calculateMatrixSize(
  locations: Location[],
  servicesConfig: ServiceConfig[]
): number {
  const enabledServicesCount = servicesConfig.filter(c => c.enabled).length
  return locations.length * enabledServicesCount
}

/**
 * Validate matrix generation inputs
 */
export function validateMatrixInputs(
  locations: Location[],
  servicesConfig: ServiceConfig[]
): { valid: boolean; error?: string } {
  if (locations.length === 0) {
    return { valid: false, error: 'At least one location is required' }
  }

  const enabledServices = servicesConfig.filter(c => c.enabled)
  if (enabledServices.length === 0) {
    return { valid: false, error: 'At least one service must be enabled' }
  }

  const matrixSize = calculateMatrixSize(locations, servicesConfig)
  if (matrixSize > 1000) {
    return { 
      valid: false, 
      error: `Matrix would generate ${matrixSize} pages. Maximum is 1000. Please reduce locations or services.`
    }
  }

  return { valid: true }
}
