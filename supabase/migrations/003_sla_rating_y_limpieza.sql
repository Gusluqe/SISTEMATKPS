-- ============================================================
-- PROTEGER SALUD — Migración 003
-- SLA + encuesta de satisfacción + emails de técnicos opcionales
-- Ejecutar en el SQL Editor de Supabase.
-- ============================================================

-- --- Tickets: seguimiento de SLA y satisfacción -------------

-- Primera respuesta del equipo (cambio de estado o comentario público de staff)
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS first_response_at TIMESTAMPTZ;

-- Recordatorio de SLA vencido ya enviado (para no repetir el aviso)
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS sla_reminder_sent_at TIMESTAMPTZ;

-- Calificación del solicitante al resolver (1 a 5)
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS rating SMALLINT;
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_rating_check;
ALTER TABLE tickets ADD CONSTRAINT tickets_rating_check
  CHECK (rating IS NULL OR rating BETWEEN 1 AND 5);

-- Backfill: los tickets ya trabajados cuentan como respondidos para no
-- arrastrar "SLA incumplido" histórico que nunca se midió.
UPDATE tickets
SET first_response_at = COALESCE(resolved_at, updated_at)
WHERE first_response_at IS NULL
  AND status IN ('in_progress', 'waiting', 'resolved', 'closed');

-- Comentarios internos (el código ya lo usaba; asegurar la columna)
ALTER TABLE ticket_comments ADD COLUMN IF NOT EXISTS is_internal BOOLEAN NOT NULL DEFAULT false;

-- --- Técnicos: email opcional -------------------------------
-- Sin email el técnico simplemente no recibe avisos; al cargarle un email
-- real desde /admin/technicians empieza a recibirlos automáticamente.
ALTER TABLE technicians ALTER COLUMN email DROP NOT NULL;

-- Vaciar los emails placeholder inventados (rebotaban)
UPDATE technicians SET email = NULL
WHERE email LIKE '%@protegersalud.com' OR email LIKE '%@protegesalud.com';

-- Desactivar técnicos viejos de prueba que no forman parte del equipo real
UPDATE technicians SET active = false
WHERE name IN ('Carlos Pereyra', 'Gustavo Romero', 'Luca Ricci');

-- --- Seguridad ----------------------------------------------
-- Toda lectura/escritura pública pasa por las API routes con service role;
-- la anon key no necesita (ni debe) acceder a tickets directamente.
DROP POLICY IF EXISTS "anon_read_own_tickets" ON tickets;
DROP POLICY IF EXISTS "anon_insert_tickets" ON tickets;
