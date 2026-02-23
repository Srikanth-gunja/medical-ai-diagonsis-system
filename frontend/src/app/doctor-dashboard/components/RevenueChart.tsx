'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

interface ChartData {
  appointmentsData: { day: string; appointments: number }[];
  statusData: { name: string; value: number; color: string }[];
}

interface RevenueChartProps {
  className?: string;
  chartData?: ChartData | null;
}

export default function RevenueChart({ className = '', chartData }: RevenueChartProps) {
  // Default data if not provided
  const appointmentsData = chartData?.appointmentsData || [
    { day: 'Mon', appointments: 0 },
    { day: 'Tue', appointments: 0 },
    { day: 'Wed', appointments: 0 },
    { day: 'Thu', appointments: 0 },
    { day: 'Fri', appointments: 0 },
    { day: 'Sat', appointments: 0 },
    { day: 'Sun', appointments: 0 },
  ];

  const statusData = chartData?.statusData || [
    { name: 'Confirmed', value: 0, color: '#10b981' }, // emerald-500
    { name: 'Pending', value: 0, color: '#f59e0b' },   // amber-500
    { name: 'Completed', value: 0, color: '#6366f1' }, // indigo-500
  ];

  // Calculate max for Y axis
  const maxAppointments = Math.max(...appointmentsData.map((d) => d.appointments), 5);
  const yAxisMax = Math.ceil(maxAppointments / 5) * 5 + 5;
  const yAxisTicks = Array.from({ length: 5 }, (_, i) => Math.round((yAxisMax / 4) * i));

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 ${className}`}>
      {/* Appointments Line Chart */}
      <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Appointments (last 7 days)</h2>
        </div>

        <div className="w-full h-64" aria-label="Weekly Appointments Line Chart">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={appointmentsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
              <XAxis
                dataKey="day"
                stroke="rgba(148, 163, 184, 0.6)"
                style={{ fontSize: '12px' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                stroke="rgba(148, 163, 184, 0.6)"
                style={{ fontSize: '12px' }}
                axisLine={false}
                tickLine={false}
                domain={[0, yAxisMax]}
                ticks={yAxisTicks}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#0f172a'
                }}
              />
              <Line
                type="monotone"
                dataKey="appointments"
                stroke="#6366f1"
                strokeWidth={3}
                dot={{ fill: '#6366f1', strokeWidth: 2, r: 4, stroke: '#ffffff' }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Status Breakdown Donut Chart */}
      <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Status Breakdown</h2>
        </div>

        <div
          className="w-full h-64 flex items-center justify-center"
          aria-label="Status Breakdown Donut Chart"
        >
          {statusData.every((d) => d.value === 0) ? (
            // Empty state with grey placeholder ring
            <div className="flex flex-col items-center justify-center">
              <div className="relative w-44 h-44">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="35"
                    fill="none"
                    stroke="#f1f5f9"
                    strokeWidth="15"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-medium text-slate-400 text-center px-4">No data</span>
                </div>
              </div>
              <div className="flex gap-4 mt-4">
                {statusData.map((entry, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-sm font-medium text-slate-600">{entry.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#0f172a'
                  }}
                  formatter={(value: number, name: string) => [`${value}%`, name]}
                />
                <Legend
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                  iconType="circle"
                  iconSize={10}
                  formatter={(value) => (
                    <span style={{ color: '#0f172a', fontSize: '14px', fontWeight: 500 }}>
                      {value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
