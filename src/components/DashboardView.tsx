import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import {
  TrendingUp,
  Target,
  DollarSign,
  Trophy,
  BarChart3,
  Calendar,
  AlertCircle,
  ArrowUpRight,
} from 'lucide-react';
import { Match, Operation, Sale } from '../types';

interface DashboardViewProps {
  sales: Sale[];
  operations: Operation[];
  matches: Match[];
  activeMatchId: string;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  sales,
  operations,
  matches,
  activeMatchId,
}) => {
  const [selectedMatchFilter, setSelectedMatchFilter] = useState<string>(activeMatchId || 'ALL');

  // Filter sales
  const filteredSales = sales.filter((s) => {
    if (selectedMatchFilter === 'ALL') return true;
    const match = matches.find((m) => m.id === selectedMatchFilter);
    if (!match) return true;
    return s.mandante === match.mandante && s.visitante === match.visitante;
  });

  // Calculate totals per operation
  const operationStats = operations.map((op) => {
    const opSales = filteredSales.filter((s) => s.operacao.trim().toLowerCase() === op.operacao.trim().toLowerCase());
    const totalVendido = opSales.reduce((acc, curr) => acc + (curr.venda || 0), 0);
    const meta = op.meta || 0;
    const pct = meta > 0 ? (totalVendido / meta) * 100 : 0;

    return {
      codigo: op.codigo,
      nome: op.operacao,
      vendaTotal: totalVendido,
      meta: meta,
      percentual: pct,
    };
  });

  const totalSalesVal = operationStats.reduce((a, b) => a + b.vendaTotal, 0);
  const totalMetaVal = operationStats.reduce((a, b) => a + b.meta, 0);
  const totalPct = totalMetaVal > 0 ? (totalSalesVal / totalMetaVal) * 100 : 0;

  // Best operation
  const sortedOps = [...operationStats].sort((a, b) => b.vendaTotal - a.vendaTotal);
  const topOp = sortedOps[0];

  const chartColors = [
    '#8A0029', // Fluminense Garnet
    '#006633', // Fluminense Green
    '#D97706', // Gold / Amber
    '#2563EB', // Blue
    '#7C3AED', // Purple
    '#059669', // Emerald
  ];

  return (
    <div id="dashboard-view-root" className="space-[#space-y-6] p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner and Filter */}
      <div id="dashboard-header-bar" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-[#8A0029]" />
            Dashboard de Vendas por Operação
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Acompanhamento em tempo real dos setores operados nos jogos do Fluminense
          </p>
        </div>

        <div id="dashboard-match-filter" className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-semibold text-slate-600 uppercase">Filtrar Jogo:</span>
          <select
            id="dashboard-select-match"
            value={selectedMatchFilter}
            onChange={(e) => setSelectedMatchFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 text-slate-800 text-xs sm:text-sm font-medium rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#8A0029] focus:outline-none"
          >
            <option value="ALL">Todos os Jogos (Acumulado)</option>
            {matches.map((m) => (
              <option key={m.id} value={m.id}>
                {m.mandante} x {m.visitante} ({m.data})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div id="metrics-cards-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Venda Total */}
        <div id="metric-card-total-sales" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Vendido
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#006633] flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              R$ {totalSalesVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="mt-2 flex items-center text-xs text-emerald-700 font-medium">
            <ArrowUpRight className="w-4 h-4 mr-0.5" />
            <span>Soma das operações registradas</span>
          </div>
          <div className="absolute top-0 right-0 w-2 h-full bg-[#006633]"></div>
        </div>

        {/* Card 2: Meta Total */}
        <div id="metric-card-total-meta" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Meta Projetada
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <Target className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              R$ {totalMetaVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Soma das metas cadastradas por setor
          </div>
          <div className="absolute top-0 right-0 w-2 h-full bg-amber-500"></div>
        </div>

        {/* Card 3: Atingimento % */}
        <div id="metric-card-performance-pct" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Atingimento da Meta
            </span>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
              totalPct >= 100 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-50 text-[#8A0029]'
            }`}>
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {totalPct.toFixed(1)}%
            </span>
          </div>
          <div className="mt-2 w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                totalPct >= 100 ? 'bg-[#006633]' : 'bg-[#8A0029]'
              }`}
              style={{ width: `${Math.min(totalPct, 100)}%` }}
            ></div>
          </div>
          <div className="absolute top-0 right-0 w-2 h-full bg-[#8A0029]"></div>
        </div>

        {/* Card 4: Maior Operação */}
        <div id="metric-card-top-operation" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Destaque do Dia
            </span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
              <Trophy className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-base font-bold text-slate-900 truncate">
              {topOp && topOp.vendaTotal > 0 ? topOp.nome : 'Nenhum registro'}
            </div>
            <div className="text-lg font-extrabold text-[#006633] mt-0.5">
              {topOp && topOp.vendaTotal > 0
                ? `R$ ${topOp.vendaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                : 'R$ 0,00'}
            </div>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Setor com maior volume de venda
          </div>
          <div className="absolute top-0 right-0 w-2 h-full bg-purple-600"></div>
        </div>
      </div>

      {/* Main Bar Chart Section */}
      <div id="dashboard-charts-row" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Comparativo Vendas vs Meta (2 Columns wide) */}
        <div id="bar-chart-card" className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Venda Realizada vs Meta por Operação (Setor)
              </h3>
              <p className="text-xs text-slate-500">
                Comparativo de valores em Reais (R$) por área
              </p>
            </div>
          </div>

          <div id="recharts-wrapper-bar" className="h-72 sm:h-80 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={operationStats}
                margin={{ top: 10, right: 10, left: -10, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis
                  dataKey="nome"
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  angle={-15}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickFormatter={(val) => `R$${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value: any) => [
                    `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                  ]}
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    color: '#FFF',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar name="Venda Realizada" dataKey="vendaTotal" fill="#006633" radius={[6, 6, 0, 0]} />
                <Bar name="Meta" dataKey="meta" fill="#8A0029" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Participação por Operação (Pie Chart) */}
        <div id="pie-chart-card" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Distribuição do Faturamento
            </h3>
            <p className="text-xs text-slate-500 mb-2">
              Participação % de cada setor no total acumulado
            </p>
          </div>

          <div id="recharts-wrapper-pie" className="h-64 sm:h-72 w-full flex items-center justify-center">
            {totalSalesVal > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={operationStats.filter((o) => o.vendaTotal > 0)}
                    dataKey="vendaTotal"
                    nameKey="nome"
                    cx="50%"
                    cy="50%"
                    outerRadius={85}
                    innerRadius={45}
                    paddingAngle={3}
                  >
                    {operationStats
                      .filter((o) => o.vendaTotal > 0)
                      .map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={chartColors[index % chartColors.length]}
                        />
                      ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [
                      `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                      'Venda',
                    ]}
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center p-6 text-slate-400 text-xs">
                <AlertCircle className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                Nenhum valor de venda digitado ainda para exibir o gráfico de pizza.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress per Operation List */}
      <div id="operation-progress-table-card" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-4">
          Detalhamento de Vendas e Desempenho de Metas por Setor
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/80">
                <th className="py-3 px-4">Código</th>
                <th className="py-3 px-4">Operação / Setor</th>
                <th className="py-3 px-4">Venda Realizada</th>
                <th className="py-3 px-4">Meta Estipulada</th>
                <th className="py-3 px-4 text-center">Progresso %</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {operationStats.map((op) => (
                <tr key={op.codigo} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-xs font-bold text-slate-600">
                    {op.codigo}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900">
                    {op.nome}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-emerald-800">
                    R$ {op.vendaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-600">
                    R$ {op.meta.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-24 sm:w-32 bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-2 rounded-full ${
                            op.percentual >= 100 ? 'bg-[#006633]' : 'bg-[#8A0029]'
                          }`}
                          style={{ width: `${Math.min(op.percentual, 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-bold text-slate-700 w-12 text-right">
                        {op.percentual.toFixed(0)}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    {op.percentual >= 100 ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                        Meta Atingida
                      </span>
                    ) : op.vendaTotal > 0 ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                        Em Progresso
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                        Pendente
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
