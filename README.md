# Sistema de Tickets — Proteger Salud

Sistema interno de soporte técnico con interfaz premium, oscura y moderna.

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 15 (App Router) + TypeScript |
| Estilos | Tailwind CSS v4 |
| Formularios | React Hook Form + Zod |
| Base de datos | Supabase (PostgreSQL) |
| Emails | Resend |
| Charts | Recharts |
| Deploy | Vercel |

## URLs

- `/` — Formulario público para crear tickets
- `/admin/dashboard` — Panel con métricas y gráficos
- `/admin/tickets` — Tabla con filtros
- `/admin/tickets/[id]` — Detalle y gestión del ticket
- `/admin/technicians` — Lista de técnicos

## Setup rápido

```bash
cp .env.local.example .env.local
# Completar con claves de Supabase y Resend
npm install
npm run dev
```

## Deploy

1. Ejecutar `supabase/migrations/001_initial_schema.sql` en el SQL Editor de Supabase
2. Configurar variables de entorno en Vercel
3. Deploy automático desde GitHub

Ver instrucciones detalladas en `supabase/migrations/001_initial_schema.sql`.
