import Anthropic from '@anthropic-ai/sdk'

// Initialize Claude client
const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY!,
})

export interface ClaudeMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ClaudeOptions {
  model?: string
  maxTokens?: number
  temperature?: number
}

const DEFAULT_OPTIONS: Required<ClaudeOptions> = {
  model: 'claude-sonnet-4-5-20250929',
  maxTokens: 4096,
  temperature: 0.7
}

/**
 * Send a message to Claude and get a response
 */
export async function sendMessage(
  messages: ClaudeMessage[],
  options: ClaudeOptions = {}
): Promise<string> {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  try {
    const response = await anthropic.messages.create({
      model: opts.model,
      max_tokens: opts.maxTokens,
      temperature: opts.temperature,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    })

    // Extract text from response
    const content = response.content[0]
    if (content.type === 'text') {
      return content.text
    }

    throw new Error('Unexpected response format from Claude')
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('rate_limit')) {
        throw new Error('AI_RATE_LIMITED: Too many requests. Please try again later.')
      }
      if (error.message.includes('invalid_api_key')) {
        throw new Error('AI_API_ERROR: Invalid API key configuration.')
      }
      throw new Error(`AI_API_ERROR: ${error.message}`)
    }
    throw error
  }
}

/**
 * Send a simple prompt to Claude
 */
export async function askClaude(
  prompt: string,
  options: ClaudeOptions = {}
): Promise<string> {
  return sendMessage([{ role: 'user', content: prompt }], options)
}

/**
 * Check if Claude API is configured
 */
export function isClaudeConfigured(): boolean {
  return !!process.env.CLAUDE_API_KEY && process.env.CLAUDE_API_KEY !== 'sk-ant-api03-your-key'
}
