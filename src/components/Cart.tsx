import { useState, useEffect } from "react";
import { useCart } from "../context/CartContext";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Trash2, Plus, Minus } from "lucide-react";
import { OrderForm } from "./OrderForm";

export const Cart = () => {
  const { state, removeFromCart, updateQuantity } = useCart();
  const [showOrderForm, setShowOrderForm] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const updateItemQuantity = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(id);
    } else {
      updateQuantity(id, newQuantity);
    }
  };

  if (showOrderForm) {
    return <OrderForm onBack={() => setShowOrderForm(false)} />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Корзина
              <Badge variant="secondary">
                {state.itemCount} {state.itemCount === 1 ? 'товар' : 'товаров'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {state.items.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Ваша корзина пуста</p>
              </div>
            ) : (
              <div className="space-y-4">
                {state.items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium">{item.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {item.price} ₽ за шт.
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateItemQuantity(item.id, item.cartQuantity - 1)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center">{item.cartQuantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateItemQuantity(item.id, item.cartQuantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {(item.price * item.cartQuantity).toLocaleString()} ₽
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => removeFromCart(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                <Separator />
                
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Итого:</span>
                  <span>{state.total.toLocaleString()} ₽</span>
                </div>
                
                <Button
                  className="w-full"
                  onClick={() => setShowOrderForm(true)}
                  disabled={state.items.length === 0}
                >
                  Оформить заказ
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};