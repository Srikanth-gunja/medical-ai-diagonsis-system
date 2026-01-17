import Icon from '@/components/ui/AppIcon';

interface Activity {
    id: string;
    type: 'appointment' | 'prescription' | 'report' | 'message';
    title: string;
    description: string;
    timestamp: string;
    icon: string;
    color: string;
}

interface RecentActivityFeedProps {
    activities: Activity[];
}

const RecentActivityFeed = ({ activities }: RecentActivityFeedProps) => {
    return (
        <div className="bg-card border border-border rounded-xl shadow-elevation-1">
            <div className="p-6 border-b border-border">
                <h2 className="text-xl font-semibold text-text-primary flex items-center space-x-2">
                    <Icon name="ClockIcon" size={24} />
                    <span>Recent Activity</span>
                </h2>
            </div>

            <div className="divide-y divide-border">
                {activities.map((activity) => (
                    <div key={activity.id} className="p-6 hover:bg-muted/50 transition-base">
                        <div className="flex items-start space-x-4">
                            <div className={`flex-shrink-0 w-10 h-10 rounded-lg ${activity.color} flex items-center justify-center`}>
                                <Icon name={activity.icon as any} size={20} className="text-white" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-semibold text-text-primary mb-1">
                                    {activity.title}
                                </h4>
                                <p className="text-sm text-text-secondary mb-2">
                                    {activity.description}
                                </p>
                                <span className="text-xs text-text-secondary">
                                    {activity.timestamp}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-4 border-t border-border">
                <button className="w-full px-4 py-2 text-sm font-medium text-primary hover:bg-muted rounded-lg transition-base">
                    View All Activity
                </button>
            </div>
        </div>
    );
};

export default RecentActivityFeed;