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
import { Checkbox } from "./ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { CalendarIcon, Plus, Minus, Heart, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { formatPhoneNumber, validatePhoneNumber } from "../lib/phone";
import { toast } from "sonner";
import { supabase } from "../integrations/supabase/client";

const checkoutSchema = z.object({
  // Заказчик
  customerName: z.string().min(1, "Имя заказчика обязательно"),
  customerPhone: z.string().min(1, "Телефон заказчика обязателен").refine(validatePhoneNumber, "Неверный формат телефона"),
  
  // Адрес и доставка
  deliveryType: z.enum(["delivery", "pickup"]),
  deliveryDate: z.date().optional(),
  deliveryTime: z.string().optional(),
  district: z.string().optional(),
  recipientName: z.string().optional(),
  recipientPhone: z.string().optional(),
  recipientAddress: z.string().optional(),
  cardWishes: z.string().optional(),
  
  // Способ оплаты
  paymentMethod: z.enum(["card", "sbp", "cash"]).default("card"),
  
  // Промокод
  promoCode: z.string().optional(),
  
  // Комментарий
  orderComment: z.string().optional(),
}).refine((data) => {
  if (data.deliveryType === "delivery") {
    return data.deliveryTime && data.district && data.recipientName && 
           data.recipientPhone && data.recipientAddress &&
           validatePhoneNumber(data.recipientPhone);
  }
  return true;
}, {
  message: "Все обязательные поля должны быть заполнены для доставки",
  path: ["deliveryType"]
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

const timeSlots = [
  "9:00 - 12:00",
  "12:00 - 15:00", 
  "15:00 - 18:00",
  "18:00 - 21:00"
];

const districts = [
  "Центральный",
  "Северный", 
  "Южный",
  "Восточный",
  "Западный",
  "Автозаводский",
  "Московский"
];

export const CheckoutForm = () => {
  const { state, updateQuantity, removeFromCart, clearCart } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<{
    code: string;
    amount: number;
    type: 'fixed' | 'percent';
  } | null>(null);
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    control
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      deliveryType: "delivery"
    }
  });

  const deliveryType = watch("deliveryType");
  const selectedDate = watch("deliveryDate");

  const updateItemQuantity = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(id);
    } else {
      updateQuantity(id, newQuantity);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>, field: "customerPhone" | "recipientPhone") => {
    const formatted = formatPhoneNumber(e.target.value);
    setValue(field, formatted);
  };

  const calculateDiscount = (total: number, discount: typeof appliedDiscount) => {
    if (!discount) return 0;
    
    if (discount.type === 'fixed') {
      return Math.min(discount.amount, total);
    } else {
      return Math.floor(total * (discount.amount / 100));
    }
  };

  const discountAmount = appliedDiscount ? calculateDiscount(state.total, appliedDiscount) : 0;
  const finalTotal = state.total - discountAmount;

  const handlePromoCode = async () => {
    if (!promoCode.trim()) {
      toast.error("Введите промокод");
      return;
    }

    setIsApplyingPromo(true);
    
    try {
      const { data: promoData, error } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', promoCode.toUpperCase())
        .eq('is_active', true)
        .single();

      if (error || !promoData) {
        toast.error("Промокод не найден или недействителен");
        return;
      }

      // Проверяем срок действия
      if (promoData.expires_at && new Date(promoData.expires_at) < new Date()) {
        toast.error("Промокод истёк");
        return;
      }

      // Проверяем лимит использований
      if (promoData.usage_limit && promoData.used_count >= promoData.usage_limit) {
        toast.error("Промокод больше недоступен");
        return;
      }

      // Применяем промокод
      setAppliedDiscount({
        code: promoData.code,
        amount: promoData.discount_amount,
        type: promoData.discount_type as 'fixed' | 'percent'
      });

      const discountText = promoData.discount_type === 'fixed' 
        ? `${promoData.discount_amount} ₽`
        : `${promoData.discount_amount}%`;
      
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
    console.log("=== НАЧАЛО ОТПРАВКИ ЗАКАЗА ===");
    console.log("Данные формы:", data);
    console.log("Состояние корзины:", state);
    
    setIsSubmitting(true);
    
    try {
      // Создаем объект заказа
      const orderData = {
        items: JSON.stringify(state.items),
        total_amount: finalTotal,
        customer_name: data.customerName,
        customer_phone: data.customerPhone,
        delivery_type: data.deliveryType,
        delivery_date: data.deliveryDate ? data.deliveryDate.toISOString().split('T')[0] : null,
        delivery_time: data.deliveryTime,
        district: data.district,
        recipient_name: data.recipientName,
        recipient_phone: data.recipientPhone,
        recipient_address: data.deliveryType === 'delivery' ? data.recipientAddress : null,
        card_wishes: data.cardWishes,
        payment_method: data.paymentMethod,
        order_comment: data.orderComment,
        promo_code: appliedDiscount?.code || null,
        discount_amount: discountAmount,
        status: 'pending',
        order_status: 'new'
      };

      console.log("Объект заказа для отправки:", orderData);

      // Сохраняем заказ в базу данных
      console.log("Отправляем заказ в Supabase...");
      const { data: savedOrder, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (orderError) {
        console.error('Ошибка при сохранении заказа:', orderError);
        throw new Error(`Ошибка при сохранении заказа: ${orderError.message}`);
      }

      console.log("Заказ успешно сохранен:", savedOrder);

      // Обновляем счетчик использования промокода
      if (appliedDiscount) {
        console.log("Обновляем промокод...");
        // Получаем данные промокода
        const { data: promoData } = await supabase
          .from('promo_codes')
          .select('id, used_count')
          .eq('code', appliedDiscount.code)
          .single();

        if (promoData) {
          // Обновляем счетчик использования
          await supabase
            .from('promo_codes')
            .update({ used_count: promoData.used_count + 1 })
            .eq('code', appliedDiscount.code);

          // Записываем использование промокода
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Левая колонка - Форма */}
        <div className="lg:col-span-2 space-y-8">
          {/* ВАШ ЗАКАЗ */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-lg font-semibold mb-4">ВАШ ЗАКАЗ</h2>
              <div className="space-y-4">
                {state.items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                    <div className="relative">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded"
                      />
                    </div>
                    <div className="flex-1">
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
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                        >
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
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ЗАКАЗЧИК */}
          <Card>
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
                  <Input
                    id="customerPhone"
                    placeholder="Телефон заказчика"
                    {...register("customerPhone")}
                    onChange={(e) => handlePhoneChange(e, "customerPhone")}
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
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                  2
                </div>
                <h2 className="text-lg font-semibold">АДРЕС И ДОСТАВКА</h2>
              </div>
              
              <RadioGroup
                value={deliveryType}
                onValueChange={(value) => setValue("deliveryType", value as "delivery" | "pickup")}
                className="mb-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="delivery" id="delivery" />
                  <Label htmlFor="delivery">Доставка</Label>
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
                            disabled={(date) => date < new Date()}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div>
                      <Label htmlFor="deliveryTime">Время *</Label>
                      <Select onValueChange={(value) => setValue("deliveryTime", value)}>
                        <SelectTrigger>
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
                      <Label htmlFor="district">Район *</Label>
                      <Select onValueChange={(value) => setValue("district", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите район" />
                        </SelectTrigger>
                        <SelectContent>
                          {districts.map((district) => (
                            <SelectItem key={district} value={district}>
                              {district}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.district && (
                        <p className="text-red-500 text-sm mt-1">Район обязателен</p>
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
                      <Label htmlFor="recipientPhone">Номер получателя *</Label>
                      <Input
                        id="recipientPhone"
                        placeholder="Номер получателя"
                        {...register("recipientPhone")}
                        onChange={(e) => handlePhoneChange(e, "recipientPhone")}
                        className={errors.recipientPhone ? "border-red-500" : ""}
                      />
                      {errors.recipientPhone && (
                        <p className="text-red-500 text-sm mt-1">Номер получателя обязателен</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="recipientAddress">Адрес получателя *</Label>
                      <Input
                        id="recipientAddress"
                        placeholder="Адрес получателя"
                        {...register("recipientAddress")}
                        className={errors.recipientAddress ? "border-red-500" : ""}
                      />
                      {errors.recipientAddress && (
                        <p className="text-red-500 text-sm mt-1">Адрес получателя обязателен</p>
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

              <div className="flex items-center space-x-2 mt-4">
                <Checkbox 
                  id="pickup" 
                  checked={deliveryType === "pickup"}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setValue("deliveryType", "pickup");
                    }
                  }}
                />
                <Label htmlFor="pickup">Самовывоз</Label>
              </div>
            </CardContent>
          </Card>

          {/* СПОСОБЫ ОПЛАТЫ */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                  3
                </div>
                <h2 className="text-lg font-semibold">СПОСОБЫ ОПЛАТЫ</h2>
              </div>
              
              <RadioGroup 
                defaultValue="card" 
                onValueChange={(value) => setValue("paymentMethod", value as "card" | "sbp" | "cash")}
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
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cash" id="cash" />
                  <Label htmlFor="cash">Оплата наличными</Label>
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
        <div className="space-y-6">
          {/* Промокод */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4">ИМЕЕТЕ ПРОМОКОД?</h3>
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
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4">Итого</h3>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span>{state.itemCount} Товар(а)</span>
                  <span>{state.total.toLocaleString()} ₽</span>
                </div>
                
                {appliedDiscount && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Скидка ({appliedDiscount.code})</span>
                    <span>-{discountAmount.toLocaleString()} ₽</span>
                  </div>
                )}
                
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Сумма к оплате</span>
                  <span>{finalTotal.toLocaleString()} ₽</span>
                </div>
              </div>
              
              <Button 
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Оформляем заказ..." : "Оформить заказ"}
              </Button>
              
              <p className="text-xs text-muted-foreground mt-3">
                Нажимая на кнопку "Оформить заказ", Вы автоматически соглашаетесь{" "}
                <span className="underline">На обработку персональных данных</span>{" "}
                И с <span className="underline">политикой конфиденциальности</span>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
};