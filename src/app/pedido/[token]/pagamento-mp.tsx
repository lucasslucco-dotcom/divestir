'use client';

import { useEffect, useRef, useState } from 'react';
import { MAX_PARCELAS } from '@/lib/loja';
import { IconeCarregando } from '../../montar/icones';

// O formulário de pagamento do próprio Mercado Pago (Payment Brick), dentro da
// página: Pix e cartão de crédito em até 12 vezes. Os dados do cartão vão direto do
// navegador para o Mercado Pago; o site só recebe o código de uso único do cartão.

type ControleDoBrick = { unmount: () => void };
type Bricks = { create: (tipo: 'payment', container: string, ajustes: unknown) => Promise<ControleDoBrick> };
type SdkDoMercadoPago = new (chave: string, opcoes: { locale: string }) => { bricks: () => Bricks };

declare global {
  interface Window {
    MercadoPago?: SdkDoMercadoPago;
  }
}

export type Envio = { metodo: string; formulario: Record<string, unknown> };

let sdk: Promise<void> | null = null;
function carregarSdk() {
  sdk ??= new Promise<void>((ok, falhou) => {
    if (window.MercadoPago) return ok();
    const script = document.createElement('script');
    script.src = 'https://sdk.mercadopago.com/js/v2';
    script.async = true;
    script.onload = () => ok();
    script.onerror = () => {
      sdk = null;
      script.remove();
      falhou(new Error('O Mercado Pago não carregou.'));
    };
    document.head.appendChild(script);
  });
  return sdk;
}

let contador = 0;

export function PagamentoMercadoPago({
  chavePublica,
  total,
  email,
  aoPagar,
}: {
  chavePublica: string;
  total: number;
  email: string | null;
  // Devolve quando o site terminou de tratar o pagamento (o formulário espera).
  aoPagar: (envio: Envio) => Promise<void>;
}) {
  const caixa = useRef<HTMLDivElement>(null);
  const pagar = useRef(aoPagar);
  const [estado, setEstado] = useState<'carregando' | 'pronto' | 'falhou'>('carregando');

  useEffect(() => {
    pagar.current = aoPagar;
  }, [aoPagar]);

  useEffect(() => {
    // Cada montagem ganha a própria caixa: desmontar uma não apaga a outra.
    const alvo = document.createElement('div');
    alvo.id = `pagamento-mercado-pago-${++contador}`;
    caixa.current?.appendChild(alvo);
    let cancelado = false;
    let controle: ControleDoBrick | null = null;

    carregarSdk()
      .then(async () => {
        if (cancelado || !window.MercadoPago) return;
        const mp = new window.MercadoPago(chavePublica, { locale: 'pt-BR' });
        const criado = await mp.bricks().create('payment', alvo.id, {
          initialization: { amount: total, ...(email ? { payer: { email } } : {}) },
          customization: {
            paymentMethods: { creditCard: 'all', bankTransfer: 'all', maxInstallments: MAX_PARCELAS },
            visual: {
              style: {
                theme: 'flat',
                customVariables: {
                  baseColor: '#0d2b17',
                  baseColorFirstVariant: '#1f4d30',
                  baseColorSecondVariant: '#1f4d30',
                  textPrimaryColor: '#0d2b17',
                  textSecondaryColor: '#0d2b17',
                  formBackgroundColor: '#faf5eb',
                  inputBackgroundColor: '#faf5eb',
                  outlinePrimaryColor: '#0d2b17',
                  outlineSecondaryColor: '#0d2b17',
                  buttonTextColor: '#faf5eb',
                  borderRadiusSmall: '6px',
                  borderRadiusMedium: '6px',
                  borderRadiusLarge: '12px',
                },
              },
            },
          },
          callbacks: {
            onReady: () => {
              if (!cancelado) setEstado('pronto');
            },
            onSubmit: ({
              selectedPaymentMethod,
              formData,
            }: {
              selectedPaymentMethod: string;
              formData: Record<string, unknown>;
            }) => pagar.current({ metodo: selectedPaymentMethod, formulario: formData }),
            onError: (erro: unknown) => {
              console.error('mercadopago: erro no formulário', erro);
              if ((erro as { type?: string } | null)?.type === 'critical' && !cancelado) setEstado('falhou');
            },
          },
        });
        if (cancelado) criado.unmount();
        else controle = criado;
      })
      .catch(() => {
        if (!cancelado) setEstado('falhou');
      });

    return () => {
      cancelado = true;
      controle?.unmount();
      alvo.remove();
    };
  }, [chavePublica, total, email]);

  return (
    <div>
      {estado === 'carregando' ? (
        <p role="status" className="flex items-center gap-2 py-6 text-[0.9375rem] leading-snug">
          <IconeCarregando /> Abrindo o pagamento do Mercado Pago…
        </p>
      ) : null}
      {estado === 'falhou' ? (
        <p role="alert" className="py-6 text-[0.9375rem] leading-snug font-semibold">
          O pagamento do Mercado Pago não abriu. Recarrega a página para tentar de novo?
        </p>
      ) : null}
      <div ref={caixa} />
    </div>
  );
}
