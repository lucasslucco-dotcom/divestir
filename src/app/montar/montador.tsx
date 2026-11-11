'use client';

import { useRouter } from 'next/navigation';
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ChangeEvent,
  type FocusEvent,
} from 'react';
import type { Catalogo, Cor } from '@/lib/catalogo';
import { checarFoto } from '@/lib/foto/checar';
import { LARGURA_PADRAO_DA_ESTAMPA_CM, definicaoDaEstampa, escalaDaOriginal } from '@/lib/foto/definicao';
import { ENQUADRAMENTO_INICIAL, medirRecorte } from '@/lib/foto/enquadramento';
import { abrirVaga, codigoNovo, enviarOriginal, type Vaga } from '@/lib/foto/guardar';
import { pedirRecorte, prepararParaRecorte } from '@/lib/foto/recorte';
import {
  acompanharEnvio,
  apagarRecortesFora,
  chaveDaInteira,
  guardarCarrinho,
  guardarMontagem,
  guardarRecorte,
  lerCarrinhoGuardado,
  lerMontagemGuardada,
  lerPedidosGuardados,
  lerRecorte,
  recortesEmUso,
} from '@/lib/montagem/guardar';
import { CARRINHO_VAZIO, MONTAGEM_VAZIA, fotoNoDesign, type Carrinho, type ItemDoCarrinho } from '@/lib/montagem/tipos';
import { janelaDaFoto, textoDoCampo } from '@/lib/molde/desenhar';
import { exemploDoDesign } from '@/lib/molde/exemplos';
import { esquecerImagem } from '@/lib/molde/recursos';
import {
  LARGURA_DA_ARTE,
  areaDoDesign,
  limparTextoDaEstampa,
  valorDoCampo,
  type CamadaFoto,
  type Design,
  type Lado,
} from '@/lib/molde/tipos';
import { Doca, type DescricaoDaVista, type Vista } from './doca';
import { coresDaPeca, ID_DOS_PASSOS, nomeDaPeca, oQueFalta, reduzir, resolver, type Falta } from './estado';
import { PassoDesign, TODOS } from './passo-design';
import { PassoFoto, type EnvioDaFoto, type FotoReaproveitavel } from './passo-foto';
import { PassoResumo } from './passo-resumo';
import { Passo, PassoCor, PassoNome, PassoPeca, PassoTamanho } from './passos';
import type { ArteDaPrevia, FotoDaPrevia, MudarEnquadramento } from './tela-da-previa';

// O montador completo (briefing, "Jornada do cliente e o montador"): uma página só,
// com a prévia fixa e os 7 passos. Desde 11/11/2026 (pedido do Lucas), o caminho é
// peça, design ("Para quem é?"), foto, nome, cor, tamanho e carrinho: a foto já é
// ajustada no design escolhido, e o nome já nasce com o limite de letras dele. Tudo o
// que a pessoa escolhe fica guardado no navegador; se ela fechar a aba, volta de onde
// parou, com a foto.

type VagaEmAndamento = Promise<{ vaga: Vaga; envio: Promise<boolean> } | null>;
// O recorte em uso e, se houver, a mesma foto com o fundo (endereços temporários).
type RecorteEmUso = { chave: string; url: string; inteira: string | null };
type Processo = { id: number; arquivo: File; url: string; vaga: VagaEmAndamento; largura?: number; altura?: number };

