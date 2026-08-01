-- ============================================================
-- PROTEGER SALUD — Migración 002
-- Sectores (Sistemas / E-Commerce / Mantenimiento) + sucursales
-- Ejecutar en el SQL Editor de Supabase.
-- ============================================================

-- Sector del ticket: define qué equipo lo atiende
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS sector TEXT NOT NULL DEFAULT 'sistemas';
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_sector_check;
ALTER TABLE tickets ADD CONSTRAINT tickets_sector_check
  CHECK (sector IN ('sistemas','ecommerce','mantenimiento'));

-- Nueva categoría 'maintenance' para pedidos de mantenimiento edilicio
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_category_check;
ALTER TABLE tickets ADD CONSTRAINT tickets_category_check
  CHECK (category IN ('hardware','software','internet','printers','systems','users','ecommerce','maintenance','woxi','other'));

CREATE INDEX IF NOT EXISTS idx_tickets_sector ON tickets(sector);
-- El campo area ahora guarda la sucursal (farmacia/depósito) — se agrupa por ella
CREATE INDEX IF NOT EXISTS idx_tickets_area ON tickets(area);

-- Tickets viejos de ecommerce pasan al sector ecommerce
UPDATE tickets SET sector = 'ecommerce' WHERE category = 'ecommerce';

-- Técnicos: sectores que atiende cada uno (puede ser más de uno)
ALTER TABLE technicians ADD COLUMN IF NOT EXISTS sectors TEXT[] NOT NULL DEFAULT '{sistemas}';

-- Vínculo con Supabase Auth (el código ya lo usaba; faltaba en las migraciones)
ALTER TABLE technicians ADD COLUMN IF NOT EXISTS auth_user_id UUID;

-- Rol de cada usuario: admin ve y administra todo; technician solo los
-- tickets de sus sectores
ALTER TABLE technicians ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'technician';
ALTER TABLE technicians DROP CONSTRAINT IF EXISTS technicians_role_check;
ALTER TABLE technicians ADD CONSTRAINT technicians_role_check
  CHECK (role IN ('admin','technician'));

-- Bucket de adjuntos (usado por /api/attachments con getPublicUrl)
INSERT INTO storage.buckets (id, name, public)
VALUES ('ticket-attachments', 'ticket-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Equipo real por sector.
-- ⚠️ Los emails que terminan en @protegersalud.com son PROVISORIOS:
--    actualizarlos con los reales desde /admin/technicians para que
--    les lleguen las notificaciones.
INSERT INTO technicians (name, email, active, sectors, role) VALUES
  ('Gustavo',              'gusprotegersalud@gmail.com', true, '{sistemas}',           'admin'),
  ('Luca',                 'luca@protegersalud.com',      true, '{sistemas,ecommerce}', 'technician'),
  ('Dilan',                'dilan@protegersalud.com',     true, '{ecommerce}',          'technician'),
  ('Gustavo Segre (Capi)', 'capi@protegersalud.com',      true, '{mantenimiento}',      'technician'),
  ('Franco',               'franco@protegersalud.com',    true, '{mantenimiento}',      'technician')
ON CONFLICT (email) DO UPDATE
  SET sectors = EXCLUDED.sectors, role = EXCLUDED.role, active = true;
