"use client"

import { useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { PageContainer } from "@/components/ui/page-container"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import {
  Rocket,
  Flame,
  Lock,
  Zap,
  Calendar,
  ArrowRight,
} from "lucide-react"
import {
  ASSIGNEE_INITIALS,
  PRIORITY_COLORS,
  PRIORITY_RANK,
  STATUS_COLORS,
  STATUS_LABELS,
  type LaunchPhase,
  type MisionAssignee,
  type MisionTask,
} from "../types/mision"
import {
  misionService,
  subscribeMisionRealtime,
} from "../services/mision-service"
import { TaskDetailSheet } from "./mision-task-detail"

const TARGET_DATE = "2026-05-31"
const PROJECT_START = "2026-05-07"

type Props = {
  initialPhases: LaunchPhase[]
  initialTasks: MisionTask[]
  currentAssignee: MisionAssignee | null
  currentName: string
}

function daysBetween(fromIso: string, toIso: string): number {
  const a = new Date(fromIso + "T00:00:00")
  const b = new Date(toIso + "T00:00:00")
  return Math.round((b.getTime() - a.getTime()) / 86_400_000)
}

function todayIso(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function formatDateShort(iso: string | null): string {
  if (!iso) return "Sin fecha"
  const d = new Date(iso + "T00:00:00")
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short" })
}

function isOverdue(task: MisionTask, today: string): boolean {
  if (!task.dueDate || task.status === "done") return false
  return task.dueDate < today
}

function isCriticalToday(task: MisionTask, today: string): boolean {
  if (task.status === "done") return false
  if (task.priority === "urgent") return true
  if (!task.dueDate) return false
  const days = daysBetween(today, task.dueDate)
  return days >= 0 && days <= 2
}

function sortTasksByPriority(a: MisionTask, b: MisionTask): number {
  const pr = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]
  if (pr !== 0) return pr
  if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate)
  if (a.dueDate) return -1
  if (b.dueDate) return 1
  return a.title.localeCompare(b.title)
}

