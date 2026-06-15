-- ============================================================================
-- Fix CHECK constraint contacts.stage: usar los stages CANONICOS del 2026-06-15
-- ============================================================================
-- El constraint anterior tenia stages viejos (contactado, cliente, atendio)
-- que ya no son los oficiales. Decisión Marco 2026-06-15:
--   nuevo_seguidor → conversacion → agendado → alumno
--   seguimiento · no_show · perdido · comento_no_follow
--
-- Esto bloqueaba silenciosamente UPDATEs del webhook ManyChat
-- (insert exitoso con 'nuevo_seguidor', pero update a 'conversacion' fallaba).

ALTER TABLE public.contacts DROP CONSTRAINT IF EXISTS contacts_stage_check;

ALTER TABLE public.contacts ADD CONSTRAINT contacts_stage_check
  CHECK (stage IN (
    'nuevo_seguidor',
    'conversacion',
    'agendado',
    'alumno',
    'seguimiento',
    'no_show',
    'perdido',
    'comento_no_follow'
  ));
