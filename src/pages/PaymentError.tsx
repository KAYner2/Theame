import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { XCircle, RefreshCw, Phone, ArrowLeft } from "lucide-react";

const PaymentError = () => {
  const [searchParams] = useSearchParams();
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [orderId, setOrderId] = useState<string>("");

  useEffect(() => {
    // Получаем параметры ошибки из URL
    const error = searchParams.get("error") || "Произошла ошибка при обработке платежа";
    const orderIdParam = searchParams.get("orderId") || searchParams.get("order");
    
    setErrorMessage(error);
    if (orderIdParam) {
      setOrderId(orderIdParam);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-2xl shadow-elegant">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
            <XCircle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-3xl font-bold text-destructive">
            Ошибка платежа
          </CardTitle>
          <p className="text-muted-foreground text-lg">
            {errorMessage}
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {orderId && (
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">Номер заказа:</p>
              <p className="text-lg font-semibold text-primary">#{orderId}</p>
            </div>
          )}

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-2">
            <h3 className="font-semibold text-orange-800">Возможные причины:</h3>
            <ul className="text-sm text-orange-700 space-y-1">
              <li>• Недостаточно средств на карте</li>
              <li>• Превышен лимит операций</li>
              <li>• Технические проблемы банка</li>
              <li>• Неверно введены данные карты</li>
            </ul>
          </div>

          <div className="bg-primary/5 rounded-lg p-4 space-y-2">
            <h3 className="font-semibold text-primary">Что делать?</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Попробуйте повторить оплату через несколько минут</li>
              <li>• Проверьте баланс карты</li>
              <li>• Обратитесь в службу поддержки банка</li>
              <li>• Свяжитесь с нами для помощи</li>
            </ul>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="text-center space-y-2 p-4 bg-muted/30 rounded-lg">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                <Phone className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">Служба поддержки</h3>
              <p className="text-sm text-muted-foreground">
                +7 (993) 932-60-95
              </p>
              <p className="text-xs text-muted-foreground">
                Ежедневно с 9:00 до 21:00
              </p>
            </div>

            <div className="text-center space-y-2 p-4 bg-muted/30 rounded-lg">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                <RefreshCw className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">Повторная оплата</h3>
              <p className="text-sm text-muted-foreground">
                Оформите заказ заново
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button asChild className="flex-1" variant="primary">
              <Link to="/cart">
                <RefreshCw className="h-4 w-4 mr-2" />
                Повторить оплату
              </Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link to="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                На главную
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentError;