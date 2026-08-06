import React, { useState, useMemo } from 'react';
import {
  CheckSquare,
  Square,
  PlusCircle,
  Trash2,
  ListChecks,
  CheckCircle2,
  Clock,
  AlertCircle,
  Edit2,
  Save,
  X,
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

export const PendingTasksView: React.FC<PendingTasksViewProps> = ({
  matches,
  activeMatchId,
  onSelectActiveMatch,
  pendingTasks,
  onAddPendingTask,
  onUpdatePendingTask,
  onDeletePendingTask,
}) => {
  const targetMatchId = activeMatchId || matches[0]?.id || '';
  const [newTitle, setNewTitle] = useState<string>('');
  const [newObs, setNewObs] = useState<string>('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState<string>('');
  const [editObs, setEditObs] = useState<string>('');
  const [feedbackMsg, setFeedbackMsg] = useState<string>('');

  const currentMatch = useMemo(() => {
    return matches.find((m) => m.id === targetMatchId) || matches[0];
  }, [matches, targetMatchId]);

  // Filter tasks for the active match selected at top
  const matchTasks = useMemo(() => {
    if (!targetMatchId) return [];
    return pendingTasks.filter((t) => t.matchId === targetMatchId);
  }, [pendingTasks, targetMatchId]);

  // Sorting rule:
  // 1. Pending (nao feitas) sorted ALPHABETICALLY by title
  // 2. Completed (feitas) placed at bottom, also sorted ALPHABETICALLY by title
  const { uncompletedTasks, completedTasks } = useMemo(() => {
    const uncompleted = matchTasks
      .filter((t) => !t.concluida)
      .sort((a, b) => (a.titulo || '').localeCompare(b.titulo || '', 'pt-BR', { sensitivity: 'base' }));

    const completed = matchTasks
      .filter((t) => t.concluida)
      .sort((a, b) => (a.titulo || '').localeCompare(b.titulo || '', 'pt-BR', { sensitivity: 'base' }));

    return { uncompletedTasks: uncompleted, completedTasks: completed };
  }, [matchTasks]);

  const totalCount = matchTasks.length;
  const completedCount = completedTasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => {
      setFeedbackMsg('');
    }, 3000);
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    if (!targetMatchId) {
      alert('Por favor, selecione um jogo no topo da página para vincular a pendência.');
      return;
    }

    const newTask: PendingTask = {
      id: `TASK_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      matchId: targetMatchId,
      titulo: newTitle.trim(),
      concluida: false,
      observacao: newObs.trim() || undefined,
      dataCriacao: new Date().toISOString().split('T')[0],
    };

    onAddPendingTask(newTask);
    setNewTitle('');
    setNewObs('');
    showFeedback('Pendência adicionada com sucesso!');
  };

  const handleToggleTask = (task: PendingTask) => {
    const updated = { ...task, concluida: !task.concluida };
    onUpdatePendingTask(updated);
    showFeedback(updated.concluida ? 'Pendência concluída!' : 'Pendência marcada como não concluída.');
  };

  const handleStartEditing = (task: PendingTask) => {
    setEditingTaskId(task.id);
    setEditTitle(task.titulo);
    setEditObs(task.observacao || '');
  };

  const handleSaveEdit = (task: PendingTask) => {
    if (!editTitle.trim()) return;
    const updated: PendingTask = {
      ...task,
      titulo: editTitle.trim(),
      observacao: editObs.trim() || undefined,
    };
    onUpdatePendingTask(updated);
    setEditingTaskId(null);
    showFeedback('Pendência atualizada!');
  };

  return (
    <div id="pending-tasks-view-container" className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ListChecks className="w-6 h-6 text-[#8A0029]" />
            Pendências e Checklist
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Gerencie tarefas operacionais do jogo selecionado no topo com sincronização automática na aba{' '}
            <span className="font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">Pendencias</span> da planilha.
          </p>
        </div>
      </div>

      {/* Progress Stats Card */}
      {currentMatch && totalCount > 0 && (
        <div className="bg-gradient-to-r from-slate-900 to-[#5A0019] text-white p-5 rounded-2xl shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-200">Progresso das Pendências</span>
            <div className="text-xs font-semibold text-slate-200">
              <span className="text-amber-300 font-bold text-sm">{completedCount}</span> de{' '}
              <span className="font-bold text-sm">{totalCount}</span> concluídas ({progressPercent}%)
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-800/80 h-2.5 rounded-full overflow-hidden border border-slate-700/60">
            <div
              className="bg-gradient-to-r from-amber-400 to-emerald-400 h-full transition-all duration-500 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Form to Add New Task */}
      <form onSubmit={handleCreateTask} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <PlusCircle className="w-4 h-4 text-[#8A0029]" />
          Cadastrar Nova Pendência para o Jogo
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Título da Pendência <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Verificar pontos de vendas de copos nos setores"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#8A0029] focus:bg-white focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Observação / Detalhes (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: Falar com supervisor do setor Sul"
              value={newObs}
              onChange={(e) => setNewObs(e.target.value)}
              className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#8A0029] focus:bg-white focus:outline-none transition-all"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={!newTitle.trim() || matches.length === 0}
            className="flex items-center justify-center gap-2 bg-[#8A0029] hover:bg-[#6A001F] text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PlusCircle className="w-4 h-4" />
            Adicionar Pendência
          </button>

          {feedbackMsg && (
            <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-300 text-amber-900 rounded-xl text-xs font-semibold px-4 py-2 shadow-sm transition-all animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{feedbackMsg}</span>
            </div>
          )}
        </div>
      </form>

      {/* Pending Tasks List */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <ListChecks className="w-4 h-4 text-[#006633]" />
              Lista de Pendências ({totalCount})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Organizadas em ordem alfabética. Tarefas concluídas vão automaticamente para a parte inferior.
            </p>
          </div>
        </div>

        {totalCount === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <CheckSquare className="w-12 h-12 mx-auto text-slate-300" />
            <p className="text-sm font-medium text-slate-600">Nenhuma pendência cadastrada para este jogo.</p>
            <p className="text-xs text-slate-400">Utilize o formulário acima para criar a primeira pendência.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 1. UNCOMPLETED TASKS SECTION (NÃO CONCLUÍDAS - ORDEM ALFABÉTICA) */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-amber-900 bg-amber-50 border border-amber-200/80 px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                Pendentes ({uncompletedTasks.length}) — Ordem Alfabética
              </h4>

              {uncompletedTasks.length === 0 ? (
                <p className="text-xs italic text-emerald-700 bg-emerald-50/60 border border-emerald-200 p-3 rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  Todas as pendências deste jogo foram concluídas!
                </p>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  {uncompletedTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-3.5 bg-white hover:bg-slate-50/80 transition-all flex items-center justify-between gap-3 group"
                    >
                      {editingTaskId === task.id ? (
                        <div className="flex-1 flex flex-col sm:flex-row gap-2 items-center">
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8A0029]"
                          />
                          <input
                            type="text"
                            placeholder="Observação"
                            value={editObs}
                            onChange={(e) => setEditObs(e.target.value)}
                            className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8A0029]"
                          />
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => handleSaveEdit(task)}
                              className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all cursor-pointer"
                              title="Salvar"
                            >
                              <Save className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingTaskId(null)}
                              className="p-1.5 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-all cursor-pointer"
                              title="Cancelar"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <button
                              onClick={() => handleToggleTask(task)}
                              className="mt-0.5 text-slate-400 hover:text-[#8A0029] transition-colors cursor-pointer shrink-0"
                              title="Marcar como concluída"
                            >
                              <Square className="w-5 h-5 text-slate-400" />
                            </button>
                            <div className="min-w-0">
                              <p className="text-xs sm:text-sm font-semibold text-slate-800 break-words leading-snug">
                                {task.titulo}
                              </p>
                              {task.observacao && (
                                <p className="text-xs text-slate-500 mt-0.5 break-words">
                                  {task.observacao}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleStartEditing(task)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                              title="Editar pendência"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Deseja remover a pendência "${task.titulo}"?`)) {
                                  onDeletePendingTask(task.id);
                                  showFeedback('Pendência removida.');
                                }
                              }}
                              className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                              title="Excluir pendência"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 2. COMPLETED TASKS SECTION (CONCLUÍDAS - PARTE DE BAIXO DA LISTA - ORDEM ALFABÉTICA) */}
            {completedTasks.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-slate-200">
                <h4 className="text-xs font-bold text-emerald-900 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Concluídas ({completedTasks.length}) — Ordem Alfabética (Parte Inferior)
                </h4>

                <div className="divide-y divide-slate-100 border border-emerald-100 rounded-xl overflow-hidden bg-slate-50/40">
                  {completedTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-3.5 hover:bg-emerald-50/40 transition-all flex items-center justify-between gap-3 group"
                    >
                      {editingTaskId === task.id ? (
                        <div className="flex-1 flex flex-col sm:flex-row gap-2 items-center">
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8A0029]"
                          />
                          <input
                            type="text"
                            placeholder="Observação"
                            value={editObs}
                            onChange={(e) => setEditObs(e.target.value)}
                            className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8A0029]"
                          />
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => handleSaveEdit(task)}
                              className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all cursor-pointer"
                              title="Salvar"
                            >
                              <Save className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingTaskId(null)}
                              className="p-1.5 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-all cursor-pointer"
                              title="Cancelar"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <button
                              onClick={() => handleToggleTask(task)}
                              className="mt-0.5 text-emerald-600 hover:text-slate-400 transition-colors cursor-pointer shrink-0"
                              title="Desmarcar como concluída"
                            >
                              <CheckSquare className="w-5 h-5 text-emerald-600" />
                            </button>
                            <div className="min-w-0">
                              <p className="text-xs sm:text-sm font-medium text-slate-500 line-through break-words leading-snug">
                                {task.titulo}
                              </p>
                              {task.observacao && (
                                <p className="text-xs text-slate-400 line-through mt-0.5 break-words">
                                  {task.observacao}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleStartEditing(task)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                              title="Editar pendência"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Deseja remover a pendência "${task.titulo}"?`)) {
                                  onDeletePendingTask(task.id);
                                  showFeedback('Pendência removida.');
                                }
                              }}
                              className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                              title="Excluir pendência"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
