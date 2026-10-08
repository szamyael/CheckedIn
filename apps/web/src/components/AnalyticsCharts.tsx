"use client";

import { useSyncExternalStore } from "react";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface RankingItem {
  label: string;
  value: number;
}

interface AttendanceTrendItem {
  label: string;
  value: number;
}

const subscribeToReducedMotion = (callback: () => void) => {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
};
const getReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const getServerReducedMotion = () => false;

export function AnalyticsCharts({
  eventRankings,
  programRankings,
  yearLevelRankings,
  attendanceTrend,
}: {
  eventRankings: RankingItem[];
  programRankings: RankingItem[];
  yearLevelRankings: RankingItem[];
  attendanceTrend: AttendanceTrendItem[];
}) {
  const reducedMotion = useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotion,
    getServerReducedMotion,
  );

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <TrendChart data={attendanceTrend} reducedMotion={reducedMotion} />
      <ChartCard title="Most Attended Events" data={eventRankings} color="var(--primary)" reducedMotion={reducedMotion} />
      <ChartCard title="Attendance by Program" data={programRankings} color="var(--accent)" reducedMotion={reducedMotion} />
      <div className="lg:col-span-2">
        <ChartCard title="Attendance by Year Level" data={yearLevelRankings} color="var(--primary-strong)" reducedMotion={reducedMotion} />
      </div>
    </div>
  );
}

function TrendChart({
  data,
  reducedMotion,
}: {
  data: AttendanceTrendItem[];
  reducedMotion: boolean;
}) {
  const total = data.reduce((sum, point) => sum + point.value, 0);
  const peak = data.reduce((best, point) => Math.max(best, point.value), 0);

  return (
    <section className="analytics-chart-card min-w-0 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)] sm:p-6 lg:col-span-2">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold tracking-[0.14em] text-[var(--primary)]">ATTENDANCE TREND</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-900">Weekly check-ins</h2>
          <p className="mt-1 text-sm text-slate-500">Confirmed attendance over the last 12 weeks</p>
        </div>
        <div className="flex gap-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">12-week total</p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-slate-900">{total.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Peak week</p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-slate-900">{peak.toLocaleString()}</p>
          </div>
        </div>
      </div>
      <div className="h-64 min-w-0 sm:h-72" role="img" aria-label={`Line chart showing weekly check-ins for the last 12 weeks. ${data.map((point) => `${point.label}: ${point.value}`).join("; ")}`}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 12, left: -14, bottom: 0 }}>
            <defs>
              <linearGradient id="attendance-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.2} />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--border)" strokeDasharray="4 6" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted)" }} tickLine={false} axisLine={false} minTickGap={18} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--muted)" }} tickLine={false} axisLine={false} width={38} />
            <Tooltip
              cursor={{ stroke: "var(--primary)", strokeDasharray: "4 4", strokeOpacity: 0.45 }}
              contentStyle={{ borderRadius: 12, borderColor: "var(--border)", backgroundColor: "var(--surface)", color: "var(--foreground)", boxShadow: "var(--shadow-soft)" }}
              labelStyle={{ color: "var(--muted)", fontSize: 12 }}
              formatter={(value) => [Number(value ?? 0).toLocaleString(), "Check-ins"]}
              labelFormatter={(label) => `Week of ${label}`}
            />
            <Area type="monotone" dataKey="value" stroke="none" fill="url(#attendance-fill)" isAnimationActive={!reducedMotion} animationDuration={900} animationEasing="ease-out" />
            <Line
              type="monotone"
              dataKey="value"
              name="Check-ins"
              stroke="var(--primary)"
              strokeWidth={3}
              dot={{ r: 3, fill: "var(--surface)", stroke: "var(--primary)", strokeWidth: 2 }}
              activeDot={{ r: 6, fill: "var(--primary)", stroke: "var(--surface)", strokeWidth: 2 }}
              isAnimationActive={!reducedMotion}
              animationBegin={120}
              animationDuration={1100}
              animationEasing="ease-out"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <table className="sr-only">
        <caption>Weekly check-ins for the last 12 weeks</caption>
        <thead><tr><th scope="col">Week</th><th scope="col">Check-ins</th></tr></thead>
        <tbody>{data.map((point) => <tr key={point.label}><th scope="row">{point.label}</th><td>{point.value}</td></tr>)}</tbody>
      </table>
    </section>
  );
}

function ChartCard({
  title,
  data,
  color,
  reducedMotion,
}: {
  title: string;
  data: RankingItem[];
  color: string;
  reducedMotion: boolean;
}) {
  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-soft)]">
        <h2 className="mb-4 font-semibold">{title}</h2>
        <p className="text-sm text-[var(--muted)]">No data yet.</p>
      </div>
    );
  }

  const chartData = data.map((d) => ({
    name: d.label.length > 18 ? `${d.label.slice(0, 18)}…` : d.label,
    fullName: d.label,
    count: d.value,
  }));

  return (
    <div className="analytics-chart-card rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-soft)] sm:p-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <h2 className="font-semibold text-[var(--primary-strong)]">{title}</h2>
        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
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
            <CartesianGrid strokeDasharray="3 5" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: "var(--muted)" }}
              interval={chartData.length > 6 ? 1 : 0}
              angle={chartData.length > 4 ? -20 : 0}
              textAnchor={chartData.length > 4 ? "end" : "middle"}
              height={chartData.length > 4 ? 50 : 24}
              tickLine={false}
              axisLine={false}
            />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--muted)" }} tickLine={false} axisLine={false} width={32} />
            <Tooltip
              cursor={{ fill: "var(--surface-muted)", opacity: 0.7 }}
              contentStyle={{ borderRadius: 12, borderColor: "var(--border)", backgroundColor: "var(--surface)", color: "var(--foreground)", boxShadow: "var(--shadow-soft)" }}
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
              isAnimationActive={!reducedMotion}
              activeBar={{ fill: color, opacity: 0.72 }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
