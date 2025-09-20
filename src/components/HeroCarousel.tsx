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

  // Автопрокрутка + не останавливать при взаимодействии
  const plugin = useRef(
    Autoplay({ delay: 5000, stopOnInteraction: false })
  );

  if (isLoading || !slides || slides.length === 0) {
    return (
      <section className="relative overflow-hidden">
        <div className="h-[calc(100vh-84px)] bg-[#fff8ea]">
          <div className="h-full max-w-5xl mx-auto px-4 flex items-center justify-center">
            <div className="w-full h-[420px] bg-muted rounded-3xl animate-pulse" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden bg-[#fff8ea]">
      {/* декоративные закруглённые переходы по углам */}
      <div className="pointer-events-none absolute inset-0">
        {/* слева сверху */}
        <div className="absolute left-0 top-0 w-[18vw] h-[18vw] max-w-[280px] max-h-[280px] rounded-br-[60%] 
                        bg-[radial-gradient(circle_at_0%_0%,#ffe9c3_0%,#ffe9c3_35%,transparent_60%)] opacity-90" />
        {/* справа сверху */}
        <div className="absolute right-0 top-0 w-[18vw] h-[18vw] max-w-[280px] max-h-[280px] rounded-bl-[60%]
                        bg-[radial-gradient(circle_at_100%_0%,#ffe9c3_0%,#ffe9c3_35%,transparent_60%)] opacity-90" />
        {/* слева снизу */}
        <div className="absolute left-0 bottom-0 w-[18vw] h-[18vw] max-w-[280px] max-h-[280px] rounded-tr-[60%]
                        bg-[radial-gradient(circle_at_0%_100%,#ffe9c3_0%,#ffe9c3_35%,transparent_60%)] opacity-90" />
        {/* справа снизу */}
        <div className="absolute right-0 bottom-0 w-[18vw] h-[18vw] max-w-[280px] max-h-[280px] rounded-tl-[60%]
                        bg-[radial-gradient(circle_at_100%_100%,#ffe9c3_0%,#ffe9c3_35%,transparent_60%)] opacity-90" />
      </div>

      <div className="h-[calc(100vh-84px)]">
        <Carousel
          plugins={[plugin.current]}
          // бесконечный цикл и плавность
          opts={{ loop: true, align: "start", duration: 25 }}
          className="h-full"
        >
          <CarouselContent className="h-full">
            {slides.map((slide) => (
              <CarouselItem key={slide.id} className="h-full">
                <div className="relative h-full overflow-hidden">
                  {/* фон-картинка */}
                  <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                    style={{ backgroundImage: `url(${slide.image_url})` }}
                  />
                  {/* лёгкий вертикальный градиент для читаемости (сверху-чуть/снизу-чуть) */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-black/0 to-black/10 pointer-events-none" />

                  {/* контент слайда (если нужен) */}
                  <div className="relative z-10 h-full flex items-center justify-start px-6 md:px-10">
                    <div className="max-w-xl text-[#2f3b2f] drop-shadow-[0_1px_0_rgba(255,255,255,0.6)]">
                      {slide.title && (
                        <h2 className="text-2xl md:text-4xl font-semibold text-[#2f3b2f] mb-2">
                          {slide.title}
                        </h2>
                      )}
                      {slide.subtitle && (
                        <p className="text-sm md:text-base text-[#2f3b2f]/80">
                          {slide.subtitle}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>

          {/* стрелки */}
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
      </div>
    </section>
  );
}
