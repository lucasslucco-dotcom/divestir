// Conferências e máscaras dos dados do checkout. Valem igual no navegador (para
// avisar na hora) e no servidor (que confere tudo de novo antes de criar o pedido).

export const soDigitos = (texto: string) => texto.replace(/\D/g, '');

export function nomeCompletoValido(nome: string) {
  const limpo = nome.trim().replace(/\s+/g, ' ');
  return limpo.length >= 5 && limpo.length <= 120 && /^\S+( \S+)+$/.test(limpo);
}

export function emailValido(email: string) {
  return email.length <= 160 && /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[^\s@.]{2,}$/.test(email.trim());
}

// CPF com os dois dígitos verificadores certos.
export function cpfValido(valor: string) {
  const cpf = soDigitos(valor);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  for (const tamanho of [9, 10]) {
    let soma = 0;
    for (let i = 0; i < tamanho; i++) soma += Number(cpf[i]) * (tamanho + 1 - i);
    if (((soma * 10) % 11) % 10 !== Number(cpf[tamanho])) return false;
  }
  return true;
}

// WhatsApp do Brasil, com DDD: tira o +55 e o zero da frente, se vierem.
export function normalizarWhatsapp(valor: string) {
  let digitos = soDigitos(valor);
  if (digitos.length >= 12 && digitos.startsWith('55')) digitos = digitos.slice(2);
  if (digitos.startsWith('0')) digitos = digitos.slice(1);
  return digitos;
}

export function whatsappValido(valor: string) {
  return /^[1-9]{2}\d{8,9}$/.test(normalizarWhatsapp(valor));
}

export const cepValido = (valor: string) => /^\d{8}$/.test(soDigitos(valor));

// As 27 unidades da federação.
export const UFS: readonly string[] =
  'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' ');

export const ufValida = (valor: string) => UFS.includes(valor.toUpperCase());

// Máscaras para quem digita: 123.456.789-09, (34) 99999-9999, 38400-000.
export function mascararCpf(valor: string) {
  return soDigitos(valor)
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

export function mascararTelefone(valor: string) {
  const digitos = soDigitos(valor).slice(0, 11);
  if (digitos.length <= 2) return digitos ? `(${digitos}` : '';
  const ddd = digitos.slice(0, 2);
  const resto = digitos.slice(2);
  if (resto.length <= 4) return `(${ddd}) ${resto}`;
  const corte = resto.length > 8 ? 5 : 4;
  return `(${ddd}) ${resto.slice(0, corte)}-${resto.slice(corte)}`;
}

export function mascararCep(valor: string) {
  return soDigitos(valor)
    .slice(0, 8)
    .replace(/(\d{5})(\d)/, '$1-$2');
}

// Nome e sobrenome separados, como o Mercado Pago pede.
export function separarNome(nome: string) {
  const partes = nome.trim().replace(/\s+/g, ' ').split(' ');
  return { primeiro: partes[0] ?? '', resto: partes.slice(1).join(' ') };
}
