/**
 * Page comparison logic using Claude AI
 */

import { askClaude } from './client'
import { buildComparisonPrompt, parseComparisonResponse, type ParsedComparison, type ComparisonPromptData } from './prompts'

export interface ComparisonResult extends ParsedComparison {
  tokensUsed?: number
}

/**
 * Compare template pages with client pages using Claude AI
 */
export async function comparePages(
  templatePages: string[],
  clientPages: Array<{ title: string; url: string }>
): Promise<ComparisonResult> {
  // Build prompt
  const promptData: ComparisonPromptData = {
    templatePages,
    clientPages
  }
  const prompt = buildComparisonPrompt(promptData)

  try {
    // Ask Claude
    const response = await askClaude(prompt, {
      temperature: 0.3, // Lower temperature for more consistent matching
      maxTokens: 4096
    })

    // Parse response
    const parsed = parseComparisonResponse(response)

    return {
      ...parsed,
      tokensUsed: estimateTokens(prompt, response)
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Failed to compare pages with AI')
  }
}

/**
 * Estimate token usage (rough approximation)
 */
function estimateTokens(prompt: string, response: string): number {
  // Rough estimate: 1 token ≈ 4 characters
  const promptTokens = Math.ceil(prompt.length / 4)
  const responseTokens = Math.ceil(response.length / 4)
  return promptTokens + responseTokens
}

/**
 * Extract template pages from template structure (all pages at all depths)
 * @deprecated Use extractAllPages from template-helpers instead
 */
export function extractTemplatePages(templateStructure: { pages: any[] }): string[] {
  const pages: string[] = []

  function traverse(pageArray: any[]) {
    for (const page of pageArray) {
      if (page.title) {
        pages.push(page.title)
      }
      if (page.children && Array.isArray(page.children)) {
        traverse(page.children)
      }
    }
  }

  traverse(templateStructure.pages || [])
  return pages
}
