import { Star } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { useReviews } from '@/hooks/useReviews';
import { Carousel, CarouselContent, CarouselItem } from './ui/carousel';
import { useIsMobile } from '@/hooks/use-mobile';
import Autoplay from 'embla-carousel-autoplay';
import { useMemo } from 'react';

export function ReviewsSection() {
  const { data: reviews = [], isLoading, error } = useReviews();
  const isMobile = useIsMobile();
  const autoplayPlugin = useMemo(
    () => Autoplay({ delay: 3000, stopOnInteraction: true }) as any,
    []
  );

  const SectionShell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <section className="py-20 bg-transparent">
      <div className="container mx-auto px-4">
        {children}
      </div>
    </section>
  );

  if (isLoading) {
    return (
      <SectionShell>
        <h2 className="text-4xl font-bold text-center mb-12">Клиенты о нас</h2>
        <div className="text-center">
          <p className="text-muted-foreground">Загрузка отзывов...</p>
        </div>
      </SectionShell>
    );
  }

  if (error) {
    return (
      <SectionShell>
        <h2 className="text-4xl font-bold text-center mb-12">Клиенты о нас</h2>
        <div className="text-center">
          <p className="text-destructive">Ошибка загрузки отзывов</p>
        </div>
      </SectionShell>
    );
  }

  const ReviewCard = ({ review }: { review: any }) => (
    <Card className="bg-gradient-card border-0 shadow-soft transition-all duration-300 hover:shadow-elegant">
      <CardContent className="p-6">
        <div className="flex items-center mb-4">
          {[...Array(review.rating)].map((_, i) => (
            <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
          ))}
        </div>
        <p className="text-muted-foreground mb-4">{review.comment}</p>
        <div className="flex justify-between items-center">
          <span className="font-semibold">{review.client_name}</span>
          <span className="text-sm text-muted-foreground">
            {new Date(review.publication_date || review.created_at).toLocaleDateString('ru-RU')}
          </span>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <SectionShell>
      <h2 className="text-4xl font-bold text-center mb-12">Клиенты о нас</h2>

      {isMobile ? (
        <Carousel
          opts={{ align: 'start', loop: true }}
          plugins={[autoplayPlugin]}
          className="w-full"
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {reviews.slice(0, 4).map((review) => (
              <CarouselItem key={review.id} className="pl-2 md:pl-4 basis-4/5">
                <ReviewCard review={review} />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {reviews.slice(0, 4).map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}
    </SectionShell>
  );
}