export function MisionPage({
  initialPhases,
  initialTasks,
  currentAssignee,
  currentName,
}: Props) {
  const [phases] = useState<LaunchPhase[]>(initialPhases)
  const [tasks, setTasks] = useState<MisionTask[]>(initialTasks)
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  const [today, setToday] = useState<string>(todayIso())

  useEffect(() => {
    const interval = setInterval(() => setToday(todayIso()), 60_000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const unsubscribe = subscribeMisionRealtime({
      onTaskInsert: (task) => {
        setTasks((prev) => [...prev.filter((t) => t.id !== task.id), task])
      },
      onTaskUpdate: (task) => {
        setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)))
      },
      onTaskDelete: (id) => {
        setTasks((prev) => prev.filter((t) => t.id !== id))
      },
    })
    return unsubscribe
  }, [])

  const daysLeft = Math.max(0, daysBetween(today, TARGET_DATE))
  const daysTotal = Math.max(1, daysBetween(PROJECT_START, TARGET_DATE))
  const daysElapsed = Math.max(0, daysTotal - daysLeft)

  const totalTasks = tasks.length
  const doneTasks = tasks.filter((t) => t.status === "done").length
  const globalProgress = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0

  const taskById = useMemo(() => {
    const map = new Map<string, MisionTask>()
    for (const t of tasks) map.set(t.id, t)
    return map
  }, [tasks])

  const phaseStats = useMemo(() => {
    return phases.map((phase) => {
      const phaseTasks = tasks.filter((t) => t.launchPhaseId === phase.id)
      const done = phaseTasks.filter((t) => t.status === "done").length
      const blocked = phaseTasks.filter((t) => t.status === "waiting").length
      const overdue = phaseTasks.filter((t) => isOverdue(t, today)).length
      const pct = phaseTasks.length ? Math.round((done / phaseTasks.length) * 100) : 0
      return { phase, total: phaseTasks.length, done, blocked, overdue, pct }
    })
  }, [phases, tasks, today])

  const criticalToday = useMemo(() => {
    return tasks
      .filter((t) => isCriticalToday(t, today))
      .sort(sortTasksByPriority)
      .slice(0, 8)
  }, [tasks, today])

  const blockedActive = useMemo(() => {
    return tasks.filter((t) => t.status === "waiting").sort(sortTasksByPriority)
  }, [tasks])

  const myTasks = useMemo(() => {
    if (!currentAssignee) return []
    return tasks
      .filter((t) => t.assignee === currentAssignee && t.status !== "done")
      .sort(sortTasksByPriority)
  }, [tasks, currentAssignee])

  const myDone = useMemo(() => {
    if (!currentAssignee) return 0
    return tasks.filter((t) => t.assignee === currentAssignee && t.status === "done").length
  }, [tasks, currentAssignee])

  const myTotal = useMemo(() => {
    if (!currentAssignee) return 0
    return tasks.filter((t) => t.assignee === currentAssignee).length
  }, [tasks, currentAssignee])

  const overdueCount = useMemo(
    () => tasks.filter((t) => isOverdue(t, today)).length,
    [tasks, today]
  )

  const activeTask = activeTaskId ? taskById.get(activeTaskId) ?? null : null

  return (
    <>
      <PageContainer className="space-y-6 md:space-y-8">
        {/* HEADER MISIÓN + COUNTDOWN */}
        <section>
          <Card className="border-border bg-card">
            <CardContent className="flex flex-col gap-6 p-4 md:flex-row md:items-center md:justify-between md:p-8">
              <div className="flex min-w-0 flex-col gap-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Rocket className="size-4 shrink-0" />
                  Misión
                </div>
                <h1 className="font-heading text-2xl leading-tight font-bold tracking-tight text-foreground md:text-4xl">
                  Producto Terminado
                </h1>
                <p className="text-[15px] text-muted-foreground">
                  Capital Hub on point · 31 May 2026
                </p>
              </div>

              {/* Tres numeros: dos columnas en telefono, tres en monitor. */}
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
                <Stat label="Días restantes" value={String(daysLeft)} />
                <Stat label="% Progreso" value={`${globalProgress}%`} />
                <Stat label="Atrasadas" value={String(overdueCount)} warn={overdueCount > 0} />
              </div>
            </CardContent>

            <div className="px-4 pb-4 md:px-8 md:pb-8">
              <ProgressBar percent={globalProgress} />
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm tabular-nums text-muted-foreground">
                <span>{doneTasks}/{totalTasks} tareas</span>
                <span>Día {daysElapsed} de {daysTotal}</span>
              </div>
            </div>
          </Card>
        </section>

        {/* 4 FASES */}
        <section className="flex flex-col gap-3">
          <SectionTitle>Fases del lanzamiento</SectionTitle>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {phaseStats.map(({ phase, total, done, blocked, overdue, pct }) => (
              <Card key={phase.id} className="border-border bg-card">
                <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-muted-foreground">
                      Fase {phase.order} · {formatDateShort(phase.targetDate)}
                    </div>
                    <CardTitle className="mt-1 font-heading text-base font-semibold text-foreground">
                      {phase.name}
                    </CardTitle>
                    <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                      {phase.description}
                    </p>
                  </div>
                  <div className="shrink-0 text-2xl font-semibold tabular-nums text-foreground">
                    {pct}%
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <ProgressBar percent={pct} />
                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm tabular-nums">
                    <span className="text-muted-foreground">{done}/{total} done</span>
                    {blocked > 0 && (
                      <span className="text-destructive">{blocked} bloqueada{blocked > 1 ? "s" : ""}</span>
                    )}
                    {overdue > 0 && (
                      <span className="text-warn">{overdue} atrasada{overdue > 1 ? "s" : ""}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <Separator />

        {/* LO CRÍTICO HOY */}
        <section className="flex flex-col gap-3">
          <SectionTitle icon={<Flame className="size-4 text-destructive" />}>
            Lo crítico hoy
          </SectionTitle>
          {criticalToday.length === 0 ? (
            <EmptyState>Nada crítico hoy. Buen día para avanzar lo siguiente.</EmptyState>
          ) : (
            <div className="flex flex-col gap-2">
              {criticalToday.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  today={today}
                  onClick={() => setActiveTaskId(task.id)}
                  taskById={taskById}
                />
              ))}
            </div>
          )}
        </section>

        {/* MI CHECKLIST */}
        {currentAssignee && (
          <section className="flex flex-col gap-3">
            <SectionTitle icon={<Zap className="size-4 text-primary" />}>
              Mi checklist · {currentName}
            </SectionTitle>
            <div className="text-sm tabular-nums text-muted-foreground">
              {myDone}/{myTotal} completadas · {myTasks.length} pendientes
            </div>
            {myTasks.length === 0 ? (
              <EmptyState>Todo limpio por aquí.</EmptyState>
            ) : (
              <div className="flex flex-col gap-2">
                {myTasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    today={today}
                    onClick={() => setActiveTaskId(task.id)}
                    taskById={taskById}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* BLOQUEOS ACTIVOS */}
        {blockedActive.length > 0 && (
          <section className="flex flex-col gap-3">
            <SectionTitle icon={<Lock className="size-4 text-destructive" />}>
              Bloqueos activos
            </SectionTitle>
            <div className="flex flex-col gap-2">
              {blockedActive.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  today={today}
                  onClick={() => setActiveTaskId(task.id)}
                  taskById={taskById}
                />
              ))}
            </div>
          </section>
        )}
      </PageContainer>

      <TaskDetailSheet
        task={activeTask}
        taskById={taskById}
        open={!!activeTask}
        onOpenChange={(o) => !o && setActiveTaskId(null)}
        onSelectTask={(id) => setActiveTaskId(id)}
        onChangeStatus={async (id, status) => {
          const updated = await misionService.setStatus(id, status)
          setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)))
        }}
        onToggleInProgress={async (id, value) => {
          const updated = await misionService.toggleInProgress(id, value)
          setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)))
        }}
      />
    </>
  )
}

