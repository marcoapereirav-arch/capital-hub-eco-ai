'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Calendar, ChevronDown } from 'lucide-react'
import { DATE_PRESETS } from '../services/date-ranges'
import type { DatePreset } from '../types/dashboard'

interface DateFilterProps {
  currentPreset: DatePreset
  currentStart?: string | null
  currentEnd?: string | null
}

export function DateFilter({ currentPreset, currentStart, currentEnd }: DateFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [customOpen, setCustomOpen] = useState(currentPreset === 'custom')
  const [customStart, setCustomStart] = useState(currentStart?.slice(0, 10) ?? '')
  const [customEnd, setCustomEnd] = useState(currentEnd?.slice(0, 10) ?? '')

  const currentLabel = DATE_PRESETS.find((p) => p.value === currentPreset)?.label ?? 'Todo el tiempo'

  function applyPreset(preset: DatePreset) {
    if (preset === 'custom') {
      setCustomOpen(true)
      return
    }
    const params = new URLSearchParams(searchParams.toString())
    params.set('range', preset)
    params.delete('start')
    params.delete('end')
    startTransition(() => {
      router.push(`?${params.toString()}`)
    })
  }

  function applyCustom() {
    if (!customStart || !customEnd) return
    const params = new URLSearchParams(searchParams.toString())
    params.set('range', 'custom')
    params.set('start', customStart)
    params.set('end', customEnd)
    startTransition(() => {
      router.push(`?${params.toString()}`)
      setCustomOpen(false)
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 gap-2 text-xs">
            <Calendar className="h-3.5 w-3.5" />
            {currentLabel}
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          {DATE_PRESETS.map((p) => (
            <DropdownMenuItem
              key={p.value}
              onClick={() => applyPreset(p.value)}
              disabled={isPending}
            >
              {p.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {customOpen && (
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            className="h-8 w-auto text-xs bg-transparent border-border"
          />
          <span className="text-xs text-muted-foreground">a</span>
          <Input
            type="date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            className="h-8 w-auto text-xs bg-transparent border-border"
          />
          <Button
            size="sm"
            variant="secondary"
            className="h-8 text-xs"
            onClick={applyCustom}
            disabled={!customStart || !customEnd || isPending}
          >
            Aplicar
          </Button>
        </div>
      )}
    </div>
  )
}
