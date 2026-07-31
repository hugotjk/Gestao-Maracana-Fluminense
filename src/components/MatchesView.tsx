import React, { useState } from 'react';
import { Calendar, PlusCircle, Search, Edit2, Trash2, CheckCircle2, Trophy, Clock, Check } from 'lucide-react';
import { Match } from '../types';

interface MatchesViewProps {
  matches: Match[];
  activeMatchId: string;
  onAddMatch: (match: Match) => void;
  onUpdateMatch: (match: Match) => void;
  onDeleteMatch: (id: string) => void;
  onSetActiveMatch: (id: string) => void;
}

export const MatchesView: React.FC<MatchesViewProps> = ({
  matches,
  activeMatchId,
  onAddMatch,
  onUpdateMatch,
  onDeleteMatch,
  onSetActiveMatch,
}) => {
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);

  // Form State
  const [data, setData] = useState('');
  const [horario, setHorario] = useState('16:00');
  const [mandante, setMandante] = useState('Fluminense');
  const [visitante, setVisitante] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const resetForm = () => {
    setData('');
    setHorario('16:00');
    setMandante('Fluminense');
    setVisitante('');
    setEditingMatch(null);
  };

  const handleStartEdit = (m: Match) => {
    setEditingMatch(m);
    setData(m.data);
    setHorario(m.horario);
    setMandante(m.mandante);
    setVisitante(m.visitante);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!data || !mandante.trim() || !visitante.trim()) {
      setFeedback('Preencha a Data, Mandante e Visitante do jogo.');
      setTimeout(() => setFeedback(null), 3000);
      return;
    }

    if (editingMatch) {
      const updated: Match = {
        ...editingMatch,
        data,
        horario,
        mandante: mandante.trim(),
        visitante: visitante.trim(),
      };
      onUpdateMatch(updated);
      setFeedback('Dados do jogo atualizados!');
    } else {
      const newMatch: Match = {
        id: `M_${Date.now()}`,
        data,
        horario,
        mandante: mandante.trim(),
        visitante: visitante.trim(),
      };
      onAddMatch(newMatch);
      setFeedback('Novo jogo cadastrado com sucesso!');
    }

    resetForm();
    setTimeout(() => setFeedback(null), 3500);
  };

  const filteredMatches = matches
    .filter((m) => {
      const q = searchTerm.toLowerCase();
      return (
        m.mandante.toLowerCase().includes(q) ||
        m.visitante.toLowerCase().includes(q) ||
        m.data.includes(q)
      );
    })
    .sort((a, b) => (b.data || '').localeCompare(a.data || ''));

  return (
    <div id="matches-view-root" className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Title Card */}
      <div id="matches-title-card" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-[#006633]" />
            Cadastro de Jogos do Fluminense
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Cadastre a data, horário, mandante e visitante dos jogos operados no estádio
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
            {editingMatch ? 'Editando Jogo' : 'Cadastrar Novo Jogo'}
          </h3>
          {editingMatch && (
            <button
              type="button"
              onClick={resetForm}
              className="text-xs font-medium text-slate-500 hover:text-slate-800 underline"
            >
              Cancelar Edição
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Data */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Data do Jogo: *
            </label>
            <input
              type="date"
              required
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-[#006633] focus:outline-none"
            />
          </div>

          {/* Horario */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Horário do Jogo:
            </label>
            <input
              type="time"
              value={horario}
              onChange={(e) => setHorario(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-[#006633] focus:outline-none"
            />
          </div>

          {/* Time Mandante */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Time Mandante: *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Fluminense"
              value={mandante}
              onChange={(e) => setMandante(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-[#006633] focus:outline-none"
            />
          </div>

          {/* Time Visitante */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Time Visitante: *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Flamengo, Botafogo, Vasco"
              value={visitante}
              onChange={(e) => setVisitante(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-[#006633] focus:outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="flex items-center gap-2 bg-[#006633] hover:bg-emerald-800 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{editingMatch ? 'Salvar Jogo' : 'Cadastrar Jogo'}</span>
          </button>
        </div>
      </form>

      {/* Matches Table */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Jogos Cadastrados ({matches.length})
            </h3>
            <p className="text-xs text-slate-500">
              Preenche automaticamente a aba "Jogos" na planilha do Google
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por time ou data..."
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
                <th className="py-3 px-4">Jogo Ativo</th>
                <th className="py-3 px-4">Confronto</th>
                <th className="py-3 px-4">Data</th>
                <th className="py-3 px-4">Horário</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredMatches.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                    Nenhum jogo cadastrado.
                  </td>
                </tr>
              ) : (
                filteredMatches.map((m) => {
                  const isActive = m.id === activeMatchId;

                  return (
                    <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#006633] text-white">
                            <Check className="w-3 h-3" /> Ativo
                          </span>
                        ) : (
                          <button
                            onClick={() => onSetActiveMatch(m.id)}
                            className="text-xs font-medium text-slate-500 hover:text-[#8A0029] bg-slate-100 hover:bg-rose-50 px-2.5 py-1 rounded-full border border-slate-200 transition-colors cursor-pointer"
                          >
                            Definir Ativo
                          </button>
                        )}
                      </td>
                      <td className="py-3 px-4 font-extrabold text-slate-900">
                        {m.mandante} <span className="text-rose-800 font-normal">x</span> {m.visitante}
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {m.data}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {m.horario}
                      </td>
                      <td className="py-3 px-4 text-right space-x-1">
                        <button
                          onClick={() => handleStartEdit(m)}
                          className="text-slate-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteMatch(m.id)}
                          className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Excluir"
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
