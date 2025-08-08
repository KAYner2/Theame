import { useEffect, useRef, useId } from 'react';

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
      init: (config: any) => Promise<any>;
      Helpers?: any;
    };
    onPaymentIntegrationLoad?: () => void;
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
  const containerId = useId();
  const scriptLoaded = useRef(false);
  const widgetInitialized = useRef(false);
  const integrationRef = useRef<any>(null);

  const paymentStartCallback = async () => {
    try {
      // Заглушка для демо - в реальном проекте здесь должен быть вызов вашего backend
      // const res = await new PaymentIntegration.Helpers().request('/api/init-payment', 'POST', {
      //   OrderId: orderId,
      //   Amount: amount,
      //   Description: `Заказ цветов №${orderId}`,
      //   CustomerName: customerName,
      //   Phone: customerPhone
      // });
      // return res.PaymentURL;
      
      // Для демо используем тестовую ссылку
      return `https://securepayments.tinkoff.ru/payment/init/${orderId}`;
    } catch (error) {
      console.error('Ошибка инициализации платежа:', error);
      onFail?.();
      throw error;
    }
  };

  const initPaymentWidget = async () => {
    if (window.PaymentIntegration && !widgetInitialized.current) {
      try {
        const container = document.getElementById(containerId);
        if (!container) return;

        const initConfig = {
          terminalKey: '1754488339817DEMO', // Демо ключ
          product: 'eacq',
          features: {
            payment: {
              container: container,
              paymentStartCallback: paymentStartCallback,
              config: {
                status: {
                  changedCallback: async (status: string) => {
                    console.log('Статус платежа изменился:', status);
                    if (status === 'SUCCESS') {
                      onSuccess?.();
                    } else if (status === 'CANCELED' || status === 'REJECTED' || status === 'PROCESSING_ERROR') {
                      onFail?.();
                    }
                  }
                },
                dialog: {
                  closedCallback: async () => {
                    console.log('Диалог оплаты закрыт');
                  }
                }
              }
            }
          }
        };

        integrationRef.current = await window.PaymentIntegration.init(initConfig);
        widgetInitialized.current = true;
        
        console.log('Tinkoff Payment Widget инициализирован');
      } catch (error) {
        console.error('Ошибка инициализации Tinkoff Payment:', error);
        onFail?.();
      }
    }
  };

  useEffect(() => {
    // Загружаем скрипт только один раз
    if (!scriptLoaded.current) {
      const script = document.createElement('script');
      script.src = 'https://acq-paymentform-integrationjs.t-static.ru/integration.js';
      script.async = true;
      
      // Создаем глобальную функцию для onload
      window.onPaymentIntegrationLoad = () => {
        scriptLoaded.current = true;
        initPaymentWidget();
      };
      
      script.setAttribute('onload', 'onPaymentIntegrationLoad()');
      document.head.appendChild(script);
    } else if (window.PaymentIntegration && !widgetInitialized.current) {
      initPaymentWidget();
    }
  }, [containerId]);

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      if (integrationRef.current && integrationRef.current.payments) {
        try {
          integrationRef.current.payments.remove('main-integration');
        } catch (error) {
          console.warn('Ошибка при очистке интеграции:', error);
        }
      }
    };
  }, []);

  return (
    <div className="w-full">
      <div 
        id={containerId}
        className="w-full min-h-[60px] flex items-center justify-center"
      >
        {/* Здесь будут отрендерены кнопки оплаты Tinkoff */}
        <div className="text-muted-foreground">
          Загрузка способов оплаты...
        </div>
      </div>
    </div>
  );
};