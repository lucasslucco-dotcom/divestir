import 'server-only';

// Envio de e-mail pelo Resend (briefing, "Stack": e-mail transacional). O domínio
// divestirbr.com.br está verificado no Resend desde 21/11/2026.
//
// Variáveis de ambiente (na Vercel):
//   RESEND_API_KEY   chave do Resend, só no servidor (sem ela, nenhum e-mail sai)
//   EMAIL_REMETENTE  opcional: quem assina os e-mails ("Divestir <pedidos@divestirbr.com.br>")
//   EMAIL_RESPOSTA   opcional: para onde vai a resposta do cliente (uma caixa que alguém lê)

// Só o teste local troca o endereço (por um Resend de mentira).
const API = () => process.env.RESEND_API_URL ?? 'https://api.resend.com';

export const emailLigado = () => !!process.env.RESEND_API_KEY;

export type Email = {
  para: string;
  assunto: string;
  html: string;
  texto: string;
  // Um código por aviso: se o mesmo aviso for pedido duas vezes (dois avisos de
  // pagamento ao mesmo tempo, por exemplo), o Resend manda um só.
  chave: string;
};

export type Envio = { ok: true; repetido: boolean } | { ok: false; erro: string };

export async function enviarEmail(email: Email): Promise<Envio> {
  const chave = process.env.RESEND_API_KEY;
  if (!chave) return { ok: false, erro: 'o envio de e-mail não está ligado' };
  let resposta: Response;
  try {
    resposta = await fetch(`${API()}/emails`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${chave}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': email.chave.slice(0, 256),
      },
      body: JSON.stringify({
        from: process.env.EMAIL_REMETENTE || 'Divestir <pedidos@divestirbr.com.br>',
        to: [email.para],
        subject: email.assunto,
        html: email.html,
        text: email.texto,
        ...(process.env.EMAIL_RESPOSTA ? { reply_to: process.env.EMAIL_RESPOSTA } : {}),
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    return { ok: false, erro: 'o Resend não respondeu' };
  }
  if (resposta.ok) return { ok: true, repetido: false };
  // 409: o mesmo aviso já foi (ou está sendo) enviado por outro pedido ao site.
  if (resposta.status === 409) return { ok: true, repetido: true };
  const dados = (await resposta.json().catch(() => null)) as { message?: string } | null;
  return {
    ok: false,
    erro: `o Resend respondeu ${resposta.status}${dados?.message ? `: ${dados.message}` : ''}`.slice(0, 300),
  };
}
