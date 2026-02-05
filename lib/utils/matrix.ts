/**
 * Location × Service matrix generator
 * Generates all combinations of locations and multiply-enabled pages
 */

import type { Location, ServiceConfig, SitemapNodeInsert, TemplateStructure } from '@/types/database'
import { extractMultiplyPages, type MultiplyPage } from './template-helpers'

export interface MatrixNode {
  title: string
  url: string
  page_type: 'service_location' | 'location'
  source: 'template'
  position: number
  metadata: {
    location_id: string
    service_id?: string
    location_name: string
    service_name?: string
    page_path?: string
  }
}

/**
 * Generate location-based pages from template structure.
 * Creates:
 * 1. A standalone location landing page per location (e.g., "Miami" at /service-areas/miami)
 * 2. Location × service cross-product pages (e.g., "Miami Water Damage" at /miami-water-damage)
 */
export function generateMatrixFromStructure(
  locations: Location[],
  templateStructure: TemplateStructure,
  locationUrlPattern: string = '/service-areas/{location_slug}'
): MatrixNode[] {
  const nodes: MatrixNode[] = []
  
  // Get all pages marked for multiplication (at any depth)
  const multiplyPages = extractMultiplyPages(templateStructure)

  let position = 0
  for (const location of locations) {
    // 1. Create standalone location landing page (e.g., "Miami" at /service-areas/miami)
    const locationUrl = locationUrlPattern.replace('{location_slug}', location.url_slug)
    nodes.push({
      title: location.name,
      url: locationUrl,
      page_type: 'location',
      source: 'template',
      position: position++,
      metadata: {
        location_id: location.id,
        location_name: location.name
      }
    })

    // 2. Create location × service pages nested under location landing page
    // e.g., /service-areas/miami/water-damage-restoration
    for (const page of multiplyPages) {
      // Extract clean slug from URL pattern (e.g., "/water-damage-restoration" → "water-damage-restoration")
      const pageSlug = page.url_pattern
        .replace(/^\//, '')        // remove leading /
        .split('/')                // split path segments
        .pop() || ''               // take the last segment (the leaf slug)
      
      // Nest under location: /service-areas/{location}/{service-slug}
      const url = `${locationUrl}/${pageSlug}`
      
      const title = `${location.name} ${page.title}`

      nodes.push({
        title,
        url,
        page_type: 'service_location',
        source: 'template',
        position: position++,
        metadata: {
          location_id: location.id,
          service_id: page.id,
          location_name: location.name,
          service_name: page.title,
          page_path: page.path.length > 0 ? page.path.join(' > ') : undefined
        }
      })
    }
  }

  return nodes
}

/**
 * LEGACY: Generate matrix from services list (backward compatibility)
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
 * Calculate how many pages the matrix will generate from template structure.
 * Includes: location landing pages + location × service pages
 */
export function calculateMatrixSizeFromStructure(
  locations: Location[],
  templateStructure: TemplateStructure
): number {
  const multiplyPages = extractMultiplyPages(templateStructure)
  const locationLandingPages = locations.length // one per location
  const serviceLocationPages = locations.length * multiplyPages.length
  return locationLandingPages + serviceLocationPages
}

/**
 * LEGACY: Calculate matrix size from services config
 */
export function calculateMatrixSize(
  locations: Location[],
  servicesConfig: ServiceConfig[]
): number {
  const enabledServicesCount = servicesConfig.filter(c => c.enabled).length
  return locations.length * enabledServicesCount
}

/**
 * Validate matrix generation from template structure
 */
export function validateMatrixFromStructure(
  locations: Location[],
  templateStructure: TemplateStructure
): { valid: boolean; error?: string } {
  if (locations.length === 0) {
    return { valid: false, error: 'At least one location is required' }
  }

  const multiplyPages = extractMultiplyPages(templateStructure)
  if (multiplyPages.length === 0) {
    return { valid: false, error: 'At least one page must be marked to multiply by locations' }
  }

  const matrixSize = calculateMatrixSizeFromStructure(locations, templateStructure)
  if (matrixSize > 1000) {
    return { 
      valid: false, 
      error: `Matrix would generate ${matrixSize} pages. Maximum is 1000. Please reduce locations or pages.`
    }
  }

  return { valid: true }
}

/**
 * LEGACY: Validate matrix inputs from services config
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
