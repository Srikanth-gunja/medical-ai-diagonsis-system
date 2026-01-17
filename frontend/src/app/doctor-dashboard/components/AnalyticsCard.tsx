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
    color = 'primary'
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

    return (
        <div className="bg-card border border-border rounded-lg p-6 hover:shadow-elevation-2 transition-base">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm text-text-secondary font-medium">{title}</p>
                    <p className="text-3xl font-bold text-text-primary mt-2">{value}</p>
                    {change && (
                        <p className={`text-sm mt-2 font-medium ${getTrendColor()}`}>
                            {change}
                        </p>
                    )}
                </div>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getColorClasses()}`}>
                    <span className="text-2xl">{icon}</span>
                </div>
            </div>
        </div>
    );
}