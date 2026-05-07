"use client"

import { useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import {
  Rocket,
  Flame,
  Lock,
  CheckCircle2,
  Zap,
  Clock,
  Calendar,
  ArrowRight,
  AlertTriangle,
} from "lucide-react"
import {
  ASSIGNEE_INITIALS,
  ASSIGNEE_LABELS,
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
import type { GTDStatus } from "@/features/tasks/types/task"

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
      <div className="flex flex-col gap-6 p-4 pb-mobile-nav md:gap-8 md:p-6">
        {/* HEADER MISIÓN + COUNTDOWN */}
        <section>
          <Card className="border-border bg-card">
            <CardContent className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between md:p-8">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  <Rocket className="h-3.5 w-3.5" />
                  Misión
                </div>
                <h1 className="font-heading text-2xl font-medium uppercase leading-tight tracking-[0.05em] text-foreground md:text-4xl">
                  Producto Terminado
                </h1>
                <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground md:text-sm">
                  Capital Hub on point · 31 May 2026
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
                <Stat label="Días restantes" value={String(daysLeft)} accent />
                <Stat label="% Progreso" value={`${globalProgress}%`} />
                <Stat
                  label="Atrasadas"
                  value={String(overdueCount)}
                  warn={overdueCount > 0}
                />
              </div>
            </CardContent>

            <div className="px-6 pb-6 md:px-8 md:pb-8">
              <ProgressBar percent={globalProgress} />
              <div className="mt-2 flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
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
                    <div className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                      Fase {phase.order} · {formatDateShort(phase.targetDate)}
                    </div>
                    <CardTitle className="mt-1 font-heading text-base font-medium uppercase tracking-[0.05em] text-foreground">
                      {phase.name}
                    </CardTitle>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                      {phase.description}
                    </p>
                  </div>
                  <div className="font-mono text-2xl font-medium text-foreground">
                    {pct}%
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <ProgressBar percent={pct} />
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-mono uppercase tracking-wider">
                    <span className="text-muted-foreground">{done}/{total} done</span>
                    {blocked > 0 && (
                      <span className="text-red-300">{blocked} bloqueada{blocked > 1 ? "s" : ""}</span>
                    )}
                    {overdue > 0 && (
                      <span className="text-orange-300">{overdue} atrasada{overdue > 1 ? "s" : ""}</span>
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
          <SectionTitle icon={<Flame className="h-3.5 w-3.5 text-red-400" />}>
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
            <SectionTitle icon={<Zap className="h-3.5 w-3.5 text-blue-300" />}>
              Mi checklist · {currentName}
            </SectionTitle>
            <div className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
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
            <SectionTitle icon={<Lock className="h-3.5 w-3.5 text-red-300" />}>
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
      </div>

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
  accent,
  warn,
}: {
  label: string
  value: string
  accent?: boolean
  warn?: boolean
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <span
        className={cn(
          "font-mono text-3xl font-medium leading-none md:text-4xl",
          accent && "text-foreground",
          warn && "text-orange-300",
          !accent && !warn && "text-foreground"
        )}
      >
        {value}
      </span>
    </div>
  )
}

function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div
        className="h-full bg-foreground transition-all"
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
    <h2 className="flex items-center gap-2 font-heading text-sm font-medium uppercase tracking-[0.15em] text-foreground">
      {icon}
      {children}
    </h2>
  )
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-dashed border-border bg-card/40 p-6 text-center text-xs text-muted-foreground">
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
      className="group flex min-h-[64px] items-center gap-3 rounded-md border border-border bg-card p-3 text-left transition hover:border-foreground/40 active:scale-[0.99] md:p-4"
    >
      {task.isInProgress && (
        <span className="size-2 shrink-0 animate-pulse rounded-full bg-cyan-300" />
      )}

      <Avatar className="size-9 shrink-0 border border-border bg-muted">
        <AvatarFallback className="bg-transparent font-mono text-[10px] uppercase">
          {ASSIGNEE_INITIALS[task.assignee]}
        </AvatarFallback>
      </Avatar>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-start gap-2">
          <span className="line-clamp-2 text-sm font-medium text-foreground">
            {task.title}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          <Badge
            variant="outline"
            className={cn("h-5 border", PRIORITY_COLORS[task.priority])}
          >
            {task.priority}
          </Badge>
          <Badge
            variant="outline"
            className={cn("h-5 border", STATUS_COLORS[task.status])}
          >
            {STATUS_LABELS[task.status]}
          </Badge>
          {task.launchBlock && (
            <Badge variant="outline" className="h-5 border-border text-muted-foreground">
              {task.launchBlock}
            </Badge>
          )}
          {task.dueDate && (
            <span
              className={cn(
                "flex items-center gap-1",
                overdue && "text-orange-300"
              )}
            >
              <Calendar className="size-3" />
              {formatDateShort(task.dueDate)}
              {overdue && " · atrasada"}
            </span>
          )}
          {pendingDeps.length > 0 && (
            <span className="flex items-center gap-1 text-red-300">
              <Lock className="size-3" />
              {pendingDeps.length} dep
            </span>
          )}
        </div>
      </div>

      <ArrowRight className="size-4 shrink-0 text-muted-foreground/60 group-hover:text-foreground" />
    </button>
  )
}

function TaskDetailSheet({
  task,
  taskById,
  open,
  onOpenChange,
  onSelectTask,
  onChangeStatus,
  onToggleInProgress,
}: {
  task: MisionTask | null
  taskById: Map<string, MisionTask>
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectTask: (id: string) => void
  onChangeStatus: (id: string, status: GTDStatus) => Promise<void>
  onToggleInProgress: (id: string, value: boolean) => Promise<void>
}) {
  if (!task) return null

  const dependencies = task.dependsOn
    .map((id) => taskById.get(id))
    .filter((t): t is MisionTask => !!t)

  const unblocks = Array.from(taskById.values()).filter((t) =>
    t.dependsOn.includes(task.id)
  )

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[90dvh] overflow-y-auto bg-card pb-safe md:max-h-[85dvh]"
      >
        <SheetHeader className="text-left">
          <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
            {task.launchBlock && <span>Bloque {task.launchBlock}</span>}
            <span>·</span>
            <span>{ASSIGNEE_LABELS[task.assignee]}</span>
          </div>
          <SheetTitle className="font-heading text-lg font-medium leading-tight">
            {task.title}
          </SheetTitle>
          {task.description && (
            <SheetDescription className="text-sm leading-relaxed text-muted-foreground">
              {task.description}
            </SheetDescription>
          )}
        </SheetHeader>

        <div className="flex flex-col gap-4 px-4 pb-6 md:px-6">
          <div className="flex flex-wrap gap-2">
            <Badge
              variant="outline"
              className={cn("border", PRIORITY_COLORS[task.priority])}
            >
              prioridad: {task.priority}
            </Badge>
            <Badge
              variant="outline"
              className={cn("border", STATUS_COLORS[task.status])}
            >
              {STATUS_LABELS[task.status]}
            </Badge>
            {task.dueDate && (
              <Badge variant="outline" className="border-border">
                <Calendar className="mr-1 size-3" />
                {formatDateShort(task.dueDate)}
              </Badge>
            )}
            {task.isInProgress && (
              <Badge variant="outline" className="border-cyan-500/40 text-cyan-300">
                en curso
              </Badge>
            )}
          </div>

          <Separator />

          <div className="flex flex-col gap-2">
            <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              Cambiar estado
            </span>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              <ActionButton
                icon={<Zap className="size-4" />}
                label="En curso"
                active={task.isInProgress}
                onClick={() => onToggleInProgress(task.id, !task.isInProgress)}
              />
              <ActionButton
                icon={<Clock className="size-4" />}
                label="Bloquear"
                active={task.status === "waiting"}
                onClick={() => onChangeStatus(task.id, "waiting")}
              />
              <ActionButton
                icon={<CheckCircle2 className="size-4" />}
                label="Completar"
                active={task.status === "done"}
                onClick={() => onChangeStatus(task.id, "done")}
              />
              <ActionButton
                icon={<ArrowRight className="size-4" />}
                label="Pendiente"
                active={task.status === "next" && !task.isInProgress}
                onClick={() => onChangeStatus(task.id, "next")}
              />
            </div>
          </div>

          {dependencies.length > 0 && (
            <>
              <Separator />
              <div className="flex flex-col gap-2">
                <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                  Depende de
                </span>
                {dependencies.map((dep) => (
                  <DependencyRow
                    key={dep.id}
                    task={dep}
                    onClick={() => onSelectTask(dep.id)}
                  />
                ))}
              </div>
            </>
          )}

          {unblocks.length > 0 && (
            <>
              <Separator />
              <div className="flex flex-col gap-2">
                <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                  Al completar, desbloquea
                </span>
                {unblocks.map((dep) => (
                  <DependencyRow
                    key={dep.id}
                    task={dep}
                    onClick={() => onSelectTask(dep.id)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

function ActionButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      className={cn(
        "min-h-[44px] justify-start gap-2 border-border text-xs",
        active && "border-foreground bg-foreground text-background hover:bg-foreground/90"
      )}
    >
      {icon}
      {label}
    </Button>
  )
}

function DependencyRow({ task, onClick }: { task: MisionTask; onClick: () => void }) {
  const done = task.status === "done"
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[44px] items-center gap-3 rounded-md border border-border bg-muted/30 p-2 text-left transition hover:border-foreground/40"
    >
      {done ? (
        <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
      ) : task.status === "waiting" ? (
        <AlertTriangle className="size-4 shrink-0 text-red-300" />
      ) : (
        <Lock className="size-4 shrink-0 text-muted-foreground" />
      )}
      <div className="min-w-0 flex-1">
        <div className="line-clamp-1 text-xs font-medium">{task.title}</div>
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {ASSIGNEE_LABELS[task.assignee]} · {STATUS_LABELS[task.status]}
        </div>
      </div>
    </button>
  )
}
