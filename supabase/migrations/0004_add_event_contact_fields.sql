alter table public.events
  add column if not exists whatsapp text,
  add column if not exists email text,
  add column if not exists ages text;