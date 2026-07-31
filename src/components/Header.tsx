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
} from 'lucide-react';
import { ViewTab, Match } from '../types';

interface HeaderProps {
  currentTab: ViewTab;
  onSelectTab: (tab: ViewTab) => void;
  matches: Match[];
  activeMatchId: string;
  onSelectActiveMatch: (id: string) => void;
  isSyncing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  matches,
  activeMatchId,
  onSelectActiveMatch,
  isSyncing,
}) => {
  const activeMatch = matches.find((m) => m.id === activeMatchId) || matches[0];

  return (
    <header id="main-app-header" className="bg-[#7A0022] text-white shadow-lg border-b-4 border-[#006633]">
      {/* Top Banner */}
      <div id="top-branding-bar" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div id="branding-logo-title" className="flex items-center space-x-3">
          <div id="badge-flu-crest" className="w-12 h-12 rounded-full bg-gradient-to-br from-[#006633] via-[#7A0022] to-amber-500 p-0.5 flex items-center justify-center shadow-md">
            <div id="inner-crest" className="w-full h-full rounded-full bg-[#7A0022] flex items-center justify-center text-amber-300 font-extrabold text-xl tracking-tighter border border-amber-400/40">
              FFC
            </div>
          </div>
          <div>
            <div id="app-title" className="flex items-center space-x-2">
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                Fluminense FC
                <span className="text-amber-300 font-medium text-sm bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                  Operações
                </span>
              </h1>
            </div>
            <p id="app-subtitle" className="text-xs text-emerald-200">
              Gestão de Vendas, Setores, Escala de Equipes & Planilhas
            </p>
          </div>
        </div>

        {/* Active Game Selector Selector */}
        <div id="active-game-selector-container" className="flex items-center gap-3 bg-[#5A0019] px-3.5 py-2 rounded-xl border border-rose-900/60 shadow-inner">
          <div id="game-icon-label" className="flex items-center text-xs font-semibold text-amber-300 uppercase tracking-wider">
            <Trophy className="w-4 h-4 mr-1.5 text-amber-400" />
            Jogo Ativo:
          </div>
          <select
            id="active-match-select"
            value={activeMatchId}
            onChange={(e) => onSelectActiveMatch(e.target.value)}
            className="bg-[#3D0010] text-white text-xs sm:text-sm font-medium rounded-lg px-2.5 py-1.5 border border-rose-800/80 focus:ring-2 focus:ring-amber-400 focus:outline-none cursor-pointer"
          >
            {[...matches]
              .sort((a, b) => (b.data || '').localeCompare(a.data || ''))
              .map((m) => (
                <option key={m.id} value={m.id}>
                  {m.mandante} vs {m.visitante} ({m.data ? new Date(m.data + 'T00:00:00').toLocaleDateString('pt-BR') : ''})
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div id="navigation-tabs-bar" className="bg-[#5c0019] border-t border-rose-900/40">
        <div id="tabs-scroll-wrapper" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center overflow-x-auto space-x-1 py-1.5 no-scrollbar">
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
            id="nav-tab-sheets"
            onClick={() => onSelectTab('configuracoes')}
            className={`flex items-center space-x-2 px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all whitespace-nowrap ml-auto ${
              currentTab === 'configuracoes'
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                : 'bg-emerald-900/60 text-emerald-200 hover:bg-emerald-800 hover:text-white border border-emerald-700/50'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Google Sheets</span>
            {isSyncing ? (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
