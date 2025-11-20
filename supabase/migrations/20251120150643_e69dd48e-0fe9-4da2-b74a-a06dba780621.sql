-- Create storage bucket for body type reference images
INSERT INTO storage.buckets (id, name, public)
VALUES ('body-type-images', 'body-type-images', true);

-- Set RLS policy to allow public read access
CREATE POLICY "Public read access for body type images"
ON storage.objects FOR SELECT
USING (bucket_id = 'body-type-images');