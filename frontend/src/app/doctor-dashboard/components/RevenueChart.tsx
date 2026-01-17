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
    { name: 'Confirmed', value: 0, color: '#3B82F6' },
    { name: 'Pending', value: 0, color: '#F59E0B' },
    { name: 'Completed', value: 0, color: '#10B981' },
  ];

  // Calculate max for Y axis
  const maxAppointments = Math.max(...appointmentsData.map((d) => d.appointments), 5);
  const yAxisMax = Math.ceil(maxAppointments / 5) * 5 + 5;
  const yAxisTicks = Array.from({ length: 5 }, (_, i) => Math.round((yAxisMax / 4) * i));

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 ${className}`}>
      {/* Appointments Line Chart */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-text-primary">Appointments (last 7 days)</h2>
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
                  backgroundColor: 'var(--color-card)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  fontSize: '14px',
                }}
              />
              <Line
                type="monotone"
                dataKey="appointments"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Status Breakdown Donut Chart */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-text-primary">Status Breakdown</h2>
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
                    stroke="rgba(148, 163, 184, 0.3)"
                    strokeWidth="15"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm text-text-tertiary text-center px-4">No data</span>
                </div>
              </div>
              <div className="flex gap-4 mt-4">
                {statusData.map((entry, index) => (
                  <div key={index} className="flex items-center gap-1.5">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-sm text-text-secondary">{entry.name}</span>
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
                    backgroundColor: 'var(--color-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    fontSize: '14px',
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
                    <span style={{ color: 'var(--color-text-primary)', fontSize: '14px' }}>
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
