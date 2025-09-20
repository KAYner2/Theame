import { useEffect, useRef, useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { useHeroSlides } from "@/hooks/useHeroSlides";

export function HeroCarousel() {
  const { data: slides, isLoading } = useHeroSlides();
  const [api, setApi] = useState<CarouselApi | null>(null);
  const timerRef = useRef<number | null>(null);

  const AUTOPLAY_MS = 4500;

  const stop = () => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const start = () => {
    if (!api) return;
    stop();
    timerRef.current = window.setInterval(() => {
      // loop: true обеспечит мягкий переход с последнего на первый
      api.scrollNext();
    }, AUTOPLAY_MS);
  };

  useEffect(() => {
    if (!api) return;
    start();
    return () => stop();
  }, [api]);

  const sectionClass = "relative bg-white py-6 md:py-8";

  if (isLoading || !slides?.length) {
    return (
      <section className={sectionClass}>
        <div className="flex items-center justify-center">
          <div className="w-[96%] md:w-[94%] lg:w-[92%] h-[46vh] md:h-[54vh] lg:h-[60vh] bg-[#ece9e2] rounded-3xl shadow-xl animate-pulse" />
        </div>
      </section>
    );
  }

  return (
    <section className={sectionClass}>
      <div
        className="relative z-10"
        onMouseEnter={stop}
        onMouseLeave={start}
        onTouchStart={stop}
        onTouchEnd={start}
      >
        <Carousel
          setApi={setApi}
          opts={{
            loop: true,        // бесконечно
            align: "start",    // самый предсказуемый вариант для 1-слайд вью
            duration: 20,      // плавность
          }}
          className="w-full"
        >
          <CarouselContent>
            {slides.map((slide, idx) => (
              <CarouselItem key={slide.id} className="basis-full">
                <div className="w-full flex items-center justify-center">
                  <div className="relative w-[96%] md:w-[94%] lg:w-[92%] h-[46vh] md:h-[54vh] lg:h-[60vh] max-h-[820px] rounded-3xl overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.18)] will-change-transform">
                    <img
                      src={slide.image_url}
                      alt={slide.title ?? "Слайд"}
                      className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
                      loading={idx === 0 ? "eager" : "lazy"}
                      decoding="async"
                      draggable={false}
                    />
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>

          {/* Стрелки: сбрасываем и перезапускаем таймер после ручного шага */}
          <CarouselPrevious
            onClick={() => {
              stop();
              // сам скролл сделает внутренний обработчик кнопки
              start();
            }}
            className="left-2 md:left-5 top-1/2 -translate-y-1/2 rounded-full w-10 h-10 md:w-12 md:h-12 
                       bg-[#fff8ea] text-[#819570] shadow-sm hover:shadow-md hover:bg-[#fff2d6]
                       border-0 focus-visible:ring-2 focus-visible:ring-[#819570]/40"
            aria-label="Предыдущий слайд"
          />
          <CarouselNext
            onClick={() => {
              stop();
              start();
            }}
            className="right-2 md:right-5 top-1/2 -translate-y-1/2 rounded-full w-10 h-10 md:w-12 md:h-12 
                       bg-[#fff8ea] text-[#819570] shadow-sm hover:shadow-md hover:bg-[#fff2d6]
                       border-0 focus-visible:ring-2 focus-visible:ring-[#819570]/40"
            aria-label="Следующий слайд"
          />
        </Carousel>
      </div>
    </section>
  );
}
