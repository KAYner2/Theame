import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Package, Clock, Phone } from "lucide-react";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const [orderId, setOrderId] = useState<string>("");

  useEffect(() => {
    // Получаем ID заказа из URL параметров
    const orderIdParam = searchParams.get("orderId") || searchParams.get("order");
    if (orderIdParam) {
      setOrderId(orderIdParam);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-2xl shadow-elegant">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Спасибо за ваш заказ!
          </CardTitle>
          <p className="text-muted-foreground text-lg">
            Ваш платеж успешно обработан
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {orderId && (
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">Номер заказа:</p>
              <p className="text-lg font-semibold text-primary">#{orderId}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">Обработка заказа</h3>
              <p className="text-sm text-muted-foreground">
                Мы начали подготовку вашего заказа
              </p>
            </div>

            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">Время доставки</h3>
              <p className="text-sm text-muted-foreground">
                От 30 минут
              </p>
            </div>

            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                <Phone className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">Связь с вами</h3>
              <p className="text-sm text-muted-foreground">
                Курьер свяжется перед доставкой
              </p>
            </div>
          </div>

          <div className="bg-primary/5 rounded-lg p-4 space-y-2">
            <h3 className="font-semibold text-primary">Что дальше?</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Флористы начнут подготовку букета в течение 30 минут</li>
              <li>• Курьер свяжется с вами за 30 минут до доставки</li>
              <li>• При возникновении вопросов звоните: +7 (993) 932-60-95 </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button asChild className="flex-1" variant="primary">
              <Link to="/catalog">Продолжить покупки</Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link to="/">На главную</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccess;