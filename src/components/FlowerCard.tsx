import { Link } from 'react-router-dom';
import { Flower } from '../types/flower';
import { Badge } from './ui/badge';
import { useCart } from '../context/CartContext';
import { useToast } from '../hooks/use-toast';
import { buildProductUrl } from '@/utils/buildProductUrl';
import { Button } from './ui/button';

interface FlowerCardProps {
  flower: Flower;
  onToggleFavorite?: (flower: Flower) => void;
}

export const FlowerCard = ({ flower }: FlowerCardProps) => {
  const { addToCart } = useCart();
  const { toast } = useToast();

  const handleAddToCart = () => {
    addToCart(flower);
    toast({
      title: 'Товар добавлен в корзину',
      description: `${flower.name} добавлен в корзину`,
    });
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
      <Link to={productUrl} className="block">
        {/* Фото */}
        <div className="relative h-[520px] overflow-hidden rounded-xl">
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
        <div className="mt-3 space-y-2">
          {/* Название */}
          <h3 className="text-sm font-normal text-gray-700 line-clamp-2">
            {flower.name}
          </h3>

          {/* Цена */}
          <p className="text-lg font-semibold text-gray-900">
            {flower.price.toLocaleString()} ₽
          </p>

          {/* Кнопка */}
          <Button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleAddToCart();
            }}
            disabled={!flower.inStock}
            className="
              px-6 py-2 rounded-full text-sm font-medium
              bg-[#819570] text-white
              hover:bg-white hover:text-[#819570] hover:border hover:border-[#819570]
              transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            {flower.inStock ? 'В корзину' : 'Нет в наличии'}
          </Button>
        </div>
      </Link>
    </div>
  );
};
