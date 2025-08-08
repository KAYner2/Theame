import { useEffect, useRef } from 'react';

interface TinkoffPaymentButtonProps {
  amount: number; // в копейках
  orderId: string;
  customerName: string;
  customerPhone: string;
  onSuccess?: () => void;
  onFail?: () => void;
}

declare global {
  interface Window {
    PaymentIntegration?: {
      init: (config: {
        terminalKey: string;
        successURL?: string;
        failURL?: string;
        language?: string;
        onSuccess?: () => void;
        onFail?: () => void;
      }) => void;
    };
  }
}

export const TinkoffPaymentButton = ({
  amount,
  orderId,
  customerName,
  customerPhone,
  onSuccess,
  onFail
}: TinkoffPaymentButtonProps) => {
  const scriptLoaded = useRef(false);
  const widgetInitialized = useRef(false);

  const initPaymentWidget = () => {
    if (window.PaymentIntegration && !widgetInitialized.current) {
      try {
        window.PaymentIntegration.init({
          terminalKey: '1754488339817DEMO',
          successURL: window.location.origin + '/success',
          failURL: window.location.origin + '/fail',
          language: 'ru',
          onSuccess: () => {
            console.log('Оплата успешна');
            onSuccess?.();
          },
          onFail: () => {
            console.log('Ошибка оплаты');
            onFail?.();
          }
        });
        widgetInitialized.current = true;
      } catch (error) {
        console.error('Ошибка инициализации Tinkoff Payment:', error);
      }
    }
  };

  useEffect(() => {
    // Загружаем скрипт только один раз
    if (!scriptLoaded.current) {
      const script = document.createElement('script');
      script.src = 'https://acq-paymentform-integrationjs.t-static.ru/integration.js';
      script.async = true;
      script.onload = () => {
        scriptLoaded.current = true;
        initPaymentWidget();
      };
      document.head.appendChild(script);
    } else if (window.PaymentIntegration && !widgetInitialized.current) {
      initPaymentWidget();
    }
  }, [amount, orderId, customerName, customerPhone]);

  return (
    <div 
      id="tinkoff-payment-button"
      data-amount={amount}
      data-orderid={orderId}
      data-name={customerName}
      data-phone={customerPhone}
      className="mt-4"
    >
      {/* Кнопка оплаты будет отрендерена сюда виджетом Tinkoff */}
    </div>
  );
};