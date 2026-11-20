// As peças de tela do painel da equipe (DESIGN.md, "Painel da equipe"): tela de
// trabalho no creme, com a tinta verde cheia e nenhum enfeite.

// Caixa de digitar: a mesma do checkout.
export const caixa =
  'block h-12 w-full rounded-md border border-verde bg-creme px-4 text-base outline-offset-2 focus-visible:outline-2 focus-visible:outline-verde';

// Lista de escolher curta (o papel de cada pessoa), do tamanho do que está escrito.
export const seletorCurto =
  'h-11 rounded-md border border-verde bg-creme px-3 text-[0.9375rem] outline-offset-2 focus-visible:outline-2 focus-visible:outline-verde';

export const rotulo = 'block text-base leading-snug font-semibold';

// Botão de trabalho: o segundo nível do painel (o ingresso continua sendo a ação
// principal, uma por tela). Contorno verde, 44px de altura.
export const botao =
  'inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md border border-verde px-4 text-[0.9375rem] leading-tight font-semibold transition-colors duration-200 ease-saida hover:bg-verde hover:text-creme focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-verde disabled:cursor-default disabled:opacity-100 disabled:hover:bg-transparent disabled:hover:text-verde';

export const link =
  'inline-block cursor-pointer py-3 text-[0.9375rem] leading-5 underline decoration-1 underline-offset-[0.3em] hover:decoration-2';

// Etiqueta pequena (Presente, Teste, o status na lista).
export const etiqueta =
  'inline-flex items-center rounded-full border border-verde px-2.5 py-1 text-[0.8125rem] leading-none font-semibold whitespace-nowrap';

export const etiquetaCheia = `${etiqueta} bg-verde text-creme`;

const DATA = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'America/Sao_Paulo' });
const DATA_E_HORA = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'America/Sao_Paulo',
});

export const dataCurta = (iso: string) => DATA.format(new Date(iso));
export const dataEHora = (iso: string) => DATA_E_HORA.format(new Date(iso)).replace(',', ' às');

// "hoje", "há 1 dia", "há 5 dias": há quanto tempo o pedido está nessa etapa.
export function haQuantoTempo(iso: string, agora: number) {
  const dias = Math.floor((agora - new Date(iso).getTime()) / 86_400_000);
  if (dias <= 0) return 'hoje';
  return dias === 1 ? 'há 1 dia' : `há ${dias} dias`;
}
