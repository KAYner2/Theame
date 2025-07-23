import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCart } from "../context/CartContext";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { useToast } from "../hooks/use-toast";

const orderFormSchema = z.object({
  name: z.string().min(2, "Имя должно содержать минимум 2 символа"),
  phone: z.string().min(10, "Введите корректный номер телефона"),
  comment: z.string().optional(),
});

type OrderFormData = z.infer<typeof orderFormSchema>;

interface OrderFormProps {
  onBack: () => void;
}

export const OrderForm = ({ onBack }: OrderFormProps) => {
  const { state, clearCart } = useCart();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      name: "",
      phone: "",
      comment: "",
    },
  });

  const onSubmit = async (data: OrderFormData) => {
    setIsSubmitting(true);
    
    try {
      // Формируем данные заказа
      const orderData = {
        customer: data,
        items: state.items,
        total: state.total,
        orderDate: new Date().toISOString(),
      };

      // Здесь должна быть отправка заказа через EmailJS или Supabase
      // Для демонстрации просто имитируем отправку
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Заказ отправлен:', orderData);
      
      // Успешная отправка
      setIsSuccess(true);
      clearCart();
      
      toast({
        title: "Заказ оформлен!",
        description: "Мы свяжемся с вами в ближайшее время.",
      });
      
      // Возвращаемся к корзине через 3 секунды
      setTimeout(() => {
        onBack();
        setIsSuccess(false);
      }, 3000);
      
    } catch (error) {
      console.error('Ошибка отправки заказа:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось отправить заказ. Попробуйте снова.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
                <h2 className="text-2xl font-bold">Заказ оформлен!</h2>
                <p className="text-muted-foreground">
                  Спасибо за ваш заказ! Мы свяжемся с вами в ближайшее время для подтверждения.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" onClick={onBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <CardTitle>Оформление заказа</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Краткая информация о заказе */}
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-medium mb-2">Ваш заказ:</h3>
              <div className="space-y-1 text-sm">
                {state.items.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <span>{item.name} x{item.cartQuantity}</span>
                    <span>{(item.price * item.cartQuantity).toLocaleString()} ₽</span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-2 mt-2 font-bold">
                Итого: {state.total.toLocaleString()} ₽
              </div>
            </div>

            {/* Форма */}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ваше имя *</FormLabel>
                      <FormControl>
                        <Input placeholder="Введите ваше имя" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Номер телефона *</FormLabel>
                      <FormControl>
                        <Input placeholder="+7 (999) 123-45-67" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="comment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Комментарий к заказу</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Дополнительные пожелания или информация о доставке..."
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Отправляем..." : "Оформить заказ"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};