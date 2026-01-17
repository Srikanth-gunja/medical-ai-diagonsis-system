import Icon from '@/components/ui/AppIcon';

interface Badge {
    icon: string;
    label: string;
    description: string;
}

const VerificationBadges = () => {
    const badges: Badge[] = [
        {
            icon: 'LockClosedIcon',
            label: 'End-to-End Encryption',
            description: 'All communications are encrypted',
        },
        {
            icon: 'CheckBadgeIcon',
            label: 'Admin Verification',
            description: 'All doctors are verified before activation',
        },
        {
            icon: 'ShieldCheckIcon',
            label: 'Secure Platform',
            description: 'SSL protected medical platform',
        },
    ];

    return (
        <div className="bg-gradient-to-br from-primary/5 via-background to-accent/5 rounded-xl p-6 border border-border">
            <div className="flex items-center space-x-2 mb-4">
                <Icon name="ShieldCheckIcon" size={24} className="text-primary" />
                <h3 className="text-lg font-semibold text-text-primary">
                    Trusted Medical Platform
                </h3>
            </div>

            <div className="space-y-4">
                {badges.map((badge, index) => (
                    <div key={index} className="flex items-start space-x-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Icon name={badge.icon as any} size={20} className="text-primary" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-text-primary">{badge.label}</p>
                            <p className="text-xs text-text-secondary mt-0.5">{badge.description}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-6 pt-6 border-t border-border">
                <p className="text-xs text-text-secondary text-center">
                    By registering, you agree to maintain professional standards and comply with all medical regulations
                </p>
            </div>
        </div>
    );
};

export default VerificationBadges;