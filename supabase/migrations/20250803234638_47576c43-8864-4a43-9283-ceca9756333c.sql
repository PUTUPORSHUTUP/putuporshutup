-- Create promo-posters storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('promo-posters', 'promo-posters', true);

-- Create storage policies for promo-posters bucket
CREATE POLICY "Public Access for promo-posters" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'promo-posters');

CREATE POLICY "Admins can upload promo-posters" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'promo-posters' AND is_user_admin());

CREATE POLICY "Admins can update promo-posters" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'promo-posters' AND is_user_admin());

CREATE POLICY "Admins can delete promo-posters" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'promo-posters' AND is_user_admin());