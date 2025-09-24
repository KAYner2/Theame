import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

export default function Delivery() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const deliveries = [
    { area: 'Центр Сочи', freeFrom: 5000, price: 300 },
    { area: 'Дагомыс, Мацеста', freeFrom: 7000, price: 500 },
    { area: 'Хоста', freeFrom: 10000, price: 700 },
    { area: 'Адлер', freeFrom: 15000, price: 1000 },
    { area: 'Лоо', freeFrom: 15000, price: 1000 },
    { area: 'Сириус', freeFrom: 15000, price: 1200 },
    { area: 'п. Красная поляна', freeFrom: 20000, price: 1500 },
    { area: 'п. Эсто-Садок', freeFrom: 20000, price: 1700 },
    { area: 'п. Роза-Хутор', freeFrom: 20000, price: 1900 },
    { area: 'На высоту 960м (Роза-Хутор/Горки город)', freeFrom: 25000, price: 2100 },
  ];

  return (
    // ЕДИНЫЙ песочный фон на всю страницу
    <div className="min-h-screen bg-[#fff8ea]">
      {/* Hero */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-[#819570]">
            Доставка
          </h1>
          <p className="text-lg md:text-xl text-[#819570] max-w-3xl mx-auto">
            Стоимость и условия доставки по районам.
          </p>
        </div>
      </section>

      {/* Список */}
      <section className="py-10 md:py-14">
        <div className="container mx-auto px-4">
          <Card className="border-0 shadow-soft bg-white/60 rounded-xl">
            <CardHeader>
              <CardTitle className="text-2xl text-[#819570]">
                Стоимость доставки по районам
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-[#e8e2d6]">
                {deliveries.map((d, i) => (
                  <div
                    key={i}
                    className="py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2"
                  >
                    <div className="text-base md:text-lg text-[#819570]">
                      {d.area}
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm md:text-base">
                      <div className="text-[#819570]">
                        до {d.freeFrom.toLocaleString('ru-RU')} ₽ —{' '}
                        <span className="text-[#333]">{d.price} ₽</span>
                      </div>
                      <div className="text-[#819570] sm:ml-4">
                        от {d.freeFrom.toLocaleString('ru-RU')} ₽ —{' '}
                        <span className="text-[#333]">Бесплатно</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <p className="mt-6 text-sm md:text-base text-[#819570]">
                Доставка круглосуточная. В ночное время доставка рассчитывается индивидуально.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
