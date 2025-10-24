import { useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent } from '../components/ui/card';
import { 
  Flower, Truck, Heart, Shield
} from 'lucide-react';
import { HeroCarousel } from '../components/HeroCarousel';
import { FeaturedProducts } from '../components/FeaturedProducts';
import { ReviewsSection } from '../components/ReviewsSection';
import { WelcomeBonusModal } from '../components/WelcomeBonusModal';

export default function Home() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const features = [
    { icon: <Flower className="w-8 h-8 text-primary" />, title: "Свежие цветы", description: "Только самые свежие и качественные цветы от лучших поставщиков" },
    { icon: <Truck className="w-8 h-8 text-nature-green" />, title: "Быстрая доставка", description: "Доставляем по всему большому Сочи от 30 минут" },
    { icon: <Heart className="w-8 h-8 text-nature-pink" />, title: "Индивидуальный подход", description: "Поможем подобрать идеальный букет для любого случая" },
    { icon: <Shield className="w-8 h-8 text-nature-coral" />, title: "Гарантия качества", description: "Гарантируем свежесть и качество всех наших цветов" },
  ];

  return (
    <div className="min-h-screen bg-[#fff8ea]">
      {/* SEO — главная */}
      <Helmet>
        <title>Купить свежие цветы и букеты в Сочи — доставка 45 минут | The Ame</title>
        <meta
          name="description"
          content="Свежие и премиальные букеты с доставкой по Сочи от The Ame. Авторские композиции, розы и сезонные цветы — создаём настроение за 45 минут."
        />
        <meta
          name="keywords"
          content="купить цветы Сочи, доставка цветов Сочи, свежие букеты, премиум букеты, авторские букеты, розы с доставкой, заказать букет, цветы онлайн, цветы в коробках, корзины с цветами, монобукеты, сезонные цветы, доставка по Большому Сочи, букет на подарок, цветочный магазин, премиальные цветы, доставка цветов за 45 минут"
        />

        {/* Open Graph */}
        <meta property="og:title" content="Купить свежие цветы и букеты в Сочи — доставка 45 минут | The Ame" />
        <meta
          property="og:description"
          content="Свежие и премиальные букеты с доставкой по Сочи от The Ame. Авторские композиции, розы и сезонные цветы — создаём настроение за 45 минут."
        />
        <meta property="og:type" content="website" />
        {/* <meta property="og:url" content="https://your-domain.ru/" /> */}
        {/* <meta property="og:image" content="https://your-domain.ru/og/home.jpg" /> */}

        {/* Twitter Card (по желанию) */}
        <meta name="twitter:card" content="summary_large_image" />
        {/* <link rel="canonical" href="https://your-domain.ru/" /> */}
      </Helmet>

      <WelcomeBonusModal />
      <HeroCarousel />
      <FeaturedProducts />
      <ReviewsSection />

      {/* Features Section */}
      <section className="py-20 bg-[#fff8ea]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">Почему выбирают нас</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Мы заботимся о качестве наших цветов и сервисе, чтобы каждый момент был особенным
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="group bg-gradient-card border-0 shadow-soft hover:shadow-elegant transition-all duration-300 hover:scale-105"
              >
                <CardContent className="p-6 text-center">
                  <div className="mb-4 flex justify-center">{feature.icon}</div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
