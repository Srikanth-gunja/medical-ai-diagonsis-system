import Icon from '@/components/ui/AppIcon';

interface AnalyticsCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeLabel?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: string;
  color?: 'primary' | 'success' | 'warning' | 'accent';
}

export default function AnalyticsCard({
  title,
  value,
  change,
  changeLabel = 'vs last month',
  trend = 'neutral',
  icon,
  color = 'primary',
}: AnalyticsCardProps) {
  const getColorClasses = () => {
    switch (color) {
      case 'success':
        return 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-emerald-500/30';
      case 'warning':
        return 'bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-amber-500/30';
      case 'accent':
        return 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-indigo-500/30';
      default:
        return 'bg-gradient-to-br from-primary to-primary-focus text-white shadow-primary/30';
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-emerald-700 dark:text-emerald-400';
      case 'down':
        return 'text-rose-700 dark:text-rose-400';
      default:
        return 'text-muted-foreground';
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
      className="relative group bg-card border border-border/50 rounded-2xl p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 overflow-hidden dark:shadow-none dark:hover:shadow-primary/5 dark:bg-background-elevated"
    >
      <div
        className={`absolute -right-8 -top-8 w-32 h-32 rounded-full blur-[40px] opacity-20 bg-gradient-to-br ${getGradientClasses()} transition-opacity duration-500 group-hover:opacity-40`}
      />

      <div className="relative z-10 flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-text-muted font-bold tracking-wider">{title}</p>
          <p className="text-3xl font-extrabold text-text-primary mt-2 tracking-tight group-hover:text-primary transition-colors duration-300">
            {value}
          </p>
          {change && (
            <div className="flex items-center gap-2 mt-3">
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-md ${trend === 'up' ? 'bg-emerald-100/80 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : trend === 'down' ? 'bg-rose-100/80 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400' : 'bg-muted/80 text-text-secondary dark:bg-muted/20'}`}
              >
                {change}
              </span>
              {changeLabel && (
                <span className="text-[11px] text-text-muted font-semibold tracking-wide flex-1 truncate">
                  {changeLabel}
                </span>
              )}
            </div>
          )}
        </div>
        <div
          className={`w-[52px] h-[52px] rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 ${getColorClasses()}`}
        >
          <Icon name={icon} size={28} className="text-white" />
        </div>
      </div>
    </div>
  );
}
