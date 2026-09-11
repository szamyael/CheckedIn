"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface RankingItem {
  label: string;
  value: number;
}

export function AnalyticsCharts({
  eventRankings,
  programRankings,
  yearLevelRankings,
}: {
  eventRankings: RankingItem[];
  programRankings: RankingItem[];
  yearLevelRankings: RankingItem[];
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ChartCard title="Most Attended Events" data={eventRankings} color="#2563eb" />
      <ChartCard title="Attendance by Program" data={programRankings} color="#7c3aed" />
      <div className="lg:col-span-2">
        <ChartCard title="Attendance by Year Level" data={yearLevelRankings} color="#059669" />
      </div>
    </div>
  );
}

function ChartCard({
  title,
  data,
  color,
}: {
  title: string;
  data: RankingItem[];
  color: string;
}) {
  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 font-semibold">{title}</h2>
        <p className="text-sm text-slate-700">No data yet.</p>
      </div>
    );
  }

  const chartData = data.map((d) => ({
    name: d.label.length > 18 ? `${d.label.slice(0, 18)}…` : d.label,
    fullName: d.label,
    count: d.value,
  }));

  return (
    <div className="analytics-chart-card rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <h2 className="font-semibold">{title}</h2>
        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
          Check-ins
        </span>
      </div>
      <div className="h-64 sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 8, right: 8, left: -12, bottom: chartData.length > 4 ? 30 : 12 }}
            barCategoryGap="24%"
          >
            <CartesianGrid strokeDasharray="3 5" stroke="#e2e8f0" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: "#64748b" }}
              interval={chartData.length > 6 ? 1 : 0}
              angle={chartData.length > 4 ? -20 : 0}
              textAnchor={chartData.length > 4 ? "end" : "middle"}
              height={chartData.length > 4 ? 50 : 24}
              tickLine={false}
              axisLine={false}
            />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={false} width={32} />
            <Tooltip
              cursor={{ fill: "#f1f5f9", opacity: 0.7 }}
              contentStyle={{ borderRadius: 10, borderColor: "#e2e8f0", boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)" }}
              formatter={(value) => [value, "Check-ins"]}
              labelFormatter={(_, payload) =>
                payload?.[0]?.payload?.fullName ?? ""
              }
            />
            <Bar
              dataKey="count"
              fill={color}
              radius={[5, 5, 0, 0]}
              animationBegin={120}
              animationDuration={850}
              animationEasing="ease-out"
              activeBar={{ fill: color, opacity: 0.72 }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
