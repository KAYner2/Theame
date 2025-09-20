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
 * Хиро-слайдер:
 * - почти на всю высоту экрана
 * - бесконечный цикл + автоплей
 * - стрелки: круглый фон #fff8ea, иконка #819570
 * - «скруглённые» переходы по углам секции (бежевый → светлый)
 */
export function HeroCarousel() {
  const { data: slides, isLoading } = useHeroSlides();

  // Патчим типы плагина, если версии embla-react и embla разные
  const autoplay = useRef(
    Autoplay({ delay: 5000, stopOnInteraction: false }) as unknown as EmblaPluginType
  );

  // Высота секции: почти fullscreen, но с запасом под шапку/брендинг
  // На мобиле ~60vh, на десктопе растёт до ~78vh
  const sectionHeight =
    "min-h-[60vh] md:min-h-[70vh] lg:min-h-[78vh]";

  if (isLoading || !slides?.length) {
    return (
      <section className={`relative bg-[#fff8ea] ${sectionHeight}`}>
        {/* Угловые «скругления» */}
        <CornerFades />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-[92%] md:w-[86%] lg:w-[78%] h-[320px] md:h-[440px] bg-[#ece9e2] rounded-3xl shadow-xl animate-pulse" />
        </div>
      </section>
    );
  }

  return (
    <section className={`relative bg-[#fff8ea] ${sectionHeight}`}>
      {/* Угловые «скругления» (бежевый → прозрачный) */}
      <CornerFades />

      <div className="relative z-10 h-full">
        <Carousel
          plugins={[autoplay.current]}
          opts={{ loop: true, align: "start", duration: 24 }}
          className="h-full"
        >
          <CarouselContent className="h-full">
            {slides.map((slide) => (
              <CarouselItem key={slide.id} className="h-full">
                <div className="h-full w-full flex items-center justify-center">
                  {/* Карточка-слайд (как на рефе: большой скруглённый прямоугольник) */}
                  <div className="relative w-[92%] md:w-[86%] lg:w-[78%] h-[58vh] md:h-[66vh] lg:h-[72vh] max-h-[900px] rounded-3xl overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.18)]">
                    {/* Фон-картинка */}
                    <div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{ backgroundImage: `url(${slide.image_url})` }}
                    />
                    {/* Лёгкий тёмный градиент слева, чтобы текст читался */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-black/20 to-transparent pointer-events-none" />

                    {/* Контент слайда (заголовок/подзаголовок/плашка «доставляем…») */}
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
                        <span
                          key={i}
                          className="w-2 h-2 rounded-full bg-white/60"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>

          {/* Стрелки: круглый фон #fff8ea, иконка #819570 */}
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

/** Мягкие «скруглённые» переходы в углах секции */
function CornerFades() {
  return (
    <>
      <div className="pointer-events-none absolute left-0 top-0 w-[18vw] h-[18vw] max-w-[280px] max-h-[280px] opacity-70 rounded-br-[60%]
        bg-[radial-gradient(circle_at_0_0,#ffe9c3_35%,transparent_60%)]" />
      <div className="pointer-events-none absolute right-0 top-0 w-[18vw] h-[18vw] max-w-[280px] max-h-[280px] opacity-70 rounded-bl-[60%]
        bg-[radial-gradient(circle_at_100%_0,#ffe9c3_35%,transparent_60%)]" />
      <div className="pointer-events-none absolute left-0 bottom-0 w-[18vw] h-[18vw] max-w-[280px] max-h-[280px] opacity-70 rounded-tr-[60%]
        bg-[radial-gradient(circle_at_0_100%,#ffe9c3_35%,transparent_60%)]" />
      <div className="pointer-events-none absolute right-0 bottom-0 w-[18vw] h-[18vw] max-w-[280px] max-h-[280px] opacity-70 rounded-tl-[60%]
        bg-[radial-gradient(circle_at_100%_100%,#ffe9c3_35%,transparent_60%)]" />
    </>
  );
}
