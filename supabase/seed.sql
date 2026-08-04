-- ============================================================
-- DATOS DE EJEMPLO — solo para desarrollo local.
-- NO correr en producción. (supabase db reset los aplica solo en local)
-- ============================================================

INSERT INTO technicians (name, email, active) VALUES
  ('Gustavo Romero',  'gustavo.romero@protegesalud.com',  true),
  ('Ana Martínez',    'ana.martinez@protegesalud.com',    true),
  ('Carlos Pereyra',  'carlos.pereyra@protegesalud.com',  true)
ON CONFLICT (email) DO NOTHING;

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
)
ON CONFLICT (ticket_number) DO NOTHING;
