# Frontend Guidelines

## Directory Structure

```
/app                      # Next.js App Router pages
  /(auth)/               # Public auth pages (login, register)
  /(dashboard)/          # Protected app pages
/components
  /ui/                   # shadcn/ui base components
  /features/             # Feature-specific components
  /layouts/              # Layout wrapper components
/hooks                   # Custom React hooks
/lib                     # Utilities and services
/types                   # TypeScript type definitions
/public                  # Static assets
```

## Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Components | PascalCase | `SitemapViewer.tsx` |
| Hooks | camelCase with 'use' prefix | `useProjects.ts` |
| Utils | camelCase | `formatDate.ts` |
| Types | PascalCase | `Project`, `SitemapNode` |
| CSS classes | kebab-case (Tailwind) | `text-blue-500 bg-gray-100` |
| Files in /app | lowercase with hyphens | `page.tsx`, `layout.tsx` |

## State Management Strategy

| State Type | Solution | When to Use | Example |
|-----------|----------|-------------|---------|
| Server data | React Query or SWR | API data, cached | Projects list, templates |
| UI state | useState | Component-local | Modal open, form inputs |
| Shared UI state | Context + useReducer | Cross-component UI | Sidebar collapsed, theme |
| Form state | react-hook-form | Complex forms | Project creation, settings |
| URL state | Next.js searchParams | Filterable lists | Project status filter |

## Component Pattern (COPY THIS)

```typescript
// components/features/[feature]/ComponentName.tsx
'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ComponentNameProps {
  /** Description of prop */
  title: string
  /** Optional callback when action completes */
  onComplete?: (result: string) => void
  /** Additional CSS classes */
  className?: string
}

export function ComponentName({ 
  title, 
  onComplete,
  className 
}: ComponentNameProps) {
  // State
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Handlers
  const handleAction = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Perform action
      const result = await someAsyncAction()
      onComplete?.(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [onComplete])

  // Render
  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <p className="text-sm text-red-500 mb-4">{error}</p>
        )}
        
        <Button 
          onClick={handleAction} 
          disabled={isLoading}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? 'Processing...' : 'Take Action'}
        </Button>
      </CardContent>
    </Card>
  )
}
```

## Page Component Pattern (App Router)

```typescript
// app/(dashboard)/projects/page.tsx
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProjectList } from '@/components/features/projects/ProjectList'
import { ProjectListSkeleton } from '@/components/features/projects/ProjectListSkeleton'

export default async function ProjectsPage() {
  const supabase = await createClient()
  
  // Check auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Projects</h1>
        <CreateProjectButton />
      </div>
      
      <Suspense fallback={<ProjectListSkeleton />}>
        <ProjectList userId={user.id} />
      </Suspense>
    </div>
  )
}
```

## Styling Approach

### Tailwind CSS + cn() Utility

```typescript
// lib/utils.ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### Usage in Components

```typescript
// Conditional classes
<div className={cn(
  'p-4 rounded-lg border',
  isActive && 'border-blue-500 bg-blue-50',
  isDisabled && 'opacity-50 cursor-not-allowed'
)}>

// Accepting className prop
<Card className={cn('w-full max-w-md', className)}>
```

### Color System (Sitemap-specific)

```typescript
// Sitemap node colors
const nodeColors = {
  template: {
    bg: 'bg-blue-100',
    border: 'border-blue-500',
    text: 'text-blue-700',
    badge: 'bg-blue-500 text-white',
  },
  client: {
    bg: 'bg-orange-100',
    border: 'border-orange-500',
    text: 'text-orange-700',
    badge: 'bg-orange-500 text-white',
  },
}
```

## Data Fetching Pattern

### Server Component (Preferred for Initial Load)

```typescript
// app/(dashboard)/projects/page.tsx
async function ProjectsPage() {
  const supabase = await createClient()
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })
  
  return <ProjectList initialData={projects} />
}
```

### Client Component (For Mutations and Real-time)

```typescript
// components/features/projects/ProjectList.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function ProjectList({ initialData }: { initialData: Project[] }) {
  const [projects, setProjects] = useState(initialData)
  const [isLoading, setIsLoading] = useState(false)
  
  const supabase = createClient()

  const refetch = async () => {
    setIsLoading(true)
    const { data } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (data) setProjects(data)
    setIsLoading(false)
  }

  const deleteProject = async (id: string) => {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
    
    if (!error) {
      setProjects(prev => prev.filter(p => p.id !== id))
    }
  }

  return (
    // ... render
  )
}
```

## Form Handling Pattern

```typescript
// components/features/projects/CreateProjectForm.tsx
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  client_url: z.string().url().optional().or(z.literal('')),
})

