import React, { useState } from 'react';
import { Download, Users, PlusCircle, Trash2, Search, CheckCircle2, Trophy, Briefcase, FileSpreadsheet } from 'lucide-react';
import { Match, Operation, Employee, Assignment } from '../types';
import { generateEmployeeAssignmentsXLSX } from '../lib/excel';

interface AssignmentsViewProps {
  assignments: Assignment[];
  employees: Employee[];
  operations: Operation[];
  matches: Match[];
  activeMatchId: string;
  onAddAssignment: (assignment: Assignment) => void;
  onRemoveAssignment: (id: string) => void;
}

export const AssignmentsView: React.FC<AssignmentsViewProps> = ({
  assignments,
  employees,
  operations,
  matches,
  activeMatchId,
  onAddAssignment,
  onRemoveAssignment,
}) => {
  const selectedMatch = matches.find((m) => m.id === activeMatchId) || matches[0];

  const [selectedCpf, setSelectedCpf] = useState<string>('');
  const [selectedOpCodigo, setSelectedOpCodigo] = useState<string>('');
  const [funcaoInput, setFuncaoInput] = useState<string>('Atendente');

  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  // Set default operation on load
  React.useEffect(() => {
    if (operations.length > 0 && !selectedOpCodigo) {
      setSelectedOpCodigo(operations[0].codigo);
    }
    if (employees.length > 0 && !selectedCpf) {
      setSelectedCpf(employees[0].cpf);
    }
  }, [operations, employees]);

  // When selecting an employee, default to their default role if present
  const handleEmployeeSelect = (cpf: string) => {
    setSelectedCpf(cpf);
    const emp = employees.find((e) => e.cpf === cpf);
    if (emp && emp.funcaoDefault) {
      setFuncaoInput(emp.funcaoDefault);
    }
  };

  const handleAddAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatch || !selectedCpf || !selectedOpCodigo) return;

    // Check if employee is already assigned to this operation on this match
    const existing = assignments.find(
      (a) => a.matchId === selectedMatch.id && a.cpf === selectedCpf && a.operacaoCodigo === selectedOpCodigo
    );

    if (existing) {
      setMessage('O funcionário já está escalado nesta operação para este jogo.');
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    const newAssignment: Assignment = {
      id: `ASG_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      matchId: selectedMatch.id,
      cpf: selectedCpf,
      operacaoCodigo: selectedOpCodigo,
      funcao: funcaoInput.trim() || 'Atendente',
    };

    onAddAssignment(newAssignment);
    setMessage('Funcionário adicionado à escala!');
    setTimeout(() => setMessage(null), 3000);
  };

  // Filter assignments for selected match
  const matchAssignments = assignments.filter((a) => a.matchId === selectedMatch?.id);

  // Filter by search
  const filteredAssignments = matchAssignments.filter((asg) => {
    const emp = employees.find((e) => e.cpf === asg.cpf);
    const op = operations.find((o) => o.codigo === asg.operacaoCodigo);
    const q = searchTerm.toLowerCase();
    return (
      emp?.nome.toLowerCase().includes(q) ||
      emp?.cpf.includes(q) ||
      op?.operacao.toLowerCase().includes(q) ||
      asg.funcao.toLowerCase().includes(q)
    );
  });

  const handleExportXLSX = () => {
    generateEmployeeAssignmentsXLSX(matchAssignments, employees, operations, selectedMatch);
  };

  return (
    <div id="assignments-view-root" className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div id="assignments-title-card" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-[#8A0029]" />
            Escala de Funcionários por Operação
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Selecione o funcionário, a operação e a função para gerar a planilha oficial em XLSX
          </p>
        </div>

        <div>
          <button
            onClick={handleExportXLSX}
            disabled={matchAssignments.length === 0}
            className={`inline-flex items-center gap-1.5 font-bold text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-sm ${
              matchAssignments.length > 0
                ? 'bg-[#006633] hover:bg-emerald-800 text-white'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Gerar Planilha (XLSX)</span>
          </button>
        </div>
      </div>

      {message && (
        <div className="p-3 bg-amber-50 border border-amber-300 text-amber-900 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-amber-600" />
          <span>{message}</span>
        </div>
      )}

      {/* Assignment Add Form */}
      <form onSubmit={handleAddAssignment} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <PlusCircle className="w-4 h-4 text-[#8A0029]" />
          Adicionar Funcionário na Escala do Jogo
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Select Employee */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              Funcionário Cadastrado:
            </label>
            <select
              value={selectedCpf}
              onChange={(e) => handleEmployeeSelect(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-[#8A0029] focus:outline-none"
            >
              {employees.length === 0 && <option value="">Nenhum funcionário cadastrado</option>}
              {employees.map((e) => (
                <option key={e.cpf} value={e.cpf}>
                  {e.nome} - CPF: {e.cpf} ({e.empresa})
                </option>
              ))}
            </select>
          </div>

          {/* Select Operation */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              Operação / Setor de Atuação:
            </label>
            <select
              value={selectedOpCodigo}
              onChange={(e) => setSelectedOpCodigo(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-[#8A0029] focus:outline-none"
            >
              {operations.length === 0 && <option value="">Nenhuma operação cadastrada</option>}
              {operations.map((o) => (
                <option key={o.codigo} value={o.codigo}>
                  {o.operacao} ({o.codigo})
                </option>
              ))}
            </select>
          </div>

          {/* Function / Role */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              Função no Dia do Jogo:
            </label>
            <input
              type="text"
              placeholder="Ex: Supervisor, Caixa, Atendente, Apoio"
              value={funcaoInput}
              onChange={(e) => setFuncaoInput(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-[#8A0029] focus:outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={employees.length === 0 || operations.length === 0}
            className="flex items-center gap-2 bg-[#8A0029] hover:bg-[#6A001F] text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            Escalar Funcionário
          </button>
        </div>
      </form>

      {/* Escala Table */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Escala Confirmada ({selectedMatch ? `${selectedMatch.mandante} x ${selectedMatch.visitante}` : ''})
            </h3>
            <p className="text-xs text-slate-500">
              Total de {matchAssignments.length} funcionário(s) escalado(s) neste jogo
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Filtrar por nome, CPF ou setor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8A0029]"
            />
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/80 text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">CPF</th>
                <th className="py-3 px-4">Nome</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Celular</th>
                <th className="py-3 px-4">Setor</th>
                <th className="py-3 px-4">Empresa</th>
                <th className="py-3 px-4">Operação Alocada</th>
                <th className="py-3 px-4">Função</th>
                <th className="py-3 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredAssignments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 text-xs">
                    Nenhum funcionário escalado para este jogo até o momento.
                  </td>
                </tr>
              ) : (
                filteredAssignments.map((asg) => {
                  const emp = employees.find((e) => e.cpf === asg.cpf);
                  const op = operations.find((o) => o.codigo === asg.operacaoCodigo);

                  return (
                    <tr key={asg.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-700">
                        {emp?.cpf || asg.cpf}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {emp?.nome || 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {emp?.email || '-'}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {emp?.celular || '-'}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {emp?.setor || '1,2,3,4,5,6'}
                      </td>
                      <td className="py-3 px-4 text-slate-800 font-bold">
                        {emp?.empresa || 'FMS'}
                      </td>
                      <td className="py-3 px-4 font-semibold text-[#8A0029]">
                        {op?.operacao || 'N/A'}
                      </td>
                      <td className="py-3 px-4 font-semibold text-emerald-800 bg-emerald-50/50 rounded">
                        {asg.funcao}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => onRemoveAssignment(asg.id)}
                          className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Remover da Escala"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
