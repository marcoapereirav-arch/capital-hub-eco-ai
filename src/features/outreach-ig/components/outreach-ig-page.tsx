"use client"

import { useEffect, useState } from "react"
import { Camera, Plus, ExternalLink, Send, ArrowRight, Trash2, X } from "lucide-react"
import { ShellHeader } from "@/features/shell/components/shell-header"
import { cn } from "@/lib/utils"

type Lead = {
  id: string
  ig_username: string
  ig_url: string | null
  full_name: string | null
  notes_assigned: string | null
  closer_assigned: string | null
  status: string
  phone: string | null
  reply_text: string | null
  messaged_at: string | null
  reply_at: string | null
  handed_off_at: string | null
  contact_attempts: number
  created_at: string
}

const STATUSES = [
  { value: "to_contact", label: "Por contactar", color: "border-border/40 text-muted-foreground" },
  { value: "messaged", label: "Enviado DM", color: "border-blue-500/40 text-blue-400" },
  { value: "replied", label: "Respondió", color: "border-amber-500/40 text-amber-400" },
  { value: "phone_got", label: "Tel obtenido", color: "border-cyan-500/40 text-cyan-400" },
  { value: "handed_off", label: "Handoff a closer", color: "border-green-500/40 text-green-400" },
  { value: "discarded", label: "Descartado", color: "border-red-500/40 text-red-400 opacity-50" },
]

