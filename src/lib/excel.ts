import * as XLSX from 'xlsx';
import { Employee, Assignment, Operation, Match, Sale, PendingTask } from '../types';

export interface ExportRow {
  cpf: string;
  nome: string;
  email: string;
  celular: string;
  setor: string;
  empresa: string;
  funcao: string;
}

export function generateEmployeeAssignmentsXLSX(
  assignments: Assignment[],
  employees: Employee[],
  operations: Operation[],
  match?: Match
) {
  const employeeMap = new Map<string, Employee>();
  employees.forEach((emp) => employeeMap.set(emp.cpf, emp));

  const operationMap = new Map<string, Operation>();
  operations.forEach((op) => operationMap.set(op.codigo, op));

  const dataRows: ExportRow[] = assignments.map((asg) => {
    const emp = employeeMap.get(asg.cpf);
    return {
      cpf: emp ? emp.cpf : asg.cpf,
      nome: emp ? emp.nome : 'Funcionário',
      email: emp ? emp.email : '',
      celular: emp ? emp.celular : '',
      setor: emp ? emp.setor : '1,2,3,4,5,6',
      empresa: emp ? emp.empresa : 'FMS',
      funcao: asg.funcao || '',
    };
  });

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(dataRows, {
    header: ['cpf', 'nome', 'email', 'celular', 'setor', 'empresa', 'funcao'],
  });

  // Set column widths for clean presentation
  worksheet['!cols'] = [
    { wch: 15 }, // cpf
    { wch: 28 }, // nome
    { wch: 28 }, // email
    { wch: 16 }, // celular
    { wch: 18 }, // setor
    { wch: 12 }, // empresa
    { wch: 22 }, // funcao
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Funcionarios');

  // Construct filename
  const matchInfo = match
    ? `${match.mandante}_x_${match.visitante}_${match.data}`
    : 'escala_funcionarios';
  const cleanFileName = `Escala_${matchInfo.replace(/[^a-zA-Z0-9_]/g, '_')}.xlsx`;

  // Write and trigger download
  XLSX.writeFile(workbook, cleanFileName);
}

/** Backup completo: baixa um arquivo Excel com todas as abas do app. */
export function exportFullDatabaseXLSX(data: {
  sales: Sale[];
  employees: Employee[];
  operations: Operation[];
  matches: Match[];
  assignments: Assignment[];
  pendingTasks: PendingTask[];
}) {
  const workbook = XLSX.utils.book_new();
  const add = (rows: any[], header: string[], name: string) =>
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows, { header }), name);

  add(data.sales.map(({ matchId, ...s }) => s), ['codigo', 'data', 'mandante', 'visitante', 'operacao', 'venda'], 'Venda');
  add(data.employees, ['cpf', 'nome', 'email', 'celular', 'setor', 'empresa', 'funcaoDefault'], 'Funcionarios');
  add(data.operations, ['codigo', 'operacao', 'meta'], 'Operacoes');
  add(data.matches, ['id', 'data', 'horario', 'mandante', 'visitante'], 'Jogos');
  add(data.assignments, ['id', 'matchId', 'cpf', 'operacaoCodigo', 'funcao'], 'Escala');
  add(
    data.pendingTasks.map((t) => ({
      ...t,
      concluida: t.concluida ? 'Sim' : 'Não',
      recorrente: t.recorrente ? 'Sim' : 'Não',
      jogosConcluidos: (t.jogosConcluidos || []).join(';'),
    })),
    ['id', 'matchId', 'titulo', 'concluida', 'observacao', 'dataCriacao', 'recorrente', 'jogosConcluidos', 'jogoConclusao', 'dataConclusao'],
    'Pendencia'
  );

  const today = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `backup_gestao_maracana_${today}.xlsx`);
}
