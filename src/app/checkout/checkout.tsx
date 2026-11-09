'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useRef, useState, type FormEvent, type InputHTMLAttributes, type ReactNode } from 'react';
import type { Catalogo } from '@/lib/catalogo';
import {
  fotoPendente,
  pecaDoCheckout,
  type OpcaoDeFrete,
  type PedidoCriado,
  type PedidoDoCheckout,
} from '@/lib/checkout';
import { codigoNovo } from '@/lib/foto/guardar';
import { MAX_PARCELAS, PRAZO_DE_PERSONALIZACAO, precoDoPresente, reais, somar } from '@/lib/loja';
import { guardarCarrinho, guardarPedido, lerCarrinhoGuardado } from '@/lib/montagem/guardar';
import type { Carrinho } from '@/lib/montagem/tipos';
import type { Design } from '@/lib/molde/tipos';
import {
  cepValido,
  cpfValido,
  emailValido,
  mascararCep,
  mascararCpf,
  mascararTelefone,
  nomeCompletoValido,
  soDigitos,
  UFS,
  ufValida,
  whatsappValido,
} from '@/lib/validar';
import {
  AvisoDeTeste,
  linhasDoCarrinho,
  MensagemDoPrazo,
  MiniaturaDaPeca,
  useRecortes,
  type LinhaDoCarrinho,
} from '../carrinho/carrinho';
import { IconeAlerta, IconeCarregando } from '../montar/icones';
import { opcaoDaPilula } from '../montar/passo-design';
import { linkDeTexto } from '../montar/passo-foto';
import { Passo } from '../montar/passos';

// O checkout numa página só (briefing, "Carrinho e checkout"): contato, entrega
// (com busca por CEP e, no presente, o nome de quem recebe), frete com o prazo
// somado ao da personalização e o aceite dos termos com a autorização da foto. Ao
// confirmar, o servidor cria o pedido e a página do pedido abre o pagamento.

type Formulario = {
  nome: string;
  email: string;
  whatsapp: string;
  cpf: string;
  cep: string;
  rua: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
  entregaDireta: boolean;
  destinatario: string;
  frete: string | null;
  termos: boolean;
  divulgacao: boolean;
};

type Campo = keyof Formulario;

const VAZIO: Formulario = {
  nome: '',
  email: '',
  whatsapp: '',
  cpf: '',
  cep: '',
  rua: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  uf: '',
  entregaDireta: false,
  destinatario: '',
  frete: null,
  termos: false,
  divulgacao: false,
};

// O que a pessoa digitou fica só nesta aba (e some quando ela fecha): se a página
// recarregar no meio, nada se perde.
const RASCUNHO = 'divestir:checkout';
const CHAVE_DA_TENTATIVA = 'divestir:checkout:tentativa';

function lerRascunho(): Formulario {
  try {
    const salvo = JSON.parse(sessionStorage.getItem(RASCUNHO) ?? 'null') as Partial<Formulario> | null;
    if (!salvo || typeof salvo !== 'object') return VAZIO;
    const limpo = { ...VAZIO };
    for (const chave of Object.keys(VAZIO) as Campo[]) {
      const valor = salvo[chave];
      if (typeof valor === typeof VAZIO[chave] || (chave === 'frete' && typeof valor === 'string')) {
        (limpo as Record<Campo, unknown>)[chave] = valor;
      }
    }
    return limpo;
  } catch {
    return VAZIO;
  }
}

function guardarRascunho(formulario: Formulario) {
  try {
    sessionStorage.setItem(RASCUNHO, JSON.stringify(formulario));
  } catch {
    // Sem espaço: segue sem guardar.
  }
}

// O mesmo pedido enviado de novo usa o mesmo código (não vira dois pedidos); se a
// pessoa mudou alguma coisa, vira outro.
function chaveDaTentativa(assinatura: string) {
  try {
    const salva = JSON.parse(sessionStorage.getItem(CHAVE_DA_TENTATIVA) ?? 'null') as {
      assinatura: string;
      chave: string;
    } | null;
    if (salva?.assinatura === assinatura) return salva.chave;
    const chave = codigoNovo();
    sessionStorage.setItem(CHAVE_DA_TENTATIVA, JSON.stringify({ assinatura, chave }));
    return chave;
  } catch {
    return codigoNovo();
  }
}

const ORDEM: Campo[] = [
  'nome',
  'email',
  'whatsapp',
  'cpf',
  'destinatario',
  'cep',
  'rua',
  'numero',
  'complemento',
  'bairro',
  'cidade',
  'uf',
  'frete',
  'termos',
];

