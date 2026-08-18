"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface ChartDatum {
  label: string;
  value: number;
  color?: string;
  tooltipLabel?: string;
}

const AXIS_STYLE = {
  fontSize: 11,
  fill: "#444651",
} as const;

const GRID_STROKE = "#e5eef5";
const CURSOR_FILL = "rgba(30, 58, 138, 0.06)";
const PRIMARY = "#1e3a8a";

function TooltipCard({
  active,
  payload,
}: {
  active?: boolean;
  payload?: {
    value: number;
    payload?: { tooltipLabel?: string; label?: string };
  }[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0];
  return (
    <div className="rounded-md border border-outline bg-surface px-3 py-2 text-xs shadow-ambient">
      <p className="font-semibold text-ink">
        {item.payload?.tooltipLabel ?? item.payload?.label ?? ""}
      </p>
      <p className="text-ink-muted">{item.value}</p>
    </div>
  );
}

export function StatusBars({
  data,
  height = 240,
}: {
  data: ChartDatum[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke={GRID_STROKE}
          vertical={false}
        />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tick={AXIS_STYLE}
          interval={0}
        />
        <YAxis
          allowDecimals={false}
          tickLine={false}
          axisLine={false}
          tick={AXIS_STYLE}
          width={40}
        />
        <Tooltip content={<TooltipCard />} cursor={{ fill: CURSOR_FILL }} />
        <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={48}>
          {data.map((d) => (
            <Cell key={d.label} fill={d.color ?? PRIMARY} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function HorizontalBars({
  data,
  minHeight = 180,
}: {
  data: ChartDatum[];
  minHeight?: number;
}) {
  const height = Math.max(minHeight, data.length * 40 + 16);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke={GRID_STROKE}
          horizontal={false}
        />
        <XAxis
          type="number"
          allowDecimals={false}
          tickLine={false}
          axisLine={false}
          tick={AXIS_STYLE}
        />
        <YAxis
          type="category"
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tick={AXIS_STYLE}
          width={150}
        />
        <Tooltip content={<TooltipCard />} cursor={{ fill: CURSOR_FILL }} />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={18} fill={PRIMARY} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function Donut({
  data,
  centerValue,
  centerLabel,
  height = 220,
}: {
  data: ChartDatum[];
  centerValue?: number;
  centerLabel?: string;
  height?: number;
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  return (
    <div className="flex flex-col gap-2">
      <div className="relative" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              innerRadius="62%"
              outerRadius="88%"
              paddingAngle={2}
              strokeWidth={0}
            >
              {data.map((d) => (
                <Cell key={d.label} fill={d.color ?? PRIMARY} />
              ))}
            </Pie>
            <Tooltip content={<TooltipCard />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold leading-8 text-ink">
            {centerValue ?? total}
          </span>
          {centerLabel ? (
            <span className="text-xs text-ink-muted">{centerLabel}</span>
          ) : null}
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5">
        {data.map((d) => (
          <span
            key={d.label}
            className="inline-flex items-center gap-1.5 text-xs text-ink-muted"
          >
            <span
              className="h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: d.color ?? PRIMARY }}
            />
            {d.tooltipLabel ?? d.label} ({d.value})
          </span>
        ))}
      </div>
    </div>
  );
}