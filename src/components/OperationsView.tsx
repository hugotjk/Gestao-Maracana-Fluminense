import React, { useState } from 'react';
import { SlidersHorizontal, PlusCircle, Search, Edit2, Trash2, CheckCircle2, Target, Hash } from 'lucide-react';
import { Operation } from '../types';
import { generateNextOperationCode } from '../lib/storage';

interface OperationsViewProps {
  operations: Operation[];
  onAddOperation: (op: Operation) => void;
  onUpdateOperation: (op: Operation) => void;
  onDeleteOperation: (codigo: string) => void;
}

export const OperationsView: React.FC<OperationsViewProps> = ({
  operations,
  onAddOperation,
  onUpdateOperation,
  onDeleteOperation,
}) => {
  const [editingOp, setEditingOp] = useState<Operation | null>(null);

  // Form State
  const [nomeOperacao, setNomeOperacao] = useState('');
  const [metaValue, setMetaValue] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const resetForm = () => {
    setNomeOperacao('');
    setMetaValue('');
    setEditingOp(null);
  };

  const handleStartEdit = (op: Operation) => {
    setEditingOp(op);
    setNomeOperacao(op.operacao);
    setMetaValue(String(op.meta));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!nomeOperacao.trim()) {
      setFeedback('Informe o Nome da Operação/Setor.');
      setTimeout(() => setFeedback(null), 3000);
      return;
    }

    const numericMeta = parseFloat(metaValue.replace(',', '.')) || 0;

    if (editingOp) {
      const updated: Operation = {
        ...editingOp,
        operacao: nomeOperacao.trim(),
        meta: numericMeta,
      };
      onUpdateOperation(updated);
      setFeedback('Operação atualizada com sucesso!');
    } else {
      const nextCode = generateNextOperationCode(operations);
      const newOp: Operation = {
        codigo: nextCode,
        operacao: nomeOperacao.trim(),
        meta: numericMeta,
      };
      onAddOperation(newOp);
      setFeedback('Nova operação cadastrada com código ' + nextCode);
    }

    resetForm();
    setTimeout(() => setFeedback(null), 3500);
  };

  const filteredOperations = operations.filter((op) => {
    const q = searchTerm.toLowerCase();
    return op.codigo.toLowerCase().includes(q) || op.operacao.toLowerCase().includes(q);
  });

  return (
    <div id="operations-view-root" className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Title Card */}
      <div id="operations-title-card" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <SlidersHorizontal className="w-6 h-6 text-[#8A0029]" />
            Cadastro de Operações e Setores
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Cadastre os setores onde vai operar e estipule a meta financeira de vendas
          </p>
        </div>
      </div>

      {feedback && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl flex items-center gap-2 text-xs font-semibold">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            {editingOp ? `Editando Operação (${editingOp.codigo})` : 'Cadastrar Nova Operação'}
          </h3>
          {editingOp && (
            <button
              type="button"
              onClick={resetForm}
              className="text-xs font-medium text-slate-500 hover:text-slate-800 underline"
            >
              Cancelar Edição
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nome Operacao */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nome da Operação / Setor: *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Setor Sul, Leste Inferior, Camarotes"
              value={nomeOperacao}
              onChange={(e) => setNomeOperacao(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-[#8A0029] focus:outline-none"
            />
          </div>

          {/* Meta */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Meta Financeira em Reais (R$):
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-semibold text-xs">
                R$
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={metaValue}
                onChange={(e) => setMetaValue(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#8A0029] focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="flex items-center gap-2 bg-[#8A0029] hover:bg-[#6A001F] text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{editingOp ? 'Salvar Operação' : 'Cadastrar Operação'}</span>
          </button>
        </div>
      </form>

      {/* Operations Table */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Operações Cadastradas ({operations.length})
            </h3>
            <p className="text-xs text-slate-500">
              Sincronizadas com a aba "Operacoes" na planilha oficial (código ex: O000000001)
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por nome ou código..."
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
                <th className="py-3 px-4">Código Unico</th>
                <th className="py-3 px-4">Nome da Operação</th>
                <th className="py-3 px-4">Meta Estipulada (R$)</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredOperations.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400 text-xs">
                    Nenhuma operação cadastrada.
                  </td>
                </tr>
              ) : (
                filteredOperations.map((op) => (
                  <tr key={op.codigo} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-700">
                      {op.codigo}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {op.operacao}
                    </td>
                    <td className="py-3 px-4 font-extrabold text-[#006633]">
                      R$ {op.meta.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        onClick={() => handleStartEdit(op)}
                        className="text-slate-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteOperation(op.codigo)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Excluir"
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
