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
  const plugin = useRef(
    Autoplay({ delay: 5000, stopOnInteraction: false })
  );

  if (isLoading || !slides || slides.length === 0) {
    return (
      <section className="h-screen relative overflow-hidden flex items-center justify-center">
        <div className="w-full max-w-4xl mx-auto px-4 h-[400px] bg-muted rounded-3xl animate-pulse" />
      </section>
    );
  }

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <Carousel 
          plugins={[plugin.current]}
          className="w-full"
        >
          <CarouselContent>
            {slides.map((slide) => (
              <CarouselItem key={slide.id}>
                <div className="relative h-[450px] rounded-2xl overflow-hidden shadow-xl bg-gradient-to-br from-slate-900 to-slate-700">
                  <div 
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                    style={{ backgroundImage: `url(${slide.image_url})` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
                  </div>
                  
                  <div className="relative z-10 h-full flex items-center px-8">
                    <div className="max-w-xl">
                      {slide.title && (
                        <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">
                          {slide.title}
                        </h1>
                      )}
                      {slide.subtitle && (
                        <p className="text-lg md:text-xl text-white/90 mb-6">
                          {slide.subtitle}
                        </p>
                      )}
                      
                      <div className="flex items-center text-white/80">
                        <div className="w-5 h-5 rounded-full border-2 border-white/60 mr-3 flex items-center justify-center">
                          <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse" />
                        </div>
                        <span className="text-sm uppercase tracking-wider">
                          Доставляем от 30 минут
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Slide indicators */}
                  <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2">
                    {slides.map((_, index) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full ${
                          slides.indexOf(slide) === index
                            ? 'bg-white'
                            : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </section>
  );
}