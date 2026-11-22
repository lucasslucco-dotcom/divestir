import 'server-only';
import { INSTAGRAM, PRAZO_DE_PERSONALIZACAO } from './loja';
import { emailLigado, enviarEmail } from './resend';
import { criarClienteAdmin } from './supabase/admin';

// Os avisos ao cliente a cada etapa do pedido (briefing, "Status do pedido e aviso
// automático"). Por enquanto só por e-mail: o WhatsApp entra quando o provedor estiver
// liberado (decisão do Lucas, 08/11/2026). Cada aviso enviado, ou que falhou, fica na
// tabela notificacoes e aparece na tela do pedido, no painel.
//
// Um aviso nunca derruba o que o chamou: se o e-mail falhar, o pedido segue e a falha
// fica registrada.

export type Aviso = 'pago' | 'ajuste_foto' | 'em_producao' | 'enviado' | 'entregue';

const VERDE = '#0d2b17';
const CREME = '#faf5eb';

export const enderecoDoSite = () =>
  process.env.SITE_URL || `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL || 'divestir.vercel.app'}`;

const escapar = (texto: string) =>
  texto.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c);

type Conteudo = {
  assunto: string;
  // A frase de cima, em serifa itálica ("Valeu, Lucas!").
  saudacao: string;
  // O título, em caixa-alta.
  titulo: string;
  paragrafos: string[];
  // Uma frase em destaque (o recado da foto, o código de rastreio).
  destaque?: { rotulo: string; valor: string };
  botao: string;
};

type Pedido = {
  id: number;
  numero: number;
  nome: string;
  email: string;
  rastreio: string | null;
  token_acompanhamento: string;
  prazo_personalizacao: string | null;
  frete_servico: { transportadora?: string; servico?: string; prazo_min?: number; prazo_max?: number } | null;
};

function conteudoDo(aviso: Aviso, pedido: Pedido, nota: string | null): Conteudo {
  const nome = pedido.nome.trim().split(/\s+/)[0] ?? '';
  const prazo =
    pedido.prazo_personalizacao ?? `${PRAZO_DE_PERSONALIZACAO.min} a ${PRAZO_DE_PERSONALIZACAO.max} dias úteis`;
  const frete = pedido.frete_servico;
  switch (aviso) {
    case 'pago':
      return {
        assunto: `Recebemos seu pedido nº ${pedido.numero}!`,
        saudacao: `Valeu, ${nome}!`,
        titulo: 'Recebemos seu pedido!',
        paragrafos: [
          'Agora é com a gente.',
          `A equipe confere a arte de cada peça e já começa a produção. Sua Divestir fica pronta em ${prazo}, e depois vem o prazo da entrega.`,
          'A cada novidade a gente te avisa por aqui.',
        ],
        botao: 'Acompanhar meu pedido',
      };
    case 'ajuste_foto':
      return {
        assunto: `Precisamos de uma foto melhor (pedido nº ${pedido.numero})`,
        saudacao: `Oi, ${nome}!`,
        titulo: 'Precisamos de uma foto melhor',
        paragrafos: [
          'A gente olhou a sua foto com carinho, e do jeito que ela está a estampa não ia ficar à altura de quem você ama.',
          'A equipe vai te chamar no WhatsApp para receber a foto nova. Assim que ela chegar, seu pedido volta para a fila.',
        ],
        destaque: nota ? { rotulo: 'O que a equipe viu', valor: nota } : undefined,
        botao: 'Ver meu pedido',
      };
    case 'em_producao':
      return {
        assunto: `Sua Divestir está sendo feita (pedido nº ${pedido.numero})`,
        saudacao: `Boa notícia, ${nome}!`,
        titulo: 'Sua Divestir está sendo feita',
        paragrafos: [
          'A arte foi aprovada e a peça entrou em produção.',
          'Quando ela sair daqui, a gente te manda o código de rastreio.',
        ],
        botao: 'Acompanhar meu pedido',
      };
    case 'enviado':
      return {
        assunto: `Saiu pra entrega! (pedido nº ${pedido.numero})`,
        saudacao: `${nome}, tá chegando!`,
        titulo: 'Saiu pra entrega!',
        paragrafos: [
          `Sua Divestir já está com ${frete?.transportadora ? `a transportadora (${[frete.transportadora, frete.servico].filter(Boolean).join(', ')})` : 'a transportadora'}${frete?.prazo_min && frete.prazo_max ? ` e costuma levar de ${frete.prazo_min} a ${frete.prazo_max} dias úteis` : ''}.`,
          'Com o código de rastreio você acompanha o caminho no site da transportadora.',
        ],
        destaque: pedido.rastreio ? { rotulo: 'Código de rastreio', valor: pedido.rastreio } : undefined,
        botao: 'Acompanhar meu pedido',
      };
    case 'entregue':
      return {
        assunto: 'Chegou! Marca a gente quando vestir',
        saudacao: `${nome}, que alegria!`,
        titulo: 'Chegou!',
        paragrafos: [
          `Sua Divestir foi entregue. Marca o ${INSTAGRAM} quando vestir: a gente quer ver.`,
          'Se algo não chegou como você esperava, responde por onde a equipe falou com você, que a gente resolve.',
        ],
        botao: 'Ver meu pedido',
      };
  }
}

