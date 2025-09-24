import { Link } from 'react-router-dom';
import { Flower } from '../types/flower';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Heart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import { useToast } from '../hooks/use-toast';
import { buildProductUrl } from '@/utils/buildProductUrl'; // 👈 общий конструктор ссылки
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

  // ✅ Единый “топовый” URL
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
        <Card className="overflow-hidden bg-primary-soft/30 border border-primary/10 hover:shadow-soft transition-all duration-300 hover:scale-[1.02] rounded-2xl h-full flex flex-col">
          {/* Фото */}
          <div className="relative aspect-square overflow-hidden rounded-t-2xl">
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
          <div className="p-4 flex-1 flex flex-col">
            <h3 className="font-medium text-foreground text-sm mb-4 line-clamp-2 leading-relaxed uppercase flex-1">
              {flower.name}
            </h3>

            <div className="mt-auto">
              <span className="block text-lg font-bold text-foreground mb-3">
                {flower.price.toLocaleString()} ₽
              </span>

              {/* 👉 Кнопка «В корзину» */}
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleAddToCart();
                }}
                disabled={!flower.inStock}
                className="
                  w-full h-11
                  bg-[#819570] text-white
                  hover:bg-white hover:text-[#819570] hover:border hover:border-[#819570]
                  transition-colors
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                {flower.inStock ? 'В корзину' : 'Нет в наличии'}
              </Button>
            </div>

            {/* Кнопка избранного */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleToggleFavorite();
              }}
              className={`mt-3 p-2 w-full rounded-md text-center transition-all duration-200 ${
                isInFavorites
                  ? 'bg-destructive text-destructive-foreground'
                  : 'bg-muted hover:bg-destructive hover:text-destructive-foreground'
              }`}
            >
              <Heart
                className={`inline-block w-4 h-4 mr-1 ${
                  isInFavorites ? 'fill-current' : ''
                }`}
              />
              {isInFavorites ? 'Убрать из избранного' : 'В избранное'}
            </button>
          </div>
        </Card>
      </Link>
    </div>
  );
};