function Stat({
  label,
  value,
  warn,
}: {
  label: string
  value: string
  warn?: boolean
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="truncate text-sm text-muted-foreground">{label}</span>
      <span
        className={cn(
          "text-3xl leading-none font-semibold tabular-nums md:text-4xl",
          warn ? "text-warn" : "text-foreground"
        )}
      >
        {value}
      </span>
    </div>
  )
}

/* La barra de progreso va en el verde de marca. Antes iba en blanco roto
 * (bg-foreground), que es el acento del brandkit anterior. */
function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div
        className="h-full bg-primary transition-all"
        style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
      />
    </div>
  )
}

function SectionTitle({
  children,
  icon,
}: {
  children: React.ReactNode
  icon?: React.ReactNode
}) {
  return (
    <h2 className="flex items-center gap-2 font-heading text-[17px] font-semibold text-foreground">
      {icon}
      {children}
    </h2>
  )
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[120px] items-center justify-center rounded-lg border border-dashed border-border bg-card px-6 py-6 text-center text-[15px] text-muted-foreground">
      {children}
    </div>
  )
}

function TaskRow({
  task,
  today,
  onClick,
  taskById,
}: {
  task: MisionTask
  today: string
  onClick: () => void
  taskById: Map<string, MisionTask>
}) {
  const overdue = isOverdue(task, today)
  const pendingDeps = task.dependsOn.filter((depId) => {
    const dep = taskById.get(depId)
    return dep && dep.status !== "done"
  })

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex min-h-16 items-center gap-3 rounded-lg border border-border bg-card p-3 text-left transition active:bg-muted md:p-4 md:hover:border-foreground/40"
    >
      {task.isInProgress && (
        <span className="size-2 shrink-0 animate-pulse rounded-full bg-primary" />
      )}

      <Avatar className="size-9 shrink-0 border border-border bg-muted">
        <AvatarFallback className="bg-transparent text-sm font-semibold">
          {ASSIGNEE_INITIALS[task.assignee]}
        </AvatarFallback>
      </Avatar>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="line-clamp-2 text-[15px] font-medium text-foreground">
          {task.title}
        </span>
        <div className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
          <Badge variant="outline" className={cn("h-5 border", PRIORITY_COLORS[task.priority])}>
            {task.priority}
          </Badge>
          <Badge variant="outline" className={cn("h-5 border", STATUS_COLORS[task.status])}>
            {STATUS_LABELS[task.status]}
          </Badge>
          {task.launchBlock && (
            <Badge variant="outline" className="h-5 border-border text-muted-foreground">
              {task.launchBlock}
            </Badge>
          )}
          {task.dueDate && (
            <span className={cn("flex items-center gap-1 tabular-nums", overdue && "text-warn")}>
              <Calendar className="size-3" />
              {formatDateShort(task.dueDate)}
              {overdue && " · atrasada"}
            </span>
          )}
          {pendingDeps.length > 0 && (
            <span className="flex items-center gap-1 tabular-nums text-destructive">
              <Lock className="size-3" />
              {pendingDeps.length} dep
            </span>
          )}
        </div>
      </div>

      <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
    </button>
  )
}
