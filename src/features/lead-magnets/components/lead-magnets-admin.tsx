"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Plus, Power, Pencil, Trash2, Tag } from "lucide-react"
import { PageContainer } from "@/components/ui/page-container"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import {
  createLeadMagnet,
  updateLeadMagnet,
  toggleLeadMagnetActive,
  deleteLeadMagnet,
} from "../actions"
import type { LeadMagnetWithStats, LeadMagnetDeliveryKind } from "../types"

type Mode = { kind: "list" } | { kind: "create" } | { kind: "edit"; lm: LeadMagnetWithStats }

export function LeadMagnetsAdmin({
  initialList,
}: {
  initialList: LeadMagnetWithStats[]
}) {
  const [mode, setMode] = useState<Mode>({ kind: "list" })
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function handleClose() {
    setMode({ kind: "list" })
    router.refresh()
  }

  return (
    <>
      <PageContainer>
        {/* En telefono el titulo y la accion se apilan: en una sola fila el boton
            se salia por la derecha y el subtitulo quedaba partido. */}
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-foreground md:text-xl">Lead Magnets</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {initialList.length} {initialList.length === 1 ? "recurso" : "recursos"} ·{" "}
              {initialList.filter((lm) => lm.active).length} activos
            </p>
          </div>
          <Button
            onClick={() => setMode({ kind: "create" })}
            className="w-full shrink-0 md:w-auto"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Nuevo
          </Button>
        </div>

        {initialList.length === 0 ? (
          <EmptyState onCreate={() => setMode({ kind: "create" })} />
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {initialList.map((lm) => (
              <LeadMagnetCard
                key={lm.id}
                lm={lm}
                pending={pending}
                onEdit={() => setMode({ kind: "edit", lm })}
                onToggle={() =>
                  startTransition(async () => {
                    await toggleLeadMagnetActive(lm.id, !lm.active)
                    router.refresh()
                  })
                }
                onDelete={() =>
                  startTransition(async () => {
                    if (!confirm(`¿Borrar "${lm.name}"? Esto solo funciona si NO tiene opt-ins registrados.`)) return
                    const res = await deleteLeadMagnet(lm.id)
                    if (!res.ok) alert(res.error ?? "Error al borrar")
                    router.refresh()
                  })
                }
              />
            ))}
          </div>
        )}
      </PageContainer>

      {/* Formulario en hoja inferior */}
      {mode.kind !== "list" && (
        <LeadMagnetForm
          initial={mode.kind === "edit" ? mode.lm : null}
          onClose={handleClose}
        />
      )}
    </>
  )
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 px-6 py-10 text-center">
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card">
        <Tag className="h-5 w-5 text-muted-foreground" />
      </span>
      <h2 className="text-[17px] font-semibold text-foreground">Aún no tienes lead magnets</h2>
      <p className="max-w-[38ch] text-[15px] text-muted-foreground">
        Los lead magnets capturan emails desde comentarios de Instagram. Crea el primero.
      </p>
      <Button onClick={onCreate}>
        <Plus className="mr-1.5 h-4 w-4" />
        Crear el primero
      </Button>
    </div>
  )
}

