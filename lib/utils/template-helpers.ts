/**
 * Helper functions for working with template structures
 */

import type { TemplatePage, TemplateStructure } from '@/types/database'

export interface MultiplyPage {
  id: string
  title: string
  url_pattern: string
  path: string[] // Breadcrumb of parent titles
  depth: number
}

/**
 * Extract all pages that should be multiplied by locations
 * Works at any depth in the hierarchy
 */
export function extractMultiplyPages(structure: TemplateStructure): MultiplyPage[] {
  const multiplyPages: MultiplyPage[] = []

  function traverse(pages: TemplatePage[], parentPath: string[] = [], depth: number = 0) {
    for (const page of pages) {
      // Check both new flag and legacy flag
      const shouldMultiply = page.multiply_in_matrix || page.is_service
      
      if (shouldMultiply) {
        multiplyPages.push({
          id: page.id,
          title: page.title,
          url_pattern: page.url_pattern,
          path: parentPath,
          depth
        })
      }

      // Continue traversing children
      if (page.children && page.children.length > 0) {
        traverse(page.children, [...parentPath, page.title], depth + 1)
      }
    }
  }

  traverse(structure.pages || [])
  return multiplyPages
}

/**
 * Find all pages at any depth (for comparison) - returns titles only
 * @deprecated Use extractAllPagesWithUrls for better AI matching
 */
export function extractAllPages(structure: TemplateStructure): string[] {
  const pages: string[] = []

  function traverse(pageArray: TemplatePage[]) {
    for (const page of pageArray) {
      pages.push(page.title)
      if (page.children && page.children.length > 0) {
        traverse(page.children)
      }
    }
  }

  traverse(structure.pages || [])
  return pages
}

/**
 * Find all pages at any depth with titles AND URL patterns (for better AI comparison)
 */
export function extractAllPagesWithUrls(structure: TemplateStructure): Array<{ title: string; url_pattern: string }> {
  const pages: Array<{ title: string; url_pattern: string }> = []

  function traverse(pageArray: TemplatePage[]) {
    for (const page of pageArray) {
      pages.push({
        title: page.title,
        url_pattern: page.url_pattern
      })
      if (page.children && page.children.length > 0) {
        traverse(page.children)
      }
    }
  }

  traverse(structure.pages || [])
  return pages
}

/**
 * Find the location parent page
 */
export function findLocationParent(structure: TemplateStructure): TemplatePage | null {
  function traverse(pages: TemplatePage[]): TemplatePage | null {
    for (const page of pages) {
      if (page.is_location_parent) {
        return page
      }
      if (page.children && page.children.length > 0) {
        const found = traverse(page.children)
        if (found) return found
      }
    }
    return null
  }

  return traverse(structure.pages || [])
}

/**
 * Generate a full page path string
 */
export function getPagePath(multiplyPage: MultiplyPage): string {
  if (multiplyPage.path.length === 0) {
    return multiplyPage.title
  }
  return [...multiplyPage.path, multiplyPage.title].join(' > ')
}
