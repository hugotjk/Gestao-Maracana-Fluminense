/**
 * Converte o que foi digitado (ou lido da planilha) em número.
 * Aceita vírgula OU ponto como separador dos centavos: "1500,50", "1500.50", "R$ 1500,5".
 * Se aparecerem os dois (ex.: "1.500,50"), o último é tratado como separador dos centavos.
 */
export function parseMoney(input: string | number | null | undefined): number {
  if (typeof input === 'number') return isFinite(input) ? input : 0;
  if (!input) return 0;

  let s = String(input).replace(/R\$/gi, '').replace(/\s/g, '');
  const negative = s.startsWith('-');
  s = s.replace(/[^\d.,]/g, '');
  if (!s) return 0;

  const lastSep = Math.max(s.lastIndexOf(','), s.lastIndexOf('.'));
  let normalized: string;
  if (lastSep === -1) {
    normalized = s;
  } else {
    const intPart = s.slice(0, lastSep).replace(/[.,]/g, '');
    const decPart = s.slice(lastSep + 1).replace(/[.,]/g, '');
    normalized = `${intPart || '0'}.${decPart}`;
  }

  const n = parseFloat(normalized);
  if (isNaN(n)) return 0;
  return negative ? -n : n;
}

/** Mostra o número com vírgula nos centavos, sem separador de milhar (ex.: 1500,50). Para campos de digitação. */
export function toInputMoney(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return '';
  return value.toFixed(2).replace('.', ',');
}

/** Formata para exibição: R$ 1.500,50 */
export function formatBRL(value: number | null | undefined): string {
  return `R$ ${(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
