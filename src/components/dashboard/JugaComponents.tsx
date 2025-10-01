"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { TrendingDown, TrendingUp } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

type TrendDirection = "up" | "down" | "neutral"

interface JugaKPICardProps {
  title: string
  value: string
  description?: string
  trend?: TrendDirection
  trendValue?: string
  icon?: React.ReactNode
  color?: "primary" | "success" | "warning" | "error" | "accent"
  className?: string
}

const KPI_COLORS: Record<NonNullable<JugaKPICardProps["color"]>, string> = {
  primary: "border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950 dark:to-transparent shadow-sm",
  success: "border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-white dark:from-green-950 dark:to-transparent shadow-sm",
  warning: "border-orange-200 dark:border-orange-800 bg-gradient-to-br from-orange-50 to-white dark:from-orange-950 dark:to-transparent shadow-sm",
  error: "border-red-200 dark:border-red-800 bg-gradient-to-br from-red-50 to-white dark:from-red-950 dark:to-transparent shadow-sm",
  accent: "border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-white dark:from-purple-950 dark:to-transparent shadow-sm",
}

const KPI_ICON_COLORS: Record<NonNullable<JugaKPICardProps["color"]>, string> = {
  primary: "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-800",
  success: "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/50 border border-green-200 dark:border-green-800",
  warning: "text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/50 border border-orange-200 dark:border-orange-800",
  error: "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/50 border border-red-200 dark:border-red-800",
  accent: "text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/50 border border-purple-200 dark:border-purple-800",
}

export function JugaKPICard({
  title,
  value,
  description,
  trend,
  trendValue,
  icon,
  color = "primary",
  className,
}: JugaKPICardProps) {
  return (
    <Card className={cn("juga-card transition-all hover:juga-shadow-glow hover:shadow-md", KPI_COLORS[color], className)}>
      <CardHeader className="pb-2 sm:pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 leading-tight uppercase tracking-wide">{title}</CardTitle>
          {icon ? <div className={cn("p-1.5 sm:p-2 rounded-lg shadow-sm", KPI_ICON_COLORS[color])}>{icon}</div> : null}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-1 sm:space-y-2">
          <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</div>
          {(description || (trend && trendValue)) && (
            <div className="flex items-center justify-between gap-2">
              {description ? <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate font-medium">{description}</p> : <span />}
              {trend && trendValue ? (
                <div
                  className={cn(
                    "flex items-center gap-1 text-xs font-semibold px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-full flex-shrink-0 border",
                    trend === "up"
                      ? "text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/50 border-green-300 dark:border-green-700"
                      : trend === "down"
                      ? "text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/50 border-red-300 dark:border-red-700"
                      : "text-gray-700 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600",
                  )}
                >
                  {trend === "up" ? <TrendingUp className="h-3 w-3" /> : trend === "down" ? <TrendingDown className="h-3 w-3" /> : null}
                  <span className="hidden sm:inline">{trendValue}</span>
                  <span className="sm:hidden">{trendValue.replace('%', '')}</span>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

interface TimelineItem {
  id: string
  title: string
  description: string
  time: string
  type?: "info" | "success" | "warning" | "error"
  avatar?: string
  user?: string
}

export function JugaTimeline({ items, className }: { items: TimelineItem[]; className?: string }) {
  const typeColors: Record<NonNullable<TimelineItem["type"]>, string> = {
    info: "bg-juga-primary",
    success: "bg-juga-success",
    warning: "bg-juga-warning",
    error: "bg-juga-error",
  }

  return (
    <div className={cn("space-y-3 sm:space-y-4", className)}>
      {items.map((item, index) => (
        <div key={item.id} className="flex gap-3 sm:gap-4">
          <div className="flex flex-col items-center">
            <div className={cn("w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full", typeColors[item.type || "info"]) } />
            {index < items.length - 1 ? <div className="w-px h-6 sm:h-8 bg-juga-border mt-1.5 sm:mt-2" /> : null}
          </div>
          <div className="flex-1 min-w-0 pb-3 sm:pb-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-heading text-xs sm:text-sm leading-tight">{item.title}</p>
                <p className="text-body text-xs sm:text-sm mt-0.5 sm:mt-1 leading-tight">{item.description}</p>
                {item.user ? (
                  <div className="flex items-center gap-1.5 sm:gap-2 mt-1.5 sm:mt-2">
                    <Avatar className="h-4 w-4 sm:h-5 sm:w-5">
                      <AvatarImage src={item.avatar} />
                      <AvatarFallback className="text-xs">
                        {item.user[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-caption text-xs truncate">{item.user}</span>
                  </div>
                ) : null}
              </div>
              <span className="text-caption text-xs whitespace-nowrap flex-shrink-0">{item.time}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

interface JugaProgressCardProps {
  title: string
  description?: string
  progress: number
  total?: number
  current?: number
  color?: "primary" | "success" | "warning" | "error" | "accent"
  className?: string
}

export function JugaProgressCard({
  title,
  description,
  progress,
  total,
  current,
  color = "primary",
  className,
}: JugaProgressCardProps) {
  return (
    <Card className={cn("juga-card", className)}>
      <CardContent className="p-3 sm:p-4">
        <div className="space-y-2 sm:space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-heading text-xs sm:text-sm leading-tight">{title}</h4>
              {description ? <p className="text-body text-xs mt-0.5 sm:mt-1 leading-tight">{description}</p> : null}
            </div>
            <div className="text-right flex-shrink-0">
              <div className="font-bold text-base sm:text-lg text-heading">{progress}%</div>
              {typeof total === "number" && typeof current === "number" ? (
                <div className="text-caption text-xs">
                  <span className="hidden sm:inline">{current.toLocaleString('pt-BR')} / {total.toLocaleString('pt-BR')}</span>
                  <span className="sm:hidden">{Math.round(current/1000)}k / {Math.round(total/1000)}k</span>
                </div>
              ) : null}
            </div>
          </div>
          <Progress 
            value={progress} 
            className="h-1.5 sm:h-2" 
          />
        </div>
      </CardContent>
    </Card>
  )
}


