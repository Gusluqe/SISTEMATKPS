-- ============================================================
-- PROTEGER SALUD — Sistema de Tickets de Soporte Técnico
-- Migración inicial: esquema completo de base de datos
-- ============================================================

-- Habilitar extensión para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLA: technicians
-- ============================================================
CREATE TABLE IF NOT EXISTS technicians (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name         TEXT NOT NULL,
  email        TEXT NOT NULL UNIQUE,
  avatar_url   TEXT,
  active       BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_technicians_active ON technicians(active);

-- Técnicos de ejemplo
INSERT INTO technicians (name, email, active) VALUES
  ('Gustavo Romero',  'gustavo.romero@protegesalud.com',  true),
  ('Ana Martínez',    'ana.martinez@protegesalud.com',    true),
  ('Carlos Pereyra',  'carlos.pereyra@protegesalud.com',  true);

-- ============================================================
-- TABLA: tickets
-- ============================================================
CREATE TABLE IF NOT EXISTS tickets (
  id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  ticket_number    TEXT NOT NULL UNIQUE,
  title            TEXT NOT NULL,
  description      TEXT NOT NULL,

  -- Estado y prioridad
  status           TEXT NOT NULL DEFAULT 'open'
                     CHECK (status IN ('open','in_progress','waiting','resolved','closed')),
  priority         TEXT NOT NULL DEFAULT 'medium'
                     CHECK (priority IN ('low','medium','high','urgent')),
  category         TEXT NOT NULL DEFAULT 'other'
                     CHECK (category IN ('hardware','software','internet','printers','systems','users','ecommerce','other')),

  -- Solicitante
  requester_name   TEXT NOT NULL,
  requester_email  TEXT NOT NULL,
  area             TEXT NOT NULL,

  -- Asignación
  technician_id    UUID REFERENCES technicians(id) ON DELETE SET NULL,

  -- Adjuntos (array de URLs o nombres de archivo)
  attachments      TEXT[] DEFAULT '{}',

  -- Fechas
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  resolved_at      TIMESTAMPTZ
);

-- Índices para consultas frecuentes
CREATE INDEX idx_tickets_status    ON tickets(status);
CREATE INDEX idx_tickets_priority  ON tickets(priority);
CREATE INDEX idx_tickets_category  ON tickets(category);
CREATE INDEX idx_tickets_created   ON tickets(created_at DESC);
CREATE INDEX idx_tickets_requester ON tickets(requester_email);
CREATE INDEX idx_tickets_tech      ON tickets(technician_id);

-- Trigger: actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- TABLA: ticket_comments
-- ============================================================
CREATE TABLE IF NOT EXISTS ticket_comments (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  ticket_id    UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  author_name  TEXT NOT NULL,
  author_email TEXT NOT NULL DEFAULT '',
  content      TEXT NOT NULL,
  is_internal  BOOLEAN DEFAULT true,  -- true = solo equipo, false = visible al usuario
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_comments_ticket ON ticket_comments(ticket_id, created_at);

-- ============================================================
-- TABLA: ticket_history
-- ============================================================
CREATE TABLE IF NOT EXISTS ticket_history (
  id             UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  ticket_id      UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  changed_by     TEXT NOT NULL,
  field_changed  TEXT NOT NULL,
  old_value      TEXT,
  new_value      TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_history_ticket ON ticket_history(ticket_id, created_at DESC);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE tickets          ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_comments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_history   ENABLE ROW LEVEL SECURITY;
ALTER TABLE technicians      ENABLE ROW LEVEL SECURITY;

-- Política: acceso total para el service_role (usado por API routes del servidor)
CREATE POLICY "service_role_all_tickets"
  ON tickets FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_comments"
  ON ticket_comments FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_history"
  ON ticket_history FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_technicians"
  ON technicians FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- Política: usuarios anónimos solo pueden INSERT en tickets (para el formulario público)
CREATE POLICY "anon_insert_tickets"
  ON tickets FOR INSERT
  TO anon
  WITH CHECK (true);

-- Política: usuarios anónimos pueden leer su propio ticket por email
CREATE POLICY "anon_read_own_tickets"
  ON tickets FOR SELECT
  TO anon
  USING (true);  -- En producción: USING (requester_email = current_user)

-- Política: usuarios autenticados tienen acceso completo
CREATE POLICY "authenticated_all_tickets"
  ON tickets FOR ALL
  TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all_comments"
  ON ticket_comments FOR ALL
  TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all_history"
  ON ticket_history FOR ALL
  TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all_technicians"
  ON technicians FOR ALL
  TO authenticated
  USING (true) WITH CHECK (true);

-- ============================================================
-- DATOS DE EJEMPLO
-- ============================================================

-- Ticket de ejemplo para testear
INSERT INTO tickets (
  ticket_number, title, description, status, priority, category,
  requester_name, requester_email, area
) VALUES (
  'TK-2026-00001',
  'No puedo acceder al sistema de facturación',
  'Desde esta mañana cuando intento ingresar al sistema de facturación me aparece el error "Sesión expirada" aunque ingreso con mis credenciales correctas. Probé en dos navegadores diferentes (Chrome y Edge) y el problema persiste. Necesito acceder con urgencia para procesar las facturas del día.',
  'open', 'high', 'software',
  'María González', 'maria.gonzalez@protegesalud.com', 'Contabilidad'
),
(
  'TK-2026-00002',
  'Impresora del piso 2 no imprime en color',
  'La impresora HP LaserJet del área de administración (piso 2) imprime todo en blanco y negro aunque está configurada para color. Ya intenté reinstalar el driver sin éxito.',
  'in_progress', 'medium', 'printers',
  'Roberto Silva', 'roberto.silva@protegesalud.com', 'Administración'
),
(
  'TK-2026-00003',
  'Internet muy lento en área de ventas',
  'Todo el equipo de ventas reporta conexión a internet extremadamente lenta desde ayer a la tarde. Descargamos un archivo de 1MB y tardó 5 minutos. Afecta a todos los puestos de trabajo del área.',
  'open', 'urgent', 'internet',
  'Laura Pérez', 'laura.perez@protegesalud.com', 'Ventas'
);
