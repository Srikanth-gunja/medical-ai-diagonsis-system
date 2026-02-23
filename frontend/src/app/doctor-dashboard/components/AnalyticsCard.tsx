interface AnalyticsCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: string;
  color?: 'primary' | 'success' | 'warning' | 'accent';
}

export default function AnalyticsCard({
  title,
  value,
  change,
  trend = 'neutral',
  icon,
  color = 'primary',
}: AnalyticsCardProps) {
  const getColorClasses = () => {
    switch (color) {
      case 'success':
        return 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-500/20';
      case 'warning':
        return 'bg-amber-50 text-amber-600 ring-1 ring-amber-500/20';
      case 'accent':
        return 'bg-indigo-50 text-indigo-600 ring-1 ring-indigo-500/20';
      default:
        return 'bg-primary/10 text-primary ring-1 ring-primary/20';
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-emerald-700';
      case 'down':
        return 'text-rose-700';
      default:
        return 'text-slate-500';
    }
  };

  const getGradientClasses = () => {
    switch (color) {
      case 'success':
        return 'from-success/5 to-transparent';
      case 'warning':
        return 'from-warning/5 to-transparent';
      case 'accent':
        return 'from-accent/5 to-transparent';
      default:
        return 'from-primary/5 to-transparent';
    }
  };

  return (
    <div
      className="relative group bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 overflow-hidden"
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br ${getGradientClasses()} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
      />

      <div className="relative z-10 flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">{title}</p>
          <p className="text-3xl font-extrabold text-slate-900 mt-2 tracking-tight group-hover:text-primary transition-colors duration-300">
            {value}
          </p>
          {change && (
            <div className="flex items-center gap-1.5 mt-2.5">
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-md ${trend === 'up' ? 'bg-emerald-100' : trend === 'down' ? 'bg-rose-100' : 'bg-slate-100'} ${getTrendColor()}`}
              >
                {change}
              </span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                vs last month
              </span>
            </div>
          )}
        </div>
        <div
          className={`w-14 h-14 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 ${getColorClasses()}`}
        >
          <span className="text-[28px] leading-none">{icon}</span>
        </div>
      </div>
    </div>
  );
}
