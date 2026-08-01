-- ============================================================
-- PROTEGER SALUD — Migración 004
-- Fallas recurrentes: registro de acciones tomadas por patrón
-- (ej: "se cambió la impresora de Farmacia Catedral")
-- Ejecutar en el SQL Editor de Supabase.
-- ============================================================

CREATE TABLE IF NOT EXISTS recurrent_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area TEXT NOT NULL,
  category TEXT NOT NULL,
  action TEXT NOT NULL,
  note TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recurrent_actions_area_cat
  ON recurrent_actions(area, category, created_at DESC);

ALTER TABLE recurrent_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_recurrent_actions"
  ON recurrent_actions FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all_recurrent_actions"
  ON recurrent_actions FOR ALL
  TO authenticated
  USING (true) WITH CHECK (true);
