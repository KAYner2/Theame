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

  if (isLoading) {
    return (
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">
            Клиенты о нас
          </h2>
          <div className="text-center">
            <p className="text-muted-foreground">Загрузка отзывов...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">
            Клиенты о нас
          </h2>
          <div className="text-center">
            <p className="text-destructive">Ошибка загрузки отзывов</p>
          </div>
        </div>
      </section>
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
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-12">
          Клиенты о нас
        </h2>
        
        {isMobile ? (
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
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
      </div>
    </section>
  );
}