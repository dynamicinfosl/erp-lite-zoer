import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { cn } from './ui/utils';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, MoreHorizontal } from 'lucide-react';

interface JugaKPICardProps {
  title: string;
  value: string;
  description?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  icon?: React.ReactNode;
  color?: 'primary' | 'success' | 'warning' | 'error' | 'accent';
  className?: string;
}

export function JugaKPICard({ 
  title, 
  value, 
  description, 
  trend, 
  trendValue, 
  icon, 
  color = 'primary',
  className 
}: JugaKPICardProps) {
  const colorClasses = {
    primary: 'border-juga-primary/20 bg-gradient-to-br from-juga-primary/5 to-transparent',
    success: 'border-juga-success/20 bg-gradient-to-br from-juga-success/5 to-transparent',
    warning: 'border-juga-warning/20 bg-gradient-to-br from-juga-warning/5 to-transparent',
    error: 'border-juga-error/20 bg-gradient-to-br from-juga-error/5 to-transparent',
    accent: 'border-juga-accent/20 bg-gradient-to-br from-juga-accent/5 to-transparent',
  };

  const iconColorClasses = {
    primary: 'text-juga-primary bg-juga-primary/10',
    success: 'text-juga-success bg-juga-success/10',
    warning: 'text-juga-warning bg-juga-warning/10',
    error: 'text-juga-error bg-juga-error/10',
    accent: 'text-juga-accent bg-juga-accent/10',
  };

  return (
    <Card className={cn('juga-card-elevated transition-all hover:juga-shadow-glow', colorClasses[color], className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-juga-text-secondary">{title}</CardTitle>
          {icon && (
            <div className={cn('p-2 rounded-lg', iconColorClasses[color])}>
              {icon}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="text-2xl font-bold text-heading">{value}</div>
          {(description || trend) && (
            <div className="flex items-center justify-between">
              {description && (
                <p className="text-sm text-caption">{description}</p>
              )}
              {trend && trendValue && (
                <div className={cn(
                  'flex items-center gap-1 text-xs px-2 py-1 rounded-full',
                  trend === 'up' ? 'text-juga-success bg-juga-success/10' : 
                  trend === 'down' ? 'text-juga-error bg-juga-error/10' : 
                  'text-juga-text-muted bg-juga-text-muted/10'
                )}>
                  {trend === 'up' ? <TrendingUp className="h-3 w-3" /> : 
                   trend === 'down' ? <TrendingDown className="h-3 w-3" /> : null}
                  <span>{trendValue}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface JugaStepperProps {
  steps: Array<{
    id: string;
    title: string;
    description?: string;
    status: 'completed' | 'current' | 'pending';
  }>;
  className?: string;
}

export function JugaStepper({ steps, className }: JugaStepperProps) {
  return (
    <div className={cn('flex items-center space-x-4', className)}>
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          <div className="flex items-center space-x-3">
            <div className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium',
              step.status === 'completed' ? 'bg-juga-success text-white' :
              step.status === 'current' ? 'bg-juga-primary text-white' :
              'bg-juga-border text-juga-text-muted'
            )}>
              {step.status === 'completed' ? '✓' : index + 1}
            </div>
            <div className="min-w-0">
              <p className={cn(
                'text-sm font-medium',
                step.status === 'current' ? 'text-juga-primary' : 'text-juga-text-secondary'
              )}>
                {step.title}
              </p>
              {step.description && (
                <p className="text-xs text-caption">{step.description}</p>
              )}
            </div>
          </div>
          {index < steps.length - 1 && (
            <Separator orientation="horizontal" className="flex-1" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

interface JugaTimelineProps {
  items: Array<{
    id: string;
    title: string;
    description: string;
    time: string;
    type?: 'info' | 'success' | 'warning' | 'error';
    avatar?: string;
    user?: string;
  }>;
  className?: string;
}

export function JugaTimeline({ items, className }: JugaTimelineProps) {
  const typeColors = {
    info: 'bg-juga-primary',
    success: 'bg-juga-success',
    warning: 'bg-juga-warning',
    error: 'bg-juga-error',
  };

  return (
    <div className={cn('space-y-4', className)}>
      {items.map((item, index) => (
        <div key={item.id} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className={cn(
              'w-3 h-3 rounded-full',
              typeColors[item.type || 'info']
            )} />
            {index < items.length - 1 && (
              <div className="w-px h-8 bg-juga-border mt-2" />
            )}
          </div>
          <div className="flex-1 min-w-0 pb-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="font-medium text-heading text-sm">{item.title}</p>
                <p className="text-body text-sm mt-1">{item.description}</p>
                {item.user && (
                  <div className="flex items-center gap-2 mt-2">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={item.avatar} />
                      <AvatarFallback className="text-xs">{item.user[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-caption text-xs">{item.user}</span>
                  </div>
                )}
              </div>
              <span className="text-caption text-xs ml-4">{item.time}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

interface JugaEmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function JugaEmptyState({ icon, title, description, action, className }: JugaEmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-4 text-center', className)}>
      {icon && (
        <div className="text-juga-text-muted mb-4 opacity-50">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-medium text-heading mb-2">{title}</h3>
      <p className="text-body mb-6 max-w-md">{description}</p>
      {action && (
        <Button onClick={action.onClick} className="juga-gradient text-white">
          {action.label}
        </Button>
      )}
    </div>
  );
}

interface JugaKanbanCardProps {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority?: 'low' | 'medium' | 'high';
  assignee?: {
    name: string;
    avatar?: string;
  };
  dueDate?: string;
  tags?: string[];
  className?: string;
}

export function JugaKanbanCard({ 
  title, 
  description, 
  status, 
  priority, 
  assignee, 
  dueDate, 
  tags, 
  className 
}: JugaKanbanCardProps) {
  const priorityColors = {
    low: 'bg-juga-success/10 text-juga-success border-juga-success/20',
    medium: 'bg-juga-warning/10 text-juga-warning border-juga-warning/20',
    high: 'bg-juga-error/10 text-juga-error border-juga-error/20',
  };

  return (
    <Card className={cn('juga-card cursor-pointer hover:juga-shadow-glow transition-all', className)}>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <h4 className="font-medium text-heading text-sm leading-tight">{title}</h4>
            <Button variant="ghost" size="icon" className="h-6 w-6 -mt-1 -mr-1">
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </div>
          
          {description && (
            <p className="text-body text-xs leading-relaxed">{description}</p>
          )}
          
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs px-2 py-0.5">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
          
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              {assignee && (
                <Avatar className="h-6 w-6">
                  <AvatarImage src={assignee.avatar} />
                  <AvatarFallback className="text-xs">{assignee.name[0]}</AvatarFallback>
                </Avatar>
              )}
              {dueDate && (
                <span className="text-caption text-xs">{dueDate}</span>
              )}
            </div>
            
            {priority && (
              <Badge className={cn('text-xs px-2 py-0.5', priorityColors[priority])}>
                {priority}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface JugaProgressCardProps {
  title: string;
  description?: string;
  progress: number;
  total?: number;
  current?: number;
  color?: 'primary' | 'success' | 'warning' | 'error';
  className?: string;
}

export function JugaProgressCard({ 
  title, 
  description, 
  progress, 
  total, 
  current, 
  color = 'primary',
  className 
}: JugaProgressCardProps) {
  const progressColors = {
    primary: 'bg-juga-primary',
    success: 'bg-juga-success',
    warning: 'bg-juga-warning',
    error: 'bg-juga-error',
  };

  return (
    <Card className={cn('juga-card', className)}>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-medium text-heading text-sm">{title}</h4>
              {description && (
                <p className="text-body text-xs mt-1">{description}</p>
              )}
            </div>
            <div className="text-right">
              <div className="font-bold text-lg text-heading">{progress}%</div>
              {total && current && (
                <div className="text-caption text-xs">{current}/{total}</div>
              )}
            </div>
          </div>
          
          <Progress 
            value={progress} 
            className="h-2"
          />
        </div>
      </CardContent>
    </Card>
  );
}