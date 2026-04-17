"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useTaskStore } from "../store/task-store"

export function TaskQuickCapture() {
  const [value, setValue] = useState("")
  const quickCapture = useTaskStore((s) => s.quickCapture)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = value.trim()
    if (!trimmed) return
    quickCapture(trimmed)
    setValue("")
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <div className="relative flex-1">
        <Plus className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Capturar tarea rapida... (Enter)"
          className="pl-8 h-9 bg-secondary/50 border-border text-sm placeholder:text-muted-foreground/50"
        />
      </div>
      <Button
        type="submit"
        variant="secondary"
        size="sm"
        className="h-9 px-3 font-mono text-xs"
        disabled={!value.trim()}
      >
        Capturar
      </Button>
    </form>
  )
}
