-- Ensure storage bucket exists for event images
insert into storage.buckets (id, name, public)
values ('event-images', 'event-images', true)
on conflict (id) do nothing;

-- Authenticated users can read event images
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'event_images_read_authenticated'
  ) then
    create policy "event_images_read_authenticated"
    on storage.objects
    for select
    to authenticated
    using (bucket_id = 'event-images');
  end if;
end
$$;

-- Users can upload only inside their own folder
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'event_images_insert_own_folder'
  ) then
    create policy "event_images_insert_own_folder"
    on storage.objects
    for insert
    to authenticated
    with check (
      bucket_id = 'event-images'
      and split_part(name, '/', 2) = auth.uid()::text
    );
  end if;
end
$$;

-- Users can update/delete only their own files
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'event_images_update_own_folder'
  ) then
    create policy "event_images_update_own_folder"
    on storage.objects
    for update
    to authenticated
    using (
      bucket_id = 'event-images'
      and split_part(name, '/', 2) = auth.uid()::text
    )
    with check (
      bucket_id = 'event-images'
      and split_part(name, '/', 2) = auth.uid()::text
    );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'event_images_delete_own_folder'
  ) then
    create policy "event_images_delete_own_folder"
    on storage.objects
    for delete
    to authenticated
    using (
      bucket_id = 'event-images'
      and split_part(name, '/', 2) = auth.uid()::text
    );
  end if;
end
$$;