type FormValues = z.infer<typeof formSchema>

export function CreateProjectForm({ 
  onSuccess 
}: { 
  onSuccess: (project: Project) => void 
}) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      client_url: '',
    },
  })

  const onSubmit = async (values: FormValues) => {
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      
      const result = await response.json()
      
      if (result.success) {
        onSuccess(result.data)
        form.reset()
      } else {
        form.setError('root', { message: result.error.message })
      }
    } catch {
      form.setError('root', { message: 'An error occurred' })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project Name</FormLabel>
              <FormControl>
                <Input placeholder="ABC Restoration Sitemap" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="client_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Client Website (optional)</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {form.formState.errors.root && (
          <p className="text-sm text-red-500">
            {form.formState.errors.root.message}
          </p>
        )}

        <Button 
          type="submit" 
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? 'Creating...' : 'Create Project'}
        </Button>
      </form>
    </Form>
  )
}
```

## Sitemap Visualization Pattern

```typescript
// components/features/sitemap/SitemapViewer.tsx
'use client'

import { useMemo } from 'react'
import { SitemapNode } from './SitemapNode'
import type { SitemapNode as NodeType } from '@/types'

interface SitemapViewerProps {
  nodes: NodeType[]
  onNodeClick?: (node: NodeType) => void
  onNodeEdit?: (node: NodeType) => void
}

export function SitemapViewer({ 
  nodes, 
  onNodeClick,
  onNodeEdit 
}: SitemapViewerProps) {
  // Build tree structure from flat array
  const tree = useMemo(() => buildTree(nodes), [nodes])

  return (
    <div className="p-4 bg-gray-50 rounded-lg overflow-auto">
      <div className="inline-block min-w-full">
        {tree.map(node => (
          <SitemapNode
            key={node.id}
            node={node}
            depth={0}
            onClick={onNodeClick}
            onEdit={onNodeEdit}
          />
        ))}
      </div>
    </div>
  )
}

function buildTree(nodes: NodeType[]): TreeNode[] {
  const nodeMap = new Map<string, TreeNode>()
  const roots: TreeNode[] = []

  // Create all nodes
  nodes.forEach(node => {
    nodeMap.set(node.id, { ...node, children: [] })
  })

  // Build relationships
  nodes.forEach(node => {
    const treeNode = nodeMap.get(node.id)!
    if (node.parent_id) {
      const parent = nodeMap.get(node.parent_id)
      if (parent) {
        parent.children.push(treeNode)
      }
    } else {
      roots.push(treeNode)
    }
  })

  // Sort children by position
  const sortChildren = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => a.position - b.position)
    nodes.forEach(node => sortChildren(node.children))
  }
  sortChildren(roots)

  return roots
}
```

## Accessibility Requirements

- All interactive elements must be keyboard accessible
- Use semantic HTML (`button`, `nav`, `main`, `article`)
- Provide `aria-label` for icon-only buttons
- Ensure color contrast meets WCAG AA (4.5:1 for text)
- Include loading states and error messages
- Support reduced motion preferences

```typescript
// Example accessible button
<Button
  aria-label="Delete project"
  onClick={handleDelete}
  disabled={isDeleting}
>
  <Trash2 className="h-4 w-4" />
  <span className="sr-only">Delete project</span>
</Button>
```

## Loading States Pattern

```typescript
// components/features/projects/ProjectListSkeleton.tsx
export function ProjectListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div 
          key={i}
          className="h-24 bg-gray-200 rounded-lg animate-pulse"
        />
      ))}
    </div>
  )
}
```
