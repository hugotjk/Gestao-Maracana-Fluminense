import React, { useState } from 'react';
import { Users, PlusCircle, Trash2, Search, CheckCircle2, FileSpreadsheet, ChevronDown, Copy } from 'lucide-react';
import { Match, Operation, Employee, Assignment } from '../types';
import { generateEmployeeAssignmentsXLSX } from '../lib/excel';

interface AssignmentsViewProps {
  assignments: Assignment[];
  employees: Employee[];
  operations: Operation[];
  matches: Match[];
  activeMatchId: string;
  onAddAssignment: (assignment: Assignment) => void;
  onAddAssignments: (list: Assignment[]) => void;
  onUpdateAssignment?: (assignment: Assignment) => void;
  onRemoveAssignment: (id: string) => void;
}

export const AssignmentsView: React.FC<AssignmentsViewProps> = ({
  assignments,
  employees,
  operations,
  matches,
  activeMatchId,
  onAddAssignment,
  onAddAssignments,
  onUpdateAssignment,
  onRemoveAssignment,
}) => {
  const selectedMatch = matches.find((m) => m.id === activeMatchId) || matches[0];

  const [selectedCpf, setSelectedCpf] = useState<string>('');
  const [selectedOpCodigo, setSelectedOpCodigo] = useState<string>('');

  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  // Operations sorted by their code (the code in parentheses)
  const sortedOperations = React.useMemo(() => {
    return [...operations].sort((a, b) =>
      (a.codigo || '').localeCompare(b.codigo || '', undefined, { numeric: true, sensitivity: 'base' })
    );
  }, [operations]);

  // Filter assignments for selected match, sorted by operation code, then employee name
  const matchAssignments = React.useMemo(() => {
    const list = assignments.filter((a) => a.matchId === selectedMatch?.id);
    const empMap = new Map<string, string>(employees.map((e) => [e.cpf, e.nome]));

    return [...list].sort((a, b) => {
      const codeA = a.operacaoCodigo || '';
      const codeB = b.operacaoCodigo || '';
      const cmp = codeA.localeCompare(codeB, undefined, { numeric: true, sensitivity: 'base' });
      if (cmp !== 0) return cmp;

      const nameA = empMap.get(a.cpf) || '';
      const nameB = empMap.get(b.cpf) || '';
      return nameA.localeCompare(nameB, 'pt-BR', { sensitivity: 'base' });
    });
  }, [assignments, selectedMatch?.id, employees]);

  // Set of CPFs already assigned to this match
  const assignedCpfs = React.useMemo(() => {
    return new Set(matchAssignments.map((a) => a.cpf));
  }, [matchAssignments]);

  // Only employees NOT yet scheduled for this match
  const availableEmployees = React.useMemo(() => {
    return employees
      .filter((e) => !assignedCpfs.has(e.cpf))
      .sort((a, b) => {
        return a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' });
      });
  }, [employees, assignedCpfs]);

  // Set default operation on load
  React.useEffect(() => {
    if (sortedOperations.length > 0 && !selectedOpCodigo) {
      setSelectedOpCodigo(sortedOperations[0].codigo);
    }
  }, [sortedOperations, selectedOpCodigo]);

  // Keep selectedCpf synchronized with available employees
  React.useEffect(() => {
    if (availableEmployees.length > 0) {
      if (!selectedCpf || !availableEmployees.some((e) => e.cpf === selectedCpf)) {
        setSelectedCpf(availableEmployees[0].cpf);
      }
    } else {
      setSelectedCpf('');
    }
  }, [availableEmployees, selectedCpf]);

  const handleEmployeeSelect = (cpf: string) => {
    setSelectedCpf(cpf);
  };

  const handleAddAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatch || !selectedCpf || !selectedOpCodigo) return;

    // Check if employee is already assigned to this match
    if (assignedCpfs.has(selectedCpf)) {
      setMessage('O funcionário já está escalado para este jogo.');
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    const newAssignment: Assignment = {
      id: `ASG_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      matchId: selectedMatch.id,
      cpf: selectedCpf,
      operacaoCodigo: selectedOpCodigo,
      funcao: '', // Default to empty as requested
    };

    onAddAssignment(newAssignment);
    setMessage('Funcionário adicionado à escala com sucesso!');
    setTimeout(() => setMessage(null), 3000);
  };

  const handleOperationChange = (asg: Assignment, newOpCodigo: string) => {
    if (onUpdateAssignment && newOpCodigo && newOpCodigo !== asg.operacaoCodigo) {
      onUpdateAssignment({ ...asg, operacaoCodigo: newOpCodigo });
      const opObj = operations.find((o) => o.codigo === newOpCodigo);
      setMessage(`Operação alterada para "${opObj?.operacao || newOpCodigo}"`);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  // Filter by search
  const filteredAssignments = matchAssignments.filter((asg) => {
    const emp = employees.find((e) => e.cpf === asg.cpf);
    const op = operations.find((o) => o.codigo === asg.operacaoCodigo);
    const q = searchTerm.toLowerCase();
    return (
      emp?.nome.toLowerCase().includes(q) ||
      emp?.cpf.includes(q) ||
      op?.operacao.toLowerCase().includes(q) ||
      (asg.funcao && asg.funcao.toLowerCase().includes(q))
    );
  });

  // ---- Copiar escala de outro jogo ----
  const sourceGames = React.useMemo(() => {
    const withAsg = new Set(assignments.map((a) => a.matchId));
    return matches
      .filter((m) => m.id !== selectedMatch?.id && withAsg.has(m.id))
      .sort((a, b) => (b.data || '').localeCompare(a.data || ''));
  }, [assignments, matches, selectedMatch?.id]);

  // Padrão: o jogo com escala mais recente ANTES do jogo ativo (ou o mais recente de todos)
  const defaultSourceId = React.useMemo(() => {
    const before = sourceGames.find((m) => (m.data || '') <= (selectedMatch?.data || ''));
    return (before || sourceGames[0])?.id || '';
  }, [sourceGames, selectedMatch?.data]);

  const [copySourceId, setCopySourceId] = useState('');
  React.useEffect(() => setCopySourceId(defaultSourceId), [defaultSourceId]);

  const handleCopyEscala = () => {
    if (!selectedMatch || !copySourceId) return;
    const source = matches.find((m) => m.id === copySourceId);
    const validCpfs = new Set(employees.map((e) => e.cpf));
    const toCopy = assignments.filter(
      (a) => a.matchId === copySourceId && !assignedCpfs.has(a.cpf) && validCpfs.has(a.cpf)
    );
    if (toCopy.length === 0) {
      setMessage('Todos os funcionários desse jogo já estão nesta escala.');
      setTimeout(() => setMessage(null), 3500);
      return;
    }
    const ok = window.confirm(
      `Copiar ${toCopy.length} funcionário(s) da escala de ${source?.mandante} x ${source?.visitante} para ${selectedMatch.mandante} x ${selectedMatch.visitante}?` +
        (assignedCpfs.size > 0 ? '\n\nQuem já está escalado neste jogo continua como está.' : '')
    );
    if (!ok) return;
    const stamp = Date.now();
    onAddAssignments(
      toCopy.map((a, i) => ({
        id: `ASG_${stamp}_${i}_${Math.random().toString(36).slice(2, 6)}`,
        matchId: selectedMatch.id,
        cpf: a.cpf,
        operacaoCodigo: a.operacaoCodigo,
        funcao: a.funcao || '',
      }))
    );
    setMessage(`${toCopy.length} funcionário(s) copiado(s) para a escala deste jogo.`);
    setTimeout(() => setMessage(null), 3500);
  };

  const handleExportXLSX = () => {
    generateEmployeeAssignmentsXLSX(matchAssignments, employees, operations, selectedMatch);
  };

  return (
    <div id="assignments-view-root" className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header Banner */}
      <div id="assignments-title-card" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-[#8A0029]" />
            Escala de Funcionários por Operação
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Selecione o funcionário e a operação para montar a escala do jogo
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

          {sourceGames.length > 0 && (
            <div className="inline-flex flex-wrap items-center gap-2 sm:ml-3 mt-2 sm:mt-0 align-middle">
              <span className="text-xs font-bold text-slate-600">Copiar escala de:</span>
              <select
                value={copySourceId}
                onChange={(e) => setCopySourceId(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-[#8A0029] focus:outline-none max-w-[280px]"
              >
                {sourceGames.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.mandante} x {m.visitante} ({m.data ? m.data.split('-').reverse().join('/') : ''}) ·{' '}
                    {assignments.filter((a) => a.matchId === m.id).length} func.
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleCopyEscala}
                className="inline-flex items-center gap-1.5 font-bold text-xs px-3.5 py-2 rounded-xl bg-[#8A0029] hover:bg-[#6A001F] text-white shadow-sm cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                Copiar para este jogo
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Assignment Add Form - Only Employee and Operation */}
      <form onSubmit={handleAddAssignment} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <PlusCircle className="w-4 h-4 text-[#8A0029]" />
          Adicionar Funcionário na Escala do Jogo
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Select Employee */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-600">
                Funcionário Cadastrado:
              </label>
              <span className="text-[11px] font-semibold text-slate-500">
                {availableEmployees.length} disponível(is) de {employees.length}
              </span>
            </div>
            <select
              value={selectedCpf}
              onChange={(e) => handleEmployeeSelect(e.target.value)}
              disabled={availableEmployees.length === 0}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-[#8A0029] focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
            >
              {availableEmployees.length === 0 ? (
                <option value="">
                  {employees.length === 0
                    ? 'Nenhum funcionário cadastrado'
                    : 'Todos os funcionários já foram escalados para este jogo'}
                </option>
              ) : (
                availableEmployees.map((e) => (
                  <option key={e.cpf} value={e.cpf}>
                    {e.nome} - CPF: {e.cpf} ({e.empresa})
                  </option>
                ))
              )}
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
              {sortedOperations.length === 0 && <option value="">Nenhuma operação cadastrada</option>}
              {sortedOperations.map((o) => (
                <option key={o.codigo} value={o.codigo}>
                  {o.operacao} ({o.codigo})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={availableEmployees.length === 0 || operations.length === 0}
            className="flex items-center justify-center gap-2 bg-[#8A0029] hover:bg-[#6A001F] text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm shrink-0 disabled:bg-slate-300 disabled:cursor-not-allowed"
          >
            <PlusCircle className="w-4 h-4" />
            Escalar Funcionário
          </button>

          {message && (
            <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-semibold px-4 py-2.5 shadow-sm transition-all">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{message}</span>
            </div>
          )}
        </div>
      </form>

      {/* Datalist for fast function selection in table */}
      <datalist id="funcoes-list">
        <option value="Gestor" />
        <option value="Atendente" />
        <option value="Supervisor" />
        <option value="Caixa" />
        <option value="Apoio" />
        <option value="Orientador" />
        <option value="Fiscal" />
        <option value="Líder" />
        <option value="Coordenador" />
      </datalist>

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
          <table className="w-full text-left border-collapse m-hide-1 m-hide-3 m-hide-4 m-hide-5 m-hide-6 m-hide-8">
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
                  const currentOpExists = operations.some((o) => o.codigo === asg.operacaoCodigo);

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
                      <td className="py-2.5 px-4">
                        <div className="relative inline-block w-full min-w-[170px] max-w-[240px]">
                          <select
                            value={asg.operacaoCodigo}
                            onChange={(e) => handleOperationChange(asg, e.target.value)}
                            className="w-full appearance-none bg-rose-50 hover:bg-rose-100/90 text-[#8A0029] font-bold border border-rose-200 hover:border-rose-300 rounded-lg pl-2.5 pr-7 py-1.5 text-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#8A0029] transition-all"
                            title="Clique para mudar a operação deste funcionário"
                          >
                            {!currentOpExists && (
                              <option value={asg.operacaoCodigo} className="text-slate-900 font-medium bg-white">
                                {asg.operacaoCodigo} (Não cadastrada)
                              </option>
                            )}
                            {sortedOperations.map((o) => (
                              <option key={o.codigo} value={o.codigo} className="text-slate-900 font-medium bg-white">
                                {o.operacao} ({o.codigo})
                              </option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-[#8A0029]">
                            <ChevronDown className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-4">
                        <input
                          type="text"
                          list="funcoes-list"
                          placeholder="Vazio"
                          value={asg.funcao || ''}
                          onChange={(e) => {
                            if (onUpdateAssignment) {
                              onUpdateAssignment({ ...asg, funcao: e.target.value });
                            }
                          }}
                          className={`w-32 border rounded-lg px-2.5 py-1 text-xs focus:ring-2 focus:ring-[#006633] focus:outline-none transition-all ${
                            asg.funcao
                              ? 'bg-emerald-50 text-emerald-950 border-emerald-300 font-bold'
                              : 'bg-slate-50 text-slate-400 border-slate-200'
                          }`}
                        />
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