function conferir(f: Formulario, temPresente: boolean, opcoes: OpcaoDeFrete[]): Partial<Record<Campo, string>> {
  const erros: Partial<Record<Campo, string>> = {};
  if (!nomeCompletoValido(f.nome)) erros.nome = 'Escreve o nome e o sobrenome.';
  if (!emailValido(f.email)) erros.email = 'Confere o e-mail: parece que falta alguma coisa.';
  if (!whatsappValido(f.whatsapp)) erros.whatsapp = 'Escreve o número com DDD, como (34) 99999-9999.';
  if (!cpfValido(f.cpf)) erros.cpf = 'Esse CPF não confere. Dá uma olhada nos números?';
  if (temPresente && f.entregaDireta && !nomeCompletoValido(f.destinatario)) {
    erros.destinatario = 'Escreve o nome e o sobrenome de quem vai receber.';
  }
  if (!cepValido(f.cep)) erros.cep = 'O CEP tem 8 números.';
  if (f.rua.trim().length < 2) erros.rua = 'Escreve a rua.';
  if (!f.numero.trim()) erros.numero = 'Escreve o número (ou S/N).';
  if (f.bairro.trim().length < 2) erros.bairro = 'Escreve o bairro.';
  if (f.cidade.trim().length < 2) erros.cidade = 'Escreve a cidade.';
  if (!ufValida(f.uf)) erros.uf = 'Escolhe o estado.';
  if (!f.frete || !opcoes.some((o) => o.id === f.frete)) erros.frete = 'Escolhe como o pedido vai chegar.';
  if (!f.termos) erros.termos = 'Para fechar o pedido, marca a autorização da foto.';
  return erros;
}

const caixa =
  'block h-12 w-full rounded-md border border-verde bg-creme px-4 text-base outline-offset-2 focus-visible:outline-2 focus-visible:outline-verde aria-[invalid=true]:ring-1 aria-[invalid=true]:ring-verde aria-[invalid=true]:ring-inset';

function Erro({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} className="mt-1.5 flex items-start gap-1.5 text-[0.9375rem] leading-snug font-semibold">
      <IconeAlerta className="mt-0.5 shrink-0" />
      {children}
    </p>
  );
}

function CampoDeTexto({
  id,
  rotulo,
  valor,
  erro,
  ajuda,
  aoMudar,
  aoSair,
  className = '',
  ...resto
}: {
  id: string;
  rotulo: string;
  valor: string;
  erro?: string | null;
  ajuda?: ReactNode;
  aoMudar: (valor: string) => void;
  aoSair?: () => void;
  className?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'value' | 'onChange' | 'onBlur' | 'className'>) {
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-base leading-snug font-semibold">
        {rotulo}
      </label>
      <input
        id={id}
        value={valor}
        onChange={(evento) => aoMudar(evento.target.value)}
        onBlur={aoSair}
        aria-invalid={erro ? true : undefined}
        aria-describedby={erro ? `${id}-erro` : ajuda ? `${id}-ajuda` : undefined}
        className={`mt-2 ${caixa}`}
        {...resto}
      />
      {erro ? (
        <Erro id={`${id}-erro`}>{erro}</Erro>
      ) : ajuda ? (
        <p id={`${id}-ajuda`} className="mt-1.5 text-[0.9375rem] leading-snug">
          {ajuda}
        </p>
      ) : null}
    </div>
  );
}

