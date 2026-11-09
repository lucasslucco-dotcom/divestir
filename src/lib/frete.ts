import 'server-only';
import type { PacoteDeEnvio } from './catalogo';
import type { OpcaoDeFrete } from './checkout';
import { somar } from './loja';

// Cotação do frete pelo Melhor Envio (decisão do Lucas, 08/11/2026): o valor e o
// prazo de entrega de cada transportadora, para o CEP de quem recebe.
//
// Variáveis de ambiente (na Vercel):
//   MELHORENVIO_TOKEN     token da conta do Melhor Envio (segredo, só no servidor)
//   MELHORENVIO_AMBIENTE  "producao" usa a conta de verdade; vazio usa a de teste (sandbox)
//   FRETE_CEP_ORIGEM      CEP de onde as peças saem
//   MELHORENVIO_CONTATO   e-mail de contato técnico, que o Melhor Envio pede em cada consulta
//   (MELHORENVIO_API_URL troca o endereço da API só no teste local, com um Melhor Envio de mentira.)
// Sem token ou sem CEP de origem, o frete é simulado (valores de mentira, marcados
// como simulados), para o checkout funcionar antes da conta existir.

export type ItemDoFrete = { pacote: PacoteDeEnvio | null; valor: number };

export class FreteIndisponivel extends Error {}

// Peça sem pacote cadastrado usa uma caixa média.
const PACOTE_PADRAO: PacoteDeEnvio = { peso_kg: 0.6, largura_cm: 30, altura_cm: 8, comprimento_cm: 35 };
const MAXIMO_DE_OPCOES = 3;

function ambiente() {
  if (!process.env.MELHORENVIO_TOKEN || !process.env.FRETE_CEP_ORIGEM) return 'simulado' as const;
  return process.env.MELHORENVIO_AMBIENTE === 'producao' ? ('producao' as const) : ('sandbox' as const);
}

export function freteSimulado() {
  return ambiente() === 'simulado';
}

// Duas opções de mentira, um pouco mais caras a cada peça a mais.
function simular(itens: ItemDoFrete[]): OpcaoDeFrete[] {
  const extra = Math.max(0, itens.length - 1) * 4;
  return [
    {
      id: 'simulado-economico',
      transportadora: 'Frete simulado',
      servico: 'Econômico',
      preco: somar(24.9, extra),
      prazo: { min: 6, max: 10 },
      simulado: true,
    },
    {
      id: 'simulado-expresso',
      transportadora: 'Frete simulado',
      servico: 'Expresso',
      preco: somar(39.9, extra),
      prazo: { min: 2, max: 4 },
      simulado: true,
    },
  ];
}

type Cotacao = {
  id?: number | string;
  name?: string;
  price?: string | number;
  custom_price?: string | number;
  delivery_time?: number;
  delivery_range?: { min?: number; max?: number };
  custom_delivery_time?: number;
  custom_delivery_range?: { min?: number; max?: number };
  company?: { name?: string };
  error?: unknown;
};

function lerCotacao(c: Cotacao): OpcaoDeFrete | null {
  if (c.error || c.id === undefined || !c.name) return null;
  const preco = Number(c.custom_price ?? c.price);
  const faixa = c.custom_delivery_range ?? c.delivery_range;
  const dias = c.custom_delivery_time ?? c.delivery_time;
  const min = Number(faixa?.min ?? dias);
  const max = Number(faixa?.max ?? dias);
  if (!Number.isFinite(preco) || preco <= 0 || !Number.isFinite(min) || !Number.isFinite(max) || max < min) return null;
  return {
    id: String(c.id),
    transportadora: c.company?.name ?? '',
    servico: c.name,
    preco: somar(preco),
    prazo: { min, max },
    simulado: false,
  };
}

// Poucas opções e fortes: a mais barata, a mais rápida e, se sobrar lugar, a
// próxima mais barata.
function escolher(opcoes: OpcaoDeFrete[]): OpcaoDeFrete[] {
  const porPreco = [...opcoes].sort((a, b) => a.preco - b.preco || a.prazo.max - b.prazo.max);
  const maisRapida = [...opcoes].sort((a, b) => a.prazo.max - b.prazo.max || a.preco - b.preco)[0];
  const escolhidas = new Map<string, OpcaoDeFrete>();
  for (const opcao of [porPreco[0], maisRapida, ...porPreco.slice(1)]) {
    if (opcao && escolhidas.size < MAXIMO_DE_OPCOES) escolhidas.set(opcao.id, opcao);
  }
  return [...escolhidas.values()].sort((a, b) => a.preco - b.preco);
}

export async function cotarFrete(cep: string, itens: ItemDoFrete[]): Promise<OpcaoDeFrete[]> {
  const modo = ambiente();
  if (modo === 'simulado') return simular(itens);

  const base =
    process.env.MELHORENVIO_API_URL ??
    (modo === 'producao' ? 'https://melhorenvio.com.br' : 'https://sandbox.melhorenvio.com.br');
  const contato = process.env.MELHORENVIO_CONTATO;
  let resposta: Response;
  try {
    resposta = await fetch(`${base}/api/v2/me/shipment/calculate`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.MELHORENVIO_TOKEN}`,
        'User-Agent': contato ? `Divestir (${contato})` : 'Divestir',
      },
      body: JSON.stringify({
        from: { postal_code: process.env.FRETE_CEP_ORIGEM?.replace(/\D/g, '') },
        to: { postal_code: cep },
        products: itens.map((item, i) => {
          const pacote = item.pacote ?? PACOTE_PADRAO;
          return {
            id: String(i + 1),
            width: pacote.largura_cm,
            height: pacote.altura_cm,
            length: pacote.comprimento_cm,
            weight: pacote.peso_kg,
            insurance_value: item.valor,
            quantity: 1,
          };
        }),
        options: { receipt: false, own_hand: false },
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    });
  } catch (motivo) {
    console.error('frete: o Melhor Envio não respondeu', motivo);
    throw new FreteIndisponivel('O Melhor Envio não respondeu.');
  }

  if (!resposta.ok) {
    const detalhe = (await resposta.text().catch(() => '')).slice(0, 300);
    console.error(`frete: o Melhor Envio respondeu ${resposta.status}`, detalhe);
    throw new FreteIndisponivel(`O Melhor Envio respondeu ${resposta.status}.`);
  }

  const dados: unknown = await resposta.json().catch(() => null);
  const lista = Array.isArray(dados) ? (dados as Cotacao[]) : [];
  return escolher(lista.map(lerCotacao).filter((opcao): opcao is OpcaoDeFrete => opcao !== null));
}
