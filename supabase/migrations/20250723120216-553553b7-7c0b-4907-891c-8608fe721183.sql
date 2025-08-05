-- Add show_on_homepage field to products table
ALTER TABLE public.products 
ADD COLUMN show_on_homepage boolean DEFAULT true;