import { Link } from 'react-router-dom';
import { Flower } from '../types/flower';
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
    <div className="group relative flex flex-col h-full">
      <Link to={productUrl} aria-label={flower.name} className="block">
        {/* 📸 Фото — квадрат 1:1, без рамок/теней, со скруглением */}
        <div className="relative overflow-hidden rounded-2xl aspect-square">
          <img
            src={flower.image}
            alt={flower.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        </div>

        {/* 📝 Название и цена */}
        <div className="mt-3 px-1">
          <h3 className="text-sm md:text-base font-normal leading-snug text-gray-800 line-clamp-2 min-h-[42px] md:min-h-0">
            {flower.name}
          </h3>

          <div className="mt-1 flex items-center justify-between">
            <span className="text-base md:text-lg font-semibold text-gray-900">
              {flower.price.toLocaleString()} ₽
            </span>

            {/* ❤️ Избранное */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleToggleFavorite();
              }}
              aria-pressed={isInFavorites}
              className={`p-2 rounded-full transition-all duration-200 ${
                isInFavorites
                  ? 'bg-destructive text-destructive-foreground'
                  : 'bg-muted hover:bg-destructive hover:text-destructive-foreground'
              }`}
              title={isInFavorites ? 'Убрать из избранного' : 'Добавить в избранное'}
            >
              <Heart className={`w-4 h-4 ${isInFavorites ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>
      </Link>

      {/* 🛒 Кнопка В корзину / Сделать предзаказ */}
      <div className="mt-2 px-1 mt-auto">
        {flower.inStock ? (
          <Button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleAddToCart();
            }}
            className="rounded-full px-6 h-10 text-sm md:text-base font-medium bg-[#819570] hover:bg-[#6f7f5f] text-white transition-colors"
          >
            В корзину
          </Button>
        ) : (
          <Button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              window.open('https://wa.me/message/XQDDWGSEL35LP1', '_blank');
            }}
            className="rounded-full px-6 h-10 text-sm md:text-base font-medium bg-[#819570] hover:bg-[#6f7f5f] text-white transition-colors"
          >
            Сделать предзаказ
          </Button>
        )}
      </div>
    </div>
  );
};
