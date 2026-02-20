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
        return 'bg-success/10 text-success';
      case 'warning':
        return 'bg-warning/10 text-warning';
      case 'accent':
        return 'bg-accent/10 text-accent';
      default:
        return 'bg-primary/10 text-primary';
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-success';
      case 'down':
        return 'text-error';
      default:
        return 'text-text-secondary';
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
      className={`relative group bg-card/80 backdrop-blur-md border border-border/50 rounded-2xl p-6 shadow-elevation-1 hover:shadow-elevation-3 hover:-translate-y-1 transition-all duration-300 overflow-hidden`}
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br ${getGradientClasses()} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
      />

      <div className="relative z-10 flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-text-secondary font-bold uppercase tracking-wider">{title}</p>
          <p className="text-3xl font-extrabold text-text-primary mt-2 group-hover:text-primary transition-colors duration-300">
            {value}
          </p>
          {change && (
            <div className="flex items-center gap-1.5 mt-2.5">
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-md ${trend === 'up' ? 'bg-success/10' : trend === 'down' ? 'bg-error/10' : 'bg-muted/50'} ${getTrendColor()}`}
              >
                {change}
              </span>
              <span className="text-[10px] text-text-tertiary font-semibold uppercase">
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
