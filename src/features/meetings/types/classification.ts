import { z } from 'zod'

export const ClassificationSchema = z.object({
  scope: z.enum(['external', 'internal']),
  tipo: z.enum([
    'sales_discovery',
    'sales_closing',
    'client_onboarding',
    'client_success',
    'team_daily',
    'team_strategy',
    'partner',
    'delivery',
    'otros',
  ]),
  resultado: z.enum(['won', 'lost', 'follow_up', 'info', 'na']),
  funnel_stage: z
    .enum(['lead', 'discovery', 'proposal', 'negotiation', 'closed_won', 'closed_lost'])
    .nullable(),
  resumen: z.string().min(20).max(1500),
  action_items: z.array(
    z.object({
      texto: z.string().min(3),
      owner: z.string().nullable().optional(),
      due_date: z.string().nullable().optional(),
    }),
  ),
  decisiones: z.array(z.object({ texto: z.string().min(3) })),
  participants: z
    .array(
      z.object({
        name: z.string().min(1),
        email: z.string().email().nullable(),
        is_team_member: z.boolean(),
        matched_team_member_name: z.string().nullable(),
        role: z.enum(['primary', 'participant', 'decision_maker', 'gatekeeper']),
        stage_inferred: z
          .enum(['lead', 'prospect', 'client', 'partner', 'other'])
          .nullable(),
      }),
    )
    .min(1),
})

export type ClassificationResult = z.infer<typeof ClassificationSchema>
