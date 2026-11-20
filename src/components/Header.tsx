import React from 'react';
import {
  LayoutDashboard,
  DollarSign,
  Users,
  UserPlus,
  SlidersHorizontal,
  Calendar,
  FileSpreadsheet,
  CheckCircle2,
  Trophy,
  ListChecks,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { useSyncStatus } from '../lib/sync';
import { ViewTab, Match } from '../types';

interface HeaderProps {
  currentTab: ViewTab;
  onSelectTab: (tab: ViewTab) => void;
  matches: Match[];
  activeMatchId: string;
  onSelectActiveMatch: (id: string) => void;
  isLoadingSheet?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  matches,
  activeMatchId,
  onSelectActiveMatch,
  isLoadingSheet,
}) => {
  const sync = useSyncStatus();
  const busy = isLoadingSheet || sync.state === 'pending' || sync.state === 'saving';
  const failed = sync.state === 'error' || sync.state === 'outdated';
  const syncTitle = isLoadingSheet ? 'Carregando dados da planilha…' : sync.message;
  const activeMatch = matches.find((m) => m.id === activeMatchId) || matches[0];

  return (
    <header id="main-app-header" className="bg-[#7A0022] text-white shadow-lg border-b-4 border-[#006633]">
      {/* Top Banner */}
      <div id="top-branding-bar" className="w-full px-4 sm:px-6 lg:px-8 pt-3 md:pt-4 pb-3 flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
        <div className="flex items-center justify-between gap-3">
        <div id="branding-logo-title" className="flex items-center space-x-3 min-w-0">
          <div id="badge-flu-crest" className="w-10 h-10 md:w-12 md:h-12 shrink-0 rounded-full bg-gradient-to-br from-[#006633] via-[#7A0022] to-amber-500 p-0.5 flex items-center justify-center shadow-md">
            <div id="inner-crest" className="w-full h-full rounded-full bg-[#7A0022] flex items-center justify-center text-amber-300 font-extrabold text-lg md:text-xl tracking-tighter border border-amber-400/40">
              FFC
            </div>
          </div>
          <div>
            <div id="app-title" className="flex items-center space-x-2">
              <h1 className="text-lg md:text-xl font-bold tracking-tight text-white flex items-center gap-1.5 whitespace-nowrap">
                Fluminense FC
                <span className="text-amber-300 font-medium text-sm bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                  Operações
                </span>
              </h1>
            </div>
            <p id="app-subtitle" className="hidden sm:block text-xs text-emerald-200">
              Gestão de Vendas, Setores, Escala de Equipes & Planilhas
            </p>
          </div>
        </div>

          {/* Situação da planilha (celular: a aba Planilha fica escondida na rolagem) */}
          <button
            type="button"
            onClick={() => onSelectTab('configuracoes')}
            title={syncTitle}
            className="md:hidden shrink-0 flex items-center gap-1 text-[11px] font-semibold bg-slate-900/50 px-2 py-1 rounded-lg"
          >
            {busy ? (
              <>
                <Loader2 className="w-3.5 h-3.5 text-amber-300 animate-spin" />
                <span className="text-amber-200">Salvando…</span>
              </>
            ) : failed ? (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-rose-300" />
                <span className="text-rose-200">Não salvo</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                <span className="text-emerald-200">Salvo</span>
              </>
            )}
          </button>
        </div>

        {/* Active Game Selector Selector */}
        <div id="active-game-selector-container" className="flex items-center gap-2 md:gap-3 w-full md:w-auto min-w-0 bg-[#5A0019] px-3 md:px-3.5 py-2 rounded-xl border border-rose-900/60 shadow-inner">
          <div id="game-icon-label" className="flex items-center shrink-0 text-xs font-semibold text-amber-300 uppercase tracking-wider whitespace-nowrap">
            <Trophy className="w-4 h-4 mr-1.5 text-amber-400" />
            <span className="hidden sm:inline">Jogo Ativo:</span>
            <span className="sm:hidden">Jogo:</span>
          </div>
          <select
            id="active-match-select"
            value={activeMatchId}
            onChange={(e) => onSelectActiveMatch(e.target.value)}
            className="flex-1 min-w-0 w-full md:w-auto bg-[#3D0010] text-white text-sm font-medium rounded-lg px-2.5 py-1.5 border border-rose-800/80 focus:ring-2 focus:ring-amber-400 focus:outline-none cursor-pointer"
          >
            {matches.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.mandante} vs {m.visitante} ({m.data ? new Date(m.data + 'T00:00:00').toLocaleDateString('pt-BR') : ''})
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div id="navigation-tabs-bar" className="bg-[#5c0019] border-t border-rose-900/40">
        <div id="tabs-scroll-wrapper" className="w-full px-4 sm:px-6 lg:px-8 flex items-center overflow-x-auto space-x-1 py-1.5 no-scrollbar">
          <button
            id="nav-tab-dashboard"
            onClick={() => onSelectTab('dashboard')}
            className={`flex items-center space-x-2 px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
              currentTab === 'dashboard'
                ? 'bg-[#006633] text-white shadow-sm ring-1 ring-emerald-400/30'
                : 'text-rose-100 hover:bg-[#7A0022] hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <button
            id="nav-tab-vendas"
            onClick={() => onSelectTab('vendas')}
            className={`flex items-center space-x-2 px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
              currentTab === 'vendas'
                ? 'bg-[#006633] text-white shadow-sm ring-1 ring-emerald-400/30'
                : 'text-rose-100 hover:bg-[#7A0022] hover:text-white'
            }`}
          >
            <DollarSign className="w-4 h-4 text-emerald-300" />
            <span>Vendas</span>
          </button>

          <button
            id="nav-tab-escala"
            onClick={() => onSelectTab('escala')}
            className={`flex items-center space-x-2 px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
              currentTab === 'escala'
                ? 'bg-[#006633] text-white shadow-sm ring-1 ring-emerald-400/30'
                : 'text-rose-100 hover:bg-[#7A0022] hover:text-white'
            }`}
          >
            <Users className="w-4 h-4 text-amber-300" />
            <span>Escala</span>
          </button>

          <button
            id="nav-tab-funcionarios"
            onClick={() => onSelectTab('funcionarios')}
            className={`flex items-center space-x-2 px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
              currentTab === 'funcionarios'
                ? 'bg-[#006633] text-white shadow-sm ring-1 ring-emerald-400/30'
                : 'text-rose-100 hover:bg-[#7A0022] hover:text-white'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Funcionários</span>
          </button>

          <button
            id="nav-tab-operacoes"
            onClick={() => onSelectTab('operacoes')}
            className={`flex items-center space-x-2 px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
              currentTab === 'operacoes'
                ? 'bg-[#006633] text-white shadow-sm ring-1 ring-emerald-400/30'
                : 'text-rose-100 hover:bg-[#7A0022] hover:text-white'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Operações</span>
          </button>

          <button
            id="nav-tab-jogos"
            onClick={() => onSelectTab('jogos')}
            className={`flex items-center space-x-2 px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
              currentTab === 'jogos'
                ? 'bg-[#006633] text-white shadow-sm ring-1 ring-emerald-400/30'
                : 'text-rose-100 hover:bg-[#7A0022] hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Jogos</span>
          </button>

          <button
            id="nav-tab-pendencias"
            onClick={() => onSelectTab('pendencias')}
            className={`flex items-center space-x-2 px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
              currentTab === 'pendencias'
                ? 'bg-[#006633] text-white shadow-sm ring-1 ring-emerald-400/30'
                : 'text-rose-100 hover:bg-[#7A0022] hover:text-white'
            }`}
          >
            <ListChecks className="w-4 h-4 text-amber-300" />
            <span>Pendências</span>
          </button>

          <button
            id="nav-tab-sheets"
            onClick={() => onSelectTab('configuracoes')}
            className={`flex items-center space-x-2 px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all whitespace-nowrap ml-auto ${
              currentTab === 'configuracoes'
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                : 'bg-emerald-900/60 text-emerald-200 hover:bg-emerald-800 hover:text-white border border-emerald-700/50'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Planilha</span>
            <span title={syncTitle} className="flex items-center gap-1 text-[11px] font-semibold bg-slate-900/50 px-1.5 py-0.5 rounded-md">
              {busy ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 text-amber-300 animate-spin" />
                  <span className="text-amber-200">Salvando…</span>
                </>
              ) : failed ? (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-300" />
                  <span className="text-rose-200">Não salvo</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                  <span className="text-emerald-200">Salvo</span>
                </>
              )}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
