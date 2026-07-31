import React, { useState } from 'react';
import { DollarSign, Save, Trash2, Edit2, Calendar, CheckCircle2, Search, PlusCircle, Trophy } from 'lucide-react';
import { Match, Operation, Sale } from '../types';
import { generateNextSaleCode } from '../lib/storage';

interface SalesViewProps {
  sales: Sale[];
  operations: Operation[];
  matches: Match[];
  activeMatchId: string;
  onSaveSales: (newSales: Sale[]) => void;
  onDeleteSale: (codigo: string) => void;
}

export const SalesView: React.FC<SalesViewProps> = ({
  sales,
  operations,
  matches,
  activeMatchId,
  onSaveSales,
  onDeleteSale,
}) => {
  const [selectedMatchId, setSelectedMatchId] = useState<string>(activeMatchId || matches[0]?.id || '');
  const selectedMatch = matches.find((m) => m.id === selectedMatchId) || matches[0];

  // Local state for inputting values per operation for the selected match
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Pre-fill inputs if sales already exist for this match
  React.useEffect(() => {
    if (!selectedMatch) return;
    const initialValues: Record<string, string> = {};
    operations.forEach((op) => {
      const existing = sales.find(
        (s) =>
          s.mandante === selectedMatch.mandante &&
          s.visitante === selectedMatch.visitante &&
          s.data === selectedMatch.data &&
          s.operacao.trim().toLowerCase() === op.operacao.trim().toLowerCase()
      );
      if (existing) {
        initialValues[op.codigo] = String(existing.venda);
      }
    });
    setInputs(initialValues);
  }, [selectedMatchId, sales, operations, selectedMatch]);

  const handleInputChange = (opCodigo: string, val: string) => {
    setInputs((prev) => ({ ...prev, [opCodigo]: val }));
  };

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatch) return;

    let currentSalesList = [...sales];
    let addedCount = 0;

    operations.forEach((op) => {
      const rawVal = inputs[op.codigo];
      if (rawVal !== undefined && rawVal !== '') {
        const numericVal = parseFloat(rawVal.replace(',', '.')) || 0;

        // Check if sale record exists for this match + op
        const existingIdx = currentSalesList.findIndex(
          (s) =>
            s.mandante === selectedMatch.mandante &&
            s.visitante === selectedMatch.visitante &&
            s.data === selectedMatch.data &&
            s.operacao.trim().toLowerCase() === op.operacao.trim().toLowerCase()
        );

        if (existingIdx >= 0) {
          // Update existing
          currentSalesList[existingIdx] = {
            ...currentSalesList[existingIdx],
            venda: numericVal,
          };
        } else if (numericVal >= 0) {
          // Create new
          const nextCode = generateNextSaleCode(currentSalesList);
          const newSale: Sale = {
            codigo: nextCode,
            data: selectedMatch.data,
            mandante: selectedMatch.mandante,
            visitante: selectedMatch.visitante,
            operacao: op.operacao,
            venda: numericVal,
            matchId: selectedMatch.id,
          };
          currentSalesList.push(newSale);
          addedCount++;
        }
      }
    });

    onSaveSales(currentSalesList);
    setSuccessMessage('Valores de vendas registrados com sucesso!');
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  // Filter existing sales for bottom table
  const filteredSalesTable = sales.filter((s) => {
    const query = searchTerm.toLowerCase();
    return (
      s.codigo.toLowerCase().includes(query) ||
      s.operacao.toLowerCase().includes(query) ||
      s.mandante.toLowerCase().includes(query) ||
      s.visitante.toLowerCase().includes(query) ||
      s.data.includes(query)
    );
  });

  return (
    <div id="sales-view-root" className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Title Banner */}
      <div id="sales-title-card" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-[#006633]" />
            Lançamento de Vendas por Operação
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Informe o valor faturado em cada setor/operação para o jogo do dia
          </p>
        </div>

        {/* Match Select Box */}
        <div id="sales-match-selector" className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center gap-3">
          <Trophy className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <div>
            <label htmlFor="sales-match-select" className="text-xs font-bold text-slate-500 block uppercase">
              Selecione o Jogo Operado:
            </label>
            <select
              id="sales-match-select"
              value={selectedMatchId}
              onChange={(e) => setSelectedMatchId(e.target.value)}
              className="bg-white border border-slate-300 font-bold text-slate-800 text-xs sm:text-sm rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-[#006633] focus:outline-none cursor-pointer mt-0.5"
            >
              {matches.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.mandante} vs {m.visitante} ({m.data})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {successMessage && (
        <div id="sales-success-alert" className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl flex items-center gap-2 text-sm font-semibold animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Main Form for entering sales values */}
      <form id="sales-entry-form" onSubmit={handleSaveAll} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div id="match-details-header" className="bg-[#7A0022]/5 p-4 rounded-xl border border-[#7A0022]/15 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-[#8A0029] uppercase tracking-wider block">
              Dados do Confronto
            </span>
            <div className="text-lg font-extrabold text-slate-900 mt-0.5">
              {selectedMatch ? `${selectedMatch.mandante} x ${selectedMatch.visitante}` : 'Selecione um jogo'}
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
            <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
              <Calendar className="w-4 h-4 text-slate-400" />
              Data: <strong>{selectedMatch?.data || '-'}</strong>
            </span>
            <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
              Horário: <strong>{selectedMatch?.horario || '-'}</strong>
            </span>
          </div>
        </div>

        <div id="operation-sales-inputs-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {operations.map((op) => (
            <div
              key={op.codigo}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-emerald-300 transition-all shadow-2xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-400 bg-slate-200/80 px-2 py-0.5 rounded">
                    {op.codigo}
                  </span>
                  <span className="text-xs text-slate-500">
                    Meta: R$ {op.meta.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <label className="block text-sm font-bold text-slate-800 mt-2">
                  {op.operacao}
                </label>
              </div>

              <div className="mt-3 relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 font-semibold text-sm">
                  R$
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={inputs[op.codigo] || ''}
                  onChange={(e) => handleInputChange(op.codigo, e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-[#006633] focus:border-transparent focus:outline-none"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button
            type="submit"
            className="flex items-center gap-2 bg-[#006633] hover:bg-emerald-800 text-white font-bold px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all text-sm cursor-pointer"
          >
            <Save className="w-5 h-5" />
            Salvar Lançamento de Vendas
          </button>
        </div>
      </form>

      {/* Sheet "Venda" History Table */}
      <div id="sales-history-card" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Registros da Aba "Venda" na Planilha
            </h3>
            <p className="text-xs text-slate-500">
              Lista com código único (ex: V000000001), data, mandante, visitante, operação e valor de venda
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por setor ou código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006633]"
            />
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/80 text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Código</th>
                <th className="py-3 px-4">Data</th>
                <th className="py-3 px-4">Mandante</th>
                <th className="py-3 px-4">Visitante</th>
                <th className="py-3 px-4">Operação</th>
                <th className="py-3 px-4">Valor Venda (R$)</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredSalesTable.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                    Nenhum registro de venda encontrado.
                  </td>
                </tr>
              ) : (
                filteredSalesTable.map((sale) => (
                  <tr key={sale.codigo} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-700 text-xs">
                      {sale.codigo}
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-xs">
                      {sale.data}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {sale.mandante}
                    </td>
                    <td className="py-3 px-4 text-slate-800">
                      {sale.visitante}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {sale.operacao}
                    </td>
                    <td className="py-3 px-4 font-extrabold text-emerald-800">
                      R$ {sale.venda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onDeleteSale(sale.codigo)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Excluir Registro"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
