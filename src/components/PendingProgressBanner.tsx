import React from 'react';
import { ListChecks, ChevronRight, CheckCircle2 } from 'lucide-react';
import { PendingTask } from '../types';
import { tasksForMatch, isTaskDone } from '../lib/storage';

interface Props {
  pendingTasks: PendingTask[];
  activeMatchId: string;
  /** Quando informado, a barra vira um botão que leva para a aba Pendências. */
  onClick?: () => void;
}

/** Barra de progresso das pendências (abertas + checklist do jogo ativo), mostrada logo abaixo do cabeçalho em todas as abas. */
export const PendingProgressBanner: React.FC<Props> = ({ pendingTasks, activeMatchId, onClick }) => {
  const tasks = tasksForMatch(pendingTasks, activeMatchId);
  if (tasks.length === 0) return null;

  const isDone = (t: PendingTask) => isTaskDone(t, activeMatchId);
  const done = tasks.filter(isDone).length;
  const open = tasks.length - done;
  const pct = Math.round((done / tasks.length) * 100);
  const allDone = open === 0;
  const nextTitles = tasks
    .filter((t) => !isDone(t))
    .map((t) => t.titulo)
    .sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }))
    .slice(0, 3);

  const content = (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
        <span className="flex items-center gap-2 text-sm font-bold">
          {allDone ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          ) : (
            <ListChecks className="w-4 h-4 text-amber-300" />
          )}
          {allDone ? 'Nenhuma pendência aberta' : `${open} ${open === 1 ? 'pendência aberta' : 'pendências abertas'}`}
          {!allDone && nextTitles.length > 0 && (
            <span className="hidden md:inline text-xs font-medium text-slate-300 truncate max-w-[50vw]">
              — {nextTitles.join(' · ')}
              {open > nextTitles.length ? ' …' : ''}
            </span>
          )}
        </span>
        <span className="flex items-center gap-1 text-xs font-semibold text-slate-200 whitespace-nowrap">
          <span className="text-amber-300 font-bold text-sm">{done}</span> de <span className="font-bold text-sm">{tasks.length}</span>{' '}
          concluídas ({pct}%)
          {onClick && <ChevronRight className="w-4 h-4 text-slate-300" />}
        </span>
      </div>
      <div className="w-full bg-slate-800/80 h-2.5 rounded-full overflow-hidden border border-slate-700/60 mt-2">
        <div
          className="bg-gradient-to-r from-amber-400 to-emerald-400 h-full transition-all duration-500 rounded-full"
          style={{ width: `${pct}%` }}
        />
      </div>
    </>
  );

  const base = `block w-full text-left text-white px-5 py-3.5 rounded-2xl shadow-sm bg-gradient-to-r ${
    allDone ? 'from-slate-900 to-[#004d26]' : 'from-slate-900 to-[#5A0019]'
  }`;

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 pt-4">
      {onClick ? (
        <button
          type="button"
          onClick={onClick}
          title="Ver pendências"
          className={`${base} cursor-pointer hover:ring-2 hover:ring-amber-400/70 transition-all`}
        >
          {content}
        </button>
      ) : (
        <div className={base}>{content}</div>
      )}
    </div>
  );
};
