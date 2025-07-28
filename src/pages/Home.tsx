import { useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { 
  Flower, 
  Truck, 
  Heart, 
  Shield, 
  Star,
  Users,
  Clock,
  Gift
} from 'lucide-react';
import { HeroCarousel } from '../components/HeroCarousel';
import { CategorySection } from '../components/CategorySection';
import { FeaturedProducts } from '../components/FeaturedProducts';
import { ReviewsSection } from '../components/ReviewsSection';
import { WelcomeBonusModal } from '../components/WelcomeBonusModal';

export default function Home() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const features = [
    {
      icon: <Flower className="w-8 h-8 text-primary" />,
      title: "Свежие цветы",
      description: "Только самые свежие и качественные цветы от лучших поставщиков"
    },
    {
      icon: <Truck className="w-8 h-8 text-nature-green" />,
      title: "Быстрая доставка",
      description: "Доставляем по всему большому Сочи от 30 минут"
    },
    {
      icon: <Heart className="w-8 h-8 text-nature-pink" />,
      title: "Индивидуальный подход",
      description: "Поможем подобрать идеальный букет для любого случая"
    },
    {
      icon: <Shield className="w-8 h-8 text-nature-coral" />,
      title: "Гарантия качества",
      description: "Гарантируем свежесть и качество всех наших цветов"
    }
  ];

  const stats = [
    { number: "2500+", label: "Довольных клиентов", icon: <Users className="w-6 h-6" /> },
    { number: "5000+", label: "Доставленных букетов", icon: <Gift className="w-6 h-6" /> },
    { number: "24/7", label: "Круглосуточная поддержка", icon: <Clock className="w-6 h-6" /> },
    { number: "4.9", label: "Средняя оценка", icon: <Star className="w-6 h-6" /> }
  ];

  return (
    <div className="min-h-screen">
      <WelcomeBonusModal />
      <HeroCarousel />
      <CategorySection />
      <FeaturedProducts />
      <ReviewsSection />

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Почему выбирают нас
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Мы заботимся о качестве наших цветов и сервисе, чтобы каждый момент был особенным
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="group bg-gradient-card border-0 shadow-soft hover:shadow-elegant transition-all duration-300 hover:scale-105">
                <CardContent className="p-6 text-center">
                  <div className="mb-4 flex justify-center">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>


    </div>
  );
}