import Icon from '@/components/ui/AppIcon';

interface SecurityBadge {
    icon: string;
    title: string;
    description: string;
}

const SecurityBadges = () => {
    const badges: SecurityBadge[] = [
        {
            icon: 'LockClosedIcon',
            title: 'End-to-End Encryption',
            description: 'Your data is encrypted during transmission and storage'
        },
        {
            icon: 'CheckBadgeIcon',
            title: 'Verified Doctors',
            description: 'All doctors are licensed and administratively verified'
        },
        {
            icon: 'ShieldCheckIcon',
            title: 'Secure Authentication',
            description: 'Protected login with session management'
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {badges.map((badge, index) => (
                <div
                    key={index}
                    className="p-6 bg-card/60 backdrop-blur-sm rounded-xl border border-border hover:shadow-elevation-2 transition-base"
                >
                    <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center">
                            <Icon name={badge.icon as any} size={24} className="text-success" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-text-primary mb-1">
                                {badge.title}
                            </h3>
                            <p className="text-xs text-text-secondary leading-relaxed">
                                {badge.description}
                            </p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default SecurityBadges;