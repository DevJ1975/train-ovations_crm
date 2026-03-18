'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { DashboardMetrics } from '@/lib/services';

function formatCurrency(amountCents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amountCents / 100);
}

const leadStatusPalette = ['#2563eb', '#fb923c', '#14b8a6', '#8b5cf6', '#ef4444', '#06b6d4'];

export function AdminDashboardCharts({
  forecastByStage,
  leadsByStatus,
  repPerformance,
  pipelineValueCents,
  weightedForecastValueCents,
}: Pick<
  DashboardMetrics,
  'forecastByStage' | 'leadsByStatus' | 'repPerformance' | 'pipelineValueCents' | 'weightedForecastValueCents'
>) {
  const repChartData = repPerformance.slice(0, 6).map((rep) => ({
    name: rep.repName.split(' ')[0] ?? rep.repName,
    pipeline: Number((rep.pipelineValueCents / 100).toFixed(0)),
    forecast: Number((rep.weightedForecastValueCents / 100).toFixed(0)),
    won: Number((rep.closedWonValueCents / 100).toFixed(0)),
  }));

  const stageChartData = forecastByStage.map((entry) => ({
    stage: entry.stage.replace('_', ' '),
    pipeline: Number((entry.amountCents / 100).toFixed(0)),
    weighted: Number((entry.weightedAmountCents / 100).toFixed(0)),
  }));

  const leadMixData = leadsByStatus.map((entry) => ({
    name: entry.status.replace('_', ' '),
    value: entry.count,
  }));

  const coveragePercent = pipelineValueCents > 0
    ? Math.min(100, Math.round((weightedForecastValueCents / pipelineValueCents) * 100))
    : 0;

  return (
    <div className="grid gap-4 xl:grid-cols-[1.25fr_0.95fr]">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-[1.5rem] border bg-surface-muted/40 p-4">
          <div className="mb-3">
            <p className="text-sm font-semibold text-foreground">Forecast by stage</p>
            <p className="text-sm text-muted-foreground">
              Raw pipeline against weighted forecast contribution.
            </p>
          </div>
          <div className="h-72">
            <ResponsiveContainer height="100%" width="100%">
              <BarChart data={stageChartData} layout="vertical" margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                <CartesianGrid horizontal={false} stroke="rgba(148, 163, 184, 0.18)" />
                <XAxis tick={{ fill: '#64748b', fontSize: 12 }} type="number" />
                <YAxis dataKey="stage" tick={{ fill: '#0f172a', fontSize: 12 }} type="category" width={84} />
                <Tooltip
                  formatter={(value, name) => [
                    formatCurrency((value as number) * 100),
                    name === 'pipeline' ? 'Pipeline' : 'Weighted',
                  ]}
                  labelFormatter={(label) => `${label}`}
                />
                <Legend />
                <Bar dataKey="pipeline" fill="#93c5fd" name="Pipeline" radius={[0, 6, 6, 0]} />
                <Bar dataKey="weighted" fill="#2563eb" name="Weighted" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-[1.5rem] border bg-surface-muted/40 p-4">
          <div className="mb-3">
            <p className="text-sm font-semibold text-foreground">Lead qualification mix</p>
            <p className="text-sm text-muted-foreground">
              Distribution of lead statuses across the scoped CRM.
            </p>
          </div>
          <div className="h-72">
            <ResponsiveContainer height="100%" width="100%">
              <PieChart>
                <Pie
                  cx="50%"
                  cy="50%"
                  data={leadMixData}
                  dataKey="value"
                  innerRadius={55}
                  outerRadius={88}
                  paddingAngle={3}
                >
                  {leadMixData.map((entry, index) => (
                    <Cell key={entry.name} fill={leadStatusPalette[index % leadStatusPalette.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        <div className="rounded-[1.5rem] border bg-surface-muted/40 p-4">
          <div className="mb-3">
            <p className="text-sm font-semibold text-foreground">Forecast coverage</p>
            <p className="text-sm text-muted-foreground">
              Weighted forecast as a share of current open pipeline.
            </p>
          </div>
          <div className="grid items-center gap-4 lg:grid-cols-[180px_1fr]">
            <div className="mx-auto h-44 w-44">
              <ResponsiveContainer height="100%" width="100%">
                <RadialBarChart
                  barSize={16}
                  cx="50%"
                  cy="50%"
                  data={[{ name: 'coverage', value: coveragePercent, fill: '#2563eb' }]}
                  endAngle={-270}
                  innerRadius="70%"
                  outerRadius="100%"
                  startAngle={90}
                >
                  <RadialBar background dataKey="value" cornerRadius={12} />
                  <text
                    dominantBaseline="middle"
                    fill="#0f172a"
                    fontSize="28"
                    fontWeight="700"
                    textAnchor="middle"
                    x="50%"
                    y="50%"
                  >
                    {coveragePercent}%
                  </text>
                </RadialBarChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl border bg-surface-muted/60 p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Open pipeline</p>
                <p className="mt-2 text-lg font-semibold text-foreground">
                  {formatCurrency(pipelineValueCents)}
                </p>
              </div>
              <div className="rounded-xl border bg-surface-muted/60 p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Weighted forecast</p>
                <p className="mt-2 text-lg font-semibold text-foreground">
                  {formatCurrency(weightedForecastValueCents)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[1.5rem] border bg-surface-muted/40 p-4">
          <div className="mb-3">
            <p className="text-sm font-semibold text-foreground">Rep pipeline comparison</p>
            <p className="text-sm text-muted-foreground">
              Manager view of top reps by pipeline, weighted forecast, and closed won revenue.
            </p>
          </div>
          <div className="h-72">
            <ResponsiveContainer height="100%" width="100%">
              <BarChart data={repChartData} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                <CartesianGrid stroke="rgba(148, 163, 184, 0.18)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#0f172a', fontSize: 12 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip
                  formatter={(value, name) => [
                    formatCurrency((value as number) * 100),
                    name === 'pipeline' ? 'Pipeline' : name === 'forecast' ? 'Weighted forecast' : 'Closed won',
                  ]}
                />
                <Legend />
                <Bar dataKey="pipeline" fill="#93c5fd" name="Pipeline" radius={[6, 6, 0, 0]} />
                <Bar dataKey="forecast" fill="#2563eb" name="Weighted forecast" radius={[6, 6, 0, 0]} />
                <Bar dataKey="won" fill="#14b8a6" name="Closed won" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
