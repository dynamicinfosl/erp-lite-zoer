'use client'

import * as React from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface OverlaySelectOption {
  value: string
  label: string
}

interface OverlaySelectProps {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  options: OverlaySelectOption[]
  className?: string
}

export function OverlaySelect({ value, onChange, placeholder = 'Selecione', options, className }: OverlaySelectProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        className={
          `h-12 rounded-xl bg-white/5 dark:bg-slate-900/40 border border-blue-400/30 
           text-slate-900 dark:text-slate-100 backdrop-blur-md 
           shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15)] hover:bg-white/10
           focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400/60 ${className ?? ''}`
        }
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl">
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value} className="cursor-pointer">
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}


