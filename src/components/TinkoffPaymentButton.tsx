// src/components/TinkoffPaymentButton.tsx
import { useEffect, useRef, useId } from 'react';
import { Button } from './ui/button';

interface TinkoffPaymentButtonProps {
  amount: number; // Сумма в КОПЕЙКАХ (напр. 800000 = 8000.00 ₽)
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

  // Берём PaymentURL у нашего серверного роута на Vercel
  async function getPaymentUrl() {
    const resp = await fetch('/api/tinkoff-init', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount,
        orderId,
        description: `Оплата заказа ${orderId}`,
        customerKey: customerPhone || customerName || orderId,
        successUrl: typeof window !== 'undefined' ? window.location.origin + '/success' : undefined,
        failUrl: typeof window !== 'undefined' ? window.location.origin + '/fail' : undefined,
      }),
    });

    const data = await resp.json();
    if (!resp.ok || !data?.paymentUrl) {
      throw new Error(data?.error || 'Не удалось получить PaymentURL');
    }
    return data.paymentUrl as string;
  }

  useEffect(() => {
    const init = async () => {
      if (integrationInitialized.current) return;

      // 1) Подгружаем официальный скрипт интеграции
      if (!scriptLoaded.current) {
        const script = document.createElement('script');
        script.src = 'https://acq-paymentform-integrationjs.t-static.ru/integration.js';
        script.async = true;

        script.onload = async () => {
          scriptLoaded.current = true;

          try {
            // 2) Инициализируем виджет и говорим откуда брать PaymentURL
            const integration = await window.PaymentIntegration!.init({
              terminalKey: '1754488339817DEMO', // демо-терминал; боевой укажешь в кабинете + в /api
              product: 'eacq',
              features: {
                payment: {
                  container: document.getElementById(containerId)!,
                  paymentStartCallback: async () => {
                    // вместо “ручных” ссылок получаем PaymentURL у нашего API
                    return await getPaymentUrl();
                  },
                  config: {
                    status: {
                      changedCallback: (status: string) => {
                        // SUCCESS / CANCELED / REJECTED / PROCESSING_ERROR / ...
                        if (status === 'SUCCESS') onSuccess?.();
                        if (['CANCELED', 'REJECTED', 'PROCESSING_ERROR'].includes(status)) onFail?.();
                      },
                    },
                    dialog: {
                      closedCallback: () => {
                        // Пользователь закрыл окно оплаты — опционально что-то делаем
                      },
                    },
                  },
                },
              },
            });

            integrationInitialized.current = true;
            console.log('Tinkoff Integration ready:', integration);
          } catch (e) {
            console.error('Tinkoff init error:', e);
            onFail?.();
          }
        };

        script.onerror = () => {
          console.error('Не удалось загрузить скрипт интеграции Tinkoff');
          onFail?.();
        };

        document.head.appendChild(script);
      }
    };

    init();
  }, [containerId, amount, orderId, customerName, customerPhone, onSuccess, onFail]);

  // Фолбэк-кнопка: если виджет не появился, всё равно откроем оплату по полученному PaymentURL
  const handleFallback = async () => {
    try {
      const url = await getPaymentUrl();
      window.open(url, '_blank');
    } catch (e) {
      console.error(e);
      onFail?.();
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* сюда Tinkoff сам отрисует кнопку/виджет */}
      <div id={containerId} className="w-full min-h-[60px]" />

      {/* запасная кнопка */}
      <div className="flex justify-center">
        <Button onClick={handleFallback} className="w-full max-w-sm" variant="outline">
          Оплатить через Tinkoff
        </Button>
      </div>
    </div>
  );
};
