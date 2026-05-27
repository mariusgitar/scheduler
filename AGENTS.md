# Workshop Agenda — Codex context

### Stack
- Next.js 14 App Router (TypeScript)
- Neon Postgres via @neondatabase/serverless
- NextAuth.js v5 (next-auth@beta) — kommer
- Tailwind CSS (ikke i bruk ennå)
- Plus Jakarta Sans via Google Fonts (CSS-import)

### Miljøvariabler
- DATABASE_URL — Neon connection string (Vercel)
- AUTH_SECRET — NextAuth secret (Vercel)
- AUTH_GOOGLE_ID — Google OAuth client ID (Vercel)
- AUTH_GOOGLE_SECRET — Google OAuth client secret (Vercel)

### Mappestruktur
- app/ — Next.js App Router sider og API-ruter
- app/api/workshops/ — CRUD for workshops
- app/workshop/[id]/ — redigeringsside
- components/ — WorkshopPlanner, CreateButton,
  DeleteButton
- lib/db.ts — databasehjelper
- lib/types.ts — WorkshopRow og andre typer
- lib/schema.sql — SQL-migrasjon

### Konvensjoner
- Norsk brukergrensesnitt, engelske variabelnavn
- Tynne page.tsx-filer, logikk i egne filer
- API-ruter i app/api/
- Databaselogikk samles i lib/db.ts
- Ingen ORM — bruk @neondatabase/serverless
  direkte med parameteriserte spørringer
- CSS i dedikerte .css-filer per seksjon,
  importert i relevante komponenter
- Codex oppretter ALDRI tabeller direkte —
  alle SQL-migrasjoner skrives til lib/schema.sql
  og kjøres manuelt av utvikler i Neon SQL-editor

### PR-disiplin
- Én ting per PR
- Hver PR skal kunne testes manuelt i nettleser
- Ikke introduser nye avhengigheter uten kommentar
- Oppdater AGENTS.md hvis ny konvensjon innføres
