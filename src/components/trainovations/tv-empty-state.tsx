import { type ReactNode } from 'react'

interface TVEmptyStateProps {
  title: string
  description?: string
  icon?: ReactNode
  action?: ReactNode
  className?: string
}

export function TVEmptyState({ title, description, icon, action, className }: TVEmptyStateProps) {
  return (
    <div className={`flex flex-col items-center gap-3 rounded-xl border border-dashed bg-surface-muted px-6 py-10 text-center ${className ?? ''}`}>
      {icon && <div className="text-muted-foreground">{icon}</div>}
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  )
}
