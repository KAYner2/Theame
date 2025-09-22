import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

// 👉 Если у вас есть 2 фото для раздела доставки, положите их в assets и раскомментируйте/замените пути
// import delivery1 from '@/assets/delivery-1.jpg';
// import delivery2 from '@/assets/delivery-2.jpg';

export default function Delivery() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const deliveries = [
    { area: "Центр Сочи", freeFrom: 5000, price: 300 },
    { area: "Дагомыс, Мацеста", freeFrom: 7000, price: 500 },
    { area: "Хоста", freeFrom: 10000, price: 700 },
    { area: "Адлер", freeFrom: 15000, price: 1000 },
    { area: "Лоо", freeFrom: 15000, price: 1000 },
    { area: "Сириус", freeFrom: 15000, price: 1200 },
    { area: "п. Красная поляна", freeFrom: 20000, price: 1500 },
    { area: "п. Эсто-Садок", freeFrom: 20000, price: 1700 },
    { area: "п. Роза-Хутор", freeFrom: 20000, price: 1900 },
    { area: "На высоту 960м (Роза-Хутор/Горки город)", freeFrom: 25000, price: 2100 },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-[#7e7e7e]">Доставка</h1>
          <p className="text-lg md:text-xl text-[#7e7e7e]/90 max-w-3xl mx-auto">
            Стоимость и условия доставки по районам.
          </p>
        </div>
      </section>

      {/* 2 фото */}
      <section className="pb-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {/* Если есть реальные фото — используйте <img src={delivery1} .../> и <img src={delivery2} .../> */}
            <div className="relative rounded-xl overflow-hidden bg-[#f6f6f6] aspect-[16/10]">
              {/* <img src={delivery1} alt="Доставка — фото 1" className="w-full h-full object-cover" /> */}
              <div className="absolute inset-0 flex items-center justify-center text-[#7e7e7e]">
                Фото доставки #1
              </div>
            </div>
            <div className="relative rounded-xl overflow-hidden bg-[#f6f6f6] aspect-[16/10]">
              {/* <img src={delivery2} alt="Доставка — фото 2" className="w-full h-full object-cover" /> */}
              <div className="absolute inset-0 flex items-center justify-center text-[#7e7e7e]">
                Фото доставки #2
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Чистый список (без стрелок) */}
      <section className="py-10 md:py-14">
        <div className="container mx-auto px-4">
          <Card className="border-0 shadow-soft bg-white">
            <CardHeader>
              <CardTitle className="text-2xl text-[#7e7e7e]">
                Стоимость доставки по районам
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
                        до {d.freeFrom.toLocaleString('ru-RU')} ₽ — <span className="text-[#000]">{d.price} ₽</span>
                      </div>
                      <div className="text-[#7e7e7e] sm:ml-4">
                        от {d.freeFrom.toLocaleString('ru-RU')} ₽ — <span className="text-[#000]">Бесплатно</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Текст под списком — по ТЗ */}
              <p className="mt-6 text-sm md:text-base text-[#7e7e7e]">
                Доставка круглосуточная. В ночное время доставка рассчитывается индивидуально.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
