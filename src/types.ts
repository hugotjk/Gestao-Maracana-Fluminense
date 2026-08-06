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
  favorito?: boolean;
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
  matchId: string;
  titulo: string;
  concluida: boolean;
  observacao?: string;
  dataCriacao?: string;
}

export type ViewTab = 'dashboard' | 'vendas' | 'escala' | 'funcionarios' | 'operacoes' | 'jogos' | 'pendencias' | 'configuracoes';
