// Ícones desenhados da tela da foto: traço de 2px, pontas redondas, na cor do texto.
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
