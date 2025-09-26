// src/components/TinkoffPaymentButton.tsx
import { useEffect, useRef, useId } from 'react';
import { Button } from './ui/button';

interface TinkoffPaymentConfig {
  amount: number;
  orderId: string;
  customerName: string;
  customerPhone: string;
  receipt?: any;
  onSuccess?: () => void;
  onFail?: () => void;
}

declare global {
  interface Window {
    PaymentIntegration?: {
      init: (config: any) => Promise<any>;
      Helpers?: any;
    };
    payWithTinkoff?: (config: TinkoffPaymentConfig) => Promise<void>;
  }
}

async function getPaymentUrl(cfg: TinkoffPaymentConfig) {
  const resp = await fetch('/api/tinkoff-init', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: cfg.amount,
      orderId: cfg.orderId,
      description: `Оплата заказа ${cfg.orderId}`,
      customerKey: cfg.customerPhone || cfg.customerName || cfg.orderId,
      successUrl:
        typeof window !== 'undefined' ? window.location.origin + '/success' : undefined,
      failUrl:
        typeof window !== 'undefined' ? window.location.origin + '/fail' : undefined,
      receipt: cfg.receipt,
    }),
  });

  const text = await resp.text();
  let data: any;
  try { data = JSON.parse(text); } catch { data = { error: text }; }

  if (!resp.ok || !data?.paymentUrl) {
    console.error('Init error payload:', data);
    throw new Error(data?.error || 'Не удалось получить PaymentURL');
  }
  return data.paymentUrl as string;
}

// глобальная функция оплаты — можно дергать из CheckoutForm
window.payWithTinkoff = async (cfg: TinkoffPaymentConfig) => {
  try {
    const url = await getPaymentUrl(cfg);
    window.open(url, '_blank');
  } catch (e) {
    console.error(e);
    cfg.onFail?.();
  }
};

export const TinkoffPaymentButton = (props: TinkoffPaymentConfig) => {
  const containerId = useId();
  const scriptLoaded = useRef(false);
  const integrationInitialized = useRef(false);

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
                  paymentStartCallback: async () => await getPaymentUrl(props),
                  config: {
                    status: {
                      changedCallback: (status: string) => {
                        if (status === 'SUCCESS') props.onSuccess?.();
                        if (['CANCELED', 'REJECTED', 'PROCESSING_ERROR'].includes(status)) props.onFail?.();
                      },
                    },
                  },
                },
              },
            });
            integrationInitialized.current = true;
          } catch (e) {
            console.error('Tinkoff init error:', e);
            props.onFail?.();
          }
        };

        script.onerror = () => {
          console.error('Не удалось загрузить скрипт интеграции Tinkoff');
          props.onFail?.();
        };

        document.head.appendChild(script);
      }
    };

    init();
  }, [containerId, props]);

  return (
    <div className="w-full space-y-4">
      {/* контейнер для виджета */}
      <div id={containerId} className="hidden" aria-hidden="true" />
      <div className="flex justify-center">
        <Button
          onClick={() => window.payWithTinkoff?.(props)}
          className="w-full max-w-sm"
          variant="outline"
        >
          Оплатить
        </Button>
      </div>
    </div>
  );
};
