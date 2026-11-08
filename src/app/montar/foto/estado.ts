import type { Enquadramento, Geometria } from '@/lib/foto/enquadramento';

// Em que pé está o recorte da foto escolhida.
export type RecortePronto = {
  url: string;
  teste: boolean;
  geometria: Geometria;
  enquadramento: Enquadramento;
};

export type EstadoDoRecorte =
  | { etapa: 'esperando' }
  | { etapa: 'recortando' }
  | ({ etapa: 'pronto' | 'aprovado' } & RecortePronto)
  | { etapa: 'erro'; mensagem: string };

export type MudarEnquadramento = (mudanca: (atual: Enquadramento) => Enquadramento) => void;
