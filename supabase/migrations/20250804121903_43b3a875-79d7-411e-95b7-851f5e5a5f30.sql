-- Add featured column to posters table
ALTER TABLE public.posters 
ADD COLUMN featured boolean NOT NULL DEFAULT false;

-- Add index for better performance on featured queries
CREATE INDEX idx_posters_featured ON public.posters(featured);

-- Ensure only one poster can be featured at a time by creating a partial unique index
CREATE UNIQUE INDEX idx_posters_featured_unique ON public.posters(featured) WHERE featured = true;