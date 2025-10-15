// === UnifiedOrderTab.tsx (или вставь в AdminPanel.tsx перед export AdminPanel) ===
import * as React from 'react';
import {
  DndContext,
  useSensors,
  useSensor,
  MouseSensor,
  TouchSensor,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAllProducts } from '@/hooks/useProducts';
import { useAllVariantProducts } from '@/hooks/useVariantProducts'; // проверь путь/название хука
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, GripVertical } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type CombinedItem = {
  key: string;                    // 'p:<uuid>' | 'v:<id>'
  kind: 'product' | 'variant';
  id: string | number;
  name: string;
  image_url: string | null;
  price: number | null;
  is_active: boolean | null;
  sort_order: number | null;
  created_at: string | null;      // ⬅️ добавили, чтобы совпадать с логикой каталога
};

function SortableRow({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <div ref={setNodeRef} style={style}>
      <div className="flex items-center gap-3">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab p-2 rounded hover:bg-muted"
          title="Перетащи"
        >
          <GripVertical className="w-4 h-4 opacity-70" />
        </button>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}

const BIG = 1e9;
const toTS = (d?: string | null) => (d ? new Date(d).getTime() : 0);

// ⬅️ Тот же компаратор, что и в каталоге (default):
// 1) sort_order ASC (NULL → в конец)
// 2) created_at DESC (новее выше)
// 3) name ASC
const byDefault = (a: CombinedItem, b: CombinedItem) => {
  const ao = a.sort_order ?? BIG;
  const bo = b.sort_order ?? BIG;
  if (ao !== bo) return ao - bo;
  const ad = toTS(a.created_at);
  const bd = toTS(b.created_at);
  if (ad !== bd) return bd - ad;
  return a.name.localeCompare(b.name);
};

export function UnifiedOrderTab() {
  const { toast } = useToast();
  const qc = useQueryClient();

  // берём оба списка
  const { data: products = [], isLoading: loadingProducts } = useAllProducts();
  const { data: variants = [], isLoading: loadingVariants } = useAllVariantProducts();

  // собираем единый массив и сортируем ТЕМ ЖЕ компараТОРОМ, что в каталоге
  const combined = React.useMemo<CombinedItem[]>(() => {
    const A: CombinedItem[] = (products ?? []).map((p: any) => ({
      key: `p:${p.id}`,
      kind: 'product',
      id: String(p.id),
      name: p.name,
      image_url: p.image_url ?? null,
      price: p.price ?? null,
      is_active: p.is_active ?? null,
      sort_order: p.sort_order ?? null,
      created_at: p.created_at ?? null,   // ← есть у products
    }));
    const B: CombinedItem[] = (variants ?? []).map((v: any) => ({
      key: `v:${v.id}`,
      kind: 'variant',
      id: Number(v.id),
      name: v.name,
      image_url: v.image_url ?? null,
      price: v.min_price_cache ?? null,
      is_active: v.is_active ?? null,
      sort_order: v.sort_order ?? null,
      created_at: v.created_at ?? null,   // ← если хук не возвращает, будет null — это ок
    }));
    return [...A, ...B].sort(byDefault);
  }, [products, variants]);

  // локальный порядок
  const [order, setOrder] = React.useState<CombinedItem[]>([]);
  React.useEffect(() => {
    setOrder(combined);
  }, [combined]);

  // dnd sensors
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
  );

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;

    const oldIndex = order.findIndex((x) => x.key === active.id);
    const newIndex = order.findIndex((x) => x.key === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    setOrder((prev) => arrayMove(prev, oldIndex, newIndex));
  };

  // сохранение в БД: сверху вниз -> sort_order = index (ПОСЛЕДОВАТЕЛЬНО, без Promise.all)
  const saveMutation = useMutation({
    mutationFn: async (sorted: CombinedItem[]) => {
      for (let idx = 0; idx < sorted.length; idx++) {
        const item = sorted[idx];
        if (item.kind === 'product') {
          const { error } = await supabase
            .from('products')
            .update({ sort_order: idx })
            .eq('id', item.id as string);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('variant_products')
            .update({ sort_order: idx })
            .eq('id', item.id as number);
          if (error) throw error;
        }
      }
    },
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['products'] }),
        qc.invalidateQueries({ queryKey: ['all-products'] }),
        qc.invalidateQueries({ queryKey: ['homepage-products'] }),
        qc.invalidateQueries({ queryKey: ['featured-products'] }),
        qc.invalidateQueries({ queryKey: ['variant-products'] }),
        qc.invalidateQueries({ queryKey: ['variant-catalog'] }),
      ]);
      toast({ title: 'Порядок сохранён' });
    },
    onError: () => {
      toast({ variant: 'destructive', title: 'Не удалось сохранить порядок' });
    },
  });

  const handleSave = () => saveMutation.mutate(order);
  const handleReset = () => setOrder(combined);

  const loading = loadingProducts || loadingVariants;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Единый порядок товаров</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset} disabled={loading || saveMutation.isPending}>
            Сбросить изменения
          </Button>
          <Button onClick={handleSave} disabled={loading || saveMutation.isPending}>
            Сохранить порядок
          </Button>
        </div>
      </div>

      {loading ? (
        <p>Загрузка...</p>
      ) : (
        <DndContext sensors={sensors} onDragEnd={onDragEnd}>
          <SortableContext items={order.map((x) => x.key)} strategy={verticalListSortingStrategy}>
            <div className="grid gap-3">
              {order.map((item) => (
                <SortableRow key={item.key} id={item.key}>
                  <Card>
                    <CardContent className="p-3">
                      <div className="flex items-center gap-4">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-12 h-12 object-cover rounded"
                            draggable={false}
                          />
                        ) : (
                          <div className="w-12 h-12 rounded bg-muted" />
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{item.name}</span>
                            <Badge variant="outline">
                              {item.kind === 'product' ? 'Обычный' : 'С вариантами'}
                            </Badge>
                            <Badge variant={item.is_active ? 'default' : 'secondary'}>
                              {item.is_active ? (
                                <>
                                  <Eye className="w-3 h-3 mr-1" /> Активен
                                </>
                              ) : (
                                <>
                                  <EyeOff className="w-3 h-3 mr-1" /> Неактивен
                                </>
                              )}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {item.price != null ? `₽${item.price}` : 'Цена не указана'}
                          </div>
                        </div>

                        <div className="text-xs text-muted-foreground w-16 text-right">
                          #{(order.findIndex((x) => x.key === item.key) + 1).toString().padStart(2, '0')}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </SortableRow>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