// O e-mail no jeito da marca: papel creme, tinta verde, título em caixa-alta e um
// botão só. Feito com tabelas e estilos na própria linha, que é o que os programas de
// e-mail entendem.
export function montarEmail(conteudo: Conteudo, pedido: Pick<Pedido, 'numero'>, pecas: string[], link: string) {
  const serifa = "font-family:'Instrument Serif',Georgia,'Times New Roman',serif";
  const titulo = "font-family:Anton,Impact,'Arial Narrow','Helvetica Neue',Arial,sans-serif";
  const corpo = "font-family:Inter,-apple-system,'Segoe UI',Helvetica,Arial,sans-serif";
  const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only">
<title>${escapar(conteudo.assunto)}</title>
</head>
<body style="margin:0;padding:0;background:${CREME};color:${VERDE};">
<div style="display:none;max-height:0;overflow:hidden;">${escapar(conteudo.paragrafos[0] ?? '')}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CREME};">
<tr><td align="center" style="padding:32px 16px 48px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
<tr><td style="${titulo};font-size:20px;letter-spacing:0.06em;text-transform:uppercase;color:${VERDE};padding-bottom:32px;">Divestir</td></tr>
<tr><td style="${serifa};font-style:italic;font-size:26px;line-height:1.25;color:${VERDE};">${escapar(conteudo.saudacao)}</td></tr>
<tr><td style="${titulo};font-size:44px;line-height:1.05;text-transform:uppercase;color:${VERDE};padding:8px 0 20px;">${escapar(conteudo.titulo)}</td></tr>
${conteudo.paragrafos.map((p) => `<tr><td style="${corpo};font-size:16px;line-height:1.6;color:${VERDE};padding-bottom:12px;">${escapar(p)}</td></tr>`).join('\n')}
${
  conteudo.destaque
    ? `<tr><td style="padding:12px 0 8px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${VERDE};border-radius:12px;"><tr><td style="${corpo};padding:16px 18px;color:${VERDE};"><div style="font-size:13px;line-height:1.4;">${escapar(conteudo.destaque.rotulo)}</div><div style="font-size:18px;line-height:1.4;font-weight:600;">${escapar(conteudo.destaque.valor)}</div></td></tr></table></td></tr>`
    : ''
}
<tr><td style="padding:20px 0 28px;"><a href="${escapar(link)}" style="${corpo};display:inline-block;background:${VERDE};color:${CREME};font-size:17px;font-weight:700;line-height:1;text-decoration:none;padding:19px 36px;border-radius:6px;">${escapar(conteudo.botao)}</a></td></tr>
<tr><td style="border-top:1px solid ${VERDE};padding-top:20px;${corpo};font-size:15px;line-height:1.5;color:${VERDE};"><strong>Pedido nº ${pedido.numero}</strong>${pecas.map((p) => `<br>${escapar(p)}`).join('')}</td></tr>
<tr><td style="${corpo};font-size:13px;line-height:1.5;color:${VERDE};padding-top:28px;">Você recebeu este e-mail porque fez um pedido na Divestir. Se o botão não abrir, copie este endereço: <a href="${escapar(link)}" style="color:${VERDE};">${escapar(link)}</a></td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
  const texto = [
    conteudo.saudacao,
    conteudo.titulo.toLocaleUpperCase('pt-BR'),
    '',
    ...conteudo.paragrafos,
    ...(conteudo.destaque ? ['', `${conteudo.destaque.rotulo}: ${conteudo.destaque.valor}`] : []),
    '',
    `${conteudo.botao}: ${link}`,
    '',
    `Pedido nº ${pedido.numero}`,
    ...pecas,
  ].join('\n');
  return { html, texto };
}