const suave = (): ScrollBehavior => (window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth');

const minusculo = (texto: string) => texto.toLocaleLowerCase('pt-BR');
const noLado = (lado: Lado) => (lado === 'costas' ? 'nas costas' : 'na frente');

export function Montador({ catalogo, designs }: { catalogo: Catalogo; designs: Design[] }) {
  const [montagem, despachar] = useReducer(reduzir, MONTAGEM_VAZIA);
  const [carrinho, setCarrinho] = useState<Carrinho>(CARRINHO_VAZIO);
  // Peças de pedidos feitos neste navegador: as fotos delas também podem ser reaproveitadas.
  const [jaPedidas, setJaPedidas] = useState<ItemDoCarrinho[]>([]);
  const [restaurada, setRestaurada] = useState(false);
  const [recorte, setRecorte] = useState<RecorteEmUso | null>(null);
  const [envio, setEnvio] = useState<EnvioDaFoto | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [vista, setVista] = useState<Vista | null>(null);
  const [compacta, setCompacta] = useState(false);
  const processo = useRef<Processo | null>(null);
  const recorteAtual = useRef<RecorteEmUso | null>(null);
  const raiz = useRef<HTMLDivElement>(null);
  const doca = useRef<HTMLDivElement>(null);
  // O seletor de fotos do aparelho (álbum ou câmera): um só, aberto pelo passo da foto
  // e pelo "Trocar a foto" da prévia.
  const campoDaFoto = useRef<HTMLInputElement>(null);
  const escolherFoto = () => campoDaFoto.current?.click();
  const idDaDica = useId();
  const router = useRouter();
  // As escolhas juntas com o que existe no catálogo e nos designs.
  const r = useMemo(() => resolver(catalogo, designs, montagem), [catalogo, designs, montagem]);

  // Volta de onde a pessoa parou (depois de a página abrir, porque o servidor não
  // conhece o que está guardado no navegador). O site mantém a página escondida
  // entre uma visita e outra, e este efeito roda de novo cada vez que ela aparece:
  // assim o montador sempre mostra o que está guardado, inclusive a peça que o
  // carrinho mandou editar ou a montagem nova de "Criar outra Divestir".
  useEffect(() => {
    const salva = lerMontagemGuardada();
    despachar({ tipo: 'restaurar', montagem: salva ?? MONTAGEM_VAZIA });
    // eslint-disable-next-line react-hooks/set-state-in-effect -- o navegador só é lido depois de a página abrir
    setCarrinho(lerCarrinhoGuardado());
    setJaPedidas(lerPedidosGuardados().flatMap((pedido) => pedido.itens));
    setRestaurada(true);
  }, []);

  // Guarda só quando a montagem muda. Quando a página volta a aparecer, os efeitos
  // rodam de novo com a montagem de antes: gravar ali apagaria o que o carrinho
  // acabou de deixar guardado ("Editar", "Criar outra Divestir").
  const guardada = useRef<typeof montagem | null>(null);
  useEffect(() => {
    if (!restaurada || montagem === guardada.current) return;
    guardada.current = montagem;
    guardarMontagem(montagem);
  }, [montagem, restaurada]);

  // O recorte em uso: um endereço temporário do navegador, liberado quando sai de cena.
  const trocarRecorte = useCallback((novo: RecorteEmUso | null) => {
    const antigo = recorteAtual.current;
    for (const url of [antigo?.url, antigo?.inteira]) {
      if (!url || url === novo?.url || url === novo?.inteira) continue;
      URL.revokeObjectURL(url);
      esquecerImagem(url);
    }
    recorteAtual.current = novo;
    setRecorte(novo);
  }, []);

  // Foto guardada de uma visita anterior: o recorte volta do armazenamento do navegador.
  const chaveDaFoto = montagem.foto?.chave ?? null;
  const temInteira = montagem.foto?.inteira ?? false;
  useEffect(() => {
    if (!chaveDaFoto || recorteAtual.current?.chave === chaveDaFoto) return;
    let ativo = true;
    void Promise.all([lerRecorte(chaveDaFoto), temInteira ? lerRecorte(chaveDaInteira(chaveDaFoto)) : null]).then(
      ([arquivo, inteira]) => {
        if (!ativo) return;
        if (!arquivo) {
          despachar({ tipo: 'sem-foto' });
          setAviso('A foto que você tinha mandado não ficou guardada neste aparelho. Manda de novo?');
          return;
        }
        trocarRecorte({
          chave: chaveDaFoto,
          url: URL.createObjectURL(arquivo),
          inteira: inteira ? URL.createObjectURL(inteira) : null,
        });
      },
    );
    return () => {
      ativo = false;
    };
  }, [chaveDaFoto, temInteira, trocarRecorte]);

  // Recortes que nenhuma montagem, peça do carrinho ou pedido usa mais saem do navegador.
  const chavesEmUso = [montagem.foto?.chave, ...carrinho.itens.map((item) => item.foto.chave)]
    .filter(Boolean)
    .sort()
    .join('|');
  useEffect(() => {
    if (!restaurada) return;
    const espera = setTimeout(() => {
      const emUso = recortesEmUso(null, lerCarrinhoGuardado());
      for (const chave of chavesEmUso.split('|')) if (chave) emUso.add(chave).add(chaveDaInteira(chave));
      void apagarRecortesFora(emUso);
    }, 3000);
    return () => clearTimeout(espera);
  }, [chavesEmUso, restaurada]);

  // A altura da prévia fixa, para os passos pararem logo abaixo dela ao rolar.
  useEffect(() => {
    const elemento = doca.current;
    const alvo = raiz.current;
    if (!elemento || !alvo) return;
    const medir = () => alvo.style.setProperty('--altura-da-doca', `${elemento.offsetHeight}px`);
    medir();
    const observador = new ResizeObserver(medir);
    observador.observe(elemento);
    return () => observador.disconnect();
  }, []);

  function irPara(passo: keyof typeof ID_DOS_PASSOS) {
    // Dois quadros de espera: a prévia fixa muda de altura quando o ajuste da foto abre
    // ou fecha, e o passo precisa parar logo abaixo dela já no tamanho novo.
    requestAnimationFrame(() =>
      requestAnimationFrame(() =>
        document.getElementById(ID_DOS_PASSOS[passo])?.scrollIntoView({ behavior: suave(), block: 'start' }),
      ),
    );
  }

  function limparEnvio() {
    if (processo.current) URL.revokeObjectURL(processo.current.url);
    processo.current = null;
    setEnvio(null);
  }

  async function recortar(id: number) {
    const atual = processo.current;
    if (!atual || atual.id !== id) return;
    const falhar = (mensagem: string) => setEnvio((e) => (e?.id === id ? { ...e, etapa: 'erro', mensagem } : e));
    setEnvio((e) => (e?.id === id ? { ...e, etapa: 'recortando', mensagem: undefined } : e));
    // A redução da foto e a vaga no espaço privado andam juntas.
    const [reduzida, vaga] = await Promise.all([prepararParaRecorte(atual.url, atual.arquivo), atual.vaga]);
    if (processo.current?.id !== id) return;
    if (!reduzida) return falhar('Não consegui preparar essa foto. Tenta mandar em JPG?');
    try {
      const { url, recorte: arquivoDoRecorte, teste, inteiro } = await pedirRecorte(reduzida, vaga?.vaga);
      const geometria = await medirRecorte(url).catch(() => null);
      if (processo.current?.id !== id || !geometria) {
        URL.revokeObjectURL(url);
        if (processo.current?.id === id) falhar('Não consegui mostrar o recorte. Tenta de novo?');
        return;
      }
      const chave = vaga?.vaga.id ?? codigoNovo();
      void guardarRecorte(chave, arquivoDoRecorte);
      // A foto com o fundo fica guardada junto quando o recorte veio no mesmo quadro
      // dela (a proporção confere): é o que o design do pôster de cinema usa.
      const proporcaoDaFoto = atual.largura && atual.altura ? atual.largura / atual.altura : 0;
      const mesmoQuadro =
        inteiro &&
        reduzida.nome.endsWith('.jpg') &&
        proporcaoDaFoto > 0 &&
        Math.abs(geometria.largura / geometria.altura / proporcaoDaFoto - 1) < 0.02;
      if (mesmoQuadro) void guardarRecorte(chaveDaInteira(chave), reduzida.foto);
      trocarRecorte({ chave, url, inteira: mesmoQuadro ? URL.createObjectURL(reduzida.foto) : null });
      despachar({
        tipo: 'foto',
        foto: {
          chave,
          id: vaga?.vaga.id ?? null,
          sessao: vaga?.vaga.sessao ?? null,
          geometria,
          escalaDaOriginal: escalaDaOriginal(atual.largura, atual.altura),
          enquadramento: ENQUADRAMENTO_INICIAL,
          aprovada: false,
          teste,
          inteira: mesmoQuadro,
          original: vaga ? 'enviando' : 'sem-vaga',
          criadaEm: new Date().toISOString(),
        },
      });
      // O envio da original segue por conta própria: o resultado fica gravado mesmo
      // que a pessoa já tenha ido para o carrinho.
      if (vaga) {
        void acompanharEnvio(chave, vaga.envio).then((chegou) =>
          despachar({ tipo: 'original', chave, original: chegou ? 'enviada' : 'falhou' }),
        );
      }
      setEnvio((e) => (e?.id === id ? { ...e, etapa: 'pronta' } : e));
      setVista('perto');
      // O ajuste acontece na prévia: o passo da foto para logo abaixo dela.
      irPara('foto');
    } catch (motivo) {
      falhar(motivo instanceof Error ? motivo.message : 'Não consegui tirar o fundo agora.');
    }
  }

  async function escolherArquivo(arquivo: File) {
    const anterior = processo.current;
    if (anterior) URL.revokeObjectURL(anterior.url);
    const id = (anterior?.id ?? 0) + 1;
    const url = URL.createObjectURL(arquivo);
    processo.current = { id, arquivo, url, vaga: Promise.resolve(null) };
    setAviso(null);
    setEnvio({ id, url, checagem: null, etapa: 'conferindo' });
    irPara('foto');

    const checagem = await checarFoto(arquivo, url);
    if (processo.current?.id !== id) return;
    // Foto barrada não segue para o recorte nem é guardada.
    if (checagem.nivel === 'bloqueio') {
      setEnvio({ id, url, checagem, etapa: 'barrada' });
      return;
    }
    setEnvio({ id, url, checagem, etapa: 'recortando' });
    // A original vai para o espaço privado enquanto o recorte acontece.
    const vaga: VagaEmAndamento = abrirVaga(arquivo, url, {
      largura: checagem.largura,
      altura: checagem.altura,
      nitidez: checagem.nitidez,
    }).then(
      (aberta) => (aberta ? { vaga: aberta.vaga, envio: enviarOriginal(aberta.vaga, aberta.original) } : null),
      () => null,
    );
    processo.current = { id, arquivo, url, vaga, largura: checagem.largura, altura: checagem.altura };
    await recortar(id);
  }

  function aoEscolherFoto(evento: ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0];
    // Limpa o campo para a mesma foto poder ser escolhida de novo.
    evento.target.value = '';
    if (arquivo) void escolherArquivo(arquivo);
  }

  function aprovar() {
    // Foto recém-mandada: o próximo passo é o nome. Quem só trocou de design e aprovou
    // o ajuste de novo fica onde está, a não ser que o design novo peça mais um texto.
    const acabouDeMandar = !!envio;
    const faltaTexto = r?.design?.config.campos.some((campo) => !valorDoCampo(campo, montagem.campos)) ?? false;
    despachar({ tipo: 'aprovar' });
    limparEnvio();
    if (acabouDeMandar || faltaTexto) irPara('nome');
  }

  // Trocar de design leva a foto junto: o ajuste é guardado por design e, num design
  // novo, abre de novo ali mesmo, na prévia.
  function escolherDesign(slug: string) {
    despachar({ tipo: 'design', slug, de: r?.design?.slug ?? null });
    if (montagem.foto) setVista('perto');
  }

  function ajustar() {
    despachar({ tipo: 'ajustar' });
    setVista('perto');
    irPara('foto');
  }

  async function reaproveitar(item: FotoReaproveitavel) {
    const [arquivo, inteira] = await Promise.all([
      lerRecorte(item.foto.chave),
      item.foto.inteira ? lerRecorte(chaveDaInteira(item.foto.chave)) : null,
    ]);
    if (!arquivo) {
      setAviso('Essa foto não está mais guardada neste aparelho. Manda de novo?');
      return;
    }
    setAviso(null);
    trocarRecorte({
      chave: item.foto.chave,
      url: URL.createObjectURL(arquivo),
      inteira: inteira ? URL.createObjectURL(inteira) : null,
    });
    // O ajuste que vem com a foto é o do design da peça de onde ela saiu.
    const foto = fotoNoDesign({ ...item.foto, aprovada: true }, item.design, r?.design?.slug ?? null);
    despachar({ tipo: 'foto', foto, campos: item.campos });
    setVista('perto');
    // Num design diferente, o ajuste abre de novo: o passo da foto para logo abaixo da prévia.
    if (!foto.aprovada) irPara('foto');
  }

  const enquadrar = useCallback<MudarEnquadramento>((mudanca) => despachar({ tipo: 'enquadrar', mudanca }), []);

  const fotoDaPrevia = useMemo<FotoDaPrevia | null>(
    () =>
      montagem.foto && recorte && recorte.chave === montagem.foto.chave
        ? {
            url: recorte.url,
            geometria: montagem.foto.geometria,
            enquadramento: montagem.foto.enquadramento,
            inteira: recorte.inteira,
          }
        : null,
    [montagem.foto, recorte],
  );

  // A peça do carrinho que saiu desta montagem (ou a que o carrinho mandou editar).
  // Se a pessoa mudar alguma coisa depois de adicionar, a mudança vai para a mesma
  // peça: assim trocar o tamanho não deixa duas peças no carrinho.
  const editada = montagem.editando ? carrinho.itens.find((item) => item.id === montagem.editando) : undefined;
  const jaNoCarrinho = montagem.noCarrinho ? carrinho.itens.find((item) => item.id === montagem.noCarrinho) : undefined;

  // A peça como ela vai para o carrinho, se já estiver completa.
  function pecaPronta(): Omit<ItemDoCarrinho, 'id' | 'criadoEm' | 'presente'> | null {
    if (!r || !r.design || !r.tamanho || !montagem.foto?.aprovada) return null;
    if (oQueFalta(montagem, r).length) return null;
    return {
      peca: r.peca.slug,
      cor: r.cor.slug,
      design: r.design.slug,
      lado: r.lado,
      campos: Object.fromEntries(r.design.config.campos.map((c) => [c.chave, valorDoCampo(c, montagem.campos)])),
      tamanho: r.tamanho,
      foto: montagem.foto,
    };
  }

  const assinar = (p: Omit<ItemDoCarrinho, 'id' | 'criadoEm' | 'presente'>) =>
    JSON.stringify([p.peca, p.cor, p.design, p.lado, p.campos, p.tamanho, p.foto.chave, p.foto.enquadramento]);
  const pronta = pecaPronta();
  const igualAoCarrinho = !!pronta && !!jaNoCarrinho && assinar(pronta) === assinar(jaNoCarrinho);

  // "outra": adiciona como uma peça a mais, mesmo vindo de uma que já está no carrinho.
  function adicionar(outra = false) {
    const pronta = pecaPronta();
    if (!pronta) return;
    // Lê de novo antes de mexer: outra aba pode ter mudado o carrinho.
    const atual = lerCarrinhoGuardado();
    const alvo = outra ? null : (montagem.editando ?? montagem.noCarrinho);
    const anterior = alvo ? atual.itens.find((i) => i.id === alvo) : undefined;
    const item: ItemDoCarrinho = {
      ...pronta,
      id: anterior?.id ?? codigoNovo(),
      criadoEm: anterior?.criadoEm ?? new Date().toISOString(),
      presente: anterior?.presente ?? null,
    };
    const novo: Carrinho = {
      versao: 1,
      itens: anterior ? atual.itens.map((i) => (i.id === anterior.id ? item : i)) : [...atual.itens, item],
    };
    guardarCarrinho(novo);
    setCarrinho(novo);
    if (anterior && montagem.editando) {
      // Editou do carrinho: a peça volta para lá já com as mudanças, e o montador
      // fica livre para a próxima.
      despachar({ tipo: 'nova' });
      trocarRecorte(null);
      router.push('/carrinho');
      return;
    }
    despachar({ tipo: 'no-carrinho', id: item.id });
  }

  function criarOutra() {
    despachar({ tipo: 'nova' });
    trocarRecorte(null);
    limparEnvio();
    setVista(null);
    setAviso(null);
    window.scrollTo({ top: 0, behavior: suave() });
  }

  // No celular, enquanto a pessoa digita, a prévia encolhe e o campo para logo abaixo dela.
  function aoFocar(evento: FocusEvent<HTMLOListElement>) {
    const campo = evento.target;
    if (!(campo instanceof HTMLInputElement) || campo.type !== 'text') return;
    if (!window.matchMedia('(max-width: 1023px) and (pointer: coarse)').matches) return;
    setCompacta(true);
    setTimeout(() => {
      const livre = (doca.current?.getBoundingClientRect().bottom ?? 0) + 16;
      const caixa = campo.labels?.[0] ?? campo;
      window.scrollBy({ top: caixa.getBoundingClientRect().top - livre, behavior: suave() });
    }, 320);
  }

  function aoDesfocar(evento: FocusEvent<HTMLOListElement>) {
    if (evento.target instanceof HTMLInputElement && evento.target.type === 'text') setCompacta(false);
  }

  if (!r) {
    return (
      <p className="mx-auto mt-16 max-w-[34ch] text-center leading-relaxed">
        As peças ainda estão chegando por aqui. Volta daqui a pouco que elas já estarão no lugar.
      </p>
    );
  }

  const valores = montagem.campos;
  const nome = limparTextoDaEstampa(valores.nome ?? '');
  const pecaNome = nomeDaPeca(r.peca, catalogo.pecas);

  // Antes de a pessoa mandar a foto, os designs aparecem com uma foto de exemplo do
  // tema escolhido em "Para quem é?" (e com um nome de exemplo, se ela ainda não
  // escreveu o dela). Depois, com a foto dela: cada design com o ajuste aprovado nele.
  const temaDoExemplo = montagem.tema && montagem.tema !== TODOS ? montagem.tema : null;
  const semFoto = !montagem.foto;
  const fotoDoDesign = (design: Design): FotoDaPrevia | null => {
    if (montagem.foto) {
      if (!fotoDaPrevia || design.slug === r.design?.slug) return fotoDaPrevia;
      return {
        ...fotoDaPrevia,
        enquadramento: montagem.foto.enquadramentos?.[design.slug] ?? ENQUADRAMENTO_INICIAL,
      };
    }
    const exemplo = exemploDoDesign(design, temaDoExemplo);
    return {
      url: exemplo.url,
      geometria: exemplo.geometria,
      enquadramento: ENQUADRAMENTO_INICIAL,
      inteira: exemplo.inteira ?? null,
    };
  };
  const valoresDoDesign = (design: Design) =>
    semFoto && !nome ? { ...valores, nome: exemploDoDesign(design, temaDoExemplo).nome } : valores;
  // A prévia grande só mostra o exemplo depois que a pessoa escolhe um design: antes
  // disso, o assunto é a peça.
  const comExemplo = semFoto && r.designEscolhido && !!r.design;

  const nomeNaArte = (design: Design) => textoDoCampo(design.config, 'nome', valoresDoDesign(design));
  const descreverDesign = (design: Design, cor: Cor, modo = '') =>
    `Prévia ilustrativa: ${design.nome} com o nome ${nomeNaArte(design)}, ${minusculo(pecaNome)} ${minusculo(cor.nome)}, estampa ${noLado(r.lado)}${modo}${semFoto ? ', com foto de exemplo' : ''}`;

  // As vistas da prévia: com o design (e a foto da pessoa ou a de exemplo), a estampa
  // de perto, o lado da estampa inteiro e o outro lado; antes disso, a frente e as
  // costas da peça.
  const fotosDaCor = r.peca.fotos[r.cor.slug] ?? {};
  const vistas: DescricaoDaVista[] = [];
  const arteDaPeca: ArteDaPrevia | null =
    r.design && (fotoDaPrevia || comExemplo)
      ? { tipo: 'design', design: r.design, valores: valoresDoDesign(r.design), foto: fotoDoDesign(r.design) }
      : null;
  if (arteDaPeca && r.design) {
    const arte = arteDaPeca;
    const area = r.peca.areas[r.lado]?.previa ?? null;
    const baseDaEstampa = fotosDaCor[r.lado];
    const baseDoOutro = fotosDaCor[r.outroLado];
    if (baseDaEstampa) {
      vistas.push({
        vista: 'perto',
        legenda: 'De perto',
        acao: 'Ver a estampa de perto',
        base: baseDaEstampa,
        area,
        arte,
        perto: true,
        rotulo: descreverDesign(r.design, r.cor, ', de perto'),
      });
      vistas.push({
        vista: 'inteira',
        legenda: r.lado === 'costas' ? 'Costas' : 'Frente',
        acao: r.lado === 'costas' ? 'Ver as costas da peça inteira' : 'Ver a frente da peça inteira',
        base: baseDaEstampa,
        area,
        arte,
        perto: false,
        rotulo: descreverDesign(r.design, r.cor, ', peça inteira'),
      });
    }
    if (baseDoOutro) {
      vistas.push({
        vista: 'outro',
        legenda: r.outroLado === 'costas' ? 'Costas' : 'Frente',
        acao: r.outroLado === 'costas' ? 'Ver as costas' : 'Ver a frente',
        base: baseDoOutro,
        area: r.marcaNoPeito ? (r.peca.areas.peito?.previa ?? null) : null,
        arte: r.marcaNoPeito ? { tipo: 'marca', design: r.design } : null,
        perto: false,
        rotulo: `Prévia ilustrativa: ${minusculo(pecaNome)} ${minusculo(r.cor.nome)}, ${
          r.outroLado === 'costas' ? 'de costas' : 'de frente'
        }${r.marcaNoPeito ? ', com DIVESTIR no peito' : ''}`,
      });
    }
  } else {
    for (const lado of ['frente', 'costas'] as const) {
      const base = fotosDaCor[lado];
      if (!base) continue;
      vistas.push({
        vista: lado,
        legenda: lado === 'frente' ? 'Frente' : 'Costas',
        acao: lado === 'frente' ? 'Ver a frente' : 'Ver as costas',
        base,
        area: null,
        arte: null,
        perto: false,
        rotulo: `${pecaNome} ${minusculo(r.cor.nome)}, ${lado === 'frente' ? 'de frente' : 'de costas'}`,
      });
    }
  }

  const ajustando = !!montagem.foto && !montagem.foto.aprovada && !!fotoDaPrevia;
  // A definição da estampa com este enquadramento: quem aparece pequeno na foto, ou
  // com muito zoom, sai com poucos pontos na peça impressa.
  const camadaDaFoto = r.design?.config.camadas.find((c): c is CamadaFoto => c.tipo === 'foto');
  const quadroDaFoto = camadaDaFoto ? janelaDaFoto(camadaDaFoto) : null;
  // No design de estampa grande, a largura impressa cresce na mesma medida da prévia.
  const areaDaPeca = r.peca.areas[r.lado]?.previa ?? null;
  const areaDaEstampa = r.design ? areaDoDesign(areaDaPeca, r.design.config) : areaDaPeca;
  const aumentoDaEstampa = areaDaPeca && areaDaEstampa ? areaDaEstampa.largura / areaDaPeca.largura : 1;
  const definicao =
    montagem.foto && quadroDaFoto
      ? definicaoDaEstampa(
          montagem.foto,
          quadroDaFoto.largura / LARGURA_DA_ARTE,
          (r.peca.areas[r.lado]?.largura_cm ?? LARGURA_PADRAO_DA_ESTAMPA_CM) * aumentoDaEstampa,
          quadroDaFoto.largura / quadroDaFoto.altura,
        )
      : null;
  const vistaGrande: Vista = ajustando
    ? 'perto'
    : vista && vistas.some((v) => v.vista === vista)
      ? vista
      : (vistas[0]?.vista ?? 'frente');
  const principal = vistas.find((v) => v.vista === vistaGrande);

  const falta: Falta[] = oQueFalta(montagem, r);
  const campoDoNome = r.design?.config.campos.find((campo) => campo.chave === 'nome');
  const camposExtras = r.design?.config.campos.filter((campo) => campo.chave !== 'nome') ?? [];
  const reaproveitaveis: FotoReaproveitavel[] = [];
  for (const item of [...carrinho.itens].reverse().concat(jaPedidas)) {
    if (item.foto.chave === montagem.foto?.chave) continue;
    if (reaproveitaveis.some((outra) => outra.foto.chave === item.foto.chave)) continue;
    reaproveitaveis.push({ foto: item.foto, campos: item.campos, design: item.design });
  }

  return (
    <div
      ref={raiz}
      // Tablet: a mesma coluna do celular, centralizada, para a prévia não engolir a tela.
      className="sm:mx-auto sm:max-w-xl lg:mx-0 lg:grid lg:max-w-none lg:grid-cols-[minmax(0,1fr)_26rem] lg:items-start lg:gap-x-12 xl:gap-x-16"
    >
      <input
        ref={campoDaFoto}
        type="file"
        accept="image/*,.heic,.heif"
        onChange={aoEscolherFoto}
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
      />
      <div className="lg:col-start-2 lg:row-start-1">
        <h1 className="font-titulo text-[clamp(2.25rem,9vw,4rem)] leading-none uppercase">Monta a sua Divestir</h1>
        <p className="mt-3 hidden max-w-[28ch] font-destaque text-[1.6rem] leading-tight italic lg:block">
          Escolhe a peça e o design, manda a foto e vê a sua Divestir nascer na tela.
        </p>
      </div>

      <div
        ref={doca}
        // A altura da vista grande segue a tela e nunca deixa a prévia passar da
        // largura disponível (100cqw é a largura da própria doca).
        className={`@container sticky top-0 z-20 -mx-4 mt-4 border-b border-verde bg-creme px-4 pt-3 pb-1 lg:top-6 lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:mx-0 lg:mt-0 lg:border-0 lg:px-0 lg:pt-0 lg:pb-0 ${
          compacta
            ? '[--altura-da-vista:9.5rem]'
            : '[--altura-da-vista:min(clamp(12.5rem,35svh,19rem),calc((100cqw-8.25rem)*1.25))] sm:[--altura-da-vista:min(clamp(16rem,42svh,28rem),calc((100cqw-8.25rem)*1.25))] lg:[--altura-da-vista:min(calc(100dvh-10rem),46rem,calc((100cqw-8.25rem)*1.25))]'
        }`}
      >
        <Doca
          vistas={vistas}
          grande={vistaGrande}
          aoVer={setVista}
          cores={coresDaPeca(catalogo, r.peca)}
          cor={r.cor}
          aoEscolherCor={(slug) => despachar({ tipo: 'cor', slug })}
          ajuste={
            ajustando && montagem.foto
              ? {
                  mudar: enquadrar,
                  descricao: idDaDica,
                  enquadramento: montagem.foto.enquadramento,
                  definicao: definicao?.nivel ?? null,
                  aoTrocarFoto: escolherFoto,
                  aoAprovar: aprovar,
                }
              : undefined
          }
          exemplo={comExemplo}
          compacta={compacta}
        />
        {/* Quem usa leitor de tela ouve a prévia sempre que ela muda. */}
        <p className="sr-only" aria-live="polite">
          {principal?.rotulo}
        </p>
      </div>

      <ol onFocus={aoFocar} onBlur={aoDesfocar} className="mt-1 lg:col-start-2 lg:row-start-2 lg:mt-8">
        <Passo id={ID_DOS_PASSOS.peca} numero={1} titulo="A peça" resumo={pecaNome}>
          <PassoPeca
            catalogo={catalogo}
            peca={r.peca}
            cor={r.cor}
            aoEscolher={(slug) => despachar({ tipo: 'peca', slug })}
          />
        </Passo>

        <Passo
          id={ID_DOS_PASSOS.design}
          numero={2}
          titulo="O design"
          resumo={(r.designEscolhido || fotoDaPrevia) && r.design ? `${r.design.nome}, ${noLado(r.lado)}` : null}
        >
          <PassoDesign
            designs={r.designs}
            design={r.design}
            escolhido={r.designEscolhido || !!montagem.foto}
            tema={montagem.tema}
            peca={r.peca}
            cor={r.cor}
            lado={r.lado}
            lados={r.lados}
            marcaNoPeito={r.marcaNoPeito}
            comExemplo={semFoto}
            fotoDoDesign={fotoDoDesign}
            valoresDoDesign={valoresDoDesign}
            rotuloDoDesign={(design) => descreverDesign(design, r.cor, ', de perto')}
            aoEscolherTema={(tema) => despachar({ tipo: 'tema', tema })}
            aoEscolherDesign={escolherDesign}
            aoEscolherLado={(lado) => despachar({ tipo: 'lado', lado })}
          />
        </Passo>

        <Passo
          id={ID_DOS_PASSOS.foto}
          numero={3}
          titulo="A foto"
          resumo={montagem.foto?.aprovada && fotoDaPrevia ? 'Foto aprovada' : null}
        >
          <PassoFoto
            envio={envio}
            foto={montagem.foto}
            temRecorte={!!fotoDaPrevia}
            definicao={definicao?.nivel ?? null}
            aviso={aviso}
            reaproveitaveis={reaproveitaveis}
            aoEscolherFoto={escolherFoto}
            aoTentarDeNovo={() => processo.current && void recortar(processo.current.id)}
            aoAjustar={ajustar}
            aoReaproveitar={(item) => void reaproveitar(item)}
            idDaDica={idDaDica}
          />
        </Passo>

        <Passo
          id={ID_DOS_PASSOS.nome}
          numero={4}
          titulo={camposExtras.length ? 'O nome e os detalhes' : 'O nome'}
          resumo={nome ? nome.toLocaleUpperCase('pt-BR') : null}
        >
          <PassoNome
            campo={campoDoNome}
            extras={camposExtras}
            valores={valores}
            casal={!!r.design?.config.temas?.includes('casal')}
            aoMudar={(chave, valor) => despachar({ tipo: 'campo', chave, valor })}
          />
        </Passo>

        <Passo id={ID_DOS_PASSOS.cor} numero={5} titulo="A cor" resumo={r.cor.nome}>
          <PassoCor
            cores={coresDaPeca(catalogo, r.peca)}
            cor={r.cor}
            peca={r.peca}
            lado={r.lado}
            arte={arteDaPeca}
            aoEscolher={(slug) => despachar({ tipo: 'cor', slug })}
            rotuloDaCor={(cor) => (r.design ? descreverDesign(r.design, cor, ', de perto') : cor.nome)}
          />
        </Passo>

        <Passo id={ID_DOS_PASSOS.tamanho} numero={6} titulo="O tamanho" resumo={r.tamanho}>
          <PassoTamanho
            peca={r.peca}
            tamanho={r.tamanho}
            aoEscolher={(tamanho) => despachar({ tipo: 'tamanho', tamanho })}
          />
        </Passo>

        <Passo id={ID_DOS_PASSOS.carrinho} numero={7} titulo="Sua Divestir">
          <PassoResumo
            r={r}
            nomeDaPeca={pecaNome}
            nome={nome}
            valores={valores}
            foto={fotoDaPrevia}
            falta={falta}
            pecasNoCarrinho={carrinho.itens.length}
            situacao={editada ? 'editando' : igualAoCarrinho ? 'no-carrinho' : jaNoCarrinho ? 'mudou' : 'nova'}
            rotulo={r.design ? descreverDesign(r.design, r.cor, ', de perto') : pecaNome}
            aoAdicionar={() => adicionar()}
            aoAdicionarOutra={() => adicionar(true)}
            aoCriarOutra={criarOutra}
            aoIrPara={irPara}
          />
        </Passo>
      </ol>
    </div>
  );
}
