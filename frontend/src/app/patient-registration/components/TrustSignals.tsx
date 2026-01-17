import Icon from '@/components/ui/AppIcon';

const TrustSignals = () => {
    const trustBadges = [
        {
            icon: 'LockClosedIcon',
            label: 'End-to-End Encryption',
            description: 'Your data is protected',
        },
        {
            icon: 'CheckBadgeIcon',
            label: 'Verified Doctors',
            description: 'Licensed professionals',
        },
        {
            icon: 'ShieldCheckIcon',
            label: 'Secure Platform',
            description: 'SSL protected',
        },
    ];

    return (
        <div className="bg-muted/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4 text-center">
                Your Information is Safe
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {trustBadges.map((badge) => (
                    <div key={badge.label} className="flex flex-col items-center text-center space-y-2">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-success/10">
                            <Icon name={badge.icon as any} size={24} className="text-success" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-text-primary">{badge.label}</p>
                            <p className="text-xs text-text-secondary">{badge.description}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TrustSignals;