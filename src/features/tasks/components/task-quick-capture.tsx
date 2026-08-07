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
        <Plus className="absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        {/* El campo se queda con la altura y la letra del kit (44 puntos y 16 de
            letra en telefono): escribir text-sm aqui volvia a encender el zoom
            automatico del iPhone al tocar el campo. */}
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Capturar tarea rapida... (Enter)"
          enterKeyHint="done"
          className="border-border bg-secondary/50 pl-8 placeholder:text-muted-foreground"
        />
      </div>
      <Button
        type="submit"
        size="default"
        className="shrink-0 px-4 text-[15px] md:text-sm"
        disabled={!value.trim()}
      >
        Capturar
      </Button>
    </form>
  )
}
