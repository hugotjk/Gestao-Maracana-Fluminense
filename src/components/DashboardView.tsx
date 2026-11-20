import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import {
  Trophy,
  BarChart3,
  Calendar,
  DollarSign,
  Medal,
  Filter,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { Match, Operation, Sale } from '../types';

interface DashboardViewProps {
  sales: Sale[];
  operations: Operation[];
  matches: Match[];
  activeMatchId: string;
}

// Helper for parsing month from date string
function parseMonthYear(dateStr: string): { key: string; label: string } {
  if (!dateStr) return { key: 'OUTROS', label: 'Outros' };

  let year = '';
  let month = '';

  if (dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts[0].length === 4) {
      year = parts[0];
      month = parts[1];
    }
  } else if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts[2] && parts[2].length === 4) {
      year = parts[2];
      month = parts[1];
    }
  }

  if (year && month) {
    const monthNames = [
      'Janeiro',
      'Fevereiro',
      'Março',
      'Abril',
      'Maio',
      'Junho',
      'Julho',
      'Agosto',
      'Setembro',
      'Outubro',
      'Novembro',
      'Dezembro',
    ];
    const monthIdx = parseInt(month, 10) - 1;
    const monthName = monthNames[monthIdx] || month;
    return {
      key: `${year}-${month.padStart(2, '0')}`,
      label: `${monthName} / ${year}`,
    };
  }

  return { key: 'OUTROS', label: 'Outros' };
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  sales,
  operations,
  matches,
  activeMatchId,
}) => {
  const [activeTab, setActiveTab] = useState<'geral' | 'mes' | 'mes_jogo'>('mes_jogo');

  // Extract all unique months from sales & matches
  const availableMonths = useMemo(() => {
    const monthMap = new Map<string, string>();
    sales.forEach((s) => {
      const { key, label } = parseMonthYear(s.data);
      if (key !== 'OUTROS') monthMap.set(key, label);
    });
    matches.forEach((m) => {
      const { key, label } = parseMonthYear(m.data);
      if (key !== 'OUTROS') monthMap.set(key, label);
    });

    const list = Array.from(monthMap.entries()).map(([key, label]) => ({ key, label }));
    list.sort((a, b) => b.key.localeCompare(a.key)); // Most recent first
    return list;
  }, [sales, matches]);

  // Selected Month state
  // Começa no mês e no jogo ativos (escolhidos no topo da página)
  const activeGame = matches.find((m) => m.id === activeMatchId);
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(
    (activeGame && parseMonthYear(activeGame.data).key) || availableMonths[0]?.key || ''
  );

  // Filter games by selected month
  const gamesInSelectedMonth = useMemo(() => {
    if (!selectedMonthKey) return matches;
    return matches.filter((m) => parseMonthYear(m.data).key === selectedMonthKey);
  }, [matches, selectedMonthKey]);

  // Selected Match state for tab 3
  const [selectedGameId, setSelectedGameId] = useState<string>(
    activeGame?.id || gamesInSelectedMonth[0]?.id || matches[0]?.id || ''
  );

  // Quando trocar o Jogo Ativo no topo, o Dashboard acompanha
  React.useEffect(() => {
    const g = matches.find((m) => m.id === activeMatchId);
    if (g) {
      setSelectedMonthKey(parseMonthYear(g.data).key);
      setSelectedGameId(g.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMatchId]);

  // Update selected game when month changes
  React.useEffect(() => {
    if (gamesInSelectedMonth.length > 0) {
      if (!gamesInSelectedMonth.some((g) => g.id === selectedGameId)) {
        setSelectedGameId(gamesInSelectedMonth[0].id);
      }
    }
  }, [gamesInSelectedMonth, selectedGameId]);

  // Total vendido por jogo (para os cartões e o gráfico de evolução)
  const evolucao = useMemo(() => {
    const totalDoJogo = (m: Match) =>
      sales
        .filter(
          (s) =>
            s.matchId === m.id || (s.mandante === m.mandante && s.visitante === m.visitante && s.data === m.data)
        )
        .reduce((acc, s) => acc + (s.venda || 0), 0);
    const jogos = matches
      .map((m) => {
        const adversario = m.mandante.toLowerCase().includes('fluminense') ? m.visitante : m.mandante;
        const dataBR = m.data ? m.data.split('-').reverse().slice(0, 2).join('/') : '';
        return {
          id: m.id,
          data: m.data,
          dataBR,
          total: totalDoJogo(m),
          nome: `${m.mandante} x ${m.visitante}`,
          nomeCompleto: `${m.mandante} x ${m.visitante} (${dataBR})`,
          rotulo: `${adversario} ${dataBR}`,
        };
      })
      .filter((j) => j.total > 0)
      .sort((a, b) => (a.data || '').localeCompare(b.data || ''));
    const media = jogos.length > 0 ? jogos.reduce((a, j) => a + j.total, 0) / jogos.length : 0;
    const melhor = jogos.length > 0 ? jogos.reduce((best, j) => (j.total > best.total ? j : best)) : null;
    return { jogos, media, melhor };
  }, [sales, matches]);

  const activeGameTotal = evolucao.jogos.find((j) => j.id === activeMatchId)?.total || 0;

  // Total sales overall
  const grandTotalSales = useMemo(() => {
    return sales.reduce((sum, s) => sum + (s.venda || 0), 0);
  }, [sales]);

  // 1. RANKING GERAL POR OPERAÇÃO
  const rankingGeral = useMemo(() => {
    return operations
      .map((op) => {
        const opSales = sales.filter(
          (s) => s.operacao.trim().toLowerCase() === op.operacao.trim().toLowerCase()
        );
        const total = opSales.reduce((acc, curr) => acc + (curr.venda || 0), 0);
        const count = opSales.length;

        return {
          codigo: op.codigo,
          nome: op.operacao,
          total,
          count,
          pctTotal: grandTotalSales > 0 ? (total / grandTotalSales) * 100 : 0,
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [operations, sales, grandTotalSales]);

  // 2. RANKING POR OPERAÇÃO E MÊS
  const rankingPorMes = useMemo(() => {
    const filteredSales = sales.filter(
      (s) => parseMonthYear(s.data).key === selectedMonthKey
    );
    const monthTotal = filteredSales.reduce((acc, curr) => acc + (curr.venda || 0), 0);

    const ranked = operations
      .map((op) => {
        const opSales = filteredSales.filter(
          (s) => s.operacao.trim().toLowerCase() === op.operacao.trim().toLowerCase()
        );
        const total = opSales.reduce((acc, curr) => acc + (curr.venda || 0), 0);
        const count = opSales.length;

        return {
          codigo: op.codigo,
          nome: op.operacao,
          total,
          count,
          pctTotal: monthTotal > 0 ? (total / monthTotal) * 100 : 0,
        };
      })
      .sort((a, b) => b.total - a.total);

    return { ranked, monthTotal };
  }, [sales, operations, selectedMonthKey]);

  // 3. RANKING POR OPERAÇÃO, MÊS E JOGO
  const selectedGame = useMemo(() => {
    return matches.find((m) => m.id === selectedGameId) || matches[0];
  }, [matches, selectedGameId]);

  const rankingPorJogo = useMemo(() => {
    if (!selectedGame) return { ranked: [], gameTotal: 0, metasBatidas: 0, setoresComMeta: 0 };

    const filteredSales = sales.filter(
      (s) =>
        s.matchId === selectedGame.id ||
        (s.mandante === selectedGame.mandante &&
          s.visitante === selectedGame.visitante &&
          s.data === selectedGame.data)
    );

    const gameTotal = filteredSales.reduce((acc, curr) => acc + (curr.venda || 0), 0);

    const ranked = operations
      .map((op) => {
        const opSales = filteredSales.filter(
          (s) => s.operacao.trim().toLowerCase() === op.operacao.trim().toLowerCase()
        );
        const total = opSales.reduce((acc, curr) => acc + (curr.venda || 0), 0);
        const meta = op.meta || 0;
        const hasSale = opSales.length > 0;
        const metaStatus: 'bateu' | 'nao_bateu' | 'sem_meta' | 'sem_venda' =
          meta <= 0 ? 'sem_meta' : !hasSale ? 'sem_venda' : total >= meta ? 'bateu' : 'nao_bateu';
        return {
          codigo: op.codigo,
          nome: op.operacao,
          total,
          meta,
          metaPct: meta > 0 ? (total / meta) * 100 : 0,
          metaStatus,
          pctTotal: gameTotal > 0 ? (total / gameTotal) * 100 : 0,
        };
      })
      .sort((a, b) => b.total - a.total);

    const comMeta = ranked.filter((r) => r.metaStatus === 'bateu' || r.metaStatus === 'nao_bateu');
    const metasBatidas = comMeta.filter((r) => r.metaStatus === 'bateu').length;
    return { ranked, gameTotal, metasBatidas, setoresComMeta: comMeta.length };
  }, [sales, operations, selectedGame]);

  // Chart colors
  const chartColors = [
    '#8A0029',
    '#006633',
    '#D97706',
    '#2563EB',
    '#7C3AED',
    '#059669',
    '#DC2626',
    '#0891B2',
  ];

  const getRankBadge = (index: number) => {
    if (index === 0)
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 font-extrabold text-xs border border-amber-300">
          <Trophy className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
          1º LUGAR
        </span>
      );
    if (index === 1)
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-200 text-slate-800 font-extrabold text-xs border border-slate-300">
          <Medal className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
          2º LUGAR
        </span>
      );
    if (index === 2)
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-700/10 text-amber-950 font-extrabold text-xs border border-amber-700/20">
          <Medal className="w-3.5 h-3.5 text-amber-800 flex-shrink-0" />
          3º LUGAR
        </span>
      );
    return (
      <span className="font-mono font-bold text-slate-500 text-xs px-2 py-0.5 bg-slate-100 rounded">
        {index + 1}º
      </span>
    );
  };

  return (
    <div id="dashboard-view-root" className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner */}
      <div
        id="dashboard-header-bar"
        className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-[#8A0029]" />
            Dashboard & Ranking das Operações
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Análise detalhada de faturamento e classificação dos setores por período e confronto
          </p>
        </div>

      </div>

      {/* Cartões de resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          color="#8A0029"
          icon={<Trophy className="w-5 h-5" />}
          label="Jogo ativo"
          value={activeGame ? formatR(activeGameTotal) : '—'}
          sub={
            activeGame
              ? `${activeGame.mandante} x ${activeGame.visitante}${
                  activeGameTotal > 0 && evolucao.media > 0
                    ? ` · ${activeGameTotal >= evolucao.media ? '+' : ''}${(((activeGameTotal - evolucao.media) / evolucao.media) * 100).toFixed(0)}% vs média`
                    : activeGameTotal === 0
                    ? ' · sem vendas lançadas'
                    : ''
                }`
              : 'Selecione um jogo no topo'
          }
        />
        <StatCard
          color="#006633"
          icon={<TrendingUp className="w-5 h-5" />}
          label="Média por jogo"
          value={formatR(evolucao.media)}
          sub={`Considerando ${evolucao.jogos.length} ${evolucao.jogos.length === 1 ? 'jogo com vendas' : 'jogos com vendas'}`}
        />
        <StatCard
          color="#D97706"
          icon={<Medal className="w-5 h-5" />}
          label="Melhor jogo"
          value={evolucao.melhor ? formatR(evolucao.melhor.total) : '—'}
          sub={evolucao.melhor ? `${evolucao.melhor.nome} (${evolucao.melhor.dataBR})` : 'Sem vendas lançadas'}
        />
        <StatCard
          color="#2563EB"
          icon={<DollarSign className="w-5 h-5" />}
          label="Total geral"
          value={formatR(grandTotalSales)}
          sub="Soma de todas as vendas lançadas"
        />
      </div>

      {/* Evolução ao longo dos jogos */}
      {evolucao.jogos.length > 0 && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#8A0029]" />
                Evolução das vendas por jogo
              </h3>
              <p className="text-xs text-slate-500">
                Total vendido em cada jogo, do mais antigo para o mais recente. A linha tracejada é a média. Clique numa barra para ver o jogo.
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-600">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-[#8A0029]" /> Jogo ativo</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-[#006633]" /> Acima da média</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-slate-400" /> Abaixo da média</span>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={evolucao.jogos} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="rotulo" tick={{ fontSize: 10, fill: '#475569' }} angle={-35} textAnchor="end" interval={0} height={60} />
                <YAxis tick={{ fontSize: 10, fill: '#475569' }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} width={55} />
                <Tooltip
                  formatter={(value: any) => [formatR(Number(value)), 'Vendido']}
                  labelFormatter={(_l: any, payload: any) => payload?.[0]?.payload?.nomeCompleto || ''}
                />
                <ReferenceLine y={evolucao.media} stroke="#D97706" strokeDasharray="6 4" label={{ value: 'Média', position: 'insideTopRight', fontSize: 10, fill: '#B45309' }} />
                <Bar
                  dataKey="total"
                  radius={[4, 4, 0, 0]}
                  cursor="pointer"
                  onClick={(d: any) => {
                    const id = d?.id ?? d?.payload?.id;
                    if (!id) return;
                    const g = matches.find((m) => m.id === id);
                    if (g) setSelectedMonthKey(parseMonthYear(g.data).key);
                    setSelectedGameId(id);
                    setActiveTab('mes_jogo');
                  }}
                >
                  {evolucao.jogos.map((j) => (
                    <Cell
                      key={j.id}
                      fill={j.id === activeMatchId ? '#8A0029' : j.total >= evolucao.media ? '#006633' : '#94a3b8'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Navigation Tabs for Rankings */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('mes_jogo')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                activeTab === 'mes_jogo'
                  ? 'bg-[#8A0029] text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>Por jogo</span>
            </button>

            <button
              onClick={() => setActiveTab('mes')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                activeTab === 'mes'
                  ? 'bg-[#8A0029] text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Por mês</span>
            </button>

            <button
              onClick={() => setActiveTab('geral')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                activeTab === 'geral'
                  ? 'bg-[#8A0029] text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span>Geral (todos os jogos)</span>
            </button>
          </div>
        </div>

        {/* TAB 1: RANKING GERAL */}
        {activeTab === 'geral' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  Ranking Geral por Operação (Todas as Vendas)
                </h3>
                <p className="text-xs text-slate-500">
                  Classificação das operações considerando todo o histórico de lançamentos no sistema
                </p>
              </div>
            </div>

            {/* Ranking Chart */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                Gráfico Comparativo de Vendas (R$)
              </h4>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={rankingGeral} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#CBD5E1" />
                    <XAxis
                      dataKey="nome"
                      tick={{ fontSize: 11, fill: '#475569' }}
                      angle={-15}
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#475569' }}
                      tickFormatter={(val) => `R$${(val / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      formatter={(value: any) => [
                        `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                        'Total Vendido',
                      ]}
                      contentStyle={{
                        backgroundColor: '#0F172A',
                        color: '#FFF',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                      {rankingGeral.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Ranking Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-2xs font-extrabold text-slate-500 uppercase tracking-wider bg-slate-100/80">
                    <th className="py-3 px-4">Posição</th>
                    <th className="py-3 px-4">Código</th>
                    <th className="py-3 px-4">Operação / Setor</th>
                    <th className="py-3 px-4">Total Vendido (R$)</th>
                    <th className="py-3 px-4">% do Faturamento Total</th>
                    <th className="py-3 px-4">Proporção</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                  {rankingGeral.map((item, index) => {
                    const topVal = rankingGeral[0]?.total || 1;
                    const barPct = topVal > 0 ? (item.total / topVal) * 100 : 0;

                    return (
                      <tr key={item.codigo} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-bold">{getRankBadge(index)}</td>
                        <td className="py-3.5 px-4 font-mono text-xs font-bold text-slate-500">
                          {item.codigo}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">{item.nome}</td>
                        <td className="py-3.5 px-4 font-extrabold text-emerald-800">
                          R$ {item.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-700">
                          {item.pctTotal.toFixed(1)}%
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="w-32 bg-slate-200 rounded-full h-2.5 overflow-hidden">
                            <div
                              className="h-2.5 bg-[#006633] rounded-full transition-all"
                              style={{ width: `${Math.min(barPct, 100)}%` }}
                            ></div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: RANKING POR OPERAÇÃO E MÊS */}
        {activeTab === 'mes' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#8A0029]" />
                  Ranking por Operação e Mês
                </h3>
                <p className="text-xs text-slate-500">
                  Selecione o mês desejado para visualizar a classificação de cada setor
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">Mês:</span>
                <select
                  value={selectedMonthKey}
                  onChange={(e) => setSelectedMonthKey(e.target.value)}
                  className="bg-white border border-slate-300 font-bold text-slate-800 text-xs sm:text-sm rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#8A0029] focus:outline-none cursor-pointer"
                >
                  {availableMonths.map((m) => (
                    <option key={m.key} value={m.key}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-emerald-50/60 border border-emerald-200 p-4 rounded-xl flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900 uppercase">
                Faturamento Total do Mês ({availableMonths.find((m) => m.key === selectedMonthKey)?.label || 'Mês Selecionado'})
              </span>
              <span className="text-lg font-extrabold text-emerald-800">
                R$ {rankingPorMes.monthTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* Ranking Table for Month */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-2xs font-extrabold text-slate-500 uppercase tracking-wider bg-slate-100/80">
                    <th className="py-3 px-4">Posição</th>
                    <th className="py-3 px-4">Código</th>
                    <th className="py-3 px-4">Operação / Setor</th>
                    <th className="py-3 px-4">Faturamento no Mês (R$)</th>
                    <th className="py-3 px-4">% do Mês</th>
                    <th className="py-3 px-4">Proporção</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                  {rankingPorMes.ranked.map((item, index) => {
                    const topVal = rankingPorMes.ranked[0]?.total || 1;
                    const barPct = topVal > 0 ? (item.total / topVal) * 100 : 0;

                    return (
                      <tr key={item.codigo} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-bold">{getRankBadge(index)}</td>
                        <td className="py-3.5 px-4 font-mono text-xs font-bold text-slate-500">
                          {item.codigo}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">{item.nome}</td>
                        <td className="py-3.5 px-4 font-extrabold text-emerald-800">
                          R$ {item.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-700">
                          {item.pctTotal.toFixed(1)}%
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="w-32 bg-slate-200 rounded-full h-2.5 overflow-hidden">
                            <div
                              className="h-2.5 bg-[#006633] rounded-full transition-all"
                              style={{ width: `${Math.min(barPct, 100)}%` }}
                            ></div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: RANKING POR OPERAÇÃO, MÊS E JOGO */}
        {activeTab === 'mes_jogo' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Filter className="w-5 h-5 text-[#8A0029]" />
                  Ranking por Operação, Mês e Jogo
                </h3>
                <p className="text-xs text-slate-500">
                  Filtre por mês e confronto para analisar o desempenho individual de cada setor no jogo
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-700">1. Mês:</span>
                  <select
                    value={selectedMonthKey}
                    onChange={(e) => setSelectedMonthKey(e.target.value)}
                    className="bg-white border border-slate-300 font-bold text-slate-800 text-xs rounded-xl px-2.5 py-2 focus:ring-2 focus:ring-[#8A0029] focus:outline-none cursor-pointer"
                  >
                    {availableMonths.map((m) => (
                      <option key={m.key} value={m.key}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-700">2. Jogo:</span>
                  <select
                    value={selectedGameId}
                    onChange={(e) => setSelectedGameId(e.target.value)}
                    className="bg-white border border-slate-300 font-bold text-slate-800 text-xs rounded-xl px-2.5 py-2 focus:ring-2 focus:ring-[#8A0029] focus:outline-none cursor-pointer max-w-[220px] truncate"
                  >
                    {gamesInSelectedMonth.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.mandante} x {g.visitante} ({g.data})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {selectedGame ? (
              <div className="space-y-4">
                <div className="bg-[#8A0029]/5 border border-[#8A0029]/20 p-4 rounded-xl flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="text-2xs font-extrabold text-[#8A0029] uppercase tracking-wider block">
                      Confronto Selecionado
                    </span>
                    <h4 className="text-base font-extrabold text-slate-900 mt-0.5">
                      {selectedGame.mandante} x {selectedGame.visitante}
                    </h4>
                    <span className="text-xs text-slate-500 font-medium">
                      Data: {selectedGame.data} | Horário: {selectedGame.horario}
                    </span>
                  </div>

                  {rankingPorJogo.setoresComMeta > 0 && (
                    <div className="text-center">
                      <span className="text-2xs font-bold text-slate-500 uppercase block">Metas batidas no jogo</span>
                      <span
                        className={`text-xl font-extrabold ${
                          rankingPorJogo.metasBatidas === rankingPorJogo.setoresComMeta ? 'text-[#006633]' : 'text-amber-700'
                        }`}
                      >
                        {rankingPorJogo.metasBatidas} de {rankingPorJogo.setoresComMeta} setores
                      </span>
                    </div>
                  )}

                  <div className="text-right">
                    <span className="text-2xs font-bold text-slate-500 uppercase block">
                      Total Faturado no Jogo
                    </span>
                    <span className="text-xl font-extrabold text-[#006633]">
                      R$ {rankingPorJogo.gameTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Ranking Table for Specific Game */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-2xs font-extrabold text-slate-500 uppercase tracking-wider bg-slate-100/80">
                        <th className="py-3 px-4">Posição</th>
                        <th className="py-3 px-4">Código</th>
                        <th className="py-3 px-4">Operação / Setor</th>
                        <th className="py-3 px-4">Venda no Jogo (R$)</th>
                        <th className="py-3 px-4">Meta (R$)</th>
                        <th className="py-3 px-4">% da Meta</th>
                        <th className="py-3 px-4">Comissão</th>
                        <th className="py-3 px-4">% do Jogo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                      {rankingPorJogo.ranked.map((item, index) => {
                        return (
                          <tr key={item.codigo} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3.5 px-4 font-bold">{getRankBadge(index)}</td>
                            <td className="py-3.5 px-4 font-mono text-xs font-bold text-slate-500">
                              {item.codigo}
                            </td>
                            <td className="py-3.5 px-4 font-bold text-slate-900">{item.nome}</td>
                            <td className="py-3.5 px-4 font-extrabold text-emerald-800">
                              R$ {item.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-3.5 px-4 font-semibold text-slate-600">
                              {item.meta > 0 ? `R$ ${item.meta.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'}
                            </td>
                            <td className="py-3.5 px-4">
                              {item.meta > 0 ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-24 bg-slate-200 rounded-full h-2.5 overflow-hidden">
                                    <div
                                      className={`h-2.5 rounded-full transition-all ${
                                        item.metaPct >= 100 ? 'bg-[#006633]' : item.metaPct >= 80 ? 'bg-amber-500' : 'bg-rose-600'
                                      }`}
                                      style={{ width: `${Math.min(item.metaPct, 100)}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-xs font-bold text-slate-700">{item.metaPct.toFixed(0)}%</span>
                                </div>
                              ) : (
                                <span className="text-xs text-slate-400">—</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4">
                              <MetaBadge status={item.metaStatus} falta={item.meta - item.total} />
                            </td>
                            <td className="py-3.5 px-4 font-bold text-slate-700">
                              {item.pctTotal.toFixed(1)}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center p-8 bg-slate-50 rounded-xl text-slate-500 text-xs">
                Nenhum jogo encontrado para o mês selecionado.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const MetaBadge: React.FC<{ status: 'bateu' | 'nao_bateu' | 'sem_meta' | 'sem_venda'; falta: number }> = ({
  status,
  falta,
}) => {
  if (status === 'bateu')
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 font-extrabold text-xs border border-emerald-300">
        ✓ Bateu a meta
      </span>
    );
  if (status === 'nao_bateu')
    return (
      <span
        className="inline-flex items-center px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 font-extrabold text-xs border border-rose-200"
        title={`Faltaram R$ ${falta.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
      >
        Não bateu · faltaram R$ {falta.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
      </span>
    );
  if (status === 'sem_venda') return <span className="text-xs text-slate-400 font-semibold">Sem venda lançada</span>;
  return <span className="text-xs text-slate-400 font-semibold">Sem meta</span>;
};

function formatR(v: number): string {
  return `R$ ${(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const StatCard: React.FC<{ color: string; icon: React.ReactNode; label: string; value: string; sub: string }> = ({
  color,
  icon,
  label,
  value,
  sub,
}) => (
  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
    <div className="flex items-center justify-between">
      <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider">{label}</span>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ color, backgroundColor: `${color}14` }}>
        {icon}
      </div>
    </div>
    <div className="mt-2.5 text-2xl font-extrabold text-slate-900">{value}</div>
    <div className="mt-1.5 text-xs text-slate-500 truncate" title={sub}>{sub}</div>
    <div className="absolute top-0 right-0 w-2 h-full" style={{ backgroundColor: color }}></div>
  </div>
);
