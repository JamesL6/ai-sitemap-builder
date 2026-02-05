'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProjectCard } from './ProjectCard'
import { Button } from '@/components/ui/button'
import type { ProjectStatus } from '@/types/database'

interface ProjectWithTemplate {
  id: string
  name: string
  client_url: string | null
  status: ProjectStatus
  created_at: string
  updated_at: string | null
  template: { id: string; name: string } | null
}

export function ProjectList() {
  const router = useRouter()
  const [projects, setProjects] = useState<ProjectWithTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/projects')
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch projects')
      }
      
      setProjects(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return
    }

    setIsDeleting(id)
    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'DELETE'
      })
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to delete project')
      }
      
      // Remove from list
      setProjects(projects.filter(p => p.id !== id))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete project')
    } finally {
      setIsDeleting(null)
    }
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={fetchProjects} variant="outline">
          Try Again
        </Button>
      </div>
    )
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed rounded-lg">
        <h3 className="text-lg font-medium mb-2">No projects yet</h3>
        <p className="text-muted-foreground mb-4">
          Create your first sitemap project to get started
        </p>
        <Button onClick={() => router.push('/projects/new')}>
          Create Project
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {projects.length} project{projects.length !== 1 ? 's' : ''}
        </p>
        <Button onClick={() => router.push('/projects/new')}>
          Create Project
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            onDelete={isDeleting === project.id ? undefined : handleDelete}
          />
        ))}
      </div>
    </div>
  )
}
