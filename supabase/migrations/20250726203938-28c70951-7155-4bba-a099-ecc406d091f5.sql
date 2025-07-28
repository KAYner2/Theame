-- Add name column to newsletter_subscriptions table
ALTER TABLE public.newsletter_subscriptions 
ADD COLUMN name TEXT;