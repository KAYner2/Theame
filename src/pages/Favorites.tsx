import { useEffect } from 'react';
import { useFavorites } from '../context/FavoritesContext';
import { FlowerCard } from '../components/FlowerCard';
import { Button } from '../components/ui/button';
import { Heart, Trash2 } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

export default function Favorites() {
  const { state, removeFromFavorites, clearFavorites } = useFavorites();
  const { toast } = useToast();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleRemoveFromFavorites = (flower: any) => {
    removeFromFavorites(flower.id);
    toast({
      title: "Удалено из избранного",
      description: `${flower.name} удален из избранного`,
    });
  };

  const handleClearFavorites = () => {
    clearFavorites();
    toast({
      title: "Избранное очищено",
      description: "Все товары удалены из избранного",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-soft">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Heart className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Избранное</h1>
              <p className="text-muted-foreground">
                {state.itemCount > 0 
                  ? `${state.itemCount} ${state.itemCount === 1 ? 'товар' : state.itemCount < 5 ? 'товара' : 'товаров'}`
                  : 'Пусто'
                }
              </p>
            </div>
          </div>
          
          {state.itemCount > 0 && (
            <Button
              variant="outline"
              onClick={handleClearFavorites}
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Очистить все
            </Button>
          )}
        </div>

        {/* Content */}
        {state.itemCount === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted/50 flex items-center justify-center">
              <Heart className="w-12 h-12 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              В избранном пока пусто
            </h2>
            <p className="text-muted-foreground mb-6">
              Добавляйте понравившиеся товары в избранное, нажимая на сердечко
            </p>
            <Button asChild>
              <a href="/catalog">Перейти в каталог</a>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {state.items.map((flower) => (
              <FlowerCard
                key={flower.id}
                flower={flower}
                onToggleFavorite={handleRemoveFromFavorites}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}