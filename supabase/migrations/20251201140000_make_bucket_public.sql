-- Make video-interviews bucket public
UPDATE storage.buckets
SET public = true
WHERE id = 'video-interviews';
