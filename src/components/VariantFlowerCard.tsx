import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useFavorites } from '@/context/FavoritesContext';
import { toast } from '@/hooks/use-toast';

type VariantCardProps = {
  product: {
    id: number;
    name: string;
    slug: string;
    image_url: string | null;
    min_price_cache: number | null;
    is_active: boolean | null;
  };
  className?: string;
  /** Если ты сделал обёртку, которая отдаёт вариантные по /catalog/:slug — поменяй на true */
  useCatalogUrl?: boolean;
};

const fmt = (n?: number | null) =>
  typeof n === 'number' ? `${n.toLocaleString('ru-RU')} ₽` : '';

export function VariantFlowerCard({
  product,
  className,
  useCatalogUrl = false,
}: VariantCardProps) {
  const { addToCart } = useCart();
  const { isFavorite, addToFavorites, removeFromFavorites } = useFavorites();

  const favId = `v:${product.id}`;
  const isFav = isFavorite(favId);

  // Куда ведёт карточка:
  const productUrl = useCatalogUrl ? `/catalog/${product.slug}` : `/v/${product.slug}`;

  const handleToggleFavorite = () => {
    if (isFav) {
      removeFromFavorites(favId);
      toast({ title: 'Удалено из избранного', description: `${product.name} удалён из избранного` });
    } else {
      addToFavorites({
        id: favId,
        name: product.name,
        price: product.min_price_cache ?? 0,
        image: product.image_url || '/placeholder.svg',
        description: '',
        category: 'Разное',
        inStock: !!product.is_active,
        quantity: 1,
        colors: [],
        size: 'variant',
        occasion: [],
      } as any);
      toast({ title: 'Добавлено в избранное', description: `${product.name} добавлен в избранное` });
    }
  };

  const handleAddToCart = async () => {
    try {
      // динамический импорт supabase — без побочек и без нарушений правил хуков
      const { supabase } = await import('@/integrations/supabase/client');

      // Берём ПЕРВЫЙ активный вариант (как «по умолчанию» на странице товара)
      const { data, error } = await supabase
        .from('product_variants')
        .select('id, product_id, title, price, image_url, composition, is_active, sort_order')
        .eq('product_id', product.id)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .limit(1);

      if (error) throw error;

      const v = (data ?? [])[0];
      if (!v) {
        // нет активных вариантов — откроем карточку, пусть пользователь выберет
        window.location.href = productUrl;
        return;
      }

      addToCart({
        id: `vp:${product.id}:${v.id}`,
        name: `${product.name} — ${v.title}`,
        price: v.price || 0,
        image: v.image_url || product.image_url || '/placeholder.svg',
        description: v.composition || '',
        category: 'Разное',
        inStock: !!product.is_active,
        quantity: 1,
        colors: [],
        size: v.title,
        occasion: [],
      } as any);

      toast({
        title: 'Добавлено в корзину',
        description: `${product.name} (${v.title}) добавлен в корзину`,
      });
    } catch (e) {
      console.error('[VariantFlowerCard] addToCart error:', e);
      // На всякий случай — откроем страницу товара
      window.location.href = productUrl;
    }
  };

  return (
    <div className={`group relative ${className || ''}`}>
      <Link to={productUrl} aria-label={product.name} className="block">
        {/* 📸 Фото — квадрат 1:1 */}
        <div className="relative overflow-hidden rounded-2xl aspect-square">
          <img
            src={product.image_url || '/placeholder.svg'}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        </div>

        {/* 📝 Название и цена «от ...» */}
        <div className="mt-3 px-1">
          <h3 className="text-sm md:text-base font-normal leading-snug text-gray-800 line-clamp-2">
            {product.name}
          </h3>

          <div className="mt-1 flex items-center justify-between">
            <span className="text-base md:text-lg font-semibold text-gray-900">
              {product.min_price_cache != null ? `от ${fmt(product.min_price_cache)}` : 'Цена по запросу'}
            </span>

            {/* ❤️ Избранное */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleToggleFavorite();
              }}
              aria-pressed={isFav}
              className={`p-2 rounded-full transition-all duration-200 ${
                isFav
                  ? 'bg-destructive text-destructive-foreground'
                  : 'bg-muted hover:bg-destructive hover:text-destructive-foreground'
              }`}
              title={isFav ? 'Убрать из избранного' : 'Добавить в избранное'}
            >
              <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>
      </Link>

      {/* 🛒 Кнопка В корзину / Сделать предзаказ */}
      <div className="mt-2 px-1">
        {product.is_active ? (
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
}
