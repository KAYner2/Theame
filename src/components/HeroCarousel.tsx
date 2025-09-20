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
 */
export function HeroCarousel() {
  const { data: slides, isLoading } = useHeroSlides();

  // обход типовой несовместимости типов плагина
  const autoplay = useRef(
    Autoplay({ delay: 5000, stopOnInteraction: false }) as unknown as EmblaPluginType
  );

  // Секция: белый фон + вертикальные отступы, чтобы снизу оставался gap
  const sectionClass =
    "relative bg-white py-6 md:py-8";

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
            {slides.map((slide) => (
              <CarouselItem key={slide.id}>
                <div className="w-full flex items-center justify-center">
                  {/* Большая карточка-слайд: почти в край по ширине, но оставляем дыхание */}
                  <div className="relative w-[96%] md:w-[94%] lg:w-[92%] h-[46vh] md:h-[54vh] lg:h-[60vh] max-h-[820px] rounded-3xl overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.18)]">
                    {/* Фон-изображение */}
                    <div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{ backgroundImage: `url(${slide.image_url})` }}
                    />

                    {/* Лёгкий затемняющий градиент слева для читабельности текста (оставил очень мягким) */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/35 via-black/15 to-transparent pointer-events-none" />

                    {/* Контент */}
                    <div className="relative z-10 h-full flex items-center px-6 md:px-10 lg:px-14">
                      <div className="max-w-3xl text-white">
                        {slide.title && (
                          <h2 className="text-3xl md:text-5xl font-extrabold leading-tight tracking-tight mb-3">
                            {slide.title}
                          </h2>
                        )}
                        {slide.subtitle && (
                          <p className="text-base md:text-lg opacity-95 mb-6">
                            {slide.subtitle}
                          </p>
                        )}

                        <div className="inline-flex items-center gap-3 text-white/90">
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full border-2 border-white/70">
                            <span className="block w-2 h-2 rounded-full bg-white/70 animate-pulse" />
                          </span>
                          <span className="text-xs md:text-sm uppercase tracking-wider">
                            Доставляем от 30 минут
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Индикаторы (точки) */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                      {slides.map((_, i) => (
                        <span key={i} className="w-2 h-2 rounded-full bg-white/70" />
                      ))}
                    </div>
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
          />
          <CarouselNext
            className="right-2 md:right-5 top-1/2 -translate-y-1/2 rounded-full w-10 h-10 md:w-12 md:h-12 
                       bg-[#fff8ea] text-[#819570] shadow-sm hover:shadow-md hover:bg-[#fff2d6]
                       border-0 focus-visible:ring-2 focus-visible:ring-[#819570]/40"
          />
        </Carousel>
      </div>
    </section>
  );
}
