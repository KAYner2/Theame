import { useRef } from "react";
import type { EmblaPluginType } from "embla-carousel";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useHeroSlides } from "@/hooks/useHeroSlides";
import Autoplay from "embla-carousel-autoplay";

/**
 * Хиро-слайдер (белый фон, почти во всю ширину, не «упирается» в низ):
 * - фон секции белый
 * - бесконечный цикл + автоплей
 * - стрелки: круглый фон #fff8ea, иконка #819570
 * - по высоте оставляет снизу приятный отступ
 * - по бокам почти до края
 * ТЗ: без текстовых слоёв и без точек-индикаторов.
 */
export function HeroCarousel() {
  const { data: slides, isLoading } = useHeroSlides();

  // обход типовой несовместимости типов плагина
  const autoplay = useRef(
    Autoplay({ delay: 5000, stopOnInteraction: false }) as unknown as EmblaPluginType
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
          opts={{ loop: true, align: "start", duration: 24 }}
          className="w-full"
        >
          <CarouselContent>
            {slides.map((slide, idx) => (
              <CarouselItem key={slide.id}>
                <div className="w-full flex items-center justify-center">
                  {/* Большая карточка-слайд: почти в край по ширине, но оставляем дыхание */}
                  <div className="relative w-[96%] md:w-[94%] lg:w-[92%] h-[46vh] md:h-[54vh] lg:h-[60vh] max-h-[820px] rounded-3xl overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.18)]">
                    {/* Чистое изображение без текстовых оверлеев и градиентов */}
                    <img
                      src={slide.image_url}
                      alt={slide.alt ?? slide.title ?? "Слайд"}
                      className="absolute inset-0 w-full h-full object-cover"
                      loading={idx === 0 ? "eager" : "lazy"}
                      draggable={false}
                    />
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>

          {/* Стрелки: круглый фон #fff8ea, стрелки #819570 */}
          <CarouselPrevious
            className="left-2 md:left-5 top-1/2 -translate-y-1/2 rounded-full w-10 h-10 md:w-12 md:h-12 
                       bg-[#fff8ea] text-[#819570] shadow-sm hover:shadow-md hover:bg-[#fff2d6]
                       border-0 focus-visible:ring-2 focus-visible:ring-[#819570]/40"
            aria-label="Предыдущий слайд"
          />
          <CarouselNext
            className="right-2 md:right-5 top-1/2 -translate-y-1/2 rounded-full w-10 h-10 md:w-12 md:h-12 
                       bg-[#fff8ea] text-[#819570] shadow-sm hover:shadow-md hover:bg-[#fff2d6]
                       border-0 focus-visible:ring-2 focus-visible:ring-[#819570]/40"
            aria-label="Следующий слайд"
          />

          {/* Индикаторы (точки) — УДАЛЕНО по ТЗ */}
        </Carousel>
      </div>
    </section>
  );
}
