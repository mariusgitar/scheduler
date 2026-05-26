# Workshop Agenda — Codex context

## Stack
- Next.js 14 App Router (TypeScript)
- Neon Postgres via @neondatabase/serverless
- Tailwind CSS
- Plus Jakarta Sans via next/font/google

## Miljøvariabler
- DATABASE_URL — settes automatisk av Vercel/Neon-integrasjonen

## Konvensjoner
- Norsk brukergrensesnitt, engelske variabelnavn og filnavn
- Tynne page.tsx-filer — logikk og typer i egne filer
- API-ruter ligger i app/api/
- Databaselogikk samles i lib/db.ts
- Ingen ORM — bruk @neondatabase/serverless direkte med parameteriserte spørringer
- Ingen auth i MVP

## PR-disiplin
- Én ting per PR
- Hver PR skal kunne testes manuelt i nettleser eller med curl før merge
- Ikke introduser nye avhengigheter uten å kommentere hvorfor
