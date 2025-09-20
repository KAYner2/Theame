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

export function HeroCarousel() {
  const { data: slides, isLoading } = useHeroSlides();

  // Патч типов, чтобы не ругался TS при расхождении версий
  const autoplay = useRef(
    Autoplay({ delay: 5000, stopOnInteraction: false }) as unknown as EmblaPluginType
  );

  // Скелетон — той же высоты, что и слайды
  if (isLoading || !slides || slides.length === 0) {
    return (
      <section className="relative bg-[#fff8ea]">
        <div className="h-[calc(100vh-84px)] min-h-[520px] flex items-center justify-center">
          <div className="w-full max-w-4xl mx-4 h-[420px] bg-muted rounded-3xl animate-pulse" />
        </div>
      </section>
    );
  }

  return (
    <section className="relative bg-[#fff8ea]">
      <Carousel
        plugins={[autoplay.current]}
        opts={{ loop: true, align: "start", duration: 25 }}
        className="h-[calc(100vh-84px)] min-h-[520px]"
      >
        <CarouselContent className="h-full">
          {slides.map((slide) => (
            <CarouselItem key={slide.id} className="h-full">
              <div className="relative h-full w-full overflow-hidden">
                {/* фон-картинка */}
                <div
                  className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                  style={{ backgroundImage: `url(${slide.image_url})` }}
                />
                {/* лёгкий градиент для читаемости (почти незаметный) */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/10 pointer-events-none" />

                {/* контент (если нужен) */}
                <div className="relative z-10 h-full flex items-center px-6 md:px-10">
                  <div className="max-w-xl">
                    {slide.title && (
                      <h2 className="text-2xl md:text-4xl font-semibold text-[#2f3b2f] drop-shadow-[0_1px_0_rgba(255,255,255,0.6)] mb-2">
                        {slide.title}
                      </h2>
                    )}
                    {slide.subtitle && (
                      <p className="text-sm md:text-base text-[#2f3b2f]/80 drop-shadow-[0_1px_0_rgba(255,255,255,0.6)]">
                        {slide.subtitle}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* стрелки: круглая подложка #fff8ea, стрелка #819570 */}
        <CarouselPrevious
          className="left-3 md:left-5 top-1/2 -translate-y-1/2 rounded-full w-10 h-10 md:w-12 md:h-12 
                     bg-[#fff8ea] text-[#819570] shadow-sm hover:shadow-md hover:bg-[#fff2d6]
                     border-0 focus-visible:ring-2 focus-visible:ring-[#819570]/40"
        />
        <CarouselNext
          className="right-3 md:right-5 top-1/2 -translate-y-1/2 rounded-full w-10 h-10 md:w-12 md:h-12 
                     bg-[#fff8ea] text-[#819570] shadow-sm hover:shadow-md hover:bg-[#fff2d6]
                     border-0 focus-visible:ring-2 focus-visible:ring-[#819570]/40"
        />
      </Carousel>
    </section>
  );
}
