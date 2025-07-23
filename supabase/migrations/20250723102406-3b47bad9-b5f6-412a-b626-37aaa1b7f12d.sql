-- Create hero_slides table for managing carousel content
CREATE TABLE public.hero_slides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT,
  subtitle TEXT,
  image_url TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;

-- Create policies for public viewing of active slides
CREATE POLICY "Public can view active hero slides" 
ON public.hero_slides 
FOR SELECT 
USING (is_active = true);

-- Create policy for all operations (for admin)
CREATE POLICY "Allow all operations on hero_slides" 
ON public.hero_slides 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_hero_slides_updated_at
BEFORE UPDATE ON public.hero_slides
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some default hero slides
INSERT INTO public.hero_slides (title, subtitle, image_url, sort_order) VALUES
('Бережная доставка букетов', 'по большому Сочи', '/slide1.jpg', 1),
('Свежие цветы каждый день', 'для особых моментов', '/slide2.jpg', 2),
('Авторские композиции', 'ручной работы', '/slide3.jpg', 3);