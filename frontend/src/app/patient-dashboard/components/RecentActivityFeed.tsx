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
  const displayedActivities = activities.slice(0, 5);

  return (
    <div className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-3xl shadow-elevation-2 overflow-hidden flex flex-col h-full relative group/feed">
      {/* Decorative Background Blob */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl opacity-50 pointer-events-none group-hover/feed:bg-primary/20 transition-all duration-700"></div>

      {/* Header */}
      <div className="p-6 sm:p-8 bg-gradient-to-b from-background/50 to-transparent border-b border-border/50 flex justify-between items-start z-10 shrink-0">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-text-primary to-text-secondary mb-1">
            Recent Activity
          </h2>
          <p className="text-sm text-text-secondary font-medium">Your latest health updates</p>
        </div>
        <div className="p-3 bg-primary/10 rounded-2xl shadow-sm border border-primary/20 flex items-center justify-center transform hover:rotate-12 transition-transform duration-300">
          <Icon name="BellAlertIcon" size={24} className="text-primary" />
        </div>
      </div>

      {/* Feed Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 relative scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
        {displayedActivities.map((activity, index) => (
          <div
            key={activity.id}
            className="relative flex items-start group animation-fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* Timeline Line (Only visual, connects items) */}
            {index !== displayedActivities.length - 1 && (
              <div className="absolute left-6 top-14 bottom-[-1rem] w-[2px] bg-gradient-to-b from-border to-transparent hidden sm:block z-0 group-hover:from-primary/30 transition-colors duration-500"></div>
            )}

            {/* Icon Bubble */}
            <div className="relative z-10 flex-shrink-0 mr-4 sm:mr-5">
              <div
                className={`w-12 h-12 rounded-[1.25rem] flex items-center justify-center shadow-md transform group-hover:-translate-y-1 group-hover:shadow-lg transition-all duration-300 border border-white/20 dark:border-white/10 ${activity.color || 'bg-primary'}`}
              >
                <Icon name={activity.icon as any} size={20} className="text-white drop-shadow-sm" />
              </div>
            </div>

            {/* Content Pane */}
            <div className="flex-1 min-w-0 group-hover:translate-x-1 transition-transform duration-300">
              <div className="bg-background/50 hover:bg-background/80 backdrop-blur-md border border-border/50 hover:border-primary/30 rounded-2xl p-4 shadow-sm hover:shadow-elevation-1 transition-all duration-300 relative overflow-hidden">
                {/* Subtle Left Border Glow on Hover */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary/0 via-primary/50 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                  <h4 className="text-sm sm:text-base font-bold text-text-primary group-hover:text-primary transition-colors pr-2 leading-tight">
                    {activity.title}
                  </h4>
                  <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-muted/80 backdrop-blur-sm text-[9px] sm:text-[10px] font-bold text-text-secondary uppercase tracking-wider shrink-0 w-fit h-fit border border-border/50">
                    <Icon name="ClockIcon" size={10} className="text-text-tertiary" />
                    <span>{activity.timestamp}</span>
                  </span>
                </div>
                <p
                  className="text-xs sm:text-sm font-medium text-text-secondary line-clamp-2 leading-relaxed"
                  title={activity.description}
                >
                  {activity.description}
                </p>
              </div>
            </div>
          </div>
        ))}
        {displayedActivities.length === 0 && (
          <div className="text-center py-10">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="BellSlashIcon" size={24} className="text-text-secondary" />
            </div>
            <h3 className="text-text-primary font-bold mb-1">No Recent Activity</h3>
            <p className="text-sm text-text-secondary">You&apos;re all caught up!</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 sm:p-5 bg-background/50 border-t border-border/50 backdrop-blur-md z-10 shrink-0 mt-auto">
        <button className="w-full flex items-center justify-center space-x-2 px-5 py-3 bg-card hover:bg-primary text-text-primary hover:text-primary-foreground border border-border/80 hover:border-primary/50 shadow-sm font-bold rounded-xl transition-all duration-300 group">
          <span>View All Activity</span>
          <Icon
            name="ArrowRightIcon"
            size={16}
            className="transform group-hover:translate-x-1 transition-transform"
          />
        </button>
      </div>
    </div>
  );
};

export default RecentActivityFeed;
