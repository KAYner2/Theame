import { useEffect, useRef, useId } from 'react';
import { Button } from './ui/button';

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
  const integrationInitialized = useRef(false);

  useEffect(() => {
    const initPaymentIntegration = async () => {
      if (!scriptLoaded.current) {
        // Создаем глобальную функцию для инициализации
        window.onPaymentIntegrationLoad = async () => {
          try {
            const initConfig = {
              terminalKey: '1754488339817DEMO', // Демо ключ
              product: 'eacq' as const,
              features: {
                payment: {
                  container: document.getElementById(containerId),
                  paymentStartCallback: async () => {
                    try {
                      // Для демо используем рабочую тестовую ссылку
                      // В реальном проекте здесь должен быть вызов вашего backend API
                      console.log('Инициализация платежа для заказа:', orderId, 'на сумму:', amount);
                      
                      // Демо ссылка для тестирования (работающая)
                      const demoPaymentUrl = `https://securepayments.tinkoff.ru/v2/terminal/1754488339817DEMO/payment?orderId=${orderId}&amount=${amount}`;
                      
                      return demoPaymentUrl;
                    } catch (error) {
                      console.error('Ошибка в paymentStartCallback:', error);
                      onFail?.();
                      throw error;
                    }
                  },
                  config: {
                    status: {
                      changedCallback: async (status: string) => {
                        console.log('Статус платежа:', status);
                        if (status === 'SUCCESS') {
                          onSuccess?.();
                        } else if (['CANCELED', 'REJECTED', 'PROCESSING_ERROR'].includes(status)) {
                          onFail?.();
                        }
                      }
                    },
                    dialog: {
                      closedCallback: async () => {
                        console.log('Диалог платежа закрыт');
                      }
                    }
                  }
                }
              }
            };

            const integration = await window.PaymentIntegration!.init(initConfig);
            integrationInitialized.current = true;
            console.log('Tinkoff Integration успешно инициализирован:', integration);
          } catch (error) {
            console.error('Ошибка инициализации Tinkoff:', error);
            onFail?.();
          }
        };

        // Загружаем скрипт
        const script = document.createElement('script');
        script.src = 'https://acq-paymentform-integrationjs.t-static.ru/integration.js';
        script.async = true;
        script.onload = () => {
          scriptLoaded.current = true;
          window.onPaymentIntegrationLoad?.();
        };
        
        document.head.appendChild(script);
      } else if (window.PaymentIntegration && !integrationInitialized.current) {
        window.onPaymentIntegrationLoad?.();
      }
    };

    initPaymentIntegration();
  }, [containerId, amount, orderId, customerName, customerPhone, onSuccess, onFail]);

  const handleManualPayment = () => {
    // Альтернативная ссылка для оплаты через Tinkoff
    const paymentUrl = `https://securepayments.tinkoff.ru/terminal/1754488339817DEMO/payment?orderId=${orderId}&amount=${amount}`;
    window.open(paymentUrl, '_blank');
  };

  return (
    <div className="w-full space-y-4">
      <div 
        id={containerId}
        className="w-full min-h-[60px]"
      />
      
      {/* Fallback кнопка если виджет не загрузился */}
      <div className="flex justify-center">
        <Button 
          onClick={handleManualPayment}
          className="w-full max-w-sm"
          variant="outline"
        >
          Оплатить через Tinkoff
        </Button>
      </div>
    </div>
  );
};