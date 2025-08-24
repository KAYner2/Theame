import { Link } from 'react-router-dom';
import { Flower } from '../types/flower';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { ShoppingCart, Heart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import { useToast } from '../hooks/use-toast';

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
      title: "Товар добавлен в корзину",
      description: `${flower.name} добавлен в корзину`,
    });
  };

  const handleToggleFavorite = () => {
    if (isInFavorites) {
      removeFromFavorites(flower.id);
      toast({
        title: "Удалено из избранного",
        description: `${flower.name} удален из избранного`,
      });
    } else {
      addToFavorites(flower);
      toast({
        title: "Добавлено в избранное",
        description: `${flower.name} добавлен в избранное`,
      });
    }
    onToggleFavorite?.(flower);
  };

  // 👇 если есть оба слага — строим ЧПУ; иначе — fallback на /product/:id
  const productUrl =
    flower.categorySlug && flower.slug
      ? `/catalog/${flower.categorySlug}/${flower.slug}`
      : `/product/${flower.id}`;

  return (
    <div className="group relative">
      <Link to={productUrl}>
        <Card className="overflow-hidden bg-primary-soft/30 border border-primary/10 hover:shadow-soft transition-all duration-300 hover:scale-[1.02] rounded-2xl h-full flex flex-col">
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

          <div className="p-4 flex-1 flex flex-col">
            <h3 className="font-medium text-foreground text-sm mb-4 line-clamp-2 leading-relaxed uppercase flex-1">
              {flower.name}
            </h3>

            {/* Bottom section with price and actions */}
            <div className="flex items-center justify-between mt-auto">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-foreground">
                  {flower.price.toLocaleString()} ₽
                </span>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleAddToCart();
                  }}
                  disabled={!flower.inStock}
                  className="p-1.5 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShoppingCart className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleToggleFavorite();
                }}
                className={`p-1.5 rounded-full transition-all duration-200 ${
                  isInFavorites
                    ? 'bg-destructive text-destructive-foreground'
                    : 'bg-muted hover:bg-destructive hover:text-destructive-foreground'
                }`}
              >
                <Heart className={`w-4 h-4 ${isInFavorites ? 'fill-current' : ''}`} />
              </button>
            </div>
          </div>
        </Card>
      </Link>
    </div>
  );
};
