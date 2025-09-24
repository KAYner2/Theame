import { Link } from 'react-router-dom';
import { Flower } from '../types/flower';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Heart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import { useToast } from '../hooks/use-toast';
import { buildProductUrl } from '@/utils/buildProductUrl';
import { Button } from './ui/button';

interface FlowerCardProps {
  flower: Flower;
  onToggleFavorite?: (flower: Flower) => void;
}

export const FlowerCard = ({ flower, onToggleFavorite }: FlowerCardProps) => {
  const { addToCart } = useCart();
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorites();
  const { toast } = useToast();

  const isInFavorites = isFavorite(flower.id);

  const handleAddToCart = () => {
    addToCart(flower);
    toast({
      title: 'Товар добавлен в корзину',
      description: `${flower.name} добавлен в корзину`,
    });
  };

  const handleToggleFavorite = () => {
    if (isInFavorites) {
      removeFromFavorites(flower.id);
      toast({
        title: 'Удалено из избранного',
        description: `${flower.name} удален из избранного`,
      });
    } else {
      addToFavorites(flower);
      toast({
        title: 'Добавлено в избранное',
        description: `${flower.name} добавлен в избранное`,
      });
    }
    onToggleFavorite?.(flower);
  };

  const productUrl = buildProductUrl({
    id: flower.id,
    name: flower.name,
    productSlug: (flower as any).slug ?? null,
    categorySlug: (flower as any).categorySlug ?? null,
    categoryName: (flower as any).category ?? null,
  });

  return (
    <div className="group relative">
      <Link to={productUrl}>
        <Card className="overflow-hidden border border-primary/10 hover:shadow-soft transition-all duration-300 hover:scale-[1.02] rounded-2xl h-full flex flex-col">
          {/* Фото */}
          <div className="relative h-96 overflow-hidden rounded-t-2xl">
            <img
              src={flower.image}
              alt={flower.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            {!flower.inStock && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <Badge variant="destructive" className="text-white">
                  Нет в наличии
                </Badge>
              </div>
            )}
          </div>

          {/* Контент */}
          <div className="p-4 flex flex-col flex-1">
            <h3 className="font-medium text-foreground text-base mb-2 line-clamp-2 leading-relaxed">
              {flower.name}
            </h3>

            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-bold text-foreground">
                {flower.price.toLocaleString()} ₽
              </span>

              {/* Кнопка избранного (иконка) */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleToggleFavorite();
                }}
                className={`p-2 rounded-full transition-all duration-200 ${
                  isInFavorites
                    ? 'bg-destructive text-destructive-foreground'
                    : 'bg-muted hover:bg-destructive hover:text-destructive-foreground'
                }`}
              >
                <Heart
                  className={`w-4 h-4 ${isInFavorites ? 'fill-current' : ''}`}
                />
              </button>
            </div>

            {/* Кнопка «В корзину» */}
            <Button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleAddToCart();
              }}
              disabled={!flower.inStock}
              className="
                w-full h-11
                bg-[#E30613] text-white font-semibold
                hover:bg-white hover:text-[#E30613] hover:border hover:border-[#E30613]
                transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed
                rounded-b-2xl
              "
            >
              {flower.inStock ? 'В корзину' : 'Нет в наличии'}
            </Button>
          </div>
        </Card>
      </Link>
    </div>
  );
};
