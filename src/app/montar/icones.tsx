// Ícones desenhados do montador: traço de 2px, pontas redondas, na cor do texto.
type Props = { className?: string; tamanho?: number };

function Svg({ className, tamanho = 16, children }: Props & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={tamanho}
      height={tamanho}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {children}
    </svg>
  );
}

export function IconeSim(props: Props) {
  return (
    <Svg {...props}>
      <path d="M3.5 8.5l3 3 6-7" />
    </Svg>
  );
}

export function IconeNao(props: Props) {
  return (
    <Svg {...props}>
      <path d="M4.5 4.5l7 7M11.5 4.5l-7 7" />
    </Svg>
  );
}

export function IconeAlerta(props: Props) {
  return (
    <Svg {...props}>
      <circle cx="8" cy="8" r="6.25" />
      <path d="M8 4.75v3.5M8 11.25h.01" />
    </Svg>
  );
}

export function IconeVoltar(props: Props) {
  return (
    <Svg {...props}>
      <path d="M10 3.5L5.5 8l4.5 4.5" />
    </Svg>
  );
}

export function IconeMais(props: Props) {
  return (
    <Svg {...props}>
      <path d="M8 3.5v9M3.5 8h9" />
    </Svg>
  );
}

export function IconeMenos(props: Props) {
  return (
    <Svg {...props}>
      <path d="M3.5 8h9" />
    </Svg>
  );
}

export function IconeCarregando(props: Props) {
  return (
    <Svg {...props} className={`animate-spin motion-reduce:animate-none ${props.className ?? ''}`}>
      <path d="M8 1.75a6.25 6.25 0 1 1-6.25 6.25" />
    </Svg>
  );
}

export function IconeSacola(props: Props) {
  return (
    <Svg {...props}>
      <path d="M3.25 5.75h9.5l-.8 7.5h-7.9z" />
      <path d="M5.75 5.75V4.5a2.25 2.25 0 0 1 4.5 0v1.25" />
    </Svg>
  );
}

export function IconeCopiar(props: Props) {
  return (
    <Svg {...props}>
      <rect x="5.25" y="5.25" width="8" height="8" rx="1.5" />
      <path d="M10.75 5.25V4.25a1.5 1.5 0 0 0-1.5-1.5h-4.5a1.5 1.5 0 0 0-1.5 1.5v4.5a1.5 1.5 0 0 0 1.5 1.5h1" />
    </Svg>
  );
}

export function IconePresente(props: Props) {
  return (
    <Svg {...props}>
      <rect x="2.75" y="6" width="10.5" height="7.25" rx="1" />
      <path d="M8 6v7.25M2.75 8.75h10.5M8 6C6.5 6 5 5.25 5 4.1 5 3.2 5.7 2.75 6.4 2.75 7.5 2.75 8 4.25 8 6zm0 0c1.5 0 3-.75 3-1.9 0-.9-.7-1.35-1.4-1.35C8.5 2.75 8 4.25 8 6z" />
    </Svg>
  );
}
