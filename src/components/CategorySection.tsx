import { Link } from 'react-router-dom';
import { Card, CardContent } from './ui/card';
import { useCategories } from '@/hooks/useCategories';
import { slugify } from '@/utils/slugify';

/** Нормализация имени категории (первую букву делаем заглавной) */
const normalizeCategoryName = (name: string) => {
  if (!name) return '';
  const s = name.trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export function CategorySection() {
  const { data: categories = [], isLoading, error } = useCategories();

  if (isLoading) {
    return (
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">Коллекции</h2>
          <div className="text-center">
            <p className="text-muted-foreground">Загрузка категорий...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">Коллекции</h2>
          <div className="text-center">
            <p className="text-destructive">
              Ошибка загрузки категорий
              {(error as any)?.message ? `: ${(error as any).message}` : ''}
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (!categories.length) {
    return (
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">Коллекции</h2>
          <div className="text-center">
            <p className="text-muted-foreground">Пока нет категорий</p>
          </div>
        </div>
      </section>
    );
  }

  // ✅ Убираем дубли по имени (если вдруг есть)
  const uniqueCategories = Array.from(
    new Map(
      categories.map((c) => [normalizeCategoryName(c.name), c])
    ).values()
  );

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-12">Коллекции</h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {uniqueCategories.map((category) => {
            const name = normalizeCategoryName(category.name);
            const slug = slugify(name);

            return (
              <Link
                key={category.id}
                to={`/catalog?category=${slug}`}
                aria-label={`Открыть категорию ${name}`}
              >
                <Card className="group overflow-hidden border-0 shadow-soft hover:shadow-elegant transition-all duration-300 aspect-square">
                  <CardContent className="p-0 h-full relative">
                    <div
                      className="absolute inset-0 bg-cover bg-center bg-no-repeat transform group-hover:scale-110 transition-transform duration-500"
                      style={{
                        backgroundImage: `url(${
                          category.image_url || '/placeholder.svg'
                        })`,
                      }}
                    >
                      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />
                    </div>

                    <div className="absolute bottom-0 left-0 p-2 sm:p-4 lg:p-6">
                      <h3 className="text-sm sm:text-lg lg:text-2xl font-bold text-white mb-1 sm:mb-2">
                        {name}
                      </h3>

                      {category.description && (
                        <p className="text-white/80 text-xs sm:text-sm hidden sm:block">
                          {category.description}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
