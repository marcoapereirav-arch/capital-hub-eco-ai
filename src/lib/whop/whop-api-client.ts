import "server-only"

/**
 * Cliente minimo de la Whop API v1 para los flows del funnel MIFGE:
 * - Cargar tarjeta guardada de un member para upsells one-click
 * - Cobrar bump tras checkout principal
 *
 * Auth: Bearer WHOP_API_KEY (necesita scopes payment:charge + member:payment_methods:read)
 * Docs: https://docs.whop.com/api-reference/payments/create-payment.md
 */

const WHOP_API_BASE = "https://api.whop.com/api/v1"

function getApiKey(): string {
  const key = process.env.WHOP_API_KEY
  if (!key) throw new Error("WHOP_API_KEY no configurada")
  return key
}

function getCompanyId(): string {
  const id = process.env.WHOP_COMPANY_ID
  if (!id) throw new Error("WHOP_COMPANY_ID no configurada")
  return id
}

async function whopFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${WHOP_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  })
  if (!res.ok) {
    const errBody = await res.text().catch(() => "")
    throw new Error(`Whop API ${path} → ${res.status}: ${errBody}`)
  }
  return (await res.json()) as T
}

export type WhopPaymentMethod = {
  id: string // payt_xxx
  payment_method_type: string
  card?: {
    brand: string
    last4: string
    exp_month: number
    exp_year: number
  }
}

export async function listMemberPaymentMethods(memberId: string): Promise<WhopPaymentMethod[]> {
  const res = await whopFetch<{ data: WhopPaymentMethod[] }>(
    `/payment_methods?member_id=${encodeURIComponent(memberId)}`
  )
  return res.data ?? []
}

export type WhopReceipt = {
  id: string
  status: string
  member?: { id: string } | null
  member_id?: string
  user_id?: string
  user?: { id: string; email?: string } | null
  total?: number
  currency?: string
}

/**
 * Resuelve el member_id desde un receipt ID (lo que devuelve onComplete del embed).
 * Whop a veces devuelve el member como objeto anidado, otras solo el id.
 */
export async function getReceipt(receiptId: string): Promise<WhopReceipt> {
  return whopFetch<WhopReceipt>(`/receipts/${receiptId}`)
}

export type ChargeUserInput = {
  memberId: string
  paymentMethodId: string
  planId: string
  metadata?: Record<string, unknown>
}

export type WhopPayment = {
  id: string
  status: string
  total: number
  currency: string
}

/**
 * Cobra a un member usando una tarjeta guardada.
 * Off-session: el response llega rapido pero el procesamiento real es async.
 * El webhook payment.succeeded confirmara el cobro.
 */
export async function chargeUser(input: ChargeUserInput): Promise<WhopPayment> {
  return whopFetch<WhopPayment>("/payments", {
    method: "POST",
    body: JSON.stringify({
      company_id: getCompanyId(),
      member_id: input.memberId,
      payment_method_id: input.paymentMethodId,
      plan_id: input.planId,
      ...(input.metadata && { metadata: input.metadata }),
    }),
  })
}
