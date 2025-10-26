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
        <title>Купить букет в Сочи — свежие цветы и авторские композиции | The Ame</title>
        <meta
          name="description"
          content="Премиальные букеты, свежие цветы и идеальный сервис. Закажите доставку по Сочи от 45 минут — создаём настроение в каждом букете."
        />
        <meta
          name="keywords"
          content="купить цветы Сочи, доставка цветов Сочи, свежие букеты, премиум букеты, авторские композиции, розы с доставкой, пионовидные розы, сезонные цветы, цветы онлайн, цветы в подарок, букет на день рождения, цветы для девушки, цветы для мамы, букет для жены, цветы без повода, доставка 24/7, премиальные цветы, букет от 45 минут, флористика Сочи"
        />

        {/* Open Graph */}
        <meta property="og:title" content="Купить свежие цветы и букеты в Сочи — доставка 45 минут | The Ame" />
        <meta
          property="og:description"
          content="Премиальные букеты, свежие цветы и идеальный сервис. Закажите доставку по Сочи от 45 минут — создаём настроение в каждом букете."
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
      {/* SEO-блок с описанием The Ame */}
<section className="py-20 bg-white text-center text-[#7e7e7e]">
  <div className="container mx-auto px-6 max-w-4xl">
    <h2 className="text-3xl md:text-4xl font-bold text-[#000] mb-6">
      The Ame — цветочный магазин в Сочи, где каждый букет говорит о чувствах
    </h2>
    <p className="text-lg leading-relaxed mb-12">
      Свежесть и стиль в каждом лепестке
    </p>

    <p className="text-base md:text-lg mb-8">
      The Ame — уютный цветочный магазин в Сочи на ул. Донская, 10А, где цветы подбирают с душой. 
      В нашем каталоге — монобукеты из роз, пионов, хризантем, гортензий, тюльпанов и ромашек, 
      а также авторские букеты, композиции в коробках или корзинах, и премиум-букеты для особых случаев. 
      Каждый цветок свежий и отборный, а гарантия на 3 дня даёт уверенность в качестве: 
      если букет не понравится — заменим бесплатно.
    </p>

    <h3 className="text-2xl font-semibold text-[#000] mb-4">
      Быстрая доставка цветов по всему Сочи
    </h3>
    <p className="text-base md:text-lg mb-8">
      Закажите доставку цветов в Сочи — мы привезём букет уже через 45 минут. Работаем во всех районах: Центр, 
      Адлер, Хоста, Сириус, Мацеста, Лоо, Дагомыс и Красная Поляна. Это идеальный способ подарить цветы любимой 
      девушке, жене, маме, бабушке, сестре, подруге, коллеге, учителю или начальнику. 
      Мы позаботимся о стильной упаковке и ярких эмоциях получателя.
    </p>

    <h3 className="text-2xl font-semibold text-[#000] mb-4">
      Букеты для всех праздников и важных событий
    </h3>
    <p className="text-base md:text-lg">
      В The Ame вы можете купить букет в Сочи на любой повод: 8 Марта, 14 февраля, Новый год, день рождения, юбилей, 
      выпускной, День матери, День учителя, свадьбу, годовщину, рождение ребёнка, корпоратив или просто «без повода» — 
      чтобы сказать «спасибо» или «люблю». У нас есть сезонные коллекции, подарочные корзины с фруктами и сладостями, 
      ароматные свечи и стильные вазы — всё, чтобы ваш подарок был особенным.
    </p>

    <p className="mt-8 text-base md:text-lg font-medium">
      Выберите букет или купите онлайн прямо сейчас — и пусть цветы The Ame создадут настроение, 
      наполняя каждый момент красотой и теплом.
    </p>
  </div>
</section>
    </div>
  );
}
