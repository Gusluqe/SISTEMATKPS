-- ============================================================
-- 005 — Hardening de RLS
-- Todo el acceso a datos pasa por las API routes con service_role;
-- las políticas "authenticated_all_*" permitían a cualquier usuario
-- logueado leer/escribir todas las tablas directo contra PostgREST
-- desde el navegador (incluso cambiarse el rol o borrar tickets).
-- Se eliminan: la anon key ya no da acceso a ninguna tabla.
-- ============================================================

DROP POLICY IF EXISTS "authenticated_all_tickets" ON tickets;
DROP POLICY IF EXISTS "authenticated_all_comments" ON ticket_comments;
DROP POLICY IF EXISTS "authenticated_all_history" ON ticket_history;
DROP POLICY IF EXISTS "authenticated_all_technicians" ON technicians;
DROP POLICY IF EXISTS "authenticated_all_recurrent_actions" ON recurrent_actions;
