'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { Project, ProjectStatus } from '@/types/database'

interface ProjectWithTemplate {
  id: string
  name: string
  client_url: string | null
  status: ProjectStatus
  created_at: string
  updated_at: string | null
  template: { id: string; name: string } | null
}

interface ProjectCardProps {
  project: ProjectWithTemplate
  onDelete?: (id: string) => void
}

const statusColors: Record<ProjectStatus, string> = {
  draft: 'bg-gray-100 text-gray-800',
  crawled: 'bg-blue-100 text-blue-800',
  compared: 'bg-purple-100 text-purple-800',
  finalized: 'bg-green-100 text-green-800',
  archived: 'bg-yellow-100 text-yellow-800',
}

const statusLabels: Record<ProjectStatus, string> = {
  draft: 'Draft',
  crawled: 'Crawled',
  compared: 'Compared',
  finalized: 'Finalized',
  archived: 'Archived',
}

export function ProjectCard({ project, onDelete }: ProjectCardProps) {
  const router = useRouter()
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{project.name}</CardTitle>
            <CardDescription className="text-sm">
              {project.client_url ? (
                <a 
                  href={project.client_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {project.client_url}
                </a>
              ) : (
                'No client URL set'
              )}
            </CardDescription>
          </div>
          <span className={`text-xs px-2 py-1 rounded ${statusColors[project.status]}`}>
            {statusLabels[project.status]}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Template:</span>
            <span className="font-medium text-foreground">
              {project.template?.name || 'None selected'}
            </span>
          </div>
          
          <div className="text-xs text-muted-foreground">
            Created {formatDate(project.created_at)}
            {project.updated_at && ` • Updated ${formatDate(project.updated_at)}`}
          </div>
          
          <div className="flex gap-2 pt-2">
            <Button 
              variant="default" 
              size="sm" 
              className="flex-1"
              onClick={() => router.push(`/projects/${project.id}`)}
            >
              Open
            </Button>
            {onDelete && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onDelete(project.id)}
              >
                Delete
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
