import { NovaSenha } from './nova-senha';

export default function PaginaDaSenha() {
  return (
    <>
      <h1 className="font-titulo text-[clamp(2.25rem,9vw,4rem)] leading-none uppercase">Minha senha</h1>
      <p className="mt-4 max-w-[52ch] leading-relaxed">
        Troque a senha provisória por uma só sua, com pelo menos 8 letras ou números.
      </p>
      <NovaSenha />
    </>
  );
}
