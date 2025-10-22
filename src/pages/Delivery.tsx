import { useEffect } from 'react';
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
      {/* Hero */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-[#7e7e7e]">
            Доставка цветов по Сочи и району
          </h1>
          <p className="text-lg md:text-xl text-[#7e7e7e]/90 max-w-3xl mx-auto">
            Срочная и круглосуточная доставка свежих букетов по всему Сочи — от центра до Адлера и Красной Поляны.
            Бесплатная доставка при заказе от указанной суммы.
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
                🌙 Доставка круглосуточная. В ночное время стоимость рассчитывается индивидуально.
              </p>
            </CardContent>
          </Card>

          {/* SEO-текст и блок услуг */}
          <div className="mt-12 bg-white p-6 md:p-10 rounded-lg shadow-soft text-[#7e7e7e]">
            <h2 className="text-2xl font-semibold mb-4 text-[#000]">
              По типу услуги
            </h2>
            <ul className="list-disc ml-6 space-y-2">
              <li><strong>Срочная доставка цветов по Сочи</strong> — привезём букет в течение 1–2 часов после оформления заказа.</li>
              <li><strong>Доставка цветов круглосуточно в Сочи</strong> — работаем 24/7, чтобы радовать ваших близких даже ночью.</li>
              <li><strong>Доставка цветов в хоспис, больницу или отель</strong> — аккуратно и с заботой передадим букет получателю в любое учреждение.</li>
              <li><strong>Доставка букетов в Адлер, Хосту и центр Сочи</strong> — охватываем все районы, включая пригороды и жилые комплексы.</li>
              <li><strong>Доставка букетов в Сириус, Дагомыс, Лоо и Красную Поляну</strong> — даже в горные посёлки доставим свежие цветы без задержек.</li>
              <li><strong>Индивидуальные заказы</strong> — подберём композицию и доставим её по любому адресу в Сочи.</li>
            </ul>

            <h2 className="text-2xl font-semibold mt-10 mb-4 text-[#000]">
              Почему выбирают нашу доставку
            </h2>
            <ul className="list-disc ml-6 space-y-2">
              <li>Только свежие цветы, закупаем ежедневно у проверенных поставщиков.</li>
              <li>Флористы с опытом более 5 лет — каждый букет собирается вручную.</li>
              <li>Фотоотчёт перед отправкой — вы видите, что получит ваш адресат.</li>
              <li>Круглосуточная служба поддержки — мы всегда на связи.</li>
              <li>Бесплатная доставка при заказе от 5000 ₽.</li>
            </ul>

            <p className="mt-8 text-base">
              Мы доставляем цветы по Сочи, Адлеру, Хосте, Лоо, Мацесте, Сириусу и Красной Поляне.
              Хотите порадовать близкого человека? Просто оформите заказ онлайн — и наш курьер быстро привезёт свежий букет в нужное место.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
