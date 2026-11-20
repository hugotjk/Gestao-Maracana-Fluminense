export interface Match {
  id: string;
  data: string; // YYYY-MM-DD
  horario: string; // HH:MM
  mandante: string;
  visitante: string;
}

export interface Operation {
  codigo: string; // e.g. O000000001
  operacao: string; // Nome da operacao/setor
  meta: number; // Meta financeiro
}

export interface Employee {
  cpf: string;
  nome: string;
  email: string;
  celular: string;
  setor: string; // default "1,2,3,4,5,6"
  empresa: string; // default "FMS"
  funcaoDefault?: string;
}

export interface Assignment {
  id: string;
  matchId: string;
  cpf: string;
  operacaoCodigo: string;
  funcao: string;
}

export interface Sale {
  codigo: string; // e.g. V000000001
  data: string;
  mandante: string;
  visitante: string;
  operacao: string;
  venda: number;
  matchId?: string;
}

export interface PendingTask {
  id: string;
  /** Jogo em que a pendência foi criada (só informativo; a pendência não pertence ao jogo). */
  matchId: string;
  titulo: string;
  /** Para pendências normais: se já foi resolvida. */
  concluida: boolean;
  observacao?: string;
  dataCriacao?: string;
  /** true = item do checklist de TODO jogo (é marcado por jogo e volta a ficar aberto no próximo). */
  recorrente?: boolean;
  /** Pendência recorrente: ids dos jogos em que já foi feita. */
  jogosConcluidos?: string[];
  /** Pendência normal: jogo ativo quando foi resolvida. */
  jogoConclusao?: string;
  /** Pendência normal: data em que foi resolvida (AAAA-MM-DD). */
  dataConclusao?: string;
}

export type ViewTab = 'dashboard' | 'vendas' | 'escala' | 'funcionarios' | 'operacoes' | 'jogos' | 'pendencias' | 'configuracoes';
