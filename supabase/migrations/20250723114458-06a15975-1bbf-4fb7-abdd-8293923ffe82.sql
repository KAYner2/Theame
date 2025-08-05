-- Add colors field to products table
ALTER TABLE public.products 
ADD COLUMN colors TEXT[] DEFAULT ARRAY[]::TEXT[];