// O resumo das peças e dos valores, ao lado do formulário (e embaixo, no celular).
function Resumo({
  linhas,
  recortes,
  presentes,
  precoDoPresente: presente,
  frete,
  titulo = 'Seu pedido',
}: {
  linhas: LinhaDoCarrinho[];
  recortes: Record<string, string | null>;
  presentes: number;
  precoDoPresente: number;
  frete: OpcaoDeFrete | null;
  titulo?: string;
}) {
  const subtotal = somar(...linhas.map((l) => l.preco?.valor ?? 0), presentes * presente);
  return (
    <>
      <h2 className="text-lg leading-snug font-semibold">{titulo}</h2>
      <ul className="mt-4 space-y-3">
        {linhas.map((linha) => (
          <li key={linha.item.id} className="flex items-start gap-3">
            <MiniaturaDaPeca linha={linha} recorte={recortes[linha.item.foto.chave]} className="w-14" />
            <div className="min-w-0 flex-1 text-[0.9375rem] leading-snug">
              <p className="font-semibold">{(linha.item.campos.nome ?? '').toLocaleUpperCase('pt-BR') || linha.nome}</p>
              <p>
                {linha.nome} · {linha.detalhes}
                {linha.item.presente ? ' · presente' : ''}
              </p>
            </div>
            <p className="text-[0.9375rem] font-semibold tabular-nums">
              {linha.preco ? reais.format(linha.preco.valor) : ''}
            </p>
          </li>
        ))}
      </ul>
      <dl className="mt-5 grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-2 border-t border-verde pt-4 text-[0.9375rem] leading-snug">
        <dt>{linhas.length === 1 ? '1 peça' : `${linhas.length} peças`}</dt>
        <dd className="text-right tabular-nums">{reais.format(somar(...linhas.map((l) => l.preco?.valor ?? 0)))}</dd>
        {presentes ? (
          <>
            <dt>{presentes === 1 ? '1 presente' : `${presentes} presentes`}</dt>
            <dd className="text-right tabular-nums">{reais.format(presentes * presente)}</dd>
          </>
        ) : null}
        <dt>Frete</dt>
        <dd className="text-right tabular-nums">{frete ? reais.format(frete.preco) : 'escolha o frete'}</dd>
        <div className="col-span-2 mt-2 grid grid-cols-subgrid border-t border-verde pt-3 text-base font-semibold">
          <dt>Total</dt>
          <dd className="text-right tabular-nums">{reais.format(somar(subtotal, frete?.preco ?? 0))}</dd>
        </div>
      </dl>
    </>
  );
}

type EstadoDoFrete =
  | { cep: string; estado: 'cotando' }
  | { cep: string; estado: 'pronto'; opcoes: OpcaoDeFrete[] }
  | { cep: string; estado: 'erro'; mensagem: string };

type BuscaDoCep = 'parado' | 'buscando' | 'achou' | 'nao-achou' | 'falhou';

// Pede ao servidor as opções de frete para o CEP e as peças do carrinho.
async function pedirFrete(cep: string, itens: Carrinho['itens'], sinal: AbortSignal): Promise<EstadoDoFrete> {
  try {
    const resposta = await fetch('/api/frete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cep, pecas: itens.map((i) => ({ peca: i.peca, presente: !!i.presente })) }),
      signal: sinal,
    });
    const dados = await resposta.json().catch(() => ({}));
    if (!resposta.ok) return { cep, estado: 'erro', mensagem: dados.erro ?? 'Não consegui calcular o frete agora.' };
    return { cep, estado: 'pronto', opcoes: (dados.opcoes ?? []) as OpcaoDeFrete[] };
  } catch {
    return { cep, estado: 'erro', mensagem: 'A internet caiu no meio do caminho. Tenta de novo?' };
  }
}

