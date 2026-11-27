-- Allow teacher video attachments (MP4) without changing existing bucket limits or other MIME rules.
update storage.buckets
set allowed_mime_types = case
  when allowed_mime_types is null then array['video/mp4']::text[]
  when 'video/mp4' = any(allowed_mime_types) then allowed_mime_types
  else array_append(allowed_mime_types, 'video/mp4')
end
where id = 'teacher-documents';
