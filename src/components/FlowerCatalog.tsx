import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FlowerCard } from './FlowerCard';
import { Flower } from '../types/flower';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Slider } from './ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from './ui/dropdown-menu';
import { SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { Product } from '@/types/database';

export const FlowerCatalog = () => {
  const [searchParams] = useSearchParams();
  const categoryFromUrl = searchParams.get('category');
  
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedColor, setSelectedColor] = useState('all');
  const [selectedComposition, setSelectedComposition] = useState('all');
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [sortBy, setSortBy] = useState('popularity');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  
  const { data: products = [], isLoading: productsLoading, error: productsError } = useProducts();
  const { data: categories = [], isLoading: categoriesLoading, error: categoriesError } = useCategories();

  // Set category from URL and scroll to top when component mounts or category changes
  useEffect(() => {
    if (categoryFromUrl && categories.length > 0) {
      const categoryExists = categories.some(cat => cat.name === categoryFromUrl);
      if (categoryExists) {
        setSelectedCategory(categoryFromUrl);
      }
    }
    
    // Smooth scroll to top when catalog loads
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, [categoryFromUrl, categories]);
  
  // Reset URL params when category is manually changed
  useEffect(() => {
    if (categoryFromUrl && selectedCategory !== categoryFromUrl && selectedCategory !== 'all') {
      // Update URL without the category parameter when user manually selects a different category
      const url = new URL(window.location.href);
      url.searchParams.delete('category');
      window.history.replaceState({}, '', url.pathname);
    }
  }, [selectedCategory, categoryFromUrl]);

  // Transform products to flowers
  const flowers = useMemo(() => {
    return products.map((product: Product): Flower => ({
      id: product.id,
      name: product.name,
      price: product.price || 0,
      image: product.image_url || '/placeholder.svg',
      description: product.description || '',
      category: product.category?.name || 'Разное',
      inStock: product.is_active,
      quantity: 1, // Default quantity since we don't have stock management yet
      colors: product.colors || [], // Use product colors or empty array
      size: 'medium' as const,
      occasion: []
    }));
  }, [products]);

  // Get all available colors and compositions
  const availableColors = useMemo(() => {
    const colors = new Set<string>();
    flowers.forEach(flower => {
      flower.colors.forEach(color => colors.add(color));
    });
    return Array.from(colors).sort();
  }, [flowers]);

  const availableCompositions = useMemo(() => {
    const compositions = new Set<string>();
    products.forEach(product => {
      if (product.composition) {
        product.composition.forEach(comp => compositions.add(comp));
      }
    });
    return Array.from(compositions).sort();
  }, [products]);

  // Get price range
  const priceRangeMinMax = useMemo(() => {
    if (flowers.length === 0) return [0, 10000];
    const prices = flowers.map(f => f.price);
    return [Math.min(...prices), Math.max(...prices)];
  }, [flowers]);

  const filteredFlowers = useMemo(() => {
    let filtered = flowers.filter(flower => {
      const matchesCategory = selectedCategory === 'all' || flower.category === selectedCategory;
      const matchesColor = selectedColor === 'all' || flower.colors.some(color => 
        color.toLowerCase().includes(selectedColor.toLowerCase())
      );
      const matchesComposition = selectedComposition === 'all' || 
        products.find(p => p.id === flower.id)?.composition?.some(comp => 
          comp.toLowerCase().includes(selectedComposition.toLowerCase())
        );
      const matchesPrice = flower.price >= priceRange[0] && flower.price <= priceRange[1];
      
      return matchesCategory && matchesColor && matchesComposition && matchesPrice;
    });

    // Apply sorting
    switch (sortBy) {
      case 'price-asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'newest':
        // Assuming newer products have higher sort_order or created_at
        filtered.sort((a, b) => {
          const productA = products.find(p => p.id === a.id);
          const productB = products.find(p => p.id === b.id);
          return (productB?.sort_order || 0) - (productA?.sort_order || 0);
        });
        break;
      default: // popularity
        filtered.sort((a, b) => {
          const productA = products.find(p => p.id === a.id);
          const productB = products.find(p => p.id === b.id);
          return (productB?.sort_order || 0) - (productA?.sort_order || 0);
        });
    }

    return filtered;
  }, [flowers, selectedCategory, selectedColor, selectedComposition, priceRange, sortBy, products]);

  const handleToggleFavorite = (flower: Flower) => {
    console.log('Добавлено в избранное:', flower.name);
    // Здесь будет логика добавления в избранное
  };

  if (productsLoading || categoriesLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Каталог цветов и букетов
          </h1>
          <p className="text-lg text-muted-foreground">Загрузка каталога...</p>
        </div>
      </div>
    );
  }

  if (productsError || categoriesError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Каталог цветов и букетов
          </h1>
          <p className="text-destructive">Ошибка загрузки каталога</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Заголовок */}
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
          Каталог цветов и букетов
        </h1>
      </div>

      {/* Фильтры и сортировка */}
      <div className="flex justify-between items-center mb-6 gap-4 flex-wrap">
        {/* Кнопка фильтров */}
        <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-10">
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              КАТЕГОРИИ
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80 p-4" align="start">
            {/* Категории */}
            <div className="space-y-3">
              <DropdownMenuLabel className="text-sm font-medium text-muted-foreground">
                Категория
              </DropdownMenuLabel>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите категорию" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все категории</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DropdownMenuSeparator className="my-4" />

            {/* Цветы в составе */}
            {availableCompositions.length > 0 && (
              <div className="space-y-3">
                <DropdownMenuLabel className="text-sm font-medium text-muted-foreground">
                  Цветы в составе
                </DropdownMenuLabel>
                <Select value={selectedComposition} onValueChange={setSelectedComposition}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите цветы" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все цветы</SelectItem>
                    {availableCompositions.map(comp => (
                      <SelectItem key={comp} value={comp}>
                        {comp}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <DropdownMenuSeparator className="my-4" />

            {/* Цвета */}
            {availableColors.length > 0 && (
              <div className="space-y-3">
                <DropdownMenuLabel className="text-sm font-medium text-muted-foreground">
                  Цвета
                </DropdownMenuLabel>
                <Select value={selectedColor} onValueChange={setSelectedColor}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите цвет" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все цвета</SelectItem>
                    {availableColors.map(color => (
                      <SelectItem key={color} value={color}>
                        {color}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <DropdownMenuSeparator className="my-4" />

            {/* Цена */}
            <div className="space-y-3">
              <DropdownMenuLabel className="text-sm font-medium text-muted-foreground">
                Цена: {priceRange[0]} - {priceRange[1]} ₽
              </DropdownMenuLabel>
              <div className="px-2">
                <Slider
                  value={priceRange}
                  onValueChange={setPriceRange}
                  max={priceRangeMinMax[1]}
                  min={priceRangeMinMax[0]}
                  step={100}
                  className="w-full"
                />
              </div>
            </div>

            {/* Кнопки управления */}
            <div className="flex gap-2 pt-4 border-t">
              <Button 
                variant="default" 
                size="sm" 
                className="flex-1 transition-all duration-200"
                onClick={() => {
                  // Закрываем dropdown с анимацией
                  setDropdownOpen(false);
                }}
              >
                Применить
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={() => {
                  setSelectedCategory('all');
                  setSelectedColor('all');
                  setSelectedComposition('all');
                  setPriceRange(priceRangeMinMax);
                }}
              >
                Сбросить
              </Button>
            </div>

          </DropdownMenuContent>
        </DropdownMenu>

        {/* Сортировка */}
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-auto min-w-[180px]">
            <ArrowUpDown className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="popularity">По популярности</SelectItem>
            <SelectItem value="price-asc">По возрастанию цены</SelectItem>
            <SelectItem value="price-desc">По убыванию цены</SelectItem>
            <SelectItem value="newest">По новизне</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Статистика */}
      <div className="flex justify-between items-center mb-6 text-sm text-muted-foreground">
        <div>
          Найдено: {filteredFlowers.length} из {flowers.length}
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary">
            В наличии: {flowers.filter(f => f.inStock).length}
          </Badge>
          <Badge variant="outline">
            Нет в наличии: {flowers.filter(f => !f.inStock).length}
          </Badge>
        </div>
      </div>

      {/* Каталог */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredFlowers.map(flower => (
          <FlowerCard
            key={flower.id}
            flower={flower}
            onToggleFavorite={handleToggleFavorite}
          />
        ))}
      </div>

      {filteredFlowers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground mb-4">
            Цветы не найдены
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setSelectedCategory('all');
              setSelectedColor('all');
              setSelectedComposition('all');
              setPriceRange(priceRangeMinMax);
              setSortBy('popularity');
            }}
          >
            Сбросить фильтры
          </Button>
        </div>
      )}
    </div>
  );
};