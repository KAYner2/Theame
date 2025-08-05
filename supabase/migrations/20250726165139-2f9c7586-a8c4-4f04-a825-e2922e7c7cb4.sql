-- Create product_recommendations table for managing related products
CREATE TABLE public.product_recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  target_category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(source_category_id, target_category_id)
);

-- Enable RLS
ALTER TABLE public.product_recommendations ENABLE ROW LEVEL SECURITY;

-- Create policies for product_recommendations
CREATE POLICY "Allow all operations on product_recommendations" 
ON public.product_recommendations 
FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Public can view active product recommendations" 
ON public.product_recommendations 
FOR SELECT 
USING (is_active = true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_product_recommendations_updated_at
BEFORE UPDATE ON public.product_recommendations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();