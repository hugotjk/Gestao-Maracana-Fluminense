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
  const selectedMatch = matches.find((m) => m.id === activeMatchId) || matches[0];

  // Local state for inputting values per operation for the selected match
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Pre-fill inputs whenever active match, sales or operations change
  React.useEffect(() => {
    if (!selectedMatch) return;
    const initialValues: Record<string, string> = {};
    operations.forEach((op) => {
      const existing = sales.find(
        (s) =>
          (s.matchId === selectedMatch.id ||
            (s.mandante === selectedMatch.mandante &&
              s.visitante === selectedMatch.visitante &&
              s.data === selectedMatch.data)) &&
          s.operacao.trim().toLowerCase() === op.operacao.trim().toLowerCase()
      );
      if (existing) {
        initialValues[op.codigo] = String(existing.venda);
      } else {
        initialValues[op.codigo] = '';
      }
    });
    setInputs(initialValues);
  }, [activeMatchId, sales, operations, selectedMatch]);

  const handleInputChange = (opCodigo: string, val: string) => {
    setInputs((prev) => ({ ...prev, [opCodigo]: val }));
  };

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatch) return;

    let currentSalesList = [...sales];

    operations.forEach((op) => {
      const rawVal = inputs[op.codigo];
      if (rawVal !== undefined && rawVal !== '') {
        const numericVal = parseFloat(rawVal.replace(',', '.')) || 0;

        // Check if sale record exists for this match + operation
        const existingIdx = currentSalesList.findIndex(
          (s) =>
            (s.matchId === selectedMatch.id ||
              (s.mandante === selectedMatch.mandante &&
                s.visitante === selectedMatch.visitante &&
                s.data === selectedMatch.data)) &&
            s.operacao.trim().toLowerCase() === op.operacao.trim().toLowerCase()
        );

        if (existingIdx >= 0) {
          // Replace/update existing
          currentSalesList[existingIdx] = {
            ...currentSalesList[existingIdx],
            venda: numericVal,
            matchId: selectedMatch.id,
          };
        } else {
          // Create new single entry for this match + op
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
        }
      }
    });

    onSaveSales(currentSalesList);
    setSuccessMessage(`Valores de vendas salvos para ${selectedMatch.mandante} x ${selectedMatch.visitante}!`);
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
      <div id="sales-title-card" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-[#006633]" />
            Lançamento de Vendas por Operação
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Informe o valor faturado em cada setor/operação para o jogo do dia
          </p>
        </div>
      </div>

      {successMessage && (
        <div id="sales-success-alert" className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl flex items-center gap-2 text-sm font-semibold animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Main Form for entering sales values */}
      <form id="sales-entry-form" onSubmit={handleSaveAll} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-5">
        <div id="operation-sales-inputs-grid" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {operations.map((op) => (
            <div
              key={op.codigo}
              className="p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-emerald-500 focus-within:border-emerald-500 transition-all shadow-2xs flex flex-col justify-between gap-1.5"
            >
              <label className="block text-xs font-extrabold text-slate-800 truncate" title={op.operacao}>
                {op.operacao}
              </label>

              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400 font-bold text-xs">
                  R$
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={inputs[op.codigo] || ''}
                  onChange={(e) => handleInputChange(op.codigo, e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-extrabold text-slate-900 focus:ring-2 focus:ring-[#006633] focus:border-transparent focus:outline-none"
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
