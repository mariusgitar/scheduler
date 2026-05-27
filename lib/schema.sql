CREATE TABLE IF NOT EXISTS workshops (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL DEFAULT 'Workshop',
  data        JSONB NOT NULL DEFAULT '{}',
  owner_id    TEXT,
  read_token  TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
