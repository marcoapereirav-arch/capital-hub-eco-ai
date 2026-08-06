"use client"

import { Fragment, useEffect, useState } from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

type NavSection = { href: string; label: string; group: string }
type MatrixData = {
  sections: NavSection[]
  roles: string[]
  allowed: Record<string, string[]>
}

/**
 * Matriz rol x seccion del nav. Click en la casilla → PUT inmediato.
 * Optimistic UI: se marca en local y se revierte si la API falla.
 *
 * En TELEFONO no es una tabla. Una tabla de 6 roles necesita unos 600 puntos de
 * ancho, y el marco del OS recorta lo que se sale: las columnas de la derecha
 * no se perdian de vista, DESAPARECIAN. Aqui cada seccion es una ficha con sus
 * roles como botones de 44 puntos. La tabla vuelve a partir de md:.
 */
export function RolePermissionsMatrix() {
  const [data, setData] = useState<MatrixData | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setErr(null)
    try {
      const res = await fetch("/api/admin/role-permissions")
      const j = await res.json()
      if (!res.ok) throw new Error(j.error ?? "Error")
      setData(j)
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function toggle(role: string, route_href: string, enabled: boolean) {
    if (!data) return
    const key = `${role}|${route_href}`
    setSavingKey(key)
    // Optimistic
    setData((prev) => {
      if (!prev) return prev
      const set = new Set(prev.allowed[role] ?? [])
      if (enabled) set.add(route_href)
      else set.delete(route_href)
      return { ...prev, allowed: { ...prev.allowed, [role]: Array.from(set) } }
    })
    try {
      const res = await fetch("/api/admin/role-permissions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, route_href, enabled }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error ?? "Error")
      }
    } catch (e) {
      setErr((e as Error).message)
      // Rollback
      await load()
    } finally {
      setSavingKey(null)
    }
  }

  if (loading) {
    return (
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground">Permisos por rol</h2>
        <div className="py-4 text-[15px] text-muted-foreground">Cargando matriz…</div>
      </section>
    )
  }
  if (!data) return null

  // Agrupar sections por group
  const groups = new Map<string, NavSection[]>()
  for (const s of data.sections) {
    const arr = groups.get(s.group) ?? []
    arr.push(s)
    groups.set(s.group, arr)
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold text-muted-foreground">
          Permisos por rol — matriz editable
        </h2>
        <span className="text-sm text-muted-foreground">
          super_admin tiene acceso a todo · checkboxes guardan al instante
        </span>
      </div>

      {err && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-[15px] text-destructive">
          {err}
        </div>
      )}

      {/* TELEFONO: una ficha por seccion */}
      <div className="space-y-4 md:hidden">
        {Array.from(groups.entries()).map(([groupName, sections]) => (
          <div key={groupName} className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground">{groupName}</h3>
            {sections.map((sec) => (
              <div key={sec.href} className="rounded-lg border border-border bg-card p-3">
                <div className="text-[15px] font-medium text-foreground">{sec.label}</div>
                <div className="mt-0.5 text-sm break-all text-muted-foreground">{sec.href}</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {data.roles.map((role) => {
                    const isOn = (data.allowed[role] ?? []).includes(sec.href)
                    const isSaving = savingKey === `${role}|${sec.href}`
                    return (
                      <button
                        key={role}
                        onClick={() => toggle(role, sec.href, !isOn)}
                        disabled={isSaving}
                        aria-pressed={isOn}
                        className={cn(
                          "inline-flex h-11 items-center gap-1.5 rounded-lg border px-3 text-[15px] transition-colors",
                          isOn
                            ? "border-primary/50 bg-primary/10 font-semibold text-primary"
                            : "border-border text-muted-foreground",
                          isSaving && "opacity-50",
                        )}
                      >
                        {isOn && <Check className="size-4" />}
                        {role}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* ESCRITORIO: la tabla, con su propio desplazamiento lateral */}
      <div className="hidden overflow-x-auto rounded-lg border border-border md:block">
        <table className="w-full text-sm">
          <thead className="sticky top-0 border-b border-border bg-card">
            <tr>
              <th className="sticky left-0 z-10 bg-card px-3 py-2 text-left text-sm font-semibold text-muted-foreground md:min-w-[200px]">
                Sección del nav
              </th>
              {data.roles.map((role) => (
                <th key={role} className="px-3 py-2 text-center text-sm whitespace-nowrap">
                  <span className="inline-block rounded-lg border border-border px-2 py-0.5 text-foreground">
                    {role}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from(groups.entries()).map(([groupName, sections]) => (
              <Fragment key={groupName}>
                <tr className="border-y border-border bg-muted/40">
                  <td colSpan={data.roles.length + 1} className="px-3 py-1.5 text-sm font-semibold text-muted-foreground">
                    {groupName}
                  </td>
                </tr>
                {sections.map((sec) => (
                  <tr key={sec.href} className="border-b border-border">
                    <td className="sticky left-0 z-10 bg-background px-3 py-2">
                      <div className="text-sm text-foreground">{sec.label}</div>
                      <div className="text-sm text-muted-foreground">{sec.href}</div>
                    </td>
                    {data.roles.map((role) => {
                      const isOn = (data.allowed[role] ?? []).includes(sec.href)
                      const isSaving = savingKey === `${role}|${sec.href}`
                      return (
                        <td key={role} className="px-3 py-2 text-center">
                          <button
                            onClick={() => toggle(role, sec.href, !isOn)}
                            disabled={isSaving}
                            aria-pressed={isOn}
                            className={cn(
                              "inline-flex size-11 items-center justify-center rounded-lg border transition-colors md:size-8",
                              isOn
                                ? "border-primary/60 bg-primary/20 text-primary"
                                : "border-border text-transparent hover:border-foreground/40",
                              isSaving && "opacity-40",
                            )}
                            title={isOn ? "Click para quitar acceso" : "Click para dar acceso"}
                          >
                            {isOn ? <Check className="size-4" /> : null}
                          </button>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-sm text-muted-foreground">
        Los cambios se aplican al siguiente refresh del usuario afectado. Super_admin / admin
        siempre tienen acceso completo (no aparecen en la matriz).
      </p>
    </section>
  )
}
