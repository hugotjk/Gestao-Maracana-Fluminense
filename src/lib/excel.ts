import * as XLSX from 'xlsx';
import { Employee, Assignment, Operation, Match } from '../types';

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

export function exportFullDatabaseXLSX(
  sales: any[],
  employees: Employee[],
  operations: Operation[],
  matches: Match[]
) {
  const workbook = XLSX.utils.book_new();

  // Tab 1: Venda
  const wsVenda = XLSX.utils.json_to_sheet(sales, {
    header: ['codigo', 'data', 'mandante', 'visitante', 'operacao', 'venda'],
  });
  XLSX.utils.book_append_sheet(workbook, wsVenda, 'Venda');

  // Tab 2: Funcionarios
  const wsFunc = XLSX.utils.json_to_sheet(employees, {
    header: ['cpf', 'nome', 'email', 'celular', 'setor', 'empresa', 'funcaoDefault'],
  });
  XLSX.utils.book_append_sheet(workbook, wsFunc, 'Funcionarios');

  // Tab 3: Operacoes
  const wsOps = XLSX.utils.json_to_sheet(operations, {
    header: ['codigo', 'operacao', 'meta'],
  });
  XLSX.utils.book_append_sheet(workbook, wsOps, 'Operacoes');

  // Tab 4: Jogos
  const wsJogos = XLSX.utils.json_to_sheet(matches, {
    header: ['id', 'data', 'horario', 'mandante', 'visitante'],
  });
  XLSX.utils.book_append_sheet(workbook, wsJogos, 'Jogos');

  XLSX.writeFile(workbook, 'backup_banco_de_dados_fluminense.xlsx');
}
