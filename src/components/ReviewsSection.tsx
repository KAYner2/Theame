import { Star } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { useReviews } from '@/hooks/useReviews';

export function ReviewsSection() {
  const { data: reviews = [], isLoading, error } = useReviews();

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

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-12">
          Клиенты о нас
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {reviews.slice(0, 4).map((review) => (
            <Card key={review.id} className="bg-gradient-card border-0 shadow-soft transition-all duration-300 hover:shadow-elegant">
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
          ))}
        </div>
      </div>
    </section>
  );
}