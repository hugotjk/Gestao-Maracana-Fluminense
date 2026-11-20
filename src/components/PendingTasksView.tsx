import React, { useState, useMemo } from 'react';
import {
  CheckSquare,
  Square,
  PlusCircle,
  Trash2,
  ListChecks,
  CheckCircle2,
  Clock,
  Edit2,
  Save,
  X,
  Repeat,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { Match, PendingTask } from '../types';

interface PendingTasksViewProps {
  matches: Match[];
  activeMatchId: string;
  onSelectActiveMatch: (id: string) => void;
  pendingTasks: PendingTask[];
  onAddPendingTask: (task: PendingTask) => void;
  onUpdatePendingTask: (task: PendingTask) => void;
  onDeletePendingTask: (id: string) => void;
}

const byTitle = (a: PendingTask, b: PendingTask) =>
  (a.titulo || '').localeCompare(b.titulo || '', 'pt-BR', { sensitivity: 'base' });

const today = () => new Date().toISOString().split('T')[0];
const formatDate = (iso?: string) => (iso ? iso.split('-').reverse().join('/') : '');

export const PendingTasksView: React.FC<PendingTasksViewProps> = ({
  matches,
  activeMatchId,
  pendingTasks,
  onAddPendingTask,
  onUpdatePendingTask,
  onDeletePendingTask,
}) => {
  const [newTitle, setNewTitle] = useState('');
  const [newObs, setNewObs] = useState('');
  const [newRecorrente, setNewRecorrente] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editObs, setEditObs] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [showDone, setShowDone] = useState(false);

  const activeMatch = matches.find((m) => m.id === activeMatchId);
  const matchName = (id?: string) => {
    const m = matches.find((x) => x.id === id);
    return m ? `${m.mandante} x ${m.visitante}` : '';
  };

  const { recorrentes, abertas, concluidas } = useMemo(() => {
    const recorrentes = pendingTasks.filter((t) => t.recorrente).sort(byTitle);
    const abertas = pendingTasks.filter((t) => !t.recorrente && !t.concluida).sort(byTitle);
    const concluidas = pendingTasks
      .filter((t) => !t.recorrente && t.concluida)
      .sort((a, b) => (b.dataConclusao || '').localeCompare(a.dataConclusao || '') || byTitle(a, b));
    return { recorrentes, abertas, concluidas };
  }, [pendingTasks]);

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(''), 3000);
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddPendingTask({
      id: `TASK_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      matchId: activeMatchId || '',
      titulo: newTitle.trim(),
      concluida: false,
      observacao: newObs.trim() || undefined,
      dataCriacao: today(),
      recorrente: newRecorrente,
      jogosConcluidos: [],
    });
    setNewTitle('');
    setNewObs('');
    showFeedback(newRecorrente ? 'Item adicionado ao checklist de todo jogo!' : 'Pendência adicionada!');
  };

  const isDone = (t: PendingTask) =>
    t.recorrente ? (t.jogosConcluidos || []).includes(activeMatchId) : t.concluida;

  const handleToggleTask = (task: PendingTask) => {
    if (task.recorrente) {
      if (!activeMatchId) {
        alert('Selecione um jogo no topo para marcar o checklist do jogo.');
        return;
      }
      const set = new Set(task.jogosConcluidos || []);
      if (set.has(activeMatchId)) set.delete(activeMatchId);
      else set.add(activeMatchId);
      onUpdatePendingTask({ ...task, jogosConcluidos: Array.from(set) });
      return;
    }
    const concluida = !task.concluida;
    onUpdatePendingTask({
      ...task,
      concluida,
      jogoConclusao: concluida ? activeMatchId || '' : '',
      dataConclusao: concluida ? today() : '',
    });
    showFeedback(concluida ? 'Pendência resolvida!' : 'Pendência reaberta.');
  };

  const handleStartEditing = (task: PendingTask) => {
    setEditingTaskId(task.id);
    setEditTitle(task.titulo);
    setEditObs(task.observacao || '');
  };

  const handleSaveEdit = (task: PendingTask) => {
    if (!editTitle.trim()) return;
    onUpdatePendingTask({ ...task, titulo: editTitle.trim(), observacao: editObs.trim() || undefined });
    setEditingTaskId(null);
    showFeedback('Pendência atualizada!');
  };

  const toggleRecorrente = (task: PendingTask) => {
    onUpdatePendingTask({ ...task, recorrente: !task.recorrente, jogosConcluidos: task.jogosConcluidos || [] });
    showFeedback(task.recorrente ? 'Agora é uma pendência normal.' : 'Agora repete em todo jogo.');
  };

  const renderTask = (task: PendingTask, extra?: React.ReactNode) => {
    const done = isDone(task);
    if (editingTaskId === task.id) {
      return (
        <div key={task.id} className="p-3.5 bg-white flex flex-col sm:flex-row gap-2 items-center">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="flex-1 w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8A0029]"
          />
          <input
            type="text"
            placeholder="Observação"
            value={editObs}
            onChange={(e) => setEditObs(e.target.value)}
            className="flex-1 w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8A0029]"
          />
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={() => handleSaveEdit(task)} className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700" title="Salvar">
              <Save className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setEditingTaskId(null)} className="p-1.5 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300" title="Cancelar">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      );
    }
    return (
      <div key={task.id} className="p-3.5 bg-white hover:bg-slate-50/80 transition-all flex items-center justify-between gap-3 group">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <button
            onClick={() => handleToggleTask(task)}
            className="mt-0.5 shrink-0 cursor-pointer"
            title={done ? 'Desmarcar' : 'Marcar como feita'}
          >
            {done ? <CheckSquare className="w-5 h-5 text-emerald-600" /> : <Square className="w-5 h-5 text-slate-400 hover:text-[#8A0029]" />}
          </button>
          <div className="min-w-0">
            <p className={`text-xs sm:text-sm break-words leading-snug ${done ? 'text-slate-500 line-through font-medium' : 'text-slate-800 font-semibold'}`}>
              {task.titulo}
            </p>
            {task.observacao && <p className={`text-xs mt-0.5 break-words ${done ? 'text-slate-400 line-through' : 'text-slate-500'}`}>{task.observacao}</p>}
            {extra}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => toggleRecorrente(task)}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${task.recorrente ? 'text-[#8A0029] bg-rose-50' : 'text-slate-300 hover:text-slate-600 hover:bg-slate-100'}`}
            title={task.recorrente ? 'Repete em todo jogo (clique para virar pendência normal)' : 'Fazer repetir em todo jogo'}
          >
            <Repeat className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => handleStartEditing(task)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer" title="Editar">
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              if (confirm(`Deseja excluir a pendência "${task.titulo}"?`)) {
                onDeletePendingTask(task.id);
                showFeedback('Pendência excluída.');
              }
            }}
            className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
            title="Excluir"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  };

  const recorrentesFeitas = recorrentes.filter(isDone).length;

  return (
    <div id="pending-tasks-view-container" className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Título */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <ListChecks className="w-6 h-6 text-[#8A0029]" />
          Pendências e Checklist
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Pendências ficam na lista até serem resolvidas, em qualquer jogo. Itens marcados com{' '}
          <Repeat className="w-3 h-3 inline text-[#8A0029]" /> fazem parte do checklist de todo jogo: são marcados por jogo e
          voltam a ficar abertos no jogo seguinte.
        </p>
      </div>

      {/* Nova pendência */}
      <form onSubmit={handleCreateTask} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <PlusCircle className="w-4 h-4 text-[#8A0029]" />
          Nova pendência
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Título <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Verificar pontos de vendas de copos nos setores"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#8A0029] focus:bg-white focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Observação (opcional)</label>
            <input
              type="text"
              placeholder="Ex: Falar com supervisor do setor Sul"
              value={newObs}
              onChange={(e) => setNewObs(e.target.value)}
              className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#8A0029] focus:bg-white focus:outline-none"
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="submit"
            disabled={!newTitle.trim()}
            className="flex items-center gap-2 bg-[#8A0029] hover:bg-[#6A001F] text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-sm disabled:opacity-50 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            Adicionar
          </button>
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
            <input type="checkbox" checked={newRecorrente} onChange={(e) => setNewRecorrente(e.target.checked)} className="w-4 h-4 accent-[#8A0029]" />
            <Repeat className="w-3.5 h-3.5 text-[#8A0029]" />
            Repetir em todo jogo (checklist)
          </label>
          {feedbackMsg && (
            <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> {feedbackMsg}
            </span>
          )}
        </div>
      </form>

      {/* Checklist de todo jogo */}
      {recorrentes.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Repeat className="w-4 h-4 text-[#8A0029]" />
              Checklist do jogo ({recorrentesFeitas} de {recorrentes.length})
            </h3>
            <span className="text-xs font-semibold text-slate-500">
              {activeMatch ? `${activeMatch.mandante} x ${activeMatch.visitante} · ${formatDate(activeMatch.data)}` : 'Selecione um jogo no topo'}
            </span>
          </div>
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
            {[...recorrentes].sort((a, b) => Number(isDone(a)) - Number(isDone(b)) || byTitle(a, b)).map((t) => renderTask(t))}
          </div>
        </div>
      )}

      {/* Pendências abertas */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-600" />
          Pendências abertas ({abertas.length})
        </h3>
        {abertas.length === 0 ? (
          <p className="text-xs text-emerald-700 bg-emerald-50/60 border border-emerald-200 p-3 rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            Nenhuma pendência aberta.
          </p>
        ) : (
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
            {abertas.map((t) =>
              renderTask(
                t,
                t.dataCriacao ? (
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Criada em {formatDate(t.dataCriacao)}
                    {matchName(t.matchId) ? ` · jogo ${matchName(t.matchId)}` : ''}
                  </p>
                ) : null
              )
            )}
          </div>
        )}
      </div>

      {/* Resolvidas */}
      {concluidas.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <button
            onClick={() => setShowDone(!showDone)}
            className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 cursor-pointer"
          >
            {showDone ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Resolvidas ({concluidas.length})
          </button>
          {showDone && (
            <div className="divide-y divide-slate-100 border border-emerald-100 rounded-xl overflow-hidden">
              {concluidas.map((t) =>
                renderTask(
                  t,
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Resolvida em {formatDate(t.dataConclusao) || '—'}
                    {matchName(t.jogoConclusao) ? ` · jogo ${matchName(t.jogoConclusao)}` : ''}
                  </p>
                )
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
