import { useRef } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useHeroSlides } from "@/hooks/useHeroSlides";
import Autoplay from "embla-carousel-autoplay";

export function HeroCarousel() {
  const { data: slides, isLoading } = useHeroSlides();

  // Если версии Embla ещё не выровнены — оставь any, чтобы не ловить конфликт типов
  const autoplay = useRef<any>(
    Autoplay({
      delay: 5000,
      stopOnInteraction: true,      // <— ключевой фикс «прыжка на 2»
      stopOnMouseEnter: true,       // приятнее для UX
      // playOnInit: true (по умолчанию и так true)
    })
  );

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
      <div className="relative z-10">
        <Carousel
          plugins={[autoplay.current]}
          opts={{
            loop: true,                 // бесконечная прокрутка
            align: "center",            // центр — визуально мягче на один-слайдовом режиме
            slidesToScroll: 1,
            duration: 20,               // плавность анимации
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
                      draggable={false}
                    />
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>

          {/* Стрелки. Сбрасываем таймер автоплея после ручного шага */}
          <CarouselPrevious
            onClick={() => autoplay.current?.reset()}
            className="left-2 md:left-5 top-1/2 -translate-y-1/2 rounded-full w-10 h-10 md:w-12 md:h-12 
                       bg-[#fff8ea] text-[#819570] shadow-sm hover:shadow-md hover:bg-[#fff2d6]
                       border-0 focus-visible:ring-2 focus-visible:ring-[#819570]/40"
            aria-label="Предыдущий слайд"
          />
          <CarouselNext
            onClick={() => autoplay.current?.reset()}
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
