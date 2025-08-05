-- Create storage policies for hero-slides bucket
CREATE POLICY "Hero slides images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'hero-slides');

CREATE POLICY "Users can upload hero slide images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'hero-slides');

CREATE POLICY "Users can update hero slide images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'hero-slides');

CREATE POLICY "Users can delete hero slide images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'hero-slides');