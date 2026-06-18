-- Tabla de documentos contables
create table if not exists documents (
  id uuid default gen_random_uuid() primary key,
  original_name text not null,
  filename text not null,
  file_url text,
  size bigint,
  mimetype text,
  type text default 'other',
  extracted_data jsonb,
  uploaded_at timestamp with time zone default now(),
  user_id uuid references auth.users(id)
);

-- Bucket de storage para documentos
insert into storage.buckets (id, name) values ('documents', 'documents')
on conflict (id) do nothing;

-- Política de seguridad: solo el usuario puede ver sus documentos
alter table documents enable row level security;

create policy "Users can view own documents"
  on documents for select
  using (auth.uid() = user_id);

create policy "Users can insert own documents"
  on documents for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own documents"
  on documents for delete
  using (auth.uid() = user_id);
