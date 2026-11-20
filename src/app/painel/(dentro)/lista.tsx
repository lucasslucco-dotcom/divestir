import Link from 'next/link';
import { reais } from '@/lib/loja';
import { NOME_DO_STATUS, nomeDoStatus, TODOS_OS_STATUS } from '@/lib/painel/status';
import type { PedidoDaLista } from '@/lib/painel/tipos';
import { botao, caixa, dataCurta, etiqueta, etiquetaCheia, link, rotulo } from '../estilo';

// A lista de pedidos com busca e filtros (briefing: "lista com busca e filtros por
// data, peça, design e status"). O formulário é um link: os filtros ficam no endereço,
// e dá para guardar ou mandar para alguém da equipe.

export type Filtros = { busca: string; status: string; peca: string; design: string; de: string; ate: string };

type Opcao = { slug: string; nome: string };

const seletor = `${caixa} appearance-auto pr-2`;

export function Lista({
  pedidos,
  filtros,
  pecas,
  designs,
}: {
  pedidos: PedidoDaLista[];
  filtros: Filtros;
  pecas: Opcao[];
  designs: Opcao[];
}) {
  const filtrando = Object.values(filtros).some(Boolean);
  return (
    <>
      <form action="/painel" className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_auto_auto_auto]">
        <input type="hidden" name="visao" value="lista" />
        <div>
          <label htmlFor="busca" className={rotulo}>
            Buscar
          </label>
          <input
            id="busca"
            name="busca"
            type="search"
            defaultValue={filtros.busca}
            placeholder="Número, nome, e-mail ou WhatsApp"
            className={`mt-2 ${caixa}`}
          />
        </div>
        <div>
          <label htmlFor="status" className={rotulo}>
            Status
          </label>
          <select id="status" name="status" defaultValue={filtros.status} className={`mt-2 ${seletor}`}>
            <option value="">Em andamento</option>
            <option value="todos">Todos</option>
            {TODOS_OS_STATUS.map((status) => (
              <option key={status} value={status}>
                {NOME_DO_STATUS[status]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="peca" className={rotulo}>
            Peça
          </label>
          <select id="peca" name="peca" defaultValue={filtros.peca} className={`mt-2 ${seletor}`}>
            <option value="">Todas</option>
            {pecas.map((peca) => (
              <option key={peca.slug} value={peca.slug}>
                {peca.nome}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="design" className={rotulo}>
            Design
          </label>
          <select id="design" name="design" defaultValue={filtros.design} className={`mt-2 ${seletor}`}>
            <option value="">Todos</option>
            {designs.map((design) => (
              <option key={design.slug} value={design.slug}>
                {design.nome}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="de" className={rotulo}>
            De
          </label>
          <input id="de" name="de" type="date" defaultValue={filtros.de} className={`mt-2 ${caixa}`} />
        </div>
        <div>
          <label htmlFor="ate" className={rotulo}>
            Até
          </label>
          <input id="ate" name="ate" type="date" defaultValue={filtros.ate} className={`mt-2 ${caixa}`} />
        </div>
        <div className="flex items-end gap-4">
          <button type="submit" className={`${botao} h-12 bg-verde text-creme hover:bg-verde-claro`}>
            Buscar
          </button>
          {filtrando ? (
            <Link href="/painel?visao=lista" className={link}>
              Limpar
            </Link>
          ) : null}
        </div>
      </form>

      <p className="mt-8 text-[0.9375rem] leading-snug" aria-live="polite">
        {pedidos.length === 0
          ? 'Nenhum pedido com esses filtros.'
          : pedidos.length === 1
            ? '1 pedido'
            : `${pedidos.length} pedidos`}
      </p>

      {pedidos.length ? (
        <ul className="mt-4 border-t border-verde">
          {pedidos.map((pedido) => {
            const [primeira, ...outras] = pedido.pecas;
            return (
              <li key={pedido.numero} className="border-b border-verde">
                <Link
                  href={`/painel/pedidos/${pedido.numero}`}
                  className="grid gap-x-6 gap-y-1 py-4 outline-offset-2 focus-visible:outline-2 focus-visible:outline-verde sm:grid-cols-[7rem_1fr_auto] lg:grid-cols-[7rem_1.2fr_2fr_11rem_7rem] lg:items-center"
                >
                  <span className="text-base leading-snug font-semibold tabular-nums">
                    Nº {pedido.numero}
                    <span className="block text-[0.8125rem] font-normal">{dataCurta(pedido.criado_em)}</span>
                  </span>
                  <span className="text-[0.9375rem] leading-snug">{pedido.nome}</span>
                  <span className="text-[0.9375rem] leading-snug sm:col-span-2 sm:col-start-2 lg:col-span-1 lg:col-start-auto">
                    {primeira ? (
                      <>
                        <span className="font-semibold">{primeira.design}</span>
                        {primeira.nome ? ` · ${primeira.nome.toLocaleUpperCase('pt-BR')}` : ''} · {primeira.peca} ·{' '}
                        {primeira.cor} · {primeira.tamanho}
                        {outras.length ? ` (+${outras.length})` : ''}
                      </>
                    ) : (
                      'Sem peças'
                    )}
                  </span>
                  <span className="flex flex-wrap gap-1.5 sm:col-start-3 sm:row-start-1 lg:col-start-auto lg:row-start-auto">
                    <span className={pedido.status === 'cancelado' ? etiqueta : etiquetaCheia}>
                      {nomeDoStatus(pedido.status)}
                    </span>
                    {pedido.teste ? <span className={etiqueta}>Teste</span> : null}
                  </span>
                  <span className="text-[0.9375rem] leading-snug font-semibold tabular-nums lg:text-right">
                    {reais.format(pedido.total)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}
    </>
  );
}