// As peças do pedido, uma linha cada: "THOR · Fã-Clube · Camiseta oversized · Preto · G".
async function pecasDoPedido(admin: NonNullable<ReturnType<typeof criarClienteAdmin>>, pedido: number) {
  const { data: itens } = await admin
    .from('itens_pedido')
    .select('peca_id, cor_id, design_id, tamanho, campos')
    .eq('pedido_id', pedido)
    .order('id');
  const linhas = (itens ?? []) as {
    peca_id: number;
    cor_id: number;
    design_id: number;
    tamanho: string;
    campos: Record<string, string> | null;
  }[];
  if (!linhas.length) return [];
  const [pecas, cores, designs] = await Promise.all([
    admin.from('pecas').select('id, nome'),
    admin.from('cores').select('id, nome'),
    admin.from('designs').select('id, nome'),
  ]);
  const nomes = (lista: unknown) =>
    new Map(((lista ?? []) as { id: number; nome: string }[]).map((l) => [l.id, l.nome]));
  const [peca, cor, design] = [nomes(pecas.data), nomes(cores.data), nomes(designs.data)];
  return linhas.map((l) =>
    [
      (l.campos?.nome ?? '').toLocaleUpperCase('pt-BR'),
      design.get(l.design_id),
      peca.get(l.peca_id),
      cor.get(l.cor_id),
      l.tamanho,
    ]
      .filter(Boolean)
      .join(' · '),
  );
}

// Manda o aviso de uma etapa ao cliente e registra no pedido. "vez" diferencia avisos
// que podem se repetir no mesmo pedido (a segunda foto pedida, o rastreio corrigido).
export async function avisarCliente(numero: number, aviso: Aviso, extras: { nota?: string | null; vez?: string } = {}) {
  try {
    const admin = criarClienteAdmin();
    if (!admin || !emailLigado()) return;
    const { data } = await admin
      .from('pedidos')
      .select('id, numero, nome, email, rastreio, token_acompanhamento, prazo_personalizacao, frete_servico')
      .eq('numero', numero)
      .maybeSingle();
    const pedido = data as Pedido | null;
    if (!pedido) return;

    // O "recebemos seu pedido" sai uma vez só, mesmo que o pagamento seja avisado de novo.
    if (aviso === 'pago') {
      const { data: ja } = await admin
        .from('notificacoes')
        .select('id')
        .eq('pedido_id', pedido.id)
        .eq('tipo', 'pago')
        .is('erro', null);
      if (ja?.length) return;
    }

    const link = `${enderecoDoSite()}/pedido/${pedido.token_acompanhamento}`;
    const conteudo = conteudoDo(aviso, pedido, extras.nota?.trim() || null);
    const { html, texto } = montarEmail(conteudo, pedido, await pecasDoPedido(admin, pedido.id), link);
    const envio = await enviarEmail({
      para: pedido.email,
      assunto: conteudo.assunto,
      html,
      texto,
      chave: `pedido-${pedido.numero}-${aviso}${extras.vez ? `-${extras.vez}` : ''}`,
    });
    if (envio.ok && envio.repetido) return;
    if (!envio.ok) console.error(`avisos: o e-mail "${aviso}" do pedido ${numero} não saiu:`, envio.erro);
    const { error } = await admin.from('notificacoes').insert({
      pedido_id: pedido.id,
      canal: 'email',
      tipo: aviso,
      enviado_em: envio.ok ? new Date().toISOString() : null,
      erro: envio.ok ? null : envio.erro,
    });
    if (error) console.error(`avisos: não consegui registrar o aviso "${aviso}" do pedido ${numero}`, error.message);
  } catch (motivo) {
    console.error(`avisos: o aviso "${aviso}" do pedido ${numero} falhou`, motivo);
  }
}
