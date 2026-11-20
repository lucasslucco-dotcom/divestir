// A faxina diária da loja (pedido do Lucas, 19/11/2026). A Vercel chama este endereço
// uma vez por dia, de madrugada (vercel.json, "crons"), e ele:
//
//   1. apaga as fotos vencidas: as de montagens que nunca viraram compra, 30 dias
//      depois do envio (briefing, "Segurança desde o primeiro dia"). Primeiro os
//      arquivos no espaço privado das fotos, depois as linhas no banco;
//   2. cancela os pedidos que ficaram sem pagamento por mais de 3 dias;
//   3. apaga as contagens antigas do limite de uso.
//
// Só a Vercel pode chamar: ela manda a senha CRON_SECRET (variável de ambiente, só no
// servidor) no cabeçalho Authorization. Sem a senha certa, nada acontece.

import { timingSafeEqual } from 'node:crypto';
import { erro } from '@/lib/api';
import { ESPACO_DAS_FOTOS } from '@/lib/foto/espaco';
import { DIAS_SEM_PAGAR } from '@/lib/loja';
import { criarClienteAdmin } from '@/lib/supabase/admin';

export const maxDuration = 60;

// Fotos por rodada, e quantas rodadas cabem numa faxina (o resto fica para amanhã).
const FOTOS_POR_VEZ = 200;
const RODADAS = 10;

function autorizado(request: Request) {
  const senha = process.env.CRON_SECRET;
  if (!senha) return null;
  const recebido = Buffer.from(request.headers.get('authorization') ?? '');
  const esperado = Buffer.from(`Bearer ${senha}`);
  return recebido.length === esperado.length && timingSafeEqual(recebido, esperado);
}

type FotoVencida = { id: string; original_url: string | null; recorte_url: string | null };

export async function GET(request: Request) {
  const pode = autorizado(request);
  if (pode === null) return erro('A faxina ainda não está ligada.', 503);
  if (!pode) return erro('Sem permissão.', 401);
  const admin = criarClienteAdmin();
  if (!admin) return erro('A faxina ainda não está ligada.', 503);

  const feito = { fotos: 0, arquivos: 0, pedidos: 0, contagens: 0, falhas: [] as string[] };

  // 1. Fotos vencidas.
  for (let rodada = 0; rodada < RODADAS; rodada++) {
    const { data, error } = await admin.rpc('fotos_vencidas', { p_limite: FOTOS_POR_VEZ });
    if (error) {
      feito.falhas.push(`fotos vencidas: ${error.message}`);
      break;
    }
    const fotos = (data ?? []) as FotoVencida[];
    if (!fotos.length) break;

    const arquivos = fotos.flatMap((f) => [f.original_url, f.recorte_url]).filter((c): c is string => !!c);
    if (arquivos.length) {
      // Um arquivo que nunca chegou (a pessoa desistiu no meio do envio) não é erro.
      const { data: apagados, error: erroDosArquivos } = await admin.storage.from(ESPACO_DAS_FOTOS).remove(arquivos);
      if (erroDosArquivos) {
        feito.falhas.push(`arquivos das fotos: ${erroDosArquivos.message}`);
        break;
      }
      feito.arquivos += apagados?.length ?? 0;
    }

    const { data: linhas, error: erroDasLinhas } = await admin.rpc('apagar_fotos', { p_ids: fotos.map((f) => f.id) });
    if (erroDasLinhas) {
      feito.falhas.push(`linhas das fotos: ${erroDasLinhas.message}`);
      break;
    }
    feito.fotos += Number(linhas ?? 0);
    if (fotos.length < FOTOS_POR_VEZ || !Number(linhas ?? 0)) break;
  }

  // 2. Pedidos que nunca foram pagos.
  const pedidos = await admin.rpc('cancelar_pedidos_nao_pagos', { p_dias: DIAS_SEM_PAGAR });
  if (pedidos.error) feito.falhas.push(`pedidos sem pagamento: ${pedidos.error.message}`);
  else feito.pedidos = Number(pedidos.data ?? 0);

  // 3. Contagens antigas do limite de uso.
  const contagens = await admin.rpc('limpar_uso');
  if (contagens.error) feito.falhas.push(`contagens de uso: ${contagens.error.message}`);
  else feito.contagens = Number(contagens.data ?? 0);

  if (feito.falhas.length) console.error('faxina: terminou com falhas', JSON.stringify(feito));
  else console.log('faxina: feita', JSON.stringify(feito));
  return Response.json(feito, { status: feito.falhas.length ? 500 : 200, headers: { 'Cache-Control': 'no-store' } });
}