export function OutreachIGPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("to_contact")
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Lead | null>(null)

  useEffect(() => { load() }, [statusFilter])

  async function load() {
    setLoading(true)
    try {
      const url = new URL("/api/admin/outreach-ig", window.location.origin)
      if (statusFilter && statusFilter !== "all") url.searchParams.set("status", statusFilter)
      const res = await fetch(url.pathname + url.search).then((r) => r.json())
      setLeads(res.leads ?? [])
    } finally {
      setLoading(false)
    }
  }

  async function updateLead(id: string, patch: Partial<Lead>) {
    await fetch(`/api/admin/outreach-ig/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    })
    load()
  }

  async function deleteLead(id: string) {
    if (!confirm("¿Eliminar este lead?")) return
    await fetch(`/api/admin/outreach-ig/${id}`, { method: "DELETE" })
    load()
  }

  const counts = STATUSES.map((s) => ({
    ...s,
    n: leads.filter((l) => l.status === s.value).length,
  }))

  return (
    <>
      <ShellHeader title="Outreach IG" />

      <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-lg font-semibold flex items-center gap-2">
              <Camera className="h-4 w-4 text-pink-400" />
              Cold Outreach Instagram
            </h1>
            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mt-0.5">
              Bandeja del closer junior para escribir DMs y pedir teléfono
            </p>
          </div>
          <button
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-1 rounded-sm bg-foreground text-background px-3 py-1.5 text-xs font-mono uppercase tracking-wider hover:opacity-90"
          >
            <Plus className="h-3 w-3" /> Añadir lead
          </button>
        </div>

        {/* Status pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setStatusFilter("all")}
            className={cn(
              "text-[10px] font-mono uppercase tracking-wider border px-2 py-1 rounded-sm transition-all",
              statusFilter === "all" ? "bg-foreground text-background border-foreground" : "border-border/40 text-muted-foreground"
            )}
          >
            Todos
          </button>
          {STATUSES.map((s) => {
            const c = counts.find((x) => x.value === s.value)!
            return (
              <button
                key={s.value}
                onClick={() => setStatusFilter(s.value)}
                className={cn(
                  "text-[10px] font-mono uppercase tracking-wider border px-2 py-1 rounded-sm transition-all",
                  statusFilter === s.value ? "bg-foreground text-background border-foreground" : s.color
                )}
              >
                {s.label}{c.n > 0 && <span className="ml-1.5">({c.n})</span>}
              </button>
            )
          })}
        </div>

        {/* Lista */}
        {loading ? (
          <div className="text-center py-12 text-sm text-muted-foreground">Cargando…</div>
        ) : leads.length === 0 ? (
          <div className="text-center py-12 text-sm text-muted-foreground rounded-md border border-dashed border-border">
            Sin leads en este estado.
          </div>
        ) : (
          <div className="rounded-md border border-border/40 divide-y divide-border/40">
            {leads.map((l) => {
              const s = STATUSES.find((x) => x.value === l.status)!
              return (
                <div key={l.id} className="px-3 py-2.5 flex items-center justify-between gap-3 hover:bg-card/40">
                  <button onClick={() => setEditing(l)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                    <div className="h-7 w-7 rounded-full bg-secondary/40 flex items-center justify-center text-[10px] font-mono uppercase shrink-0">
                      @
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm truncate flex items-center gap-2">
                        @{l.ig_username}
                        {l.ig_url && (
                          <a href={l.ig_url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground">
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                      <div className="text-[10px] font-mono text-muted-foreground truncate">
                        {l.full_name && <span>{l.full_name} · </span>}
                        {l.closer_assigned && <span>asignado a {l.closer_assigned} · </span>}
                        {l.phone && <span>tel {l.phone}</span>}
                      </div>
                    </div>
                  </button>

                  <span className={cn("text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-sm border shrink-0", s.color)}>
                    {s.label}
                  </span>

                  {/* Quick actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {l.status === "to_contact" && (
                      <button onClick={() => updateLead(l.id, { status: "messaged" })} className="text-[9px] font-mono uppercase tracking-wider border border-border/40 px-1.5 py-0.5 rounded-sm hover:bg-card">
                        <Send className="h-2.5 w-2.5 inline -mt-0.5" /> DM enviado
                      </button>
                    )}
                    {l.status === "messaged" && (
                      <button onClick={() => updateLead(l.id, { status: "replied" })} className="text-[9px] font-mono uppercase tracking-wider border border-amber-500/40 text-amber-400 px-1.5 py-0.5 rounded-sm hover:bg-card">
                        Respondió
                      </button>
                    )}
                    {l.status === "phone_got" && (
                      <button onClick={() => updateLead(l.id, { status: "handed_off" })} className="text-[9px] font-mono uppercase tracking-wider border border-green-500/40 text-green-400 px-1.5 py-0.5 rounded-sm hover:bg-card">
                        <ArrowRight className="h-2.5 w-2.5 inline -mt-0.5" /> Handoff
                      </button>
                    )}
                    <button onClick={() => deleteLead(l.id)} className="text-muted-foreground hover:text-red-400 p-1">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {creating && (
        <CreateModal onClose={() => setCreating(false)} onCreated={() => { setCreating(false); load() }} />
      )}
      {editing && (
        <EditModal lead={editing} onClose={() => setEditing(null)} onUpdated={() => { setEditing(null); load() }} />
      )}
    </>
  )
}

function CreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ ig_username: "", ig_url: "", full_name: "", notes_assigned: "", closer_assigned: "" })
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch("/api/admin/outreach-ig", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ig_username: form.ig_username,
          ig_url: form.ig_url || undefined,
          full_name: form.full_name || undefined,
          notes_assigned: form.notes_assigned || undefined,
          closer_assigned: form.closer_assigned || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Error")
        return
      }
      onCreated()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-md border border-border bg-background p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Añadir lead IG</h2>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>
        <Input label="@username de IG *" value={form.ig_username} onChange={(v) => setForm({ ...form, ig_username: v })} required />
        <Input label="URL perfil IG" value={form.ig_url} onChange={(v) => setForm({ ...form, ig_url: v })} placeholder="https://instagram.com/..." />
        <Input label="Nombre completo (si lo sabes)" value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} />
        <Input label="Por qué se asignó" value={form.notes_assigned} onChange={(v) => setForm({ ...form, notes_assigned: v })} placeholder="Engaged en post de Adrián del 1 jun" />
        <Input label="Closer asignado" value={form.closer_assigned} onChange={(v) => setForm({ ...form, closer_assigned: v })} placeholder="paolo, junior_1, etc" />
        {error && <p className="text-xs text-red-400">{error}</p>}
        <div className="flex items-center gap-2 pt-2">
          <button type="submit" disabled={submitting || !form.ig_username} className="rounded-sm bg-foreground text-background px-3 py-1.5 text-xs font-mono uppercase tracking-wider hover:opacity-90 disabled:opacity-30">
            {submitting ? "…" : "Añadir"}
          </button>
        </div>
      </form>
    </div>
  )
}

function EditModal({ lead, onClose, onUpdated }: { lead: Lead; onClose: () => void; onUpdated: () => void }) {
  const [phone, setPhone] = useState(lead.phone ?? "")
  const [fullName, setFullName] = useState(lead.full_name ?? "")
  const [replyText, setReplyText] = useState(lead.reply_text ?? "")
  const [status, setStatus] = useState(lead.status)
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    try {
      await fetch(`/api/admin/outreach-ig/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phone || null,
          full_name: fullName || null,
          reply_text: replyText || null,
          status,
        }),
      })
      onUpdated()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-md border border-border bg-background p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">@{lead.ig_username}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>

        {lead.notes_assigned && (
          <p className="text-xs text-muted-foreground italic">{lead.notes_assigned}</p>
        )}

        <Input label="Nombre completo" value={fullName} onChange={setFullName} />
        <Input label="Teléfono (cuando lo dé)" value={phone} onChange={setPhone} placeholder="+34..." />

        <label className="block">
          <span className="block text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">Qué te respondió</span>
          <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} rows={3} className="w-full rounded-sm border border-border/40 bg-background px-2 py-1.5 text-sm resize-none" />
        </label>

        <label className="block">
          <span className="block text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">Estado</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded-sm border border-border/40 bg-background px-2 py-1.5 text-sm">
            {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </label>

        <button onClick={save} disabled={saving} className="w-full rounded-sm bg-foreground text-background py-2 text-xs font-mono uppercase tracking-wider hover:opacity-90 disabled:opacity-30">
          {saving ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </div>
  )
}

function Input({ label, value, onChange, required, placeholder }: { label: string; value: string; onChange: (v: string) => void; required?: boolean; placeholder?: string }) {
  return (
    <label className="block">
      <span className="block text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} required={required} placeholder={placeholder} className="w-full rounded-sm border border-border/40 bg-background px-2 py-1.5 text-sm" />
    </label>
  )
}
