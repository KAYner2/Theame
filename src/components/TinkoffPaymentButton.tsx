// src/components/TinkoffPaymentButton.tsx
import { useEffect, useRef, useId } from 'react';
import { Button } from './ui/button';

interface TinkoffPaymentButtonProps {
  amount: number;        // сумма в КОПЕЙКАХ (пример: 800000 = 8000 ₽)
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

  async function getPaymentUrl() {
    const resp = await fetch('/api/tinkoff-init', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount,
        orderId,
        description: `Оплата заказа ${orderId}`,
        customerKey: customerPhone || customerName || orderId,
        successUrl:
          typeof window !== 'undefined' ? window.location.origin + '/success' : undefined,
        failUrl:
          typeof window !== 'undefined' ? window.location.origin + '/fail' : undefined,
      }),
    });

    const text = await resp.text();
    let data: any;
    try { data = JSON.parse(text); } catch { data = { error: text }; }

    if (!resp.ok || !data?.paymentUrl) {
      throw new Error(data?.error || 'Не удалось получить PaymentURL');
    }
    return data.paymentUrl as string;
  }

  useEffect(() => {
    const init = async () => {
      if (integrationInitialized.current) return;

      if (!scriptLoaded.current) {
        const script = document.createElement('script');
        script.src = 'https://acq-paymentform-integrationjs.t-static.ru/integration.js';
        script.async = true;

        script.onload = async () => {
          scriptLoaded.current = true;
          try {
            await window.PaymentIntegration!.init({
              terminalKey: import.meta.env.VITE_TINKOFF_TERMINAL_KEY || '1754488339817DEMO',
              product: 'eacq',
              features: {
                payment: {
                  container: document.getElementById(containerId)!,
                  paymentStartCallback: async () => await getPaymentUrl(),
                  config: {
                    status: {
                      changedCallback: (status: string) => {
                        if (status === 'SUCCESS') onSuccess?.();
                        if (['CANCELED', 'REJECTED', 'PROCESSING_ERROR'].includes(status)) onFail?.();
                      },
                    },
                    dialog: { closedCallback: () => {} },
                  },
                },
              },
            });
            integrationInitialized.current = true;
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
      {/* контейнер для инициализации Tinkoff, скрыт чтобы кнопка не была видна */}
      <div id={containerId} className="hidden" aria-hidden="true" />
      <div className="flex justify-center">
        <Button onClick={handleFallback} className="w-full max-w-sm" variant="outline">
          Оплатить
        </Button>
      </div>
    </div>
  );
};
