'use client';

import { Bar, BarChart, RadialBar, RadialBarChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';

function formatCurrency(amountCents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amountCents / 100);
}

export function RepPerformanceMiniChart({
  pipelineValueCents,
  weightedForecastValueCents,
  closedWonValueCents,
  winRatePercent,
}: {
  pipelineValueCents: number;
  weightedForecastValueCents: number;
  closedWonValueCents: number;
  winRatePercent: number;
}) {
  const data = [
    { name: 'Pipeline', value: Number((pipelineValueCents / 100).toFixed(0)) },
    { name: 'Forecast', value: Number((weightedForecastValueCents / 100).toFixed(0)) },
    { name: 'Won', value: Number((closedWonValueCents / 100).toFixed(0)) },
  ];

  return (
    <div className="grid gap-3 rounded-[1.25rem] border bg-white/80 p-3 lg:grid-cols-[1fr_112px]">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Performance snapshot</p>
        <div className="mt-2 h-28">
          <ResponsiveContainer height="100%" width="100%">
            <BarChart data={data}>
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip formatter={(value) => formatCurrency((value as number) * 100)} />
              <Bar dataKey="value" fill="#2563eb" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mx-auto flex h-28 w-28 items-center justify-center">
        <ResponsiveContainer height="100%" width="100%">
          <RadialBarChart
            barSize={12}
            cx="50%"
            cy="50%"
            data={[{ name: 'winRate', value: winRatePercent, fill: '#14b8a6' }]}
            endAngle={-270}
            innerRadius="70%"
            outerRadius="100%"
            startAngle={90}
          >
            <RadialBar background dataKey="value" cornerRadius={999} />
            <text
              dominantBaseline="middle"
              fill="#0f172a"
              fontSize="20"
              fontWeight="700"
              textAnchor="middle"
              x="50%"
              y="50%"
            >
              {winRatePercent}%
            </text>
          </RadialBarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
