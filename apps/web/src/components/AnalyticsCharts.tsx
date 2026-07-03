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
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <h2 className="mb-4 font-semibold">{title}</h2>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 24 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={50} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip
              formatter={(value) => [value, "Check-ins"]}
              labelFormatter={(_, payload) =>
                payload?.[0]?.payload?.fullName ?? ""
              }
            />
            <Bar dataKey="count" fill={color} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
