// src/pages/Home.tsx
import { useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { HeroCarousel } from '../components/HeroCarousel';
import { FeaturedProducts } from '../components/FeaturedProducts';
import { ReviewsSection } from '../components/ReviewsSection';
import { WelcomeBonusModal } from '../components/WelcomeBonusModal';

export default function Home() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

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

        <meta name="twitter:card" content="summary_large_image" />
        {/* <link rel="canonical" href="https://your-domain.ru/" /> */}
      </Helmet>

      <WelcomeBonusModal />
      <HeroCarousel />
      <FeaturedProducts />
      <ReviewsSection />

      {/* ====== Расширенный SEO-блок ====== */}
      <section
        className="py-24 bg-white"
        aria-labelledby="seo-the-ame"
      >
        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-6xl text-center">
            {/* Главный заголовок */}
            <h2
              id="seo-the-ame"
              className="text-4xl md:text-5xl font-extrabold leading-tight tracking-tight text-[#000]"
            >
              The Ame — цветочный магазин в Сочи, где каждый букет говорит о чувствах.
            </h2>

            {/* Подзаголовок */}
            <p className="mt-6 text-xl md:text-2xl leading-relaxed text-[#7e7e7e]">
              Свежесть и стиль в каждом лепестке
            </p>

            {/* Декоративный разделитель */}
            <div className="mt-10 mx-auto h-px w-28 bg-[#eaeaea]" />

            {/* Блок 1 */}
            <div className="mt-12 text-left md:text-center">
              <p className="mx-auto max-w-4xl text-lg md:text-xl leading-8 text-[#4b4b4b]">
                The Ame — уютный цветочный магазин в Сочи на ул. Донская, 10А, где цветы подбирают с душой.
                В нашем каталоге — монобукеты из роз, пионов, хризантем, гортензий, тюльпанов и ромашек,
                а также авторские букеты, композиции в коробках или корзинах, и премиум-букеты для особых случаев.
                Каждый цветок свежий и отборный, а гарантия на 3 дня даёт уверенность в качестве:
                если букет не понравится — заменим бесплатно.
              </p>
            </div>

            {/* Разделитель */}
            <div className="mt-12 mx-auto h-px w-24 bg-[#f0f0f0]" />

            {/* Блок 2 */}
            <div className="mt-12">
              <h3 className="text-2xl md:text-3xl font-semibold text-[#000]">
                Быстрая доставка цветов по всему Сочи
              </h3>
              <p className="mt-5 mx-auto max-w-4xl text-lg md:text-xl leading-8 text-[#4b4b4b]">
                Закажите доставку цветов в Сочи — мы привезём букет уже через 45 минут. Работаем во всех районах:
                Центр, Адлер, Хоста, Сириус, Мацеста, Лоо, Дагомыс и Красная Поляна. Это идеальный способ подарить
                цветы в Сочи любимой девушке, жене, маме, бабушке, сестре, подруге, коллеге, учителю или начальнику.
                Мы позаботимся о стильной упаковке и ярких эмоциях получателя.
              </p>
            </div>

            {/* Разделитель */}
            <div className="mt-12 mx-auto h-px w-24 bg-[#f0f0f0]" />

            {/* Блок 3 */}
            <div className="mt-12">
              <h3 className="text-2xl md:text-3xl font-semibold text-[#000]">
                Букеты для всех праздников и важных событий
              </h3>
              <p className="mt-5 mx-auto max-w-4xl text-lg md:text-xl leading-8 text-[#4b4b4b]">
                В The Ame вы можете купить букет в Сочи на любой повод: 8 Марта, 14 февраля, Новый год,
                день рождения, юбилей, выпускной, День матери, День учителя, свадьбу, годовщину, рождение ребёнка,
                корпоратив или просто «без повода» — чтобы сказать «спасибо» или «люблю». У нас есть сезонные коллекции,
                подарочные корзины с фруктами и сладостями, ароматные свечи и стильные вазы — всё, чтобы ваш подарок был особенным.
              </p>
            </div>

            {/* CTA-текст */}
            <p className="mt-14 mx-auto max-w-3xl text-lg md:text-xl font-medium leading-8 text-[#2b2b2b]">
              Выберите букет или купите онлайн прямо сейчас — и пусть цветы The Ame создадут настроение,
              наполняя каждый момент красотой и теплом.
            </p>
          </div>
        </div>
      </section>
      {/* ====== /Расширенный SEO-блок ====== */}
    </div>
  );
}
