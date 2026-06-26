"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Plus, Power, Pencil, Trash2, ExternalLink, Tag } from "lucide-react"
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
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border px-4 py-3 md:px-6 md:py-4">
        <div>
          <h1 className="font-heading text-lg font-semibold text-foreground md:text-xl">
            Lead Magnets
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground md:text-sm">
            {initialList.length} {initialList.length === 1 ? "recurso" : "recursos"} ·{" "}
            {initialList.filter((lm) => lm.active).length} activos
          </p>
        </div>
        <button
          type="button"
          onClick={() => setMode({ kind: "create" })}
          className="inline-flex h-9 items-center gap-1.5 rounded-md bg-foreground px-3 text-xs font-medium text-background transition-opacity hover:opacity-90 md:h-10 md:px-4 md:text-sm"
        >
          <Plus className="h-3.5 w-3.5 md:h-4 md:w-4" />
          Nuevo
        </button>
      </header>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 pb-mobile-nav md:p-6">
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
      </div>

      {/* Form modal */}
      {mode.kind !== "list" && (
        <LeadMagnetForm
          initial={mode.kind === "edit" ? mode.lm : null}
          onClose={handleClose}
        />
      )}
    </div>
  )
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card">
        <Tag className="h-5 w-5 text-muted-foreground" />
      </div>
      <h2 className="font-heading text-lg font-semibold text-foreground">
        Aún no tienes lead magnets
      </h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Los lead magnets capturan emails desde comentarios de Instagram. Crea el primero.
      </p>
      <button
        type="button"
        onClick={onCreate}
        className="mt-6 inline-flex h-10 items-center gap-1.5 rounded-md bg-foreground px-4 text-sm font-medium text-background transition-opacity hover:opacity-90"
      >
        <Plus className="h-4 w-4" />
        Crear el primero
      </button>
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
      className={`relative flex flex-col gap-3 rounded-lg border p-4 transition-opacity ${
        lm.active
          ? "border-border bg-card"
          : "border-border bg-card/40 opacity-60"
      }`}
    >
      {/* Header */}
      <header>
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-heading text-sm font-semibold text-foreground">{lm.name}</h3>
          <span
            className={`shrink-0 rounded-sm border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wide ${
              lm.active
                ? "border-green-500/30 bg-green-500/10 text-green-300"
                : "border-zinc-500/30 bg-zinc-500/10 text-zinc-400"
            }`}
          >
            {lm.active ? "Activo" : "Pausado"}
          </span>
        </div>
        <p className="mt-1 truncate font-mono text-[10px] text-muted-foreground/70">
          /lm/{lm.slug}
        </p>
      </header>

      {/* Keywords */}
      {lm.manychat_keywords.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {lm.manychat_keywords.map((kw) => (
            <span
              key={kw}
              className="inline-flex items-center gap-1 rounded-sm border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-muted-foreground"
            >
              <Tag className="h-2.5 w-2.5" />
              {kw}
            </span>
          ))}
        </div>
      )}

      {/* Stats */}
      <dl className="grid grid-cols-3 gap-2 border-t border-border pt-3">
        <div>
          <dt className="font-mono text-[9px] uppercase tracking-wide text-muted-foreground/60">
            Opt-ins
          </dt>
          <dd className="font-heading text-base font-semibold text-foreground">{lm.optins_total}</dd>
        </div>
        <div>
          <dt className="font-mono text-[9px] uppercase tracking-wide text-muted-foreground/60">
            Abiertos
          </dt>
          <dd className="font-heading text-base font-semibold text-foreground">{lm.opens_total}</dd>
        </div>
        <div>
          <dt className="font-mono text-[9px] uppercase tracking-wide text-muted-foreground/60">
            → Trial
          </dt>
          <dd className="font-heading text-base font-semibold text-foreground">
            {lm.converted_to_trial_total}
            <span className="ml-1 text-[10px] font-normal text-muted-foreground/70">
              ({conversionRate}%)
            </span>
          </dd>
        </div>
      </dl>

      {/* Actions */}
      <div className="flex items-center gap-1 border-t border-border pt-3">
        <button
          type="button"
          onClick={onEdit}
          disabled={pending}
          className="inline-flex h-8 items-center gap-1 rounded-sm border border-border px-2 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50"
        >
          <Pencil className="h-3 w-3" />
          Editar
        </button>
        <button
          type="button"
          onClick={onToggle}
          disabled={pending}
          className="inline-flex h-8 items-center gap-1 rounded-sm border border-border px-2 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50"
          title={lm.active ? "Pausar" : "Activar"}
        >
          <Power className="h-3 w-3" />
          {lm.active ? "Pausar" : "Activar"}
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={pending}
          className="ml-auto inline-flex h-8 items-center gap-1 rounded-sm border border-red-500/30 px-2 text-xs text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-50"
        >
          <Trash2 className="h-3 w-3" />
        </button>
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
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 md:items-center"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-t-lg border border-border bg-card md:rounded-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-border px-4 py-3 md:px-6 md:py-4">
          <h2 className="font-heading text-base font-semibold text-foreground">
            {isEdit ? "Editar lead magnet" : "Nuevo lead magnet"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Cerrar
          </button>
        </header>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto">
          <div className="flex flex-col gap-4 p-4 md:p-6">
            <Field label="Nombre">
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Test Vocacional Digital"
                required
                minLength={2}
                maxLength={120}
                className="form-input"
              />
            </Field>

            <Field label="Slug" hint="Solo minúsculas, números y guiones. Aparece en /lm/<slug>">
              <input
                value={form.slug}
                onChange={(e) =>
                  setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })
                }
                placeholder="test-vocacional"
                required
                pattern="[a-z0-9-]+"
                disabled={isEdit}
                className="form-input"
              />
            </Field>

            <Field label="Descripción" hint="Aparece en la página /lm/<slug>">
              <textarea
                value={form.description ?? ""}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                placeholder="Descubre qué profesión digital encaja con tu perfil..."
                className="form-input resize-none"
              />
            </Field>

            <Field label="Tipo de entrega">
              <div className="flex gap-2">
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
                <input
                  value={form.delivery_route}
                  onChange={(e) => setForm({ ...form, delivery_route: e.target.value })}
                  placeholder="/lm/test-vocacional/quiz"
                  required
                  className="form-input"
                />
              </Field>
            ) : (
              <Field
                label="URL del recurso"
                hint="URL del PDF/imagen en Storage o link externo"
              >
                <input
                  type="url"
                  value={form.delivery_asset_url}
                  onChange={(e) => setForm({ ...form, delivery_asset_url: e.target.value })}
                  placeholder="https://..."
                  required
                  className="form-input"
                />
              </Field>
            )}

            <Field
              label="Keywords ManyChat"
              hint="Separadas por coma. La keyword del comentario IG que activa este LM. Ej: TEST, test vocacional"
            >
              <input
                value={form.manychat_keywords}
                onChange={(e) => setForm({ ...form, manychat_keywords: e.target.value })}
                placeholder="TEST, test vocacional"
                className="form-input"
              />
            </Field>

            <label className="inline-flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
                className="h-4 w-4 rounded border-border bg-background"
              />
              <span className="text-sm text-foreground">Activo (recibe opt-ins)</span>
            </label>

            {error && (
              <div className="rounded-sm border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                {error}
              </div>
            )}
          </div>

          <footer className="flex items-center justify-end gap-2 border-t border-border bg-card/60 px-4 py-3 md:px-6">
            <button
              type="button"
              onClick={onClose}
              disabled={pending}
              className="inline-flex h-10 items-center rounded-md border border-border px-4 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex h-10 items-center rounded-md bg-foreground px-4 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {pending ? "Guardando..." : isEdit ? "Guardar" : "Crear"}
            </button>
          </footer>
        </form>
      </div>

      <style jsx>{`
        :global(.form-input) {
          height: 2.5rem;
          width: 100%;
          border-radius: 0.375rem;
          border: 1px solid hsl(var(--border));
          background-color: hsl(var(--background));
          padding: 0 0.75rem;
          font-size: 0.875rem;
          color: hsl(var(--foreground));
        }
        :global(textarea.form-input) {
          height: auto;
          padding: 0.5rem 0.75rem;
        }
        :global(.form-input:focus) {
          outline: none;
          border-color: hsl(var(--foreground));
        }
        :global(.form-input::placeholder) {
          color: hsl(var(--muted-foreground));
          opacity: 0.5;
        }
      `}</style>
    </div>
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
      <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </label>
      {children}
      {hint && (
        <p className="mt-1 text-[11px] text-muted-foreground/70">{hint}</p>
      )}
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
      className={`flex flex-1 flex-col items-start gap-0.5 rounded-md border p-3 text-left transition-colors ${
        checked
          ? "border-foreground bg-foreground/5"
          : "border-border bg-background hover:bg-secondary"
      }`}
    >
      <span className="text-sm font-medium text-foreground">{label}</span>
      <span className="text-[10px] text-muted-foreground">{hint}</span>
    </button>
  )
}
