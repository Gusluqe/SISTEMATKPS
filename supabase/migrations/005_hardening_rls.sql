-- ============================================================
-- 005 — Hardening de RLS
-- Todo el acceso a datos pasa por las API routes con service_role;
-- las políticas "authenticated_all_*" permitían a cualquier usuario
-- logueado leer/escribir todas las tablas directo contra PostgREST
-- desde el navegador (incluso cambiarse el rol o borrar tickets).
-- Se eliminan: la anon key ya no da acceso a ninguna tabla.
--
-- Incluye además la tabla recurrent_actions (migración 004) porque en
-- producción quedó sin aplicar; sin ella, registrar una acción sobre una
-- falla recurrente devuelve error.
-- Es idempotente: se puede correr más de una vez sin problema.
-- ============================================================

-- --- Tabla de acciones sobre fallas recurrentes (004, sin la política abierta)
CREATE TABLE IF NOT EXISTS recurrent_actions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area       TEXT NOT NULL,
  category   TEXT NOT NULL,
  action     TEXT NOT NULL,
  note       TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recurrent_actions_area_cat
  ON recurrent_actions(area, category, created_at DESC);

ALTER TABLE recurrent_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_recurrent_actions" ON recurrent_actions;
CREATE POLICY "service_role_all_recurrent_actions"
  ON recurrent_actions FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- --- Cierre de las políticas abiertas a cualquier usuario autenticado
DROP POLICY IF EXISTS "authenticated_all_tickets" ON tickets;
DROP POLICY IF EXISTS "authenticated_all_comments" ON ticket_comments;
DROP POLICY IF EXISTS "authenticated_all_history" ON ticket_history;
DROP POLICY IF EXISTS "authenticated_all_technicians" ON technicians;
DROP POLICY IF EXISTS "authenticated_all_recurrent_actions" ON recurrent_actions;
