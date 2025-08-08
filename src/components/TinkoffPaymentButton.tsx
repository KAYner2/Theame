import { useEffect } from "react";

type Props = {
  amount: number; // в копейках
  orderId: string;
  email?: string;
  phone?: string;
  name?: string; // описание заказа
};

export default function TinkoffPaymentButton({
  amount,
  orderId,
  email = "",
  phone = "",
  name = "Оплата заказа"
}: Props) {
  useEffect(() => {
    // Подключаем скрипт только один раз
    const script = document.createElement("script");
    script.src = "https://acq-paymentform-integrationjs.t-static.ru/integration.js";
    script.async = true;
    script.onload = () => {
      if (window.PaymentIntegration) {
        window.PaymentIntegration.init({
          terminalKey: "1754488339817DEMO", // замени на свой, если нужно
          product: "eacq",
          features: {
            payment: {}, // включаем кнопки оплаты
          },
        });
      }
    };
    document.body.appendChild(script);
  }, []);

  return (
    <div
      className="tinkoffPayRow"
      style={{ maxWidth: 300, marginTop: 20 }}
      data-amount={amount.toString()}
      data-orderid={orderId}
      data-email={email}
      data-phone={phone}
      data-name={name}
    ></div>
  );
}