function LeadMagnetCard({
  lm,
  pending,
  onEdit,
  onToggle,
  onDelete,
}: {
  lm: LeadMagnetWithStats
  pending: boolean
  onEdit: () => void
  onToggle: () => void
  onDelete: () => void
}) {
  const conversionRate =
    lm.leads_total > 0 ? Math.round((lm.converted_to_trial_total / lm.leads_total) * 100) : 0

  return (
    <article
      className={cn(
        "relative flex flex-col gap-3 rounded-lg border border-border p-4 transition-opacity",
        lm.active ? "bg-card" : "bg-card/40 opacity-60",
      )}
    >
      {/* Header */}
      <header>
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 flex-1 text-[15px] font-semibold text-foreground">{lm.name}</h3>
          <span
            className={cn(
              "shrink-0 rounded-sm border px-2 py-0.5 text-sm font-semibold",
              lm.active
                ? "border-primary/30 bg-primary/10 text-primary"
                : "border-border bg-muted text-muted-foreground",
            )}
          >
            {lm.active ? "Activo" : "Pausado"}
          </span>
        </div>
        <p className="mt-1 truncate text-sm text-muted-foreground">/lm/{lm.slug}</p>
      </header>

      {/* Keywords */}
      {lm.manychat_keywords.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {lm.manychat_keywords.map((kw) => (
            <span
              key={kw}
              className="inline-flex items-center gap-1 rounded-sm border border-border bg-background px-1.5 py-0.5 text-sm text-muted-foreground"
            >
              <Tag className="h-3 w-3" />
              {kw}
            </span>
          ))}
        </div>
      )}

      {/* Stats: dos columnas en telefono, tres en escritorio. A tres columnas en
          375 puntos cada cifra sale a 100 y la etiqueta se parte. */}
      <dl className="grid grid-cols-2 gap-2 border-t border-border pt-3 md:grid-cols-3">
        <div>
          <dt className="text-sm text-muted-foreground">Opt-ins</dt>
          <dd className="text-base font-semibold tabular-nums text-foreground">{lm.optins_total}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Abiertos</dt>
          <dd className="text-base font-semibold tabular-nums text-foreground">{lm.opens_total}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">→ Trial</dt>
          <dd className="text-base font-semibold tabular-nums text-foreground">
            {lm.converted_to_trial_total}
            <span className="ml-1 text-sm font-normal text-muted-foreground">({conversionRate}%)</span>
          </dd>
        </div>
      </dl>

      {/* Actions */}
      <div className="flex items-center gap-2 border-t border-border pt-3">
        <Button variant="outline" onClick={onEdit} disabled={pending}>
          <Pencil className="mr-1.5 h-4 w-4" />
          Editar
        </Button>
        <Button
          variant="outline"
          onClick={onToggle}
          disabled={pending}
          title={lm.active ? "Pausar" : "Activar"}
        >
          <Power className="mr-1.5 h-4 w-4" />
          {lm.active ? "Pausar" : "Activar"}
        </Button>
        <Button
          variant="destructive"
          size="icon"
          onClick={onDelete}
          disabled={pending}
          aria-label={`Borrar ${lm.name}`}
          className="ml-auto"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </article>
  )
}

function LeadMagnetForm({
  initial,
  onClose,
}: {
  initial: LeadMagnetWithStats | null
  onClose: () => void
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    slug: initial?.slug ?? "",
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    delivery_kind: (initial?.delivery_kind ?? "dynamic") as LeadMagnetDeliveryKind,
    delivery_asset_url: initial?.delivery_asset_url ?? "",
    delivery_route: initial?.delivery_route ?? "",
    manychat_keywords: (initial?.manychat_keywords ?? []).join(", "),
    active: initial?.active ?? true,
  })

  const isEdit = initial != null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const keywords = form.manychat_keywords
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean)

    const payload = {
      ...(isEdit && { id: initial!.id }),
      slug: form.slug,
      name: form.name,
      description: form.description || null,
      delivery_kind: form.delivery_kind,
      delivery_asset_url: form.delivery_kind === "static" ? form.delivery_asset_url : null,
      delivery_route: form.delivery_kind === "dynamic" ? form.delivery_route : null,
      manychat_keywords: keywords,
      active: form.active,
    }

    startTransition(async () => {
      const res = isEdit
        ? await updateLeadMagnet(payload)
        : await createLeadMagnet(payload)
      if (res.ok) {
        onClose()
      } else {
        setError(res.error ?? "Error desconocido")
      }
    })
  }

  return (
    <Sheet
      open
      onOpenChange={(abierto) => {
        if (!abierto) onClose()
      }}
    >
      <SheetContent
        side="bottom"
        aria-describedby={undefined}
        className={cn(
          "rounded-t-xl",
          // Se repite la condicion del lado porque las clases del kit (`data-[side=bottom]:...`)
          // pesan mas que un `md:` suelto; sin repetirla el cajon sale por la izquierda.
          "md:data-[side=bottom]:inset-y-0 md:right-0 md:data-[side=bottom]:left-auto md:data-[side=bottom]:h-full md:data-[side=bottom]:max-h-none md:w-full md:max-w-lg md:border-l md:pb-0",
        )}
      >
        <div className="mx-auto mt-1 h-1 w-10 rounded-full bg-border md:hidden" />
        <SheetHeader>
          <SheetTitle className="text-[17px] font-semibold">
            {isEdit ? "Editar lead magnet" : "Nuevo lead magnet"}
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="flex flex-col gap-4 px-4 pb-4">
            <Field label="Nombre">
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Test Vocacional Digital"
                required
                minLength={2}
                maxLength={120}
                enterKeyHint="next"
              />
            </Field>

            <Field label="Slug" hint="Solo minúsculas, números y guiones. Aparece en /lm/<slug>">
              <Input
                value={form.slug}
                onChange={(e) =>
                  setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })
                }
                placeholder="test-vocacional"
                required
                pattern="[a-z0-9-]+"
                disabled={isEdit}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
              />
            </Field>

            <Field label="Descripción" hint="Aparece en la página /lm/<slug>">
              <Textarea
                value={form.description ?? ""}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                placeholder="Descubre qué profesión digital encaja con tu perfil..."
                className="resize-none"
              />
            </Field>

            <Field label="Tipo de entrega">
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <RadioOption
                  checked={form.delivery_kind === "dynamic"}
                  onChange={() => setForm({ ...form, delivery_kind: "dynamic" })}
                  label="Dinámico"
                  hint="Quiz / herramienta interactiva"
                />
                <RadioOption
                  checked={form.delivery_kind === "static"}
                  onChange={() => setForm({ ...form, delivery_kind: "static" })}
                  label="Estático"
                  hint="PDF / imagen / link directo"
                />
              </div>
            </Field>

            {form.delivery_kind === "dynamic" ? (
              <Field
                label="Ruta interna"
                hint="ej: /lm/test-vocacional/quiz — la página dinámica que construyes en código"
              >
                <Input
                  value={form.delivery_route}
                  onChange={(e) => setForm({ ...form, delivery_route: e.target.value })}
                  placeholder="/lm/test-vocacional/quiz"
                  required
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                />
              </Field>
            ) : (
              <Field
                label="URL del recurso"
                hint="URL del PDF/imagen en Storage o link externo"
              >
                <Input
                  type="url"
                  inputMode="url"
                  value={form.delivery_asset_url}
                  onChange={(e) => setForm({ ...form, delivery_asset_url: e.target.value })}
                  placeholder="https://..."
                  required
                />
              </Field>
            )}

            <Field
              label="Keywords ManyChat"
              hint="Separadas por coma. La keyword del comentario IG que activa este LM. Ej: TEST, test vocacional"
            >
              <Input
                value={form.manychat_keywords}
                onChange={(e) => setForm({ ...form, manychat_keywords: e.target.value })}
                placeholder="TEST, test vocacional"
              />
            </Field>

            <label className="flex min-h-11 cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
                className="h-5 w-5 rounded-sm border-border bg-background accent-primary"
              />
              <span className="text-[15px] text-foreground">Activo (recibe opt-ins)</span>
            </label>

            {error && (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
          </div>

          {/* Pegada abajo DENTRO de la hoja, para que el teclado no la tape. */}
          <div className="sticky bottom-0 z-10 flex items-center justify-end gap-2 border-t border-border bg-popover px-4 py-3 pb-safe-4 md:pb-3">
            <Button type="button" variant="secondary" onClick={onClose} disabled={pending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Guardando..." : isEdit ? "Guardar" : "Crear"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <span className="mb-1.5 block text-sm font-semibold text-muted-foreground">{label}</span>
      {children}
      {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
    </div>
  )
}

function RadioOption({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean
  onChange: () => void
  label: string
  hint: string
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      aria-pressed={checked}
      className={cn(
        "flex min-h-11 flex-1 flex-col items-start justify-center gap-0.5 rounded-lg border p-3 text-left transition-colors",
        checked
          ? "border-primary bg-primary/10"
          : "border-border bg-background active:bg-secondary md:hover:bg-secondary",
      )}
    >
      <span className="text-[15px] font-medium text-foreground">{label}</span>
      <span className="text-sm text-muted-foreground">{hint}</span>
    </button>
  )
}
