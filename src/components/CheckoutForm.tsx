import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCart } from "../context/CartContext";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { CalendarIcon, Plus, Minus, Heart, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { formatPhoneNumber, validatePhoneNumber, getCleanPhoneNumber } from "../lib/phone";
import { PhoneInput } from "./PhoneInput";
import { toast } from "sonner";
import { supabase } from "../integrations/supabase/client";
import { AddressAutocomplete } from "./AddressAutocomplete";
import { TinkoffPaymentButton } from "./TinkoffPaymentButton";
import { startOfDay, startOfToday } from "date-fns";

type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

// ======== PROMO: типы для правил из БД ========
type DiscountRule = {
  min_total: number;
  max_total?: number;
  type: 'fixed' | 'percent';
  amount: number;
};

type AppliedDiscount = {
  code: string;
  type: 'fixed' | 'percent';
  amount: number;          // используется для «простых» промиков без rules
  rules?: DiscountRule[];  // если из БД пришли тировые правила
};

const checkoutSchema = z.object({
  // Заказчик
  customerName: z.string().min(1, "Имя заказчика обязательно"),
  customerPhone: z.string().min(1, "Телефон заказчика обязателен").refine(validatePhoneNumber, "Неверный формат телефона"),
  
  // Адрес и доставка
  deliveryType: z.enum(["delivery", "pickup", "clarify"]),
  deliveryDate: z.date().optional(),
  deliveryTime: z.string().optional(),
  address: z.string().optional(),
  recipientName: z.string().optional(),
  recipientPhone: z.string().optional(),
  district: z.string().optional(),
  cardWishes: z.string().optional(),
  
  // Способ оплаты
  paymentMethod: z.enum(["card", "sbp", "cash"]).default("card"),
  
  // Промокод
  promoCode: z.string().optional(),
  
  // Комментарий
  orderComment: z.string().optional(),
}).refine((data) => {
  if (data.deliveryType === "delivery") {
    return data.deliveryTime && data.address && data.recipientName && 
           data.recipientPhone && data.district &&
           validatePhoneNumber(data.recipientPhone);
  }
  if (data.deliveryType === "clarify") {
    return data.recipientName && data.recipientPhone && validatePhoneNumber(data.recipientPhone);
  }
  return true;
}, {
  message: "Все обязательные поля должны быть заполнены для доставки",
  path: ["deliveryType"]
})
// NEW: запрет наличных, если не самовывоз
.superRefine((data, ctx) => {
  if (data.deliveryType !== "pickup" && data.paymentMethod === "cash") {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Оплата наличными доступна только при самовывозе.",
      path: ["paymentMethod"],
    });
  }
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

/** NEW: генерим почасовые слоты 09:00–10:00 ... 20:00–21:00 */
const generateTimeSlots = () => {
  const slots: string[] = [];
  for (let h = 9; h < 21; h++) {
    const start = `${String(h).padStart(2, "0")}:00`;
    const end = `${String(h + 1).padStart(2, "0")}:00`;
    slots.push(`${start} - ${end}`);
  }
  return slots;
};
const timeSlots = generateTimeSlots();

const districts = [
  { name: "Центр Сочи", price: 300, freeFrom: 5000 },
  { name: "Дагомыс, Мацеста", price: 500, freeFrom: 7000 },
  { name: "Хоста", price: 700, freeFrom: 10000 },
  { name: "Адлер", price: 1000, freeFrom: 15000 },
  { name: "Лоо", price: 1000, freeFrom: 15000 },
  { name: "Сириус", price: 1200, freeFrom: 15000 },
  { name: "п. Красная поляна", price: 1500, freeFrom: 20000 },
  { name: "п. Эсто-Садок", price: 1700, freeFrom: 20000 },
  { name: "п. Роза-Хутор", price: 1900, freeFrom: 20000 },
  { name: "На высоту 960м (Роза-Хутор/Горки город)", price: 2100, freeFrom: 25000 }
];

export const CheckoutForm = () => {
  const { state, updateQuantity, removeFromCart, clearCart } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedOrderId, setSavedOrderId] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<AppliedDiscount | null>(null);
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    getValues,
    control
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      deliveryType: "delivery"
    }
  });

  const deliveryType = watch("deliveryType");
  const paymentMethod = watch("paymentMethod");
  const selectedDate = watch("deliveryDate");

  // NEW: флаг для дизейбла наличных
  const cashDisabled = deliveryType !== "pickup";
  
  // Расчет доставки
  const calculateDeliveryPrice = () => {
    if (!selectedDistrict || deliveryType !== "delivery") return 0;
    const district = districts.find(d => d.name === selectedDistrict);
    if (!district) return 0;
    if (state.total >= district.freeFrom) return 0;
    return district.price;
  };
  
  const deliveryPrice = calculateDeliveryPrice();

  const updateItemQuantity = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(id);
    } else {
      updateQuantity(id, newQuantity);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>, field: "customerPhone" | "recipientPhone") => {
    const currentValue = getValues(field) || '';
    const formatted = formatPhoneNumber(e.target.value, currentValue);
    setValue(field, formatted);
  };

  const calculateDiscount = (total: number, discount: AppliedDiscount | null) => {
    if (!discount) return 0;

    // 1) Если промокод содержит rules из БД — ищем подходящее правило по сумме total
    if (discount.rules && discount.rules.length > 0) {
      const matched = discount.rules
        .filter(r => total >= r.min_total && (r.max_total == null || total <= r.max_total))
        .sort((a, b) => a.min_total - b.min_total)
        .pop();

      if (!matched) return 0;

      return matched.type === 'fixed'
        ? Math.min(matched.amount, total)
        : Math.floor(total * (matched.amount / 100));
    }

    // 2) Обычные промо (без rules): фикс/процент
    if (discount.type === 'fixed') {
      return Math.min(discount.amount, total);
    }
    return Math.floor(total * (discount.amount / 100));
  };

  const discountAmount = appliedDiscount ? calculateDiscount(state.total, appliedDiscount) : 0;
  const subtotalWithDelivery = state.total + deliveryPrice;
  const finalTotal = subtotalWithDelivery - discountAmount;
  const toKop = (rub: number) => Math.round(rub * 100);

  const receiptItems = [
    ...state.items.map((item) => ({
      Name: String(item.name).slice(0, 128),
      Price: toKop(item.price),
      Quantity: String(item.cartQuantity),
      Amount: toKop(item.price) * item.cartQuantity,
      PaymentMethod: "full_payment",
      PaymentObject: "commodity",
      Tax: "none", // УСН без НДС
    })),
    ...(deliveryPrice > 0
      ? [{
          Name: "Доставка",
          Price: toKop(deliveryPrice),
          Quantity: "1",
          Amount: toKop(deliveryPrice),
          PaymentMethod: "full_payment",
          PaymentObject: "service",
          Tax: "none",
        }]
      : [])
  ];

  const finalTotalKop = toKop(finalTotal);

  // Страхуемся от расхождения копеек
  const sumKop = receiptItems.reduce((sum, i) => sum + Number(i.Amount), 0);
  if (sumKop !== finalTotalKop && receiptItems.length > 0) {
    const diff = finalTotalKop - sumKop;
    receiptItems[receiptItems.length - 1].Amount =
      Number(receiptItems[receiptItems.length - 1].Amount) + diff;
  }

  const receipt = {
    Phone: getCleanPhoneNumber(watch("customerPhone") || ""),
    Taxation: "usn_income_outcome", // или "usn_income" — выбери свою
    Items: receiptItems
  };

  function normalizeRules(raw: unknown): DiscountRule[] | undefined {
    if (!raw) return undefined;
    if (Array.isArray(raw)) return raw as DiscountRule[];
    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? (parsed as DiscountRule[]) : undefined;
      } catch {
        return undefined;
      }
    }
    if (typeof raw === 'object' && raw !== null) {
      const maybeArray = raw as any;
      return Array.isArray(maybeArray) ? (maybeArray as DiscountRule[]) : undefined;
    }
    return undefined;
  }

  const handlePromoCode = async () => {
    if (!promoCode.trim()) {
      toast.error("Введите промокод");
      return;
    }

    setIsApplyingPromo(true);

    try {
      const code = promoCode.toUpperCase();

      type PromoRow = {
        code: string;
        is_active: boolean;
        expires_at: string | null;
        usage_limit: number | null;
        used_count: number | null;
        discount_type: 'fixed' | 'percent' | string | null;
        discount_amount: number | null;
        discount_rules?: unknown; // может быть jsonb или текст
      };

      const response = await supabase
        .from('promo_codes')
        .select('code, is_active, expires_at, usage_limit, used_count, discount_type, discount_amount, discount_rules')
        .eq('code', code)
        .eq('is_active', true)
        .maybeSingle<PromoRow>();

      if (response.error) {
        if (response.error.message?.includes("discount_rules")) {
          toast.error("В БД нет колонки discount_rules. Добавь её в public.promo_codes (jsonb).");
        } else {
          toast.error("Промокод не найден или недействителен");
        }
        return;
      }

      if (!response.data) {
        toast.error("Промокод не найден или недействителен");
        return;
      }

      const promoData = response.data;

      if (promoData.expires_at && new Date(promoData.expires_at) < new Date()) {
        toast.error("Промокод истёк");
        return;
      }

      if (promoData.usage_limit != null && promoData.used_count != null && promoData.used_count >= promoData.usage_limit) {
        toast.error("Промокод больше недоступен");
        return;
      }

      const rules = normalizeRules(promoData.discount_rules);

      const discountFromDb: AppliedDiscount = {
        code: promoData.code,
        type: (promoData.discount_type ?? 'fixed') as 'fixed' | 'percent',
        amount: Number(promoData.discount_amount ?? 0),
        rules
      };

      const preview = calculateDiscount(state.total, discountFromDb);
      if (preview <= 0) {
        toast.error("Промокод применим при большей сумме корзины");
        return;
      }

      setAppliedDiscount(discountFromDb);

      const discountText = rules
        ? `${preview} ₽`
        : (discountFromDb.type === 'fixed'
            ? `${discountFromDb.amount} ₽`
            : `${discountFromDb.amount}%`);

      toast.success(`Промокод применён! Скидка: ${discountText}`);
    } catch (error) {
      toast.error("Ошибка при применении промокода");
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const removePromoCode = () => {
    setAppliedDiscount(null);
    setPromoCode("");
    toast.success("Промокод удален");
  };

  const onSubmit = async (data: CheckoutFormData) => {
    // NEW: выбор способа обязателен
    if (!data.paymentMethod) {
      toast.error("Выберите способ оплаты");
      return;
    }
    // NEW: жесткая проверка перед сохранением
    if (data.paymentMethod === "cash" && data.deliveryType !== "pickup") {
      toast.error("Оплата наличными доступна только при самовывозе.");
      return;
    }

    console.log("=== НАЧАЛО ОТПРАВКИ ЗАКАЗА ===");
    console.log("Данные формы:", data);
    console.log("Состояние корзины:", state);
    
    setIsSubmitting(true);
    
    const itemsJson: Json = state.items.map((i) => ({
      id: i.id,
      name: i.name,
      price: i.price,
      cartQuantity: i.cartQuantity,
      image: i.image,
    })) as Json; 

    try {
      // Создаем объект заказа
      const orderData = {
        items: itemsJson,  // ⬅️ важно: без JSON.stringify
        total_amount: finalTotal,
        customer_name: data.customerName,
        customer_phone: getCleanPhoneNumber(data.customerPhone),
        delivery_type: data.deliveryType,
        delivery_date: data.deliveryDate ? format(data.deliveryDate, "yyyy-MM-dd") : null,
        delivery_time: data.deliveryTime,
        district: data.district,
        recipient_name: data.recipientName,
        recipient_phone: data.recipientPhone ? getCleanPhoneNumber(data.recipientPhone) : null,
        recipient_address: data.deliveryType === "delivery" ? data.address ?? null : null,
        card_wishes: data.cardWishes,
        payment_method: data.paymentMethod,
        order_comment: data.orderComment,
        promo_code: appliedDiscount?.code || null,
        discount_amount: discountAmount,
        status: "pending",
        order_status: "new"
      };

      console.log("Объект заказа для отправки:", orderData);

      // Сохраняем заказ в базу данных
      console.log("Отправляем заказ в Supabase...");
      const { data: savedOrder, error: orderError } = await supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single();

      if (orderError) {
        console.error('Ошибка при сохранении заказа:', orderError);
        throw new Error(`Ошибка при сохранении заказа: ${orderError.message}`);
      }

      console.log("Заказ успешно сохранен:", savedOrder);

      // Сохраняем ID заказа для виджета оплаты
      setSavedOrderId(savedOrder.id);

      // Если онлайн-оплата — просто показываем виджет Tinkoff
      if (data.paymentMethod === "card" || data.paymentMethod === "sbp") {
        setIsSubmitting(false);
        return; // Дальше UI сам покажет <TinkoffPaymentButton />
      }

      // Обновляем счетчик использования промокода
      if (appliedDiscount) {
        console.log("Обновляем промокод...");
        const { data: promoData } = await supabase
          .from('promo_codes')
          .select('id, used_count')
          .eq('code', appliedDiscount.code)
          .single();

        if (promoData) {
          await supabase
            .from('promo_codes')
            .update({ used_count: promoData.used_count + 1 })
            .eq('code', appliedDiscount.code);

          await supabase
            .from('promo_code_usage')
            .insert({
              promo_code_id: promoData.id,
              order_id: savedOrder.id,
              customer_phone: data.customerPhone
            });
        }
      }
      
      console.log("=== ЗАКАЗ УСПЕШНО ОФОРМЛЕН ===");
      toast.success("Заказ успешно оформлен!");
      clearCart();
      
    } catch (error) {
      console.error('Ошибка при оформлении заказа:', error);
      toast.error("Ошибка при оформлении заказа");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Левая колонка - Форма */}
        <div className="lg:col-span-2 space-y-8">
          {/* ВАШ ЗАКАЗ */}
          <Card className="bg-[#fff8ea] border border-gray-200">
            <CardContent className="pt-6">
              <h2 className="text-lg font-semibold mb-4">ВАШ ЗАКАЗ</h2>
              <div className="space-y-4">
                {state.items.map((item) => (
                  <div key={item.id} className="border rounded-lg overflow-hidden">
                    {/* Mobile Layout */}
                    <div className="md:hidden">
                      <div className="relative w-full">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-64 object-cover"
                        />
                      </div>
                      <div className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-medium text-base flex-1">{item.name}</h4>
                          <p className="font-semibold text-lg text-nowrap">
                            {(item.price * item.cartQuantity).toLocaleString()} ₽
                          </p>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => updateItemQuantity(item.id, item.cartQuantity - 1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="text-sm font-medium w-12 text-center">
                              {item.cartQuantity} шт
                            </span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => updateItemQuantity(item.id, item.cartQuantity + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Heart className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => removeFromCart(item.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden md:flex items-center space-x-6 p-4">
                      <div className="relative">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-48 h-48 object-cover rounded-2xl"
                        />
                      </div>
                      <div className="flex-1 ml-8">
                        <h4 className="font-medium text-sm">{item.name}</h4>
                        <div className="flex items-center space-x-2 mt-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => updateItemQuantity(item.id, item.cartQuantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="text-sm font-medium w-12 text-center">
                            {item.cartQuantity} шт
                          </span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => updateItemQuantity(item.id, item.cartQuantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-2 mb-2">
                          <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <Heart className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => removeFromCart(item.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="font-semibold">
                          {(item.price * item.cartQuantity).toLocaleString()} ₽
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ЗАКАЗЧИК */}
          <Card className="bg-[#fff8ea] border border-gray-200">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                  1
                </div>
                <h2 className="text-lg font-semibold">ЗАКАЗЧИК</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customerName">Имя заказчика *</Label>
                  <Input
                    id="customerName"
                    placeholder="Имя заказчика"
                    {...register("customerName")}
                    className={errors.customerName ? "border-red-500" : ""}
                  />
                  {errors.customerName && (
                    <p className="text-red-500 text-sm mt-1">{errors.customerName.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="customerPhone">Телефон заказчика *</Label>
                  <PhoneInput
                    id="customerPhone"
                    placeholder="Телефон заказчика"
                    value={watch("customerPhone") || ''}
                    onChange={(value) => setValue("customerPhone", value)}
                    className={errors.customerPhone ? "border-red-500" : ""}
                  />
                  {errors.customerPhone && (
                    <p className="text-red-500 text-sm mt-1">{errors.customerPhone.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* АДРЕС И ДОСТАВКА */}
          <Card className="bg-[#fff8ea] border border-gray-200">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                  2
                </div>
                <h2 className="text-lg font-semibold">АДРЕС И ДОСТАВКА</h2>
              </div>
              
              <RadioGroup
                value={deliveryType}
                onValueChange={(value) => {
                  // CHANGED: ставим тип доставки и если наличка — переключаем на карту
                  setValue("deliveryType", value as "delivery" | "pickup" | "clarify");

                  if (value !== "pickup" && getValues("paymentMethod") === "cash") {
                    setValue("paymentMethod", "card");
                    toast.message("Наличными — только при самовывозе. Переключили на оплату картой.");
                  }
                }}
                className="mb-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="delivery" id="delivery" />
                  <Label htmlFor="delivery">Доставка</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pickup" id="pickup" />
                  <Label htmlFor="pickup">Самовывоз</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="clarify" id="clarify" />
                  <Label htmlFor="clarify">Уточнить у получателя</Label>
                </div>
              </RadioGroup>

              {deliveryType === "delivery" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>День доставки</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !selectedDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {selectedDate ? (
                              format(selectedDate, "dd MMMM yyyy")
                            ) : (
                              <span>День доставки</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={(date) => setValue("deliveryDate", date)}
                            disabled={(d) => startOfDay(d) < startOfToday()}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div>
                      <Label htmlFor="deliveryTime">Время *</Label>
                      {/* NEW: Select со слотами вместо free text Input */}
                      <Select
                        value={watch("deliveryTime") || ""}
                        onValueChange={(v) => setValue("deliveryTime", v)}
                      >
                        <SelectTrigger className={errors.deliveryTime ? "border-red-500" : ""}>
                          <SelectValue placeholder="Выберите время" />
                        </SelectTrigger>
                        <SelectContent>
                          {timeSlots.map((slot) => (
                            <SelectItem key={slot} value={slot}>
                              {slot}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.deliveryTime && (
                        <p className="text-red-500 text-sm mt-1">Время доставки обязательно</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="address">Адрес *</Label>
                      <AddressAutocomplete
                        value={watch("address")}
                        onChange={(value) => setValue("address", value)}
                        placeholder="Введите улицу и номер дома"
                        error={!!errors.address}
                      />
                      {errors.address && (
                        <p className="text-red-500 text-sm mt-1">Адрес обязателен</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="recipientName">Имя получателя *</Label>
                      <Input
                        id="recipientName"
                        placeholder="Имя получателя"
                        {...register("recipientName")}
                        className={errors.recipientName ? "border-red-500" : ""}
                      />
                      {errors.recipientName && (
                        <p className="text-red-500 text-sm mt-1">Имя получателя обязательно</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="district">Район *</Label>
                      <Select 
                        value={selectedDistrict} 
                        onValueChange={(value) => {
                          setSelectedDistrict(value);
                          setValue("district", value);
                        }}
                      >
                        <SelectTrigger className={errors.district ? "border-red-500" : ""}>
                          <SelectValue placeholder="Выберите район" />
                        </SelectTrigger>
                        <SelectContent>
                          {districts.map((district) => (
                            <SelectItem key={district.name} value={district.name}>
                              {district.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.district && (
                        <p className="text-red-500 text-sm mt-1">Район обязателен</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="recipientPhone">Номер получателя *</Label>
                      <PhoneInput
                        id="recipientPhone"
                        placeholder="Номер получателя"
                        value={watch("recipientPhone") || ''}
                        onChange={(value) => setValue("recipientPhone", value)}
                        className={errors.recipientPhone ? "border-red-500" : ""}
                      />
                      {errors.recipientPhone && (
                        <p className="text-red-500 text-sm mt-1">Номер получателя обязателен</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="cardWishes">Пожелания в открытку</Label>
                    <Textarea
                      id="cardWishes"
                      placeholder="Пожелания в открытку"
                      {...register("cardWishes")}
                      rows={4}
                    />
                  </div>
                </div>
              )}

              {deliveryType === "clarify" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="recipientName">Имя получателя *</Label>
                      <Input
                        id="recipientName"
                        placeholder="Имя получателя"
                        {...register("recipientName")}
                        className={errors.recipientName ? "border-red-500" : ""}
                      />
                      {errors.recipientName && (
                        <p className="text-red-500 text-sm mt-1">Имя получателя обязательно</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="recipientPhone">Номер получателя *</Label>
                      <PhoneInput
                        id="recipientPhone"
                        placeholder="Номер получателя"
                        value={watch("recipientPhone") || ''}
                        onChange={(value) => setValue("recipientPhone", value)}
                        className={errors.recipientPhone ? "border-red-500" : ""}
                      />
                      {errors.recipientPhone && (
                        <p className="text-red-500 text-sm mt-1">Номер получателя обязателен</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="cardWishes">Пожелания в открытку</Label>
                    <Textarea
                      id="cardWishes"
                      placeholder="Пожелания в открытку"
                      {...register("cardWishes")}
                      rows={4}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* СПОСОБЫ ОПЛАТЫ */}
          <Card className="bg-[#fff8ea] border border-gray-200">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                  3
                </div>
                <h2 className="text-lg font-semibold">СПОСОБЫ ОПЛАТЫ</h2>
              </div>
              
              <RadioGroup
                value={paymentMethod}
                onValueChange={(value) => {
                  // CHANGED: блокируем выбор наличных при доставке/уточнить
                  if (value === "cash" && cashDisabled) {
                    toast.error("Оплата наличными доступна только при самовывозе.");
                    return;
                  }
                  setValue("paymentMethod", value as "card" | "sbp" | "cash");
                }}
                className="mb-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="card" id="card" />
                  <Label htmlFor="card">Оплата картой (VISA, Mastercard)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="sbp" id="sbp" />
                  <Label htmlFor="sbp">СБП (Система быстрых платежей)</Label>
                </div>

                <div className={`flex items-center space-x-2 ${cashDisabled ? "opacity-50 cursor-not-allowed" : ""}`}>
                  <RadioGroupItem value="cash" id="cash" disabled={cashDisabled} />
                  <Label htmlFor="cash">
                    Оплата наличными
                    {cashDisabled && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        доступно только при самовывозе
                      </span>
                    )}
                  </Label>
                </div>
              </RadioGroup>

              <div>
                <Label htmlFor="orderComment">Комментарий к заказу</Label>
                <Textarea
                  id="orderComment"
                  placeholder="Комментарий к заказу"
                  {...register("orderComment")}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Правая колонка - Сводка заказа */}
        <div className="space-y-6 lg:sticky lg:top-24">
          {/* Промокод */}
          <Card className="bg-[#fff8ea] border border-gray-200">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4">ЕСТЬ ПРОМОКОД?</h3>
              <div className="space-y-3">
                {!appliedDiscount ? (
                  <>
                    <Input
                      placeholder="Промо код"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                      disabled={isApplyingPromo}
                    />
                    <Button 
                      type="button"
                      onClick={handlePromoCode}
                      className="w-full"
                      variant="default"
                      disabled={isApplyingPromo || !promoCode.trim()}
                    >
                      {isApplyingPromo ? "Проверяем..." : "Применить промокод"}
                    </Button>
                  </>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                      <div>
                        <p className="font-medium text-green-800">Промокод применён</p>
                        <p className="text-sm text-green-600">{appliedDiscount.code}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={removePromoCode}
                        className="text-green-600 hover:text-green-800"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Итого */}
          <Card className="bg-[#fff8ea] border border-gray-200">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4">Итого</h3>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span>{state.itemCount} Товар(а)</span>
                  <span>{state.total.toLocaleString()} ₽</span>
                </div>
                
                {deliveryPrice > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Доставка</span>
                    <span>+{deliveryPrice.toLocaleString()} ₽</span>
                  </div>
                )}
                
                {deliveryPrice === 0 && selectedDistrict && deliveryType === "delivery" && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Доставка</span>
                    <span>Бесплатно</span>
                  </div>
                )}
                
                {appliedDiscount && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Скидка ({appliedDiscount.code})</span>
                    <span>-{(calculateDiscount(state.total, appliedDiscount)).toLocaleString()} ₽</span>
                  </div>
                )}
                
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Сумма к оплате</span>
                  <span>{finalTotal.toLocaleString()} ₽</span>
                </div>
              </div>
              
              {(paymentMethod === "card" || paymentMethod === "sbp") ? (
                // Для онлайн-оплаты сначала сохраняем заказ, потом показываем виджет
                <div className="space-y-4">
                  {!savedOrderId ? (
                    <Button 
                      onClick={async () => {
                        const formData = getValues();
                        // NEW: явная проверка способа оплаты перед сабмитом
                        if (!formData.paymentMethod) {
                          toast.error("Выберите способ оплаты");
                          return;
                        }
                        const validation = checkoutSchema.safeParse(formData);
                        if (!validation.success) {
                          toast.error("Заполните все обязательные поля");
                          return;
                        }
                        await onSubmit(formData);
                      }}
                      className="w-full"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Подготавливаем оплату..." : "Перейти к оплате"}
                    </Button>
                  ) : (
                    <TinkoffPaymentButton
                      amount={toKop(finalTotal)} // в копейках
                      orderId={savedOrderId}
                      customerName={watch("customerName") || ""}
                      customerPhone={watch("customerPhone") || ""}
                      receipt={receipt} // ← передаём чек на бэкенд
                      onSuccess={() => {
                        toast.success("Оплата прошла успешно!");
                        clearCart();
                        setSavedOrderId(null);
                      }}
                      onFail={() => {
                        toast.error("Ошибка оплаты. Попробуйте ещё раз.");
                      }}
                    />
                  )}
                </div>
              ) : (
                // Для оплаты наличными обычная кнопка
                <Button 
                  onClick={async () => {
                    const formData = getValues();
                    if (!formData.paymentMethod) {
                      toast.error("Выберите способ оплаты");
                      return;
                    }
                    const validation = checkoutSchema.safeParse(formData);
                    if (!validation.success) {
                      toast.error("Заполните все обязательные поля");
                      return;
                    }
                    await onSubmit(formData);
                  }}
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Оформляем заказ..." : "Оформить заказ"}
                </Button>
              )}
              
              <p className="text-xs text-muted-foreground mt-3">
                Нажимая на кнопку "Оформить заказ", Вы автоматически соглашаетесь{" "}
                <a href="/public-offer" className="underline hover:text-primary transition-colors">
                  с условиями публичной оферты
                </a>{" "}
                и{" "}
                <a href="/privacy" className="underline hover:text-primary transition-colors">
                  политикой конфиденциальности
                </a>.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