export function Checkout({
  catalogo,
  designs,
  modoDeTeste,
}: {
  catalogo: Catalogo;
  designs: Design[];
  modoDeTeste: boolean;
}) {
  const router = useRouter();
  const id = useId();
  const [carrinho, setCarrinho] = useState<Carrinho | null>(null);
  const [form, setForm] = useState<Formulario>(VAZIO);
  const [tocados, setTocados] = useState<Set<Campo>>(new Set());
  const [tentou, setTentou] = useState(false);
  const [frete, setFrete] = useState<EstadoDoFrete | null>(null);
  const [cep, setCep] = useState<BuscaDoCep>('parado');
  const [enviando, setEnviando] = useState(false);
  const [falha, setFalha] = useState<{ mensagem: string; carrinho?: boolean } | null>(null);
  const cotacao = useRef<AbortController | null>(null);
  const recortes = useRecortes(carrinho?.itens.map((i) => i.foto.chave) ?? []);

  const presente = precoDoPresente(modoDeTeste);
  const temPresente = !!carrinho?.itens.some((i) => i.presente);

  // Guarda o resultado da cotação, se ela ainda for a mais recente.
  function aplicarFrete(resultado: EstadoDoFrete, controle: AbortController) {
    if (controle.signal.aborted) return;
    setFrete(resultado);
    if (resultado.estado === 'pronto') {
      setForm((f) => (f.frete && resultado.opcoes.some((o) => o.id === f.frete) ? f : { ...f, frete: null }));
    }
  }

  function cotar(digitos: string, itens: Carrinho['itens']) {
    cotacao.current?.abort();
    const controle = new AbortController();
    cotacao.current = controle;
    setFrete({ cep: digitos, estado: 'cotando' });
    void pedirFrete(digitos, itens, controle.signal).then((resultado) => aplicarFrete(resultado, controle));
  }

  // O carrinho e o rascunho moram no navegador: lidos depois de a página abrir. Com
  // um CEP já no rascunho, o frete é cotado na hora.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- o navegador só é lido depois de a página abrir */
    const lido = lerCarrinhoGuardado();
    const rascunho = lerRascunho();
    setCarrinho(lido);
    setForm(rascunho);
    if (!cepValido(rascunho.cep) || !lido.itens.length) return;
    const digitos = soDigitos(rascunho.cep);
    const controle = new AbortController();
    cotacao.current = controle;
    setFrete({ cep: digitos, estado: 'cotando' });
    /* eslint-enable react-hooks/set-state-in-effect */
    void pedirFrete(digitos, lido.itens, controle.signal).then((resultado) => {
      if (controle.signal.aborted) return;
      setFrete(resultado);
      if (resultado.estado === 'pronto') {
        setForm((f) => (f.frete && resultado.opcoes.some((o) => o.id === f.frete) ? f : { ...f, frete: null }));
      }
    });
    return () => controle.abort();
  }, []);

  useEffect(() => {
    if (carrinho) guardarRascunho(form);
  }, [form, carrinho]);

  async function buscarCep(digitos: string) {
    setCep('buscando');
    try {
      const resposta = await fetch(`https://viacep.com.br/ws/${digitos}/json/`);
      const dados = (await resposta.json()) as Record<string, string | boolean>;
      if (!resposta.ok || dados.erro) {
        setCep('nao-achou');
        return;
      }
      setForm((f) =>
        soDigitos(f.cep) !== digitos
          ? f
          : {
              ...f,
              rua: (dados.logradouro as string) || f.rua,
              bairro: (dados.bairro as string) || f.bairro,
              cidade: (dados.localidade as string) || f.cidade,
              uf: (dados.uf as string) || f.uf,
            },
      );
      setCep('achou');
    } catch {
      setCep('falhou');
    }
  }

  function mudar<C extends Campo>(campo: C, valor: Formulario[C]) {
    setForm((f) => ({ ...f, [campo]: valor }));
    setFalha(null);
  }

  function mudarCep(texto: string) {
    const mascarado = mascararCep(texto);
    const digitos = soDigitos(mascarado);
    const antes = soDigitos(form.cep);
    mudar('cep', mascarado);
    if (digitos.length === 8 && digitos !== antes && carrinho) {
      void buscarCep(digitos);
      cotar(digitos, carrinho.itens);
    } else if (digitos.length < 8) {
      cotacao.current?.abort();
      setFrete(null);
      setCep('parado');
    }
  }

  const sair = (campo: Campo) => () => setTocados((t) => (t.has(campo) ? t : new Set(t).add(campo)));

  if (!carrinho) return <div aria-busy="true" aria-label="Carregando o checkout" className="mt-10 h-40" />;

  const linhas = linhasDoCarrinho(carrinho.itens, catalogo, designs, modoDeTeste);
  if (!linhas.length) {
    return (
      <div className="mt-10 max-w-md">
        <p className="font-destaque text-[1.75rem] leading-tight italic">Seu carrinho está vazio.</p>
        <p className="mt-2 leading-relaxed">Monta a sua Divestir com a foto de quem você ama, e ela aparece aqui.</p>
        <Link href="/montar" className="ingresso mt-8">
          Criar minha Divestir
        </Link>
      </div>
    );
  }
  if (linhas.some((l) => l.foraDeLinha || !l.preco || fotoPendente(l.item))) {
    return (
      <div className="mt-10 max-w-md">
        <p className="flex items-start gap-2 text-lg leading-snug font-semibold">
          <IconeAlerta tamanho={20} className="mt-1 shrink-0" />
          Tem uma peça do carrinho pedindo atenção antes do pagamento.
        </p>
        <Link href="/carrinho" className="ingresso mt-8">
          Voltar ao carrinho
        </Link>
      </div>
    );
  }

  const opcoes = frete?.estado === 'pronto' ? frete.opcoes : [];
  const escolhido = opcoes.find((o) => o.id === form.frete) ?? null;
  const erros = conferir(form, temPresente, opcoes);
  const mostrar = (campo: Campo) => (tentou || tocados.has(campo) ? (erros[campo] ?? null) : null);
  const presentes = carrinho.itens.filter((i) => i.presente).length;
  const campo = (nome: Campo) => `${id}-${nome}`;

  const resumoDosDados =
    !erros.nome && !erros.email && !erros.whatsapp && !erros.cpf ? form.nome.trim().split(' ')[0] : null;
  const resumoDaEntrega =
    !erros.cep && !erros.rua && !erros.numero && !erros.bairro && !erros.cidade && !erros.uf && !erros.destinatario
      ? `${form.cidade}, ${form.uf.toUpperCase()}`
      : null;

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    if (enviando || !carrinho) return;
    setTentou(true);
    const primeiro = ORDEM.find((c) => erros[c]);
    if (primeiro) {
      const alvo = primeiro === 'frete' ? document.querySelector<HTMLInputElement>(`input[name="${id}-frete"]`) : null;
      (alvo ?? document.getElementById(campo(primeiro)))?.focus();
      if (primeiro === 'frete' && !alvo)
        document.getElementById(`${id}-passo-frete`)?.scrollIntoView({ block: 'start' });
      return;
    }

    const semChave: Omit<PedidoDoCheckout, 'chave'> = {
      contato: { nome: form.nome, email: form.email, whatsapp: form.whatsapp, cpf: form.cpf },
      endereco: {
        cep: form.cep,
        rua: form.rua,
        numero: form.numero,
        complemento: form.complemento,
        bairro: form.bairro,
        cidade: form.cidade,
        uf: form.uf.toUpperCase(),
      },
      destinatario: temPresente && form.entregaDireta ? form.destinatario : null,
      frete: form.frete ?? '',
      termos: form.termos,
      divulgacao: form.divulgacao,
      pecas: carrinho.itens.map(pecaDoCheckout),
    };
    const pedido: PedidoDoCheckout = { chave: chaveDaTentativa(JSON.stringify(semChave)), ...semChave };

    setEnviando(true);
    setFalha(null);
    try {
      const resposta = await fetch('/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pedido),
      });
      const dados = await resposta.json().catch(() => ({}));
      if (!resposta.ok) {
        const pendentes: string[] = Array.isArray(dados.fotosPendentes) ? dados.fotosPendentes : [];
        if (pendentes.length) {
          // A foto dessas peças não chegou: o carrinho pede de novo.
          const atual = lerCarrinhoGuardado();
          guardarCarrinho({
            versao: 1,
            itens: atual.itens.map((i) =>
              pendentes.includes(i.id) ? { ...i, foto: { ...i.foto, original: 'falhou' } } : i,
            ),
          });
        }
        if (resposta.status === 409 && !pendentes.length) cotar(soDigitos(form.cep), carrinho.itens);
        setFalha({
          mensagem: dados.erro ?? 'Não consegui fechar o pedido agora. Tenta de novo em instantes?',
          carrinho: pendentes.length > 0,
        });
        setEnviando(false);
        return;
      }
      const criado = dados as PedidoCriado;
      guardarPedido({
        token: criado.token,
        numero: criado.numero,
        criadoEm: new Date().toISOString(),
        itens: carrinho.itens,
      });
      router.push(`/pedido/${criado.token}`);
    } catch {
      setFalha({ mensagem: 'A internet caiu no meio do caminho. Tenta de novo?' });
      setEnviando(false);
    }
  }

  const prazo = (o: OpcaoDeFrete) => ({
    min: PRAZO_DE_PERSONALIZACAO.min + o.prazo.min,
    max: PRAZO_DE_PERSONALIZACAO.max + o.prazo.max,
  });

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-x-14">
      <form noValidate onSubmit={enviar} className="mt-6 max-w-xl">
        <ol>
          <Passo id={`${id}-passo-dados`} numero={1} titulo="Seus dados" resumo={resumoDosDados}>
            <div className="space-y-5">
              <CampoDeTexto
                id={campo('nome')}
                rotulo="Nome completo"
                valor={form.nome}
                erro={mostrar('nome')}
                aoMudar={(v) => mudar('nome', v)}
                aoSair={sair('nome')}
                autoComplete="name"
                autoCapitalize="words"
                maxLength={120}
              />
              <CampoDeTexto
                id={campo('email')}
                rotulo="E-mail"
                valor={form.email}
                erro={mostrar('email')}
                ajuda="É por ele que você acompanha o pedido."
                aoMudar={(v) => mudar('email', v.trim())}
                aoSair={sair('email')}
                type="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                maxLength={160}
              />
              <CampoDeTexto
                id={campo('whatsapp')}
                rotulo="WhatsApp"
                valor={form.whatsapp}
                erro={mostrar('whatsapp')}
                ajuda="Com DDD."
                aoMudar={(v) => mudar('whatsapp', mascararTelefone(v))}
                aoSair={sair('whatsapp')}
                type="tel"
                inputMode="tel"
                autoComplete="tel-national"
              />
              <CampoDeTexto
                id={campo('cpf')}
                rotulo="CPF"
                valor={form.cpf}
                erro={mostrar('cpf')}
                ajuda="O Mercado Pago pede no pagamento."
                aoMudar={(v) => mudar('cpf', mascararCpf(v))}
                aoSair={sair('cpf')}
                inputMode="numeric"
                autoComplete="off"
              />
            </div>
          </Passo>

          <Passo id={`${id}-passo-entrega`} numero={2} titulo="Entrega" resumo={resumoDaEntrega}>
            {temPresente ? (
              <fieldset className="mb-6">
                <legend className="text-base leading-snug font-semibold">Para quem vai a entrega?</legend>
                <div className="mt-2 inline-flex flex-wrap rounded-full border border-verde p-1">
                  {[
                    { direta: false, texto: 'Para mim' },
                    { direta: true, texto: 'Direto para quem vai ganhar' },
                  ].map((opcao) => (
                    <label key={opcao.texto} className="relative">
                      <input
                        type="radio"
                        name={`${id}-entrega`}
                        checked={form.entregaDireta === opcao.direta}
                        onChange={() => mudar('entregaDireta', opcao.direta)}
                        className="peer sr-only"
                      />
                      <span className={opcaoDaPilula}>{opcao.texto}</span>
                    </label>
                  ))}
                </div>
                {form.entregaDireta ? (
                  <CampoDeTexto
                    id={campo('destinatario')}
                    rotulo="Nome completo de quem vai receber"
                    valor={form.destinatario}
                    erro={mostrar('destinatario')}
                    ajuda="O endereço abaixo é o dessa pessoa. O pacote vai sem o valor impresso."
                    aoMudar={(v) => mudar('destinatario', v)}
                    aoSair={sair('destinatario')}
                    autoComplete="off"
                    autoCapitalize="words"
                    maxLength={120}
                    className="mt-5"
                  />
                ) : null}
                {carrinho.itens.length > 1 && carrinho.itens.some((i) => !i.presente) ? (
                  <p className="mt-4 max-w-[46ch] text-[0.9375rem] leading-snug">
                    Todas as peças deste pedido vão para o mesmo endereço. Se uma delas vai para outra pessoa, faz um
                    pedido separado para ela.
                  </p>
                ) : null}
              </fieldset>
            ) : null}

            <div className="grid grid-cols-6 gap-x-4 gap-y-5">
              <div className="col-span-6 sm:col-span-3">
                <CampoDeTexto
                  id={campo('cep')}
                  rotulo="CEP"
                  valor={form.cep}
                  erro={mostrar('cep')}
                  ajuda={
                    cep === 'buscando'
                      ? 'Buscando o endereço…'
                      : cep === 'nao-achou'
                        ? 'Não achei esse CEP. Confere o número ou preenche o endereço.'
                        : cep === 'falhou'
                          ? 'Não consegui buscar o endereço. Preenche aqui embaixo, por favor.'
                          : null
                  }
                  aoMudar={mudarCep}
                  aoSair={sair('cep')}
                  inputMode="numeric"
                  autoComplete="postal-code"
                />
                <a
                  href="https://buscacepinter.correios.com.br/app/endereco/index.php"
                  target="_blank"
                  rel="noreferrer"
                  className={linkDeTexto}
                >
                  Não sei o meu CEP
                </a>
              </div>
              <CampoDeTexto
                id={campo('rua')}
                rotulo="Rua"
                valor={form.rua}
                erro={mostrar('rua')}
                aoMudar={(v) => mudar('rua', v)}
                aoSair={sair('rua')}
                autoComplete="address-line1"
                maxLength={160}
                className="col-span-6"
              />
              <CampoDeTexto
                id={campo('numero')}
                rotulo="Número"
                valor={form.numero}
                erro={mostrar('numero')}
                aoMudar={(v) => mudar('numero', v)}
                aoSair={sair('numero')}
                maxLength={20}
                className="col-span-2"
              />
              <CampoDeTexto
                id={campo('complemento')}
                rotulo="Complemento"
                valor={form.complemento}
                ajuda="Se tiver: apartamento, bloco, casa."
                aoMudar={(v) => mudar('complemento', v)}
                autoComplete="address-line2"
                maxLength={80}
                className="col-span-4"
              />
              <CampoDeTexto
                id={campo('bairro')}
                rotulo="Bairro"
                valor={form.bairro}
                erro={mostrar('bairro')}
                aoMudar={(v) => mudar('bairro', v)}
                aoSair={sair('bairro')}
                autoComplete="address-level3"
                maxLength={80}
                className="col-span-6"
              />
              <CampoDeTexto
                id={campo('cidade')}
                rotulo="Cidade"
                valor={form.cidade}
                erro={mostrar('cidade')}
                aoMudar={(v) => mudar('cidade', v)}
                aoSair={sair('cidade')}
                autoComplete="address-level2"
                maxLength={80}
                className="col-span-4"
              />
              <div className="col-span-2">
                <label htmlFor={campo('uf')} className="block text-base leading-snug font-semibold">
                  Estado
                </label>
                <div className="relative mt-2">
                  <select
                    id={campo('uf')}
                    value={form.uf.toUpperCase()}
                    onChange={(evento) => mudar('uf', evento.target.value)}
                    onBlur={sair('uf')}
                    autoComplete="address-level1"
                    aria-invalid={mostrar('uf') ? true : undefined}
                    aria-describedby={mostrar('uf') ? `${campo('uf')}-erro` : undefined}
                    className={`${caixa} appearance-none pr-9`}
                  >
                    <option value="">UF</option>
                    {UFS.map((uf) => (
                      <option key={uf} value={uf}>
                        {uf}
                      </option>
                    ))}
                  </select>
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 16 16"
                    width={16}
                    height={16}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2"
                  >
                    <path d="M4 6l4 4 4-4" />
                  </svg>
                </div>
                {mostrar('uf') ? <Erro id={`${campo('uf')}-erro`}>{mostrar('uf')}</Erro> : null}
              </div>
            </div>
          </Passo>

          <Passo
            id={`${id}-passo-frete`}
            numero={3}
            titulo="Frete"
            resumo={escolhido ? `${escolhido.servico}, ${reais.format(escolhido.preco)}` : null}
          >
            {!frete ? (
              <p className="text-[0.9375rem] leading-snug">Escreve o CEP lá em cima, que o frete aparece aqui.</p>
            ) : frete.estado === 'cotando' ? (
              <p className="flex items-center gap-2 text-[0.9375rem] leading-snug" role="status">
                <IconeCarregando /> Calculando o frete…
              </p>
            ) : frete.estado === 'erro' ? (
              <div role="alert">
                <p className="text-[0.9375rem] leading-snug font-semibold">{frete.mensagem}</p>
                <button type="button" onClick={() => cotar(frete.cep, carrinho.itens)} className={linkDeTexto}>
                  Calcular de novo
                </button>
              </div>
            ) : (
              <fieldset aria-describedby={mostrar('frete') ? `${id}-frete-erro` : undefined}>
                <legend className="sr-only">Como o pedido vai chegar</legend>
                <div className="space-y-3">
                  {opcoes.map((opcao) => {
                    const total = prazo(opcao);
                    return (
                      <label key={opcao.id} className="relative block cursor-pointer">
                        <input
                          type="radio"
                          name={`${id}-frete`}
                          value={opcao.id}
                          checked={form.frete === opcao.id}
                          onChange={() => mudar('frete', opcao.id)}
                          className="peer sr-only"
                        />
                        <span className="flex items-start justify-between gap-4 rounded-xl border border-verde px-4 py-3.5 transition-colors duration-200 ease-saida peer-checked:bg-verde peer-checked:text-creme peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-verde">
                          <span className="min-w-0">
                            <span className="block text-base leading-snug font-semibold">
                              {opcao.servico}
                              {opcao.transportadora ? ` · ${opcao.transportadora}` : ''}
                            </span>
                            <span className="mt-0.5 block text-[0.9375rem] leading-snug">
                              Chega em {total.min} a {total.max} dias úteis
                            </span>
                            <span className="mt-0.5 block text-sm leading-5">
                              {PRAZO_DE_PERSONALIZACAO.min} a {PRAZO_DE_PERSONALIZACAO.max} para fazer a peça e{' '}
                              {opcao.prazo.min === opcao.prazo.max
                                ? opcao.prazo.max
                                : `${opcao.prazo.min} a ${opcao.prazo.max}`}{' '}
                              de entrega
                            </span>
                          </span>
                          <span className="shrink-0 text-base leading-snug font-semibold tabular-nums">
                            {reais.format(opcao.preco)}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
                {opcoes.some((o) => o.simulado) ? (
                  <p className="mt-3 text-sm leading-5">
                    Frete simulado: o cálculo de verdade entra com a conta do Melhor Envio.
                  </p>
                ) : null}
                {mostrar('frete') ? <Erro id={`${id}-frete-erro`}>{mostrar('frete')}</Erro> : null}
              </fieldset>
            )}
          </Passo>

          <Passo id={`${id}-passo-confirmar`} numero={4} titulo="Confirmação">
            <div className="space-y-4">
              <div>
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    id={campo('termos')}
                    type="checkbox"
                    checked={form.termos}
                    onChange={(evento) => mudar('termos', evento.target.checked)}
                    aria-invalid={mostrar('termos') ? true : undefined}
                    aria-describedby={mostrar('termos') ? `${campo('termos')}-erro` : undefined}
                    className="mt-0.5 size-5 shrink-0 cursor-pointer"
                  />
                  <span className="text-[0.9375rem] leading-snug">
                    <span className="font-semibold">Tenho autorização de quem aparece na foto</span> para usar a imagem
                    dessa pessoa na minha Divestir. A foto serve só para fazer a peça.
                  </span>
                </label>
                {mostrar('termos') ? <Erro id={`${campo('termos')}-erro`}>{mostrar('termos')}</Erro> : null}
              </div>
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={form.divulgacao}
                  onChange={(evento) => mudar('divulgacao', evento.target.checked)}
                  className="mt-0.5 size-5 shrink-0 cursor-pointer"
                />
                <span className="text-[0.9375rem] leading-snug">
                  Topo que a Divestir mostre a minha peça e a foto em conteúdos da marca, como no Instagram.{' '}
                  <span className="whitespace-nowrap">(Opcional.)</span>
                </span>
              </label>
              {modoDeTeste ? (
                <p className="text-sm leading-5">
                  Os termos de uso e a política de privacidade completos entram antes do lançamento.
                </p>
              ) : null}
            </div>

            <div className="mt-8 border-t border-verde pt-6 lg:hidden">
              <Resumo
                linhas={linhas}
                recortes={recortes}
                presentes={presentes}
                precoDoPresente={presente?.valor ?? 0}
                frete={escolhido}
              />
            </div>

            <div className="mt-8">
              <button type="submit" disabled={enviando} className="ingresso w-full sm:w-auto disabled:cursor-wait">
                {enviando ? (
                  <span className="flex items-center gap-2">
                    <IconeCarregando /> Criando o pedido…
                  </span>
                ) : (
                  'Ir para o pagamento'
                )}
              </button>
              {tentou && Object.keys(erros).length ? (
                <p role="alert" className="mt-3 text-[0.9375rem] leading-snug font-semibold">
                  Falta pouco: confere os campos marcados.
                </p>
              ) : null}
              {falha ? (
                <div role="alert" className="mt-3">
                  <p className="text-[0.9375rem] leading-snug font-semibold">{falha.mensagem}</p>
                  {falha.carrinho ? (
                    <Link href="/carrinho" className={linkDeTexto}>
                      Ir para o carrinho
                    </Link>
                  ) : null}
                </div>
              ) : null}
              <p className="mt-4 text-[0.9375rem] leading-snug">
                No próximo passo: Pix ou cartão em até {MAX_PARCELAS} vezes, pelo Mercado Pago.
              </p>
            </div>
            <MensagemDoPrazo className="mt-8" />
          </Passo>
        </ol>
      </form>

      <aside aria-label="Resumo do pedido" className="hidden lg:sticky lg:top-6 lg:mt-12 lg:block">
        <Resumo
          linhas={linhas}
          recortes={recortes}
          presentes={presentes}
          precoDoPresente={presente?.valor ?? 0}
          frete={escolhido}
        />
        <Link href="/carrinho" className={linkDeTexto}>
          Mudar o carrinho
        </Link>
        {modoDeTeste ? <AvisoDeTeste className="mt-6" /> : null}
      </aside>
      {modoDeTeste ? <AvisoDeTeste className="mt-2 lg:hidden" /> : null}
    </div>
  );
}
