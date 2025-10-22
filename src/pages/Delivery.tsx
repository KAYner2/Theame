import { useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

export default function Delivery() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const deliveries = [
    { area: "Центр Сочи", freeFrom: 5000, price: 300 },
    { area: "Дагомыс, Мацеста", freeFrom: 7000, price: 700 },
    { area: "Хоста", freeFrom: 10000, price: 1000 },
    { area: "Адлер", freeFrom: 12000, price: 1200 },
    { area: "Лоо", freeFrom: 12000, price: 1200 },
    { area: "Сириус", freeFrom: 15000, price: 1500 },
    { area: "п. Красная поляна", freeFrom: 20000, price: 1800 },
    { area: "п. Эсто-Садок", freeFrom: 20000, price: 2000 },
    { area: "п. Роза-Хутор", freeFrom: 20000, price: 2200 },
    { area: "На высоту 960м (Роза-Хутор/Горки город)", freeFrom: 25000, price: 2400 },
  ];

  return (
    <div className="min-h-screen bg-[#fff8ea]">
      {/* Мета-теги для SEO */}
      <Helmet>
        <title>The Ame — Быстрая доставка цветов по Сочи</title>
        <meta
          name="description"
          content="Доставка цветов и букетов по Сочи, Адлеру, Красной Поляне, Сириусу, Хосте, Дагомысу и Мацесте. Срочная и круглосуточная доставка свежих букетов — закажите онлайн!"
        />
        <meta
          name="keywords"
          content="доставка цветов Сочи, доставка букетов Сочи, быстрая доставка цветов Сочи, заказать цветы Сочи, заказать букет Сочи, доставка цветов Адлер, доставка цветов Хоста, доставка цветов Сириус, доставка цветов Красная Поляна, доставка цветов Дагомыс, доставка цветов Мацеста"
        />
      </Helmet>

      {/* Hero */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-[#7e7e7e]">
            Доставка цветов по Сочи
          </h1>
          <p className="text-lg md:text-xl text-[#7e7e7e]/90 max-w-3xl mx-auto">
            Срочная и круглосуточная доставка свежих букетов по всему Сочи — от центра до Адлера и Красной Поляны.
            Мы быстро и бережно доставим цветы в любую точку города.
          </p>
        </div>
      </section>

      {/* Стоимость доставки */}
      <section className="py-10 md:py-14">
        <div className="container mx-auto px-4">
          <Card className="border-0 shadow-soft bg-white">
            <CardHeader>
              <CardTitle className="text-2xl text-[#7e7e7e]">
                Стоимость доставки по районам Сочи
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-[#eaeaea]">
                {deliveries.map((d, i) => (
                  <div
                    key={i}
                    className="py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2"
                  >
                    <div className="text-base md:text-lg text-[#000]">
                      {d.area}
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm md:text-base">
                      <div className="text-[#7e7e7e]">
                        до {d.freeFrom.toLocaleString('ru-RU')} ₽ —{" "}
                        <span className="text-[#000]">{d.price} ₽</span>
                      </div>
                      <div className="text-[#7e7e7e] sm:ml-4">
                        от {d.freeFrom.toLocaleString('ru-RU')} ₽ —{" "}
                        <span className="text-[#000]">Бесплатно</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <p className="mt-6 text-sm md:text-base text-[#7e7e7e]">
                 Доставка работает круглосуточно. В ночное время стоимость рассчитывается индивидуально.
              </p>
            </CardContent>
          </Card>

          {/* SEO-текст и блок услуг */}
          <div className="mt-12 bg-white p-6 md:p-10 rounded-lg shadow-soft text-[#7e7e7e]">
            <h2 className="text-2xl font-semibold mb-4 text-[#000]">
              Как мы доставляем цветы по Сочи
            </h2>
            <ul className="list-disc ml-6 space-y-2">
              <li><strong>Срочная доставка цветов по Сочи</strong> — привезём букет уже через 1–2 часа после оформления заказа.</li>
              <li><strong>Круглосуточная доставка букетов</strong> — мы доставляем 24/7, чтобы вы могли подарить радость в любое время суток.</li>
              <li><strong>Доставка букетов по районам Сочи</strong> — Адлер, Хоста, Центр, Сириус, Дагомыс, Лоо и Красная Поляна — доставим в любую часть города.</li>
              <li><strong>Индивидуальные заказы</strong> — создадим авторскую композицию и доставим по любому адресу в Сочи и пригороде.</li>
            </ul>

            <h2 className="text-2xl font-semibold mt-10 mb-4 text-[#000]">
              Почему выбирают нашу доставку цветов в Сочи
            </h2>
            <ul className="list-disc ml-6 space-y-2">
              <li>Свежие цветы премиум-класса, закупаем у проверенных поставщиков</li>
              <li>Опытные флористы с любовью собирают каждый букет вручную.</li>
              <li>Фотоотчёт перед доставкой — вы видите, что получит ваш адресат.</li>
              <li>Круглосуточная служба поддержки — ответим и поможем в любое время.</li>
              <li>Быстрая доставка — от 45 минут по городу Сочи.</li>
            </ul>

            <p className="mt-8 text-base">
              Мы доставляем цветы по всему Большому Сочи: Адлер, Хоста, Лоо, Мацеста, Сириус, Красная Поляна, Дагомыс и другие районы.
              Хотите заказать букет срочно? Просто оформите заказ в два клика онлайн — и наш курьер привезёт свежие цветы точно в срок.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